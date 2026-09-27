 < type="module">
    import { createNavBar } from '../../src/shared/components/NavBar.js';
    document.getElementById('nav-mount').appendChild(createNavBar());

    let rulesDb = null;

    async function init() {
      try {
        const res = await fetch('/src/tools/guidance/guidance-rules.json');
        rulesDb = await res.json();
        
        // Populate the conditions dropdown alphabetically
        const conditionSelect = document.getElementById('client-condition');
        const sortedConditions = rulesDb.conditions.sort((a, b) => a.name.localeCompare(b.name));
        
        sortedConditions.forEach(cond => {
          const option = document.createElement('option');
          option.value = cond.id;
          option.textContent = cond.name;
          conditionSelect.appendChild(option);
        });

      } catch (err) {
        console.error(err);
        document.getElementById('results-mount').innerHTML = '<div class="empty-state" style="color:red;">Error loading clinical protocols. Please check your JSON file.</div>';
      }
    }

    function renderProductCards(products) {
      if (!products || products.length === 0) return `<p style="color:#666; font-style:italic;">No additional supplements prescribed for this phase.</p>`;
      return `
        <div class="product-list">
          ${products.map(p => `
            <div class="product-item">
              <h4>${p.name}</h4>
              <p>Dosage: ${p.dose}</p>
            </div>
          `).join('')}
        </div>
      `;
    }

    document.getElementById('intake-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!rulesDb) return;

      const formData = new FormData(e.target);
      const age = formData.get('age');
      const intensity = formData.get('intensity');
      const conditionId = formData.get('condition');
      
      const mount = document.getElementById('results-mount');
      let html = '';

      // --- PHASE 1: FOUNDATIONAL NUTRITION ---
      let foundationData = {};
      let foundationProducts = [];

      if (age === 'adult') {
        const key = intensity === 'optimal' ? 'adult_optimal' : 'adult_minimal';
        foundationData = rulesDb.foundations[key];
        foundationProducts = foundationData.products;
      } else {
        // Handle Children (Dr. Strand does not separate optimal/minimal for children)
        foundationData = { rationale: "Provides necessary macronutrients and vitamins for critical growth stages." };
        foundationProducts = rulesDb.foundations.children[age] || [];
      }

      html += `
        <div class="protocol-section">
          <span class="protocol-kicker">Phase 1: Baseline</span>
          <h3 class="protocol-header">Foundational Cellular Nutrition</h3>
          <p class="protocol-rationale">${foundationData.rationale || 'Establishes a baseline of complete cellular nutrition.'}</p>
          ${renderProductCards(foundationProducts)}
        </div>
      `;

      // --- PHASE 2: TARGETED OPTIMIZERS ---
      if (conditionId !== 'general') {
        const conditionData = rulesDb.conditions.find(c => c.id === conditionId);
        
        if (conditionData) {
          const optimizerProducts = intensity === 'optimal' ? conditionData.optimal : conditionData.minimal;
          
          html += `
            <div class="protocol-section">
              <span class="protocol-kicker">Phase 2: Targeted Support</span>
              <h3 class="protocol-header">${conditionData.name} Optimizers</h3>
              <p class="protocol-rationale">${conditionData.rationale}</p>
              ${renderProductCards(optimizerProducts)}
            </div>
          `;
        }
      }

      mount.innerHTML = html;
    });

    init();