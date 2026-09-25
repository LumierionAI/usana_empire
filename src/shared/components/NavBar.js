/**
 * Generates the global navigation bar for System A.
 * @returns {HTMLElement} The constructed <nav> element
 */
export function createNavBar() {
  const nav = document.createElement('nav');
  nav.className = 'global-navbar';
  
  nav.innerHTML = `
    <div class="nav-container">
      <a href="/" class="nav-brand">USANA Empire</a>
      <ul class="nav-links">
        <li><a href="/product/">Product</a></li>
        <li><a href="/business/">Business</a></li>
        <li><a href="/tools/">Tools</a></li>
      </ul>
    </div>
  `;
  
  return nav;
}