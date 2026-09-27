import { resolvePath } from '../base-path.js';

/**
 * Wraps a tool view in the standard System B shell.
 * @param {string} title - The name of the current tool
 * @param {HTMLElement} contentNode - The main UI of the tool
 * @returns {HTMLElement} The assembled shell
 */

export function createToolShell(title, contentNode) {
  const shell = document.createElement('div');
  shell.className = 'tool-shell';
  
  const header = document.createElement('header');
  header.className = 'tool-header';
  header.innerHTML = `
    <a href="${resolvePath('app/tools/')}" class="back-link">&larr; Back to Tools</a>
    <h1 class="tool-title">${title}</h1>
    <div class="tool-actions">
      <button class="btn-export">Export CSV</button>
      <button class="btn-import">Import CSV</button>
    </div>
  `;
  
  const main = document.createElement('main');
  main.className = 'tool-content';
  main.appendChild(contentNode);
  
  shell.appendChild(header);
  shell.appendChild(main);
  
  return shell;
}