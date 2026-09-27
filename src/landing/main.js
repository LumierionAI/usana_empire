import { createNavBar } from '../shared/components/NavBar.js';
import { buildProgressRail, updateActiveRail } from './progress-rail.js';
import { initScrollEngine } from './scroll-engine.js';

document.getElementById('nav-mount').appendChild(createNavBar());

async function initLanding() {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'content/sections.json');
    const sections = await response.json();
    
    const mainContent = document.getElementById('main-content');
    
    sections.forEach((sec, index) => {
      const sectionEl = document.createElement('section');
      sectionEl.className = `snap-section theme-${sec.theme}`;
      if (index === 0) sectionEl.classList.add('is-active');
      sectionEl.id = sec.id;
      
      let contentHTML = `
        <div class="visual-wrapper" style="background-image: url('${sec.image || ''}')"></div>
        <div class="content-wrapper">
          <span class="kicker">${sec.kicker}</span>
          <h2 class="editorial-title">${sec.title}</h2>
          <p class="editorial-body">${sec.content}</p>
      `;
      
      if (sec.id === 'hero') {
        contentHTML += `
          <div class="cta-group">
            <a href="/product/" class="btn btn-primary">Discover Nutrition</a>
            <a href="/business/" class="btn btn-outline">The Opportunity</a>
          </div>
        `;
      } else if (sec.id === 'opportunity') {
        contentHTML += `
          <div class="cta-group">
            <a href="/business/" class="btn btn-primary">Learn the Business Model</a>
          </div>
        `;
      }
      
      contentHTML += `</div>`; // Close content-wrapper
      
      if (sec.id === 'hero' && sections.length > 1) {
        const nextSectionId = sections[1].id; 
        contentHTML += `
          <div class="scroll-indicator" onclick="document.getElementById('${nextSectionId}').scrollIntoView({behavior: 'smooth'})">
            Scroll to discover
          </div>
        `;
      }
      
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
    console.error("Failed to load landing page content:", error);
  }
}

initLanding();