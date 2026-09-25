/**
 * Initializes the IntersectionObserver for scroll tracking.
 * @param {string} selector - CSS selector for the sections to observe.
 * @param {Function} onActiveChange - Callback triggered when a new section becomes active.
 */
export function initScrollEngine(selector, onActiveChange) {
  const sections = document.querySelectorAll(selector);
  
  const options = {
    root: null, // observe relative to the viewport
    rootMargin: '0px',
    threshold: 0.5 // trigger when at least 50% of the section is visible
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        onActiveChange(entry.target.id);
      }
    });
  }, options);
  
  sections.forEach(section => observer.observe(section));
}