import { createNavBar } from '../shared/components/NavBar.js';
import { buildProgressRail, updateActiveRail } from '../landing/progress-rail.js';
import { initScrollEngine } from '../landing/scroll-engine.js';
import { resolvePath } from '../shared/base-path.js';

document.getElementById('nav-mount').appendChild(createNavBar());

const btnNutri = document.getElementById('btn-nutritionals');
const btnCela = document.getElementById('btn-celavive');
const viewNutri = document.getElementById('view-nutritionals');
const viewCela = document.getElementById('view-celavive');
const railMount = document.getElementById('rail-mount');

let nutritionalsData = [];
let celaviveData = [];

function toggleViews(showNutri) {
  // Clear the existing rail navigation
  railMount.innerHTML = '';
  
  if (showNutri) {
    btnNutri.classList.add('active'); 
    btnCela.classList.remove('active');
    viewNutri.classList.remove('hidden'); 
    viewCela.classList.add('hidden');
    
    // Rebuild rail for Nutritionals and scroll to top
    railMount.appendChild(buildProgressRail(nutritionalsData));
    if (viewNutri.firstElementChild) {
      viewNutri.firstElementChild.scrollIntoView({behavior: 'smooth'});
    }
  } else {
    btnCela.classList.add('active'); 
    btnNutri.classList.remove('active');
    viewCela.classList.remove('hidden'); 
    viewNutri.classList.add('hidden');
    
    // Rebuild rail for Celavive and scroll to top
    railMount.appendChild(buildProgressRail(celaviveData));
    if (viewCela.firstElementChild) {
      viewCela.firstElementChild.scrollIntoView({behavior: 'smooth'});
    }
  }
}

btnNutri.addEventListener('click', () => toggleViews(true));
btnCela.addEventListener('click', () => toggleViews(false));

function createSection(p, index) {
  const sectionEl = document.createElement('section');
  sectionEl.className = 'snap-section';
  if (index === 0) sectionEl.classList.add('is-active');
  sectionEl.id = p.id;
  
  sectionEl.innerHTML = `
    <div class="visual-wrapper">
      <a href="${p.buyLink || '#'}" target="_blank" class="product-image-link" title="Click to purchase ${p.name}">
        <img src="${resolvePath(p.image)}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
      </a>
    </div>
    <div class="content-wrapper">
      <span class="kicker">${p.kicker}</span>
      <h2 class="editorial-title">${p.name}</h2>
      <p class="editorial-body">${p.overview}</p>
      
      <div class="details-grid">
        <div class="benefits-block">
          <h4>Core Benefits</h4>
          <ul>${p.benefits.map(b => `<li>${b}</li>`).join('')}</ul>
        </div>
        <div class="ideal-block">
          <h4>Ideal For</h4>
          <div class="ideal-for-list">
            ${p.idealFor.map(tag => `<span class="ideal-tag">${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  return sectionEl;
}

async function loadProducts() {
  try {
    const response = await fetch(resolvePath('content/products.json'));
    const products = await response.json();
    
    // Split data into the two hubs
    nutritionalsData = products.filter(p => p.category === 'nutritionals');
    celaviveData = products.filter(p => p.category === 'celavive');
    
    // Render HTML blocks
    nutritionalsData.forEach((p, i) => viewNutri.appendChild(createSection(p, i)));
    celaviveData.forEach((p, i) => viewCela.appendChild(createSection(p, i)));

    // Initialize default view (Nutritionals)
    railMount.appendChild(buildProgressRail(nutritionalsData));

    // Global scroll tracker watches all snap-sections regardless of container
    initScrollEngine('.snap-section', (activeId) => {
      updateActiveRail(activeId);
      document.querySelectorAll('.snap-section').forEach(el => {
        if (el.id === activeId) el.classList.add('is-active');
        else el.classList.remove('is-active');
      });
    });

  } catch (e) {
    console.error("Failed to load product portfolio:", e);
    viewNutri.innerHTML = `<div style="text-align:center; padding-top: 150px; color: red;">Failed to load products.</div>`;
  }
}

loadProducts();