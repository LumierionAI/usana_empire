import { createNavBar } from '../shared/components/NavBar.js';
import { buildProgressRail, updateActiveRail } from '../landing/progress-rail.js';
import { initScrollEngine } from '../landing/scroll-engine.js';

document.getElementById('nav-mount').appendChild(createNavBar());

async function initBusinessPlan() {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'content/compensation.json');
    const sections = await response.json();
    
    const mainContent = document.getElementById('main-content');
    
    sections.forEach((sec, index) => {
      const sectionEl = document.createElement('section');
      sectionEl.className = `snap-section theme-${sec.theme} layout-${sec.layout}`;
      if (index === 0) sectionEl.classList.add('is-active');
      sectionEl.id = sec.id;
      
      let contentHTML = `
        <div class="data-heavy-section">
          <div class="content-wrapper">
            <span class="kicker" style="justify-content: ${sec.layout === 'center' || sec.layout === 'split' ? 'center' : 'flex-start'}">${sec.kicker}</span>
            <h2 class="editorial-title">${sec.title}</h2>
            <p class="editorial-body">${sec.content}</p>
          </div>
      `;
      
      // If the section has data cards, render the business grid
      if (sec.cards && sec.cards.length > 0) {
        contentHTML += `<div class="business-grid">`;
        sec.cards.forEach(card => {
          contentHTML += `
            <div class="comp-card">
              <div class="comp-card-title">${card.title}</div>
              <p class="comp-card-body">${card.body}</p>
            </div>
          `;
        });
        contentHTML += `</div>`;
      }
      
      contentHTML += `</div>`; // Close data-heavy-section
      
      sectionEl.innerHTML = contentHTML;
      mainContent.appendChild(sectionEl);
    });

    const railMount = document.getElementById('rail-mount');
    railMount.appendChild(buildProgressRail(sections));

    initScrollEngine('.snap-section', (activeId) => {
      updateActiveRail(activeId);
      
      document.querySelectorAll('.snap-section').forEach(el => {
        if (el.id === activeId) {
          el.classList.add('is-active');
        } else {
          el.classList.remove('is-active');
        }
      });
    });
  } catch (error) {
    console.error("Failed to load business plan content:", error);
  }
}

initBusinessPlan();