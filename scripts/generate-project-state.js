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

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT, 'PROJECT_STATE.md');
const CHECKLIST_FILE = path.join(__dirname, 'project-checklist.json');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.vite', 'coverage',
  '.cache', '.github',
]);

// Removed .md to prevent flagging spec documents as technical debt[cite: 4]
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

function buildGitSection() {
  if (!isGitRepo()) {
    return '_This directory is not (yet) a git repository. Run `git init` to start tracking history._';
  }
  
  let branch = safeRun('git branch --show-current');
  if (!branch) {
    branch = safeRun('git rev-parse --abbrev-ref HEAD') || 'No commits yet (main)';
  }
  
  const log = safeRun('git log -10 --pretty=format:"- %h  %ad  %s" --date=short') || '_no commits yet_';
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
    '**Last 10 commits:**',
    log,
    '',
    '**Uncommitted changes:**',
    uncommitted,
  ].join('\n');
}

function buildChecklistSection(checklist) {
  if (!checklist) return '_No scripts/project-checklist.json found._';
  let out = [];
  let totalItems = 0;
  let doneItems = 0;

  for (const phase of checklist.phases) {
    out.push(`### ${phase.name}`);
    for (const item of phase.items) {
      totalItems += 1;
      if (item.manual) {
        out.push(`- [ ] ${item.label} — _needs manual confirmation, not file-checkable_`);
        continue;
      }
      const status = checkPathStatus(item.check);
      if (status.exists) doneItems += 1;
      const box = status.exists ? '[x]' : '[ ]';
      out.push(`- ${box} ${item.label} (\`${item.check}\`) — ${status.note}`);
    }
    out.push('');
  }

  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const header = `**Overall file-checkable progress: ${doneItems}/${totalItems} items present (${pct}%)** — manual-QA items are not counted in this percentage.\n`;
  return header + '\n' + out.join('\n');
}

function buildOpenDecisionsSection(checklist) {
  if (!checklist || !checklist.openDecisions || checklist.openDecisions.length === 0) return '_No open decisions listed._';
  return checklist.openDecisions.map(d => `- ${d}`).join('\n');
}

function buildMarkersSection(files) {
  const hits = scanForMarkers(files);
  if (hits.length === 0) return '_No TODO / FIXME / HACK / OPEN DECISION markers found in source files._';
  return hits.map(h => `- \`${h.file}:${h.line}\` — ${h.text}`).join('\n');
}

function findNextStep(checklist) {
  if (!checklist) return 'Recreate scripts/project-checklist.json.';
  for (const phase of checklist.phases) {
    const incomplete = phase.items.filter(item => {
      if (item.manual) return true;
      return !checkPathStatus(item.check).exists;
    });
    if (incomplete.length > 0) {
      return `**${phase.name}** is the first incomplete phase. Next unfinished items:\n` +
        incomplete.slice(0, 5).map(i => `- ${i.label}`).join('\n');
    }
  }
  return 'All file-checkable items across all phases are present.';
}

function main() {
  const checklist = loadChecklist();
  const files = collectFiles(ROOT);
  const tree = buildTree(ROOT) || '_(empty — nothing built yet)_';
  const timestamp = new Date().toISOString();

  const specNote = checklist && checklist.specFile
    ? `The authoritative spec is **${checklist.specFile}**. If it's not in this repo yet, copy it in — it is the source of truth for architecture, schemas, and rules, and this file only tracks *progress against it*, it does not replace it.`
    : 'No spec file is referenced in project-checklist.json — add one.';

  const md = `# PROJECT STATE — USANA Empire

**Generated:** ${timestamp}
**Generated by:** \`scripts/generate-project-state.js\` — re-run this any time with \`npm run state\` (or \`node scripts/generate-project-state.js\`) to refresh this file.

---

## Read this first (resume instructions)

If you are starting a new session — new chat window, new tool, new contributor, or just picking this back up after a break — read in this order:
1. **This file**, for exactly what exists right now and what's next.
2. **${checklist ? checklist.specFile : 'the Final Technical Specification'}**, for *why* things are built the way they are, the full architecture, data schemas, and the binding implementation rules (§14). Do not deviate from it without updating it first.
3. The **Open Decisions** section below — these are the things nobody has answered yet; check whether they've been resolved since this file was last generated before starting work that depends on them.

${specNote}

---

## Suggested next step

${findNextStep(checklist)}

---

## Phase checklist (auto-detected from files on disk)

${buildChecklistSection(checklist)}

---

## Open decisions (from the spec — verify current status before relying on these)

${buildOpenDecisionsSection(checklist)}

---

## Git status

${buildGitSection()}

---

## TODO / FIXME / HACK / OPEN DECISION markers found in source

${buildMarkersSection(files)}

---

## Full directory tree

\`\`\`
${tree}
\`\`\`

---

*End of auto-generated snapshot. Re-run \`npm run state\` after your next work session.*
`;

  fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
}

main();