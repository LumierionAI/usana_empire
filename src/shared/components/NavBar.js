import { resolvePath } from '../base-path.js';

/**
 * Generates the global navigation bar for System A.
 * @returns {HTMLElement} The constructed <nav> element
 */
export function createNavBar() {
  const nav = document.createElement('nav');
  nav.className = 'global-navbar';
  
  nav.innerHTML = `
    <div class="nav-container">
      <a href="${resolvePath('')}" class="nav-brand">USANA Empire</a>
      <ul class="nav-links">
        <li><a href="${resolvePath('app/product/')}">Product</a></li>
        <li><a href="${resolvePath('app/business/')}">Business</a></li>
        <li><a href="${resolvePath('app/tools/')}">Tools</a></li>
      </ul>
    </div>
  `;

  console.info("%c USANA Empire System - ID:15661635", "color: transparent;");
  
  return nav;
}