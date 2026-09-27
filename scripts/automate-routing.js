// scripts/automate-routing.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reconstruct __dirname in ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

// --- TASK 1: Generate the Centralized Helper ---
const basePathCode = `/**
 * Resolves a path against the Vite base URL for GitHub Pages compatibility.
 * @param {string} path - The target path (e.g., 'content/products.json')
 */
export function resolvePath(path) {
  const base = import.meta.env.BASE_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return \`\${base}\${cleanPath}\`;
}\n`;

const helperPath = path.join(rootDir, 'src/shared/base-path.js');
fs.writeFileSync(helperPath, basePathCode);
console.log('✅ Created: src/shared/base-path.js');

// --- TASK 2: Purge Absolute Paths from HTML ---
function fixHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) fixHtmlFiles(fullPath);
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const depth = path.relative(rootDir, fullPath).split(path.sep).length - 1;
      const prefix = depth === 0 ? './' : '../'.repeat(depth);

      const original = content;
      // Replaces href="/..." and src="/...", safely ignoring external //cdn links
      content = content.replace(/(href|src)=["']\/(?!\/)([^"']*)["']/g, `$1="${prefix}$2"`);

      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed HTML paths in: ${path.relative(rootDir, fullPath)}`);
      }
    }
  }
}
fixHtmlFiles(rootDir);

// --- TASK 3: Decouple JSON Image Paths ---
const jsonPaths = ['public/content/products.json', 'public/content/sections.json'];
jsonPaths.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    let data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    let modified = false;
    data.forEach(item => {
      if (item.image && item.image.startsWith('/')) {
        item.image = item.image.substring(1);
        modified = true;
      }
    });
    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
      console.log(`✅ Stripped absolute slashes from JSON in: ${relPath}`);
    }
  }
});

// --- TASK 4: Implement Helper in JavaScript Components ---
const jsReplacements = [
  {
    file: 'src/shared/components/NavBar.js',
    replacements: [
      { search: "const base = import.meta.env.BASE_URL;", replace: "import { resolvePath } from '../base-path.js';" },
      { search: 'href="${base}"', replace: 'href="${resolvePath(\'\')}"' },
      { search: 'href="${base}app/product/"', replace: 'href="${resolvePath(\'app/product/\')}"' },
      { search: 'href="${base}app/business/"', replace: 'href="${resolvePath(\'app/business/\')}"' },
      { search: 'href="${base}app/tools/"', replace: 'href="${resolvePath(\'app/tools/\')}"' }
    ]
  },
  {
    file: 'src/shared/components/ToolShell.js',
    replacements: [
      { search: "const base = import.meta.env.BASE_URL;", replace: "import { resolvePath } from '../base-path.js';" },
      { search: 'href="${base}app/tools/"', replace: 'href="${resolvePath(\'app/tools/\')}"' }
    ]
  },
  {
    file: 'src/landing/main.js',
    replacements: [
      { search: "await fetch(import.meta.env.BASE_URL + 'content/sections.json')", replace: "await fetch(resolvePath('content/sections.json'))" },
      { search: "import { initScrollEngine } from './scroll-engine.js';", replace: "import { initScrollEngine } from './scroll-engine.js';\nimport { resolvePath } from '../shared/base-path.js';" }
    ]
  },
  {
    file: 'src/business/main.js',
    replacements: [
      { search: "await fetch(import.meta.env.BASE_URL + 'content/compensation.json')", replace: "await fetch(resolvePath('content/compensation.json'))" },
      { search: "import { initScrollEngine } from '../landing/scroll-engine.js';", replace: "import { initScrollEngine } from '../landing/scroll-engine.js';\nimport { resolvePath } from '../shared/base-path.js';" }
    ]
  },
  {
    file: 'src/product/main.js',
    replacements: [
      { search: "await fetch(import.meta.env.BASE_URL + 'content/products.json')", replace: "await fetch(resolvePath('content/products.json'))" },
      { search: 'src="${p.image}"', replace: 'src="${resolvePath(p.image)}"' },
      { search: "import { initScrollEngine } from '../landing/scroll-engine.js';", replace: "import { initScrollEngine } from '../landing/scroll-engine.js';\nimport { resolvePath } from '../shared/base-path.js';" }
    ]
  }
];

jsReplacements.forEach(({ file, replacements }) => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    replacements.forEach(({ search, replace }) => {
      if (content.includes(search)) {
        content = content.replace(search, replace);
        modified = true;
      }
    });
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Injected resolvePath into: ${file}`);
    }
  }
});

console.log('\n🚀 Automation complete. Run `npm run build && npm run preview` to verify.');