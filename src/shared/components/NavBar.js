/**
 * Generates the global navigation bar for System A.
 * @returns {HTMLElement} The constructed <nav> element
 */
export function createNavBar() {
  const nav = document.createElement('nav');
  nav.className = 'global-navbar';
  
  const base = import.meta.env.BASE_URL;
  
  nav.innerHTML = `
    <div class="nav-container">
      <a href="${base}" class="nav-brand">USANA Empire</a>
      <ul class="nav-links">
        <li><a href="${base}app/product/">Product</a></li>
        <li><a href="${base}app/business/">Business</a></li>
        <li><a href="${base}app/tools/">Tools</a></li>
      </ul>
    </div>
  `;

  console.info("%c USANA Empire System - ID:15661635", "color: transparent;");
  
  return nav;
}