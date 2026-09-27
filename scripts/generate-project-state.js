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
 * exist, what's still missing, what's flagged as a TODO in the code,
 * what the git history looks like, and what open decisions are still
 * blocking which phase — all derived directly from the real state of
 * the repo, not from memory or a stale conversation.
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
 * scripts/project-checklist.json lists every phase from the Final
 * Technical Specification's Development Plan (§10) and the key files
 * each phase is expected to produce (from §9's file structure). This
 * script checks whether each file/directory exists and is non-trivial
 * (not a stub) and marks it accordingly. A few items are marked
 * "manual" in the checklist (e.g. an accessibility pass) because they
 * can't be verified by scanning files — those always show as
 * "needs manual confirmation."
 *
 * This script has NO external dependencies — only Node's built-in
 * fs, path, and child_process modules — so it always runs, even
 * before `npm install` has ever been run.
 * ---------------------------------------------------------------------
 */

/**
 * generate-project-state.js
 * ---------------------------------------------------------------------
 * Scans the repository and writes PROJECT_STATE.md at the repo root.
 * Designed to provide an AI agent with comprehensive, zero-shot context
 * of the project's purpose, architecture, state, recent momentum, and
 * full historical changelog, including source code dumps.
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

function buildChecklistSection(checklist) {
  if (!checklist) return '_No scripts/project-checklist.json found._';
  let out = [];
  let totalItems = 0;
  let doneItems = 0;

  for (const phase of checklist.phases) {
    if (!phase.items || phase.items.length === 0) continue;
    out.push(`### ${phase.name}`);
    for (const item of phase.items) {
      totalItems += 1;
      const status = checkPathStatus(item.check);
      if (status.exists) doneItems += 1;
      const box = status.exists ? '[x]' : '[ ]';
      out.push(`- ${box} ${item.label} (\`${item.check}\`) — ${status.note}`);
    }
    out.push('');
  }

  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const header = `**Automated file progress: ${doneItems}/${totalItems} items present (${pct}%)**\n`;
  return header + '\n' + out.join('\n');
}

function buildManualTasksSection(checklist) {
  if (!checklist || !checklist.manualTasks || checklist.manualTasks.length === 0) return '_No pending manual tasks._';
  let out = [];
  for (const task of checklist.manualTasks) {
    out.push(`- [ ] **${task.label}**\n  > ${task.instructions}`);
  }
  return out.join('\n\n');
}

function buildMetadataSection(checklist) {
  if (!checklist || !checklist.projectMetadata) return '_No project metadata defined in checklist._';
  const meta = checklist.projectMetadata;
  const arch = Object.entries(meta.architecture || {})
    .map(([key, val]) => `- **${key}:** ${val}`)
    .join('\n');

  return `**Description:** ${meta.description}\n\n**Architecture & Stack:**\n${arch}`;
}

function buildSourceCodeSection() {
  const targetDirs = ['src', 'public/content'];
  let codeDump = '';

  function dumpFiles(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        dumpFiles(fullPath);
      } else if (['.js', '.json', '.html', '.css'].includes(path.extname(entry.name))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relative = path.relative(ROOT, fullPath);
        let lang = path.extname(entry.name).substring(1);
        if (lang === 'js') lang = 'javascript';

        codeDump += `### ${relative}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
      }
    }
  }

  targetDirs.forEach(dir => dumpFiles(path.join(ROOT, dir)));

  const viteConfigPath = path.join(ROOT, 'vite.config.js');
  if (fs.existsSync(viteConfigPath)) {
    codeDump += `### vite.config.js\n\`\`\`javascript\n${fs.readFileSync(viteConfigPath, 'utf-8')}\n\`\`\`\n\n`;
  }

  return codeDump;
}

function main() {
  const checklist = loadChecklist();
  const files = collectFiles(ROOT);
  const tree = buildTree(ROOT) || '_(empty — nothing built yet)_';
  const timestamp = new Date().toISOString();

  const projectName = checklist?.projectName || 'Project';
  const specNote = checklist?.specFile
    ? `The authoritative spec is **${checklist.specFile}**. It is the source of truth for architecture, schemas, and rules. Do not deviate from it without updating it first.`
    : 'No spec file is referenced in project-checklist.json.';

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
3. **Check Open Decisions** below to ensure your work does not conflict with blocked tasks.

---

## 3. Phase Checklist (Auto-detected from files)

${buildChecklistSection(checklist)}

---

## 4. Manual Verification Tasks

These tasks cannot be verified by scanning the file system and require human QA or external confirmation.

${buildManualTasksSection(checklist)}

---

## 5. Open Decisions (Pending Resolution)

${checklist?.openDecisions ? checklist.openDecisions.map(d => `- ${d}`).join('\n') : '_None_'}

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

## 10. Source Code Contents

${buildSourceCodeSection()}
`;

  fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
}

// Execute the script
main();