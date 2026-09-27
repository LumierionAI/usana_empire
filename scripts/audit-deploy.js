import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetDirs = ['src', 'tools', 'business', 'product'];
const targetFiles = ['index.html'];

let errorCount = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  const relativePath = path.relative(rootDir, filePath);
  let lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Check for absolute paths in HTML href or src attributes
    if (ext === '.html') {
      if (line.match(/(href|src)=["']\/[a-zA-Z0-9]/)) {
        console.warn(`[WARNING] Absolute path found in HTML: ${relativePath}:${lineNum}`);
        console.warn(`   Line: ${line.trim()}`);
        console.warn(`   Fix: Use relative paths (e.g., './') or Vite base tags.\n`);
        errorCount++;
      }
    }

    // 2. Check for naked fetches in JS missing import.meta.env.BASE_URL
    if (ext === '.js') {
      if (line.match(/fetch\(['"]\/[a-zA-Z0-9]/)) {
        console.warn(`[WARNING] Unsafe fetch() path found: ${relativePath}:${lineNum}`);
        console.warn(`   Line: ${line.trim()}`);
        console.warn(`   Fix: Prefix with import.meta.env.BASE_URL or use a direct static import.\n`);
        errorCount++;
      }

      // 3. Check for absolute routing in JS (window.location)
      if (line.match(/window\.location\.href\s*=\s*['"]\/[a-zA-Z0-9]/)) {
        console.warn(`[WARNING] Hardcoded absolute redirect found: ${relativePath}:${lineNum}`);
        console.warn(`   Line: ${line.trim()}`);
        console.warn(`   Fix: Prepend import.meta.env.BASE_URL to the redirect path.\n`);
        errorCount++;
      }
    }
  });
}

function walkDir(currentPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
      scanFile(fullPath);
    }
  }
}

console.log('Starting GitHub Pages Deployment Audit...\n');

targetDirs.forEach(dir => {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) walkDir(dirPath);
});

targetFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) scanFile(filePath);
});

if (errorCount === 0) {
  console.log('✅ Audit passed! No common deployment path errors detected.');
} else {
  console.log(`❌ Audit complete. Found ${errorCount} potential deployment issue(s).`);
}