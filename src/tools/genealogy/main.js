import { createNavBar } from '../../shared/components/NavBar.js';
import { simulateInteractiveTree } from '../../shared/calc-engine/genealogy-calc.js';

document.getElementById('nav-mount').appendChild(createNavBar());

const treeMount = document.getElementById('tree-mount');
const outPeople = document.getElementById('out-people');
const outVolume = document.getElementById('out-volume');
const outCp = document.getElementById('out-cp');
const outCurrency = document.getElementById('out-currency');
const errorBanner = document.getElementById('error-banner');

const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

let treeState = null;
let nodeCounter = 0;

function createNode(name, isBc1=false, isBc2=false, isBc3=false) {
  nodeCounter++;
  return { id: 'node_' + nodeCounter, name, ownVol: 0, left: null, right: null, isBc1, isBc2, isBc3, leftVol: 0, rightVol: 0, cp: 0 };
}

function initTree(bcCount) {
  treeState = createNode('Matt Elijah Pineda (BC1)', true, false, false);
  if (bcCount === 3) {
    treeState.left = createNode('Matt Elijah Pineda (BC2)', false, true, false);
    treeState.right = createNode('Matt Elijah Pineda (BC3)', false, false, true);
  }
  renderFullTree();
}

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

function updateMetricsDOM(result) {
  if (result.error) {
    errorBanner.textContent = result.error;
    errorBanner.style.display = 'block';
  } else {
    errorBanner.style.display = 'none';
  }
  outPeople.textContent = fmt(result.totalPeople);
  outVolume.textContent = fmt(result.totalVolume);
  outCp.textContent = fmt(result.commissionPoints);
  outCurrency.textContent = `₱${fmt(result.localCurrency)}`;
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
  const psp = parseInt(document.getElementById('psp').value) || 0;
  const bcCount = parseInt(document.getElementById('bcCount').value) || 3;
  const exchangeRate = parseFloat(document.getElementById('exchangeRate').value) || 55;

  const result = simulateInteractiveTree(treeState, psp, bcCount, exchangeRate);
  updateMetricsDOM(result);
  updateTreeDOM(treeState);
}

function renderHtmlTree(node) {
  if (!node) return '';

  const isLeaf = !node.left && !node.right;
  const isRootBC = node.isBc1 || node.isBc2 || node.isBc3;

  let html = `
    <li>
      <div class="g-node">
        <input class="g-name-input" type="text" value="${node.name}" data-id="${node.id}" placeholder="Name" />
        <div class="g-vols">
          <div class="g-vol left">
            <div class="g-vol-label">Left</div>
            <div class="g-vol-value" id="left-vol-${node.id}">${fmt(node.leftVol)}</div>
          </div>
          <div class="g-vol right">
            <div class="g-vol-label">Right</div>
            <div class="g-vol-value" id="right-vol-${node.id}">${fmt(node.rightVol)}</div>
          </div>
        </div>
  `;

  if (isLeaf && !isRootBC) {
    html += `
        <div class="g-leaf-vol">
          <input type="number" class="g-vol-input" value="${node.ownVol}" data-id="${node.id}" min="0" placeholder="Sales Vol" />
        </div>
    `;
  } else if (isRootBC) {
    html += `<div class="g-payout-display" id="payout-${node.id}">Payout: 0 CP</div>`;
  }

  html += `<div class="g-actions">`;
  html += `<button class="btn-icon add" data-action="add-left" data-id="${node.id}" ${node.left ? 'disabled' : ''}>+ L</button>`;
  if (!isRootBC) {
    html += `<button class="btn-icon rm" data-action="remove" data-id="${node.id}">X</button>`;
  } else {
    html += `<div></div>`;
  }
  html += `<button class="btn-icon add" data-action="add-right" data-id="${node.id}" ${node.right ? 'disabled' : ''}>+ R</button>`;
  html += `</div></div>`;

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
  treeMount.innerHTML = `
    <div class="genealogy-tree">
      <ul>${renderHtmlTree(treeState)}</ul>
    </div>
  `;
  runSimulation();
}

treeMount.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const node = findNode(treeState, id);

  if (action === 'add-left' && node && !node.left) {
    node.left = createNode('Partner');
    renderFullTree();
  } else if (action === 'add-right' && node && !node.right) {
    node.right = createNode('Partner');
    renderFullTree();
  } else if (action === 'remove' && node) {
    removeNodeFromTree(treeState, id);
    renderFullTree();
  }
});

treeMount.addEventListener('input', (e) => {
  if (e.target.classList.contains('g-name-input')) {
    const node = findNode(treeState, e.target.dataset.id);
    if (node) node.name = e.target.value;
  }
  if (e.target.classList.contains('g-vol-input')) {
    const node = findNode(treeState, e.target.dataset.id);
    if (node) {
      node.ownVol = parseInt(e.target.value) || 0;
      runSimulation();
    }
  }
});

['bcCount', 'psp', 'exchangeRate'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      if (id === 'bcCount') initTree(parseInt(el.value));
      else runSimulation();
    });
    if (id !== 'bcCount') el.addEventListener('input', runSimulation);
  }
});

initTree(3);