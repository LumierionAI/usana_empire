#!/usr/bin/env node
/**
 * generate-project-state.js
 * ---------------------------------------------------------------------
 * Scans the repository and writes PROJECT_STATE.md at the repo root —
 * a single, self-contained snapshot of exactly where this project
 * currently stands.
 *
 * WHY THIS EXISTS
 * This project spans many work sessions, possibly across different
 * tools, different chat windows, or different people. PROJECT_STATE.md
 * is meant to be the FIRST file read at the start of any new session:
 * it tells you (human or AI) what phase the project is in, what files
 * exist, whether shared modules are actually imported anywhere, what's
 * still missing, what's flagged as a TODO in the code, what the git
 * history looks like, and what open decisions are still blocking which
 * phase — all derived directly from the real state of the repo, not
 * from memory or a stale conversation.
 *
 * USAGE
 *   node scripts/generate-project-state.js
 *   npm run state          (after adding the script to package.json)
 *
 * WHEN TO RUN IT
 * Run it at the end of every work session, before closing the editor
 * or ending a chat session, and commit PROJECT_STATE.md alongside your
 * code changes. It costs nothing to run and takes under a second.
 *
 * HOW IT DECIDES WHAT'S "DONE"
 * scripts/project-checklist.json lists every phase and, per phase, the
 * items expected to exist. Each item has a "kind":
 *   - "file"   : existence + non-trivial-size check against `check`.
 *                Counts toward the completion percentage.
 *   - "manual" : cannot be verified by scanning files (a11y pass, CSV
 *                wiring, schema reconciliation, etc). Never counted
 *                toward the percentage — always listed separately under
 *                "Manual Verification / Follow-up Tasks" instead, so a
 *                "100%" reading never silently absorbs work that still
 *                needs a human. A phase can also be marked
 *                `"manual": true` at the phase level (e.g. Phase 4,
 *                Phase 7) when *none* of its items are file-checkable.
 *
 * CHANGE LOG (kept short, most recent first)
 * - Fixed: source-code dump now walks app/, src/, and public/content/
 *   with the same ignore rules as the directory tree, instead of a
 *   hardcoded two-directory allowlist. That allowlist previously meant
 *   app/tools/receipts, ledger, and prospects (all logic-bearing HTML
 *   files with inline <script type="module">) were invisible to this
 *   document even though they were fully implemented — this generator
 *   was the reason they read as "unverifiable," not the code itself.
 * - Added: module usage graph. Every file under src/shared is checked
 *   against every other .js/.html file in the repo for an `import`
 *   referencing it, and reported as "imported by: [...]" or "imported
 *   by nobody". This is what should have surfaced the ToolShell
 *   export/import button wiring question automatically.
 * - Added: specFile existence is validated at generation time; a
 *   mismatch (spec renamed/moved, checklist not updated) now prints a
 *   visible warning in the output instead of failing silently.
 * - Added: oversized JSON content (over JSON_SUMMARY_THRESHOLD bytes)
 *   is summarized (record count / top-level keys) instead of dumped in
 *   full, so this document doesn't grow without bound as content grows.
 * - Added: manual-only phases/items are excluded from the completion
 *   percentage and listed separately, with the exclusion stated
 *   explicitly in the generated header.
 *
 * This script has NO external dependencies — only Node's built-in
 * fs, path, and child_process modules — so it always runs, even
 * before `npm install` has ever been run.
 * ---------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'PROJECT_STATE.md');
const CHECKLIST_FILE = path.join(__dirname, 'project-checklist.json');
const PACKAGE_JSON_FILE = path.join(ROOT, 'package.json');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.vite', 'coverage',
  '.cache', '.github',
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.html', '.css', '.json'
]);

// Source-code-dump specific: which top-level dirs count as "project code",
// walked with the same ignore rules as the directory tree (see collectFiles).
const SOURCE_DUMP_ROOTS = ['app', 'src', 'public/content'];
const SOURCE_DUMP_EXTENSIONS = new Set(['.js', '.json', '.html', '.css']);

// Any single JSON file above this size gets summarized instead of dumped
// in full, so PROJECT_STATE.md doesn't grow linearly with content forever.
const JSON_SUMMARY_THRESHOLD = 4000; // bytes

const TODO_PATTERN = /\b(TODO|FIXME|HACK|OPEN DECISION)\b:?/i;

function safeRun(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function isGitRepo() {
  return safeRun('git rev-parse --is-inside-work-tree') === 'true';
}

function collectFiles(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function buildTree(dir, prefix = '') {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => !(e.name.startsWith('.') && e.name !== '.github'))
      .filter(e => !IGNORE_DIRS.has(e.name))
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  } catch {
    return '';
  }

  let lines = [];
  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    lines.push(prefix + connector + entry.name + (entry.isDirectory() ? '/' : ''));
    if (entry.isDirectory()) {
      const sub = buildTree(path.join(dir, entry.name), nextPrefix);
      if (sub) lines.push(sub);
    }
  });
  return lines.join('\n');
}

function checkPathStatus(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return { exists: false, note: 'not created yet' };
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const contents = fs.readdirSync(full).filter(f => !f.startsWith('.'));
    if (contents.length === 0) return { exists: false, note: 'directory exists but is empty' };
    return { exists: true, note: `${contents.length} item(s)` };
  }
  if (stat.size < 5) return { exists: false, note: 'file exists but appears empty/stub' };
  return { exists: true, note: `${stat.size} bytes` };
}

function scanForMarkers(files) {
  const hits = [];
  for (const file of files) {
    const ext = path.extname(file);
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    const rel = path.relative(ROOT, file);
    if (rel === path.relative(ROOT, __filename) || rel === path.relative(ROOT, CHECKLIST_FILE) || rel === path.relative(ROOT, OUTPUT_FILE)) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (TODO_PATTERN.test(line)) {
        hits.push({
          file: path.relative(ROOT, file),
          line: idx + 1,
          text: line.trim().slice(0, 140),
        });
      }
    });
  }
  return hits;
}

function loadChecklist() {
  if (!fs.existsSync(CHECKLIST_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CHECKLIST_FILE, 'utf8'));
  } catch (err) {
    return null;
  }
}

function loadDependencies() {
  if (!fs.existsSync(PACKAGE_JSON_FILE)) return '_No package.json found._';
  try {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE, 'utf8'));
    const deps = { ...pkg.dependencies };
    const devDeps = { ...pkg.devDependencies };
    let out = [];
    if (Object.keys(deps).length > 0) {
      out.push('**Dependencies:**\n' + Object.entries(deps).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n'));
    }
    if (Object.keys(devDeps).length > 0) {
      out.push('**Dev Dependencies:**\n' + Object.entries(devDeps).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n'));
    }
    return out.length > 0 ? out.join('\n\n') : '_No dependencies listed in package.json._';
  } catch (err) {
    return '_Error parsing package.json._';
  }
}

function buildGitSection() {
  if (!isGitRepo()) {
    return '_This directory is not (yet) a git repository. Run `git init` to start tracking history._';
  }

  let branch = safeRun('git branch --show-current') || safeRun('git rev-parse --abbrev-ref HEAD') || 'No commits yet (main)';
  const diffStat = safeRun('git log -3 --stat --oneline') || '_no recent changes to display_';
  const statusRaw = safeRun('git status --porcelain') || '';

  let staged = [];
  let unstaged = [];
  let untracked = [];

  if (statusRaw) {
    statusRaw.split('\n').filter(Boolean).forEach(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      if (status === '??') {
        untracked.push(`- ${file}`);
      } else {
        if (status[0] !== ' ' && status[0] !== '?') staged.push(`- [${status[0]}]${file}`);
        if (status[1] !== ' ' && status[1] !== '?') unstaged.push(`- [${status[1]}]${file}`);
      }
    });
  }

  let uncommitted = '';
  if (!staged.length && !unstaged.length && !untracked.length) {
    uncommitted = '_working tree clean_';
  } else {
    if (staged.length) uncommitted += '**Staged:**\n' + staged.join('\n') + '\n\n';
    if (unstaged.length) uncommitted += '**Modified (Unstaged):**\n' + unstaged.join('\n') + '\n\n';
    if (untracked.length) uncommitted += '**Untracked:**\n' + untracked.join('\n') + '\n\n';
    uncommitted = uncommitted.trim();
  }

  return [
    `**Current branch:** \`${branch}\``,
    '',
    '**Recent File Changes (Last 3 commits):**',
    '```text',
    diffStat,
    '```',
    '',
    '**Uncommitted changes:**',
    uncommitted,
  ].join('\n');
}

function buildChangelogSection() {
  if (!isGitRepo()) return '_No git repository found. Changelog unavailable._';
  const logRaw = safeRun('git log --pretty=format:"- **%ad** | `%h` | %s" --date=short');
  if (!logRaw) return '_No commits yet._';
  return logRaw;
}

// ---------------------------------------------------------------------
// Checklist / phase completion
// ---------------------------------------------------------------------

function buildChecklistSection(checklist) {
  if (!checklist) return '_No scripts/project-checklist.json found._';
  let out = [];
  let totalItems = 0;
  let doneItems = 0;
  const manualOnlyPhases = [];

  for (const phase of checklist.phases || []) {
    if (!phase.items || phase.items.length === 0) continue;
    out.push(`### ${phase.name}`);
    for (const item of phase.items) {
      if (item.kind === 'manual') {
        out.push(`- [ ] 🔧 ${item.label} — _requires manual verification, see §4_`);
        continue;
      }
      totalItems += 1;
      const status = checkPathStatus(item.check);
      if (status.exists) doneItems += 1;
      const box = status.exists ? '[x]' : '[ ]';
      out.push(`- ${box} ${item.label} (\`${item.check}\`) — ${status.note}`);
    }
    out.push('');
    if (phase.manual) manualOnlyPhases.push(phase.name);
  }

  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  let header = `**Automated file-existence progress: ${doneItems}/${totalItems} auto-checkable items present (${pct}%)**\n`;
  header += `_This percentage reflects file-existence checks only — it is not a correctness or "feature complete" signal. Items marked 🔧 above are excluded from it and must be verified manually (see §4).`;
  if (manualOnlyPhases.length) {
    header += ` Entire phases with no auto-checkable items at all: ${manualOnlyPhases.join(', ')}.`;
  }
  header += '_\n';
  return header + '\n' + out.join('\n');
}

function buildManualTasksSection(checklist) {
  if (!checklist) return '_No pending manual tasks._';
  let out = [];
  for (const phase of checklist.phases || []) {
    for (const item of phase.items || []) {
      if (item.kind === 'manual') {
        out.push(`- [ ] **${item.label}** _(${phase.name})_\n  > ${item.instructions || 'See project documentation.'}`);
      }
    }
  }
  // Back-compat with older checklist shapes that used a separate top-level array.
  for (const task of checklist.manualTasks || []) {
    out.push(`- [ ] **${task.label}**\n  > ${task.instructions}`);
  }
  return out.length ? out.join('\n\n') : '_No pending manual tasks._';
}

function buildMetadataSection(checklist) {
  if (!checklist || !checklist.projectMetadata) return '_No project metadata defined in checklist._';
  const meta = checklist.projectMetadata;
  const arch = Object.entries(meta.architecture || {})
    .map(([key, val]) => `- **${key}:** ${val}`)
    .join('\n');

  return `**Description:** ${meta.description}\n\n**Architecture & Stack:**\n${arch}`;
}

function buildOpenDecisionsSection(checklist) {
  const decisions = checklist?.openDecisions;
  if (!decisions || decisions.length === 0) return '_None_';

  const statusTag = (status) => {
    if (status === 'resolved') return '✅ RESOLVED';
    if (status === 'awaiting-clarification') return '❓ AWAITING CLARIFICATION';
    return '🔴 OPEN';
  };

  return decisions.map(d => {
    // Back-compat: allow plain strings alongside the richer object shape.
    if (typeof d === 'string') return `- ${d}`;
    let line = `- **[${statusTag(d.status)}]** ${d.text}`;
    if (d.blocks) line += `\n  > Blocks: ${d.blocks}`;
    if (d.resolution) line += `\n  > Resolution: ${d.resolution}`;
    return line;
  }).join('\n');
}

// ---------------------------------------------------------------------
// Module usage graph — is anything in src/shared actually imported?
// ---------------------------------------------------------------------

function buildModuleUsageSection(allFiles) {
  const candidateExts = new Set(['.js', '.html']);
  const selfPath = path.relative(ROOT, __filename);
  const scannable = allFiles.filter(f => {
    if (!candidateExts.has(path.extname(f))) return false;
    // Exclude this generator itself — its own doc comments illustrate the
    // exact `import ... from '.../Foo.js'` shape being matched for, which
    // otherwise produces false-positive "imported by" hits against itself.
    if (path.relative(ROOT, f) === selfPath) return false;
    return true;
  });

  const sharedModules = scannable.filter(f => {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    return rel.startsWith('src/shared/') && path.extname(f) === '.js';
  });

  if (sharedModules.length === 0) {
    return '_No modules found under src/shared/._';
  }

  // Pre-read every scannable file once.
  const contentsByFile = new Map();
  for (const f of scannable) {
    try {
      contentsByFile.set(f, fs.readFileSync(f, 'utf8'));
    } catch {
      // unreadable/binary — skip
    }
  }

  const rows = [];
  for (const mod of sharedModules) {
    const modRel = path.relative(ROOT, mod).split(path.sep).join('/');
    const baseName = path.basename(mod, path.extname(mod));
    // Matches: import { x } from '.../ToolShell.js'  or  '.../ToolShell'
    const importPattern = new RegExp(`from\\s+['"][^'"]*\\b${baseName}(\\.js)?['"]`);

    const importers = [];
    for (const [file, content] of contentsByFile) {
      if (file === mod) continue;
      if (importPattern.test(content)) {
        importers.push(path.relative(ROOT, file).split(path.sep).join('/'));
      }
    }

    if (importers.length === 0) {
      rows.push(`- \`${modRel}\` — **imported by nobody**`);
    } else {
      rows.push(`- \`${modRel}\` — imported by: ${importers.map(i => `\`${i}\``).join(', ')}`);
    }
  }

  return [
    '_Every module under `src/shared/` checked against every other `.js`/`.html` file in the repo for a matching `import ... from` reference. This is a plain-text pattern match, not a bundler-accurate resolution — treat "imported by nobody" as a strong signal to investigate, not absolute proof of dead code (e.g. dynamic imports or renamed re-exports would not be caught)._',
    '',
    ...rows,
  ].join('\n');
}

// ---------------------------------------------------------------------
// Source code dump — now walks app/, src/, public/content/ uniformly,
// with the same ignore rules as the directory tree, and summarizes
// oversized JSON instead of dumping it whole.
// ---------------------------------------------------------------------

function summarizeJSON(content, relPath, byteSize) {
  try {
    const parsed = JSON.parse(content);
    let shape;
    if (Array.isArray(parsed)) {
      shape = `Array of ${parsed.length} item(s).`;
      if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        shape += ` First item's keys: ${Object.keys(parsed[0]).join(', ')}`;
      }
    } else if (parsed && typeof parsed === 'object') {
      shape = `Object with top-level keys: ${Object.keys(parsed).join(', ')}`;
    } else {
      shape = 'Primitive JSON value.';
    }
    return `### ${relPath}\n_${byteSize} bytes — content summarized (exceeds ${JSON_SUMMARY_THRESHOLD}-byte threshold); full text omitted from this document to keep it bounded in size. Read the file directly for full content._\n\n${shape}\n\n`;
  } catch {
    return `### ${relPath}\n_${byteSize} bytes — content summarized as unparseable/invalid JSON; full text omitted. Read the file directly._\n\n`;
  }
}

function buildSourceCodeSection() {
  let codeDump = '';

  for (const rootRel of SOURCE_DUMP_ROOTS) {
    const rootDir = path.join(ROOT, rootRel);
    if (!fs.existsSync(rootDir)) continue;
    const files = collectFiles(rootDir).filter(f => SOURCE_DUMP_EXTENSIONS.has(path.extname(f)));
    files.sort();

    for (const fullPath of files) {
      const relative = path.relative(ROOT, fullPath).split(path.sep).join('/');
      const ext = path.extname(fullPath);
      const stat = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      if (ext === '.json' && stat.size > JSON_SUMMARY_THRESHOLD) {
        codeDump += summarizeJSON(content, relative, stat.size);
        continue;
      }

      let lang = ext.substring(1);
      if (lang === 'js') lang = 'javascript';
      codeDump += `### ${relative}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
    }
  }

  const viteConfigPath = path.join(ROOT, 'vite.config.js');
  if (fs.existsSync(viteConfigPath)) {
    codeDump += `### vite.config.js\n\`\`\`javascript\n${fs.readFileSync(viteConfigPath, 'utf-8')}\n\`\`\`\n\n`;
  }

  return codeDump;
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

function main() {
  const checklist = loadChecklist();
  const files = collectFiles(ROOT);
  const tree = buildTree(ROOT) || '_(empty — nothing built yet)_';
  const timestamp = new Date().toISOString();

  const projectName = checklist?.projectName || 'Project';

  let specNote;
  if (!checklist?.specFile) {
    specNote = 'No spec file is referenced in project-checklist.json.';
  } else {
    const specExists = fs.existsSync(path.join(ROOT, checklist.specFile));
    specNote = specExists
      ? `The authoritative spec is **${checklist.specFile}**. It is the source of truth for architecture, schemas, and rules. Do not deviate from it without updating it first.`
      : `⚠️ **WARNING: checklist.specFile is set to \`${checklist.specFile}\`, but no file with that name exists in the repo root.** Either the spec was renamed/moved, or project-checklist.json is stale. Resolve this before trusting any spec references in this document.`;
  }

  const md = `# PROJECT STATE — ${projectName}

**Generated:** ${timestamp}
**Generated by:** \`scripts/generate-project-state.js\`

---

## 1. Project Context & Architecture

${buildMetadataSection(checklist)}

**Dependencies:**
${loadDependencies()}

---

## 2. Read This First (Resume Instructions)

1. **Review this file** to understand exactly what exists right now, recent changes, and unresolved tasks.
2. **Review ${checklist ? checklist.specFile : 'the Technical Specification'}**. ${specNote}
3. **Check Open Decisions** (§5) to ensure your work does not conflict with blocked tasks.
4. **Check the Module Usage Graph** (§10) before assuming a shared component is wired up anywhere.

---

## 3. Phase Checklist (Auto-detected from files)

${buildChecklistSection(checklist)}

---

## 4. Manual Verification / Follow-up Tasks

These cannot be verified by scanning the file system and require human QA, a code read, or an explicit decision.

${buildManualTasksSection(checklist)}

---

## 5. Open Decisions (Pending Resolution)

${buildOpenDecisionsSection(checklist)}

---

## 6. Git Status & Active Working Tree

${buildGitSection()}

---

## 7. Action Items (TODO / FIXME / HACK)

${scanForMarkers(files).length > 0 ? scanForMarkers(files).map(h => `- \`${h.file}:${h.line}\` — ${h.text}`).join('\n') : '_No markers found._'}

---

## 8. Full Git Changelog

${buildChangelogSection()}

---

## 9. Full Directory Tree

\`\`\`
${tree}
\`\`\`

---

## 10. Module Usage Graph (src/shared/*)

${buildModuleUsageSection(files)}

---

## 11. Source Code Contents

${buildSourceCodeSection()}
`;

  fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
  console.log(`PROJECT_STATE.md written to ${OUTPUT_FILE}`);
}

// Execute the script
main();