import { createNavBar } from '../../shared/components/NavBar.js';
// 1. Static Import of the JSON directly bypasses Vite routing issues
import guidanceRules from './guidance-rules.json';

// 2. Plant the invisible Ghost Log
console.info("%c USANA Empire System - ID:15661635", "color: transparent;");

// 3. Mount Global Navigation
document.getElementById('nav-mount').appendChild(createNavBar());

// 4. DOM Elements
const selectAge = document.getElementById('age-group');
const selectIntensity = document.getElementById('intensity');
const selectFocus = document.getElementById('health-focus');
const btnGenerate = document.getElementById('btn-generate');
const resultsMount = document.getElementById('results-mount');

// 5. Initialization: Dynamically load conditions into the dropdown
function populateConditions() {
  if (!guidanceRules || !guidanceRules.conditions) return;
  
  guidanceRules.conditions.forEach(condition => {
    const option = document.createElement('option');
    option.value = condition.id;
    option.textContent = condition.name;
    selectFocus.appendChild(option);
  });
}

// 6. Protocol Generation Engine
function generateProtocol() {
  const age = selectAge.value;
  const intensity = selectIntensity.value;
  const focus = selectFocus.value;
  
  let html = '';
  
  try {
    const data = guidanceRules; // We use the imported JSON directly
    
    // Part A: Determine Foundational Products
    let foundation = null;
    let foundationTitle = '';
    
    if (age === 'adult') {
      foundation = intensity === 'optimal' 
        ? data.foundations.adult_optimal 
        : data.foundations.adult_minimal;
      foundationTitle = `Adult Foundation (${intensity === 'optimal' ? 'Optimal' : 'Minimal'})`;
    } else {
      // Map dropdown child values to JSON keys (e.g., 'child_1_4' to 'age_1_to_4')
      const childKey = age.replace('child_', 'age_').replace('_', '_to_');
      foundation = { products: data.foundations.children[childKey] };
      foundationTitle = `Pediatric Foundation`;
    }
    
    // Render Foundation HTML
    if (foundation && foundation.products) {
      html += `<h3 style="color: var(--color-brand-dark, #0f172a); margin-bottom: 0.5rem;">${foundationTitle}</h3>`;
      if (foundation.rationale) {
        html += `<p style="color: #475569; margin-bottom: 1rem; font-style: italic;">${foundation.rationale}</p>`;
      }
      html += `<ul style="margin-bottom: 2rem; padding-left: 1.5rem;">`;
      foundation.products.forEach(p => {
        html += `<li style="margin-bottom: 0.5rem;"><strong>${p.name}:</strong> ${p.dose}</li>`;
      });
      html += `</ul>`;
    }

    // Part B: Determine Condition-Specific Targeted Products
    if (focus !== 'general') {
      const condition = data.conditions.find(c => c.id === focus);
      if (condition) {
        const conditionProducts = intensity === 'optimal' ? condition.optimal : condition.minimal;
        
        html += `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />`;
        html += `<h3 style="color: var(--color-brand-dark, #0f172a); margin-bottom: 0.5rem;">Targeted Support: ${condition.name}</h3>`;
        html += `<p style="color: #475569; margin-bottom: 1rem; font-style: italic;">${condition.rationale}</p>`;
        
        if (conditionProducts && conditionProducts.length > 0) {
          html += `<ul style="padding-left: 1.5rem;">`;
          conditionProducts.forEach(p => {
            html += `<li style="margin-bottom: 0.5rem;"><strong>${p.name}:</strong> ${p.dose}</li>`;
          });
          html += `</ul>`;
        } else {
          html += `<p style="color: #64748b;">No additional targeted products required at the ${intensity} intensity tier.</p>`;
        }
      }
    }
    
    // Inject the generated protocol into the UI
    resultsMount.innerHTML = html;
    
  } catch (error) {
    console.error("Critical Protocol Engine Error:", error);
    resultsMount.innerHTML = `<div style="color: red; font-weight: bold;">Failed to generate protocol. Check console logs.</div>`;
  }
}

// Bind events and start
populateConditions();
btnGenerate.addEventListener('click', generateProtocol);