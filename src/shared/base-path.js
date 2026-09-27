/**
 * Resolves a path against the Vite base URL for GitHub Pages compatibility.
 * @param {string} path - The target path (e.g., 'content/products.json')
 */
export function resolvePath(path) {
  const base = import.meta.env.BASE_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
