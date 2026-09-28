import { createNavBar } from '../../shared/components/NavBar.js';
import { simulateInteractiveTree } from '../../shared/calc-engine/genealogy-calc.js';

document.getElementById('nav-mount').appendChild(createNavBar());

const treeMount = document.getElementById('tree-mount');
const outRank = document.getElementById('out-rank');
const outCp = document.getElementById('out-cp');
const outCurrency = document.getElementById('out-currency');
const errorBanner = document.getElementById('error-banner');
const rankCard = document.getElementById('rank-card');
const rankIcon = document.getElementById('rank-icon');

const modal = document.getElementById('enrollment-modal');
const modalTitle = document.getElementById('enroll-title');
const btnCloseModal = document.getElementById('btn-close-modal');

const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

// --- GLOBAL STATE ---
let treeState = null;
let pcState = { psp: 0 };
let nodeCounter = 0;
let pendingAction = { type: null, targetId: null }; 

// --- NODE FACTORY ---
function createNode(name, isBc1=false, isBc2=false, isBc3=false, psp=0) {
  nodeCounter++;
  return { id: 'node_' + nodeCounter, name, psp, left: null, right: null, isBc1, isBc2, isBc3, leftVol: 0, rightVol: 0, cp: 0 };
}

// --- ENROLLMENT LOGIC ---
function executeEnrollment(enrollType) {
  const is3BC = enrollType === '3bc';
  
  if (pendingAction.type === 'join') {
    pcState.psp = 0; // Reset PC state on fresh enrollment
    if (is3BC) {
      treeState = createNode('Matt Elijah Pineda (BC1)', true, false, false, 100);
      treeState.left = createNode('Matt Elijah Pineda (BC2)', false, true, false, 200);
      treeState.right = createNode('Matt Elijah Pineda (BC3)', false, false, true, 200);
    } else {
      treeState = createNode('Matt Elijah Pineda (BC1)', true, false, false, 200);
    }
  } else {
    const parentNode = findNode(treeState, pendingAction.targetId);
    if (!parentNode) return;
    
    let newPartner;
    if (is3BC) {
      newPartner = createNode('Partner BC1', false, false, false, 100);
      newPartner.left = createNode('Partner BC2', false, false, false, 200);
      newPartner.right = createNode('Partner BC3', false, false, false, 200);
    } else {
      newPartner = createNode('Partner', false, false, false, 200);
    }
    
    if (pendingAction.type === 'add-left') parentNode.left = newPartner;
    if (pendingAction.type === 'add-right') parentNode.right = newPartner;
  }
  
  closeModal();
  renderFullTree();
}

function openModal(actionType, targetId = null) {
  pendingAction = { type: actionType, targetId };
  modalTitle.textContent = actionType === 'join' ? 'Join USANA' : 'Enroll Partner';
  modal.classList.add('active');
}

function closeModal() {
  modal.classList.remove('active');
  pendingAction = { type: null, targetId: null };
}

document.querySelectorAll('.enroll-btn').forEach(btn => {
  btn.addEventListener('click', (e) => executeEnrollment(e.currentTarget.dataset.type));
});
btnCloseModal.addEventListener('click', closeModal);

// --- TREE OPERATIONS ---
function findNode(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  const leftSearch = findNode(node.left, id);
  if (leftSearch) return leftSearch;
  return findNode(node.right, id);
}

function removeNodeFromTree(parent, id) {
  if (!parent) return false;
  if (parent.left && parent.left.id === id) { parent.left = null; return true; }
  if (parent.right && parent.right.id === id) { parent.right = null; return true; }
  if (removeNodeFromTree(parent.left, id)) return true;
  if (removeNodeFromTree(parent.right, id)) return true;
  return false;
}

// --- DOM UPDATES ---
function updateMetricsDOM(result) {
  if (result.error) {
    errorBanner.textContent = result.error;
    errorBanner.style.display = 'block';
  } else {
    errorBanner.style.display = 'none';
  }
  
  const sym = document.getElementById('currencySymbol').value === 'PHP' ? '₱' : '$';
  
  // Dashboard Updates
  outCp.textContent = fmt(result.commissionPoints);
  outCurrency.textContent = `${sym}${fmt(result.localCurrency)}`;
  outRank.textContent = result.rankData.name;
  
  // Rank Visuals Updates
  rankCard.className = `rank-card level-${result.rankData.level}`;
  if (result.rankData.level === 'star-diamond') {
    rankIcon.innerHTML = '★'.repeat(result.rankData.stars);
  } else if (result.rankData.level === 'none') {
    rankIcon.innerHTML = '<div style="width:12px; height:12px; border-radius:50%; background:#cbd5e1;"></div>';
  } else {
    // Generate an initial letter for standard ranks
    rankIcon.innerHTML = result.rankData.name.charAt(0);
  }
}

function updateTreeDOM(node) {
  if (!node) return;
  const leftEl = document.getElementById(`left-vol-${node.id}`);
  const rightEl = document.getElementById(`right-vol-${node.id}`);
  const payoutEl = document.getElementById(`payout-${node.id}`);

  if (leftEl) leftEl.textContent = fmt(node.leftVol);
  if (rightEl) rightEl.textContent = fmt(node.rightVol);
  
  if (payoutEl) {
    if (node.cp >= 1000) {
      payoutEl.textContent = 'MAXED: 1,000 CP';
      payoutEl.classList.add('maxed');
    } else {
      payoutEl.textContent = `Payout: ${fmt(node.cp)} CP`;
      payoutEl.classList.remove('maxed');
    }
  }

  updateTreeDOM(node.left);
  updateTreeDOM(node.right);
}

function runSimulation() {
  if (!treeState) {
    updateMetricsDOM({ error: null, commissionPoints: 0, localCurrency: 0, rankData: { name: "None", level: "none", stars: 0 } });
    return;
  }
  const exchangeRate = parseFloat(document.getElementById('exchangeRate').value) || 1;
  const result = simulateInteractiveTree(treeState, pcState, exchangeRate);
  updateMetricsDOM(result);
  updateTreeDOM(treeState);
}

function renderHtmlTree(node) {
  if (!node) return '';
  const isRootBC = node.isBc1 || node.isBc2 || node.isBc3;

  let html = `
    <li>
      <div class="g-node">
        <input class="g-name-input" type="text" value="${node.name}" data-id="${node.id}" placeholder="Name" />
        <div class="g-vols">
          <div class="g-vol left">
            <div class="g-vol-label">L GSP</div>
            <div class="g-vol-value" id="left-vol-${node.id}">${fmt(node.leftVol)}</div>
          </div>
          <div class="g-vol right">
            <div class="g-vol-label">R GSP</div>
            <div class="g-vol-value" id="right-vol-${node.id}">${fmt(node.rightVol)}</div>
          </div>
        </div>
  `;

  if (isRootBC) {
    html += `<div class="g-payout-display" id="payout-${node.id}">Payout: 0 CP</div>`;
  }

  // Action Bar
  html += `<div class="g-actions">`;
  html += `<button class="btn-icon add" data-action="add-left" data-id="${node.id}" ${node.left ? 'disabled' : ''}>+ L</button>`;
  if (!isRootBC) html += `<button class="btn-icon rm" data-action="remove" data-id="${node.id}">X</button>`;
  else html += `<div></div>`;
  html += `<button class="btn-icon add" data-action="add-right" data-id="${node.id}" ${node.right ? 'disabled' : ''}>+ R</button>`;
  html += `</div>`;
  
  // New PSP Input bound to every node
  html += `
        <div class="g-psp-container">
          <label>PSP</label>
          <input type="number" class="g-psp-input" value="${node.psp}" data-id="${node.id}" min="0" step="50" />
        </div>
      </div>
  `;

  if (node.left || node.right) {
    html += `<ul>`;
    if (node.left && !node.right) {
      html += renderHtmlTree(node.left);
      html += `<li style="visibility:hidden; width:160px; padding:0;"></li>`;
    } else if (!node.left && node.right) {
      html += `<li style="visibility:hidden; width:160px; padding:0;"></li>`;
      html += renderHtmlTree(node.right);
    } else {
      html += renderHtmlTree(node.left);
      html += renderHtmlTree(node.right);
    }
    html += `</ul>`;
  }
  html += `</li>`;
  return html;
}

function renderFullTree() {
  if (!treeState) {
    treeMount.innerHTML = `
      <div class="blank-state">
        <h2>Start Your Business</h2>
        <p>Enroll with USANA to establish your Business Center structure and begin building your network.</p>
        <button class="btn btn-primary" style="max-width: 250px; margin: 0 auto;" onclick="document.getElementById('btn-init-join').click()">Join USANA</button>
        <!-- Hidden button to bind cleanly to existing delegated listener -->
        <button id="btn-init-join" style="display:none;" data-action="join"></button>
      </div>
    `;
    runSimulation();
    return;
  }

  // The PC Node sits completely outside the <ul> tree structure
  const pcHtml = `
    <div class="pc-node">
      <div class="pc-label">Preferred Customers</div>
      <input type="number" class="pc-psp-input" value="${pcState.psp}" min="0" step="50" placeholder="Total PSP" />
    </div>
  `;

  treeMount.innerHTML = `
    ${pcHtml}
    <div class="genealogy-tree">
      <ul>${renderHtmlTree(treeState)}</ul>
    </div>
  `;
  runSimulation();
}

// --- EVENT DELEGATION & LISTENERS ---
treeMount.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === 'join' || action === 'add-left' || action === 'add-right') {
    openModal(action, id);
  } else if (action === 'remove') {
    removeNodeFromTree(treeState, id);
    renderFullTree();
  }
});

treeMount.addEventListener('input', (e) => {
  if (e.target.classList.contains('g-name-input')) {
    const node = findNode(treeState, e.target.dataset.id);
    if (node) node.name = e.target.value;
  }
  if (e.target.classList.contains('g-psp-input')) {
    const node = findNode(treeState, e.target.dataset.id);
    if (node) {
      node.psp = parseInt(e.target.value) || 0;
      runSimulation();
    }
  }
  if (e.target.classList.contains('pc-psp-input')) {
    pcState.psp = parseInt(e.target.value) || 0;
    runSimulation();
  }
});

document.getElementById('currencySymbol').addEventListener('change', (e) => {
  const rateInput = document.getElementById('exchangeRate');
  if (e.target.value === 'USD') rateInput.value = 1;
  if (e.target.value === 'PHP' && rateInput.value == 1) rateInput.value = 55;
  runSimulation();
});

document.getElementById('exchangeRate').addEventListener('input', runSimulation);

document.getElementById('btn-reset-tree').addEventListener('click', () => {
  if (confirm("Are you sure you want to clear the entire genealogy?")) {
    treeState = null;
    pcState.psp = 0;
    nodeCounter = 0;
    renderFullTree();
  }
});

// Init blank state
renderFullTree();