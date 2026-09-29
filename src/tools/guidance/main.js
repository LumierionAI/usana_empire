import { createNavBar } from '../../shared/components/NavBar.js';
import guidanceRules from './guidance-rules.json';

console.info("%c USANA Empire System - ID:15661635", "color: transparent;");

document.getElementById('nav-mount').appendChild(createNavBar());

const selectAge = document.getElementById('age-group');
const selectIntensity = document.getElementById('intensity');
const selectFocus = document.getElementById('health-focus');
const btnGenerate = document.getElementById('btn-generate');
const resultsMount = document.getElementById('results-mount');

function populateConditions() {
  if (!guidanceRules || !guidanceRules.conditions) return;
  
  guidanceRules.conditions.forEach(condition => {
    const option = document.createElement('option');
    option.value = condition.id;
    option.textContent = condition.name;
    selectFocus.appendChild(option);
  });
}

function generateProtocol() {
  const age = selectAge.value;
  const intensity = selectIntensity.value;
  const focus = selectFocus.value;
  
  let html = '';
  
  try {
    const data = guidanceRules; 
    
    // Inject Dynamic Meta Disclaimer per Phase 3 Requirements
    const metaSource = data._meta?.source || 'Comprehensive Guide to Nutritional Product Recommendation';
    const metaDisclaimer = data._meta?.disclaimer || 'Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.';
    
    html += `
      <div class="disclaimer-banner" style="background: #fff1f2; color: #be123c; border-left: 4px solid #be123c; padding: 1rem; margin-bottom: 1.5rem; border-radius: 0 4px 4px 0;">
        <strong style="display: block; margin-bottom: 0.5rem; text-transform: uppercase;">Medical Disclaimer</strong>
        <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; line-height: 1.4;">${metaDisclaimer}</p>
        <p style="margin: 0; font-size: 0.8rem; opacity: 0.85;"><strong>Source:</strong> ${metaSource}</p>
      </div>
    `;

    // Part A: Determine Foundational Products
    let foundation = null;
    let foundationTitle = '';
    
    if (age === 'adult') {
      foundation = intensity === 'optimal' 
        ? data.foundations.adult_optimal 
        : data.foundations.adult_minimal;
      foundationTitle = `Adult Foundation (${intensity === 'optimal' ? 'Optimal' : 'Minimal'})`;
    } else {
      const childKey = age.replace('child_', 'age_').replace('_', '_to_');
      foundation = { products: data.foundations.children[childKey] };
      foundationTitle = `Pediatric Foundation`;
    }
    
    // Render Foundation HTML
    if (foundation && foundation.products) {
      html += `<h3 style="color: var(--color-brand-dark, #0f172a); margin-bottom: 0.5rem;">${foundationTitle}</h3>`;
      if (foundation.rationale) {
        html += `<p style="color: #475569; margin-bottom: 1rem; font-style: italic; font-size: 0.9rem;">${foundation.rationale}</p>`;
      }
      html += `<ul style="margin-bottom: 2rem; padding-left: 1.5rem; color: #334155;">`;
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
        
        html += `<hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 2rem 0;" />`;
        html += `<h3 style="color: var(--color-brand-dark, #0f172a); margin-bottom: 0.5rem;">Targeted Support: ${condition.name}</h3>`;
        html += `<p style="color: #475569; margin-bottom: 1rem; font-style: italic; font-size: 0.9rem;">${condition.rationale}</p>`;
        
        if (conditionProducts && conditionProducts.length > 0) {
          html += `<ul style="padding-left: 1.5rem; color: #334155;">`;
          conditionProducts.forEach(p => {
            html += `<li style="margin-bottom: 0.5rem;"><strong>${p.name}:</strong> ${p.dose}</li>`;
          });
          html += `</ul>`;
        } else {
          html += `<p style="color: #64748b; font-size: 0.9rem;">No additional targeted products required at the ${intensity} intensity tier.</p>`;
        }
      }
    }
    
    resultsMount.innerHTML = html;
    
  } catch (error) {
    console.error("Critical Protocol Engine Error:", error);
    resultsMount.innerHTML = `<div style="color: red; font-weight: bold;">Failed to generate protocol. Check console logs.</div>`;
  }
}

populateConditions();
btnGenerate.addEventListener('click', generateProtocol);