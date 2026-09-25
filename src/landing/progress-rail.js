/**
 * Builds the DOM elements for the side progress rail.
 * @param {Array<Object>} sections - The array of section objects from JSON.
 * @returns {HTMLElement} The constructed rail container.
 */
export function buildProgressRail(sections) {
  const rail = document.createElement('div');
  rail.className = 'progress-rail';
  
  sections.forEach((sec, index) => {
    const dot = document.createElement('div');
    dot.className = 'rail-dot';
    if (index === 0) dot.classList.add('active');
    dot.dataset.target = sec.id;
    dot.title = sec.title;
    
    dot.addEventListener('click', () => {
      const targetEl = document.getElementById(sec.id);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    rail.appendChild(dot);
  });
  
  return rail;
}

/**
 * Updates the visual state of the rail dots.
 * @param {string} activeId - The ID of the currently visible section.
 */
export function updateActiveRail(activeId) {
  document.querySelectorAll('.rail-dot').forEach(dot => {
    if (dot.dataset.target === activeId) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}