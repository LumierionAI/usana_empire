import { createToolShell } from '../../shared/components/ToolShell.js';
import { createDataTable } from '../../shared/components/DataTable.js';
import { createImportWizard } from '../../shared/components/ImportWizard.js';
import { storageAdapter } from '../../shared/storage-adapter.js';
import { calculateLedgerTotals } from '../../shared/calc-engine/ledger-calc.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';

// ==========================================
// 1. CENTRALIZED STATE
// ==========================================
const state = {
  ledgerEntries: [],
  formData: getEmptyForm(),
  importPendingData: null
};

function getEmptyForm() {
  return { date: new Date().toISOString().split('T')[0], type: 'sale', amount: '', description: '' };
}

// ==========================================
// 2. PURE UI COMPONENTS
// ==========================================
function renderMetrics(totals) {
  const format = (num) => 'Php ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `
    <div class="metric-card profit">
      <h3>Net Profit</h3>
      <div class="value">${format(totals.netProfit)}</div>
    </div>
    <div class="metric-card">
      <h3>Total Revenue</h3>
      <div class="value">${format(totals.revenue)}</div>
      <div style="font-size: 0.8rem; color:#64748b; margin-top: 4px;">
        Retail: ${format(totals.retailSalesTotal)} | Comm: ${format(totals.commissionTotal)}
      </div>
    </div>
    <div class="metric-card expense">
      <h3>Total Expenses</h3>
      <div class="value">${format(totals.expenses)}</div>
    </div>
  `;
}

function renderForm(data) {
  return `
    <h2>Add Entry</h2>
    <form id="ledger-form">
      <div class="form-group">
        <label for="entry-date">Date</label>
        <input type="date" id="entry-date" value="${data.date}" required>
      </div>
      <div class="form-group">
        <label for="entry-type">Transaction Type</label>
        <select id="entry-type" required>
          <option value="sale" ${data.type === 'sale' ? 'selected' : ''}>Retail Sale (Income)</option>
          <option value="commission" ${data.type === 'commission' ? 'selected' : ''}>Weekly Commission (Income)</option>
          <option value="inventory" ${data.type === 'inventory' ? 'selected' : ''}>Product Inventory (Expense)</option>
          <option value="expense" ${data.type === 'expense' ? 'selected' : ''}>Business Expense (Expense)</option>
        </select>
      </div>
      <div class="form-group">
        <label for="entry-amount">Amount (Php)</label>
        <input type="number" id="entry-amount" value="${data.amount}" min="0.01" step="0.01" required placeholder="0.00">
      </div>
      <div class="form-group">
        <label for="entry-desc">Description / Notes</label>
        <input type="text" id="entry-desc" value="${data.description}" placeholder="e.g., CellSentials Pack">
      </div>
      <button type="submit" class="btn btn-primary">Save Entry</button>
    </form>
  `;
}

// ==========================================
// 3. MASTER RENDER LOOP
// ==========================================
const contentContainer = document.createElement('div');
contentContainer.className = 'dashboard-grid';

function render() {
  const totals = calculateLedgerTotals(state.ledgerEntries);
  const format = (num) => 'Php ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  contentContainer.innerHTML = `
    <div class="metrics-row">${renderMetrics(totals)}</div>
    <aside class="panel">${renderForm(state.formData)}</aside>
    <section class="panel">
      <h2>Profit Trend</h2>
      <div class="chart-container" id="chart-mount"></div>
    </section>
    <section class="table-row">
      <div id="table-mount"></div>
    </section>
  `;

  // Render DataTable Component
  const tableMount = contentContainer.querySelector('#table-mount');
  const sorted = [...state.ledgerEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const tableData = sorted.map(entry => {
    let sign = (entry.type === 'expense' || entry.type === 'inventory') ? '-' : '+';
    return {
      'Date': entry.date,
      'Type': `<span class="type-badge badge-${entry.type}">${entry.type}</span>`,
      'Description': entry.description || '-',
      'Amount': `<strong>${sign}${format(entry.amount)}</strong>`
    };
  });
  tableMount.appendChild(createDataTable(['Date', 'Type', 'Description', 'Amount'], tableData));

  // Render SVG Chart
  renderChart(contentContainer.querySelector('#chart-mount'));
}

function renderChart(mount) {
  if (state.ledgerEntries.length === 0) {
    mount.innerHTML = '<div style="padding: 1rem; color: #64748b;">Not enough data to plot trend.</div>';
    return;
  }
  const sorted = [...state.ledgerEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningProfit = 0;
  const points = sorted.map(entry => {
    if (entry.type === 'sale' || entry.type === 'commission') runningProfit += entry.amount;
    if (entry.type === 'expense' || entry.type === 'inventory') runningProfit -= entry.amount;
    return runningProfit;
  });

  const maxProfit = Math.max(...points, 100);
  const minProfit = Math.min(...points, 0);
  const range = maxProfit - minProfit || 1;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", "0 0 1000 200"); svg.setAttribute("preserveAspectRatio", "none");

  if (minProfit < 0) {
    const zeroY = 200 - ((0 - minProfit) / range) * 180 - 10;
    const zeroLine = document.createElementNS(svgNS, "line");
    zeroLine.setAttribute("x1", "0"); zeroLine.setAttribute("y1", zeroY);
    zeroLine.setAttribute("x2", "1000"); zeroLine.setAttribute("y2", zeroY);
    zeroLine.setAttribute("stroke", "#e2e8f0"); zeroLine.setAttribute("stroke-width", "2");
    svg.appendChild(zeroLine);
  }

  let polylinePts = [];
  const stepX = points.length > 1 ? 1000 / (points.length - 1) : 500;
  points.forEach((val, i) => {
    const x = i * stepX;
    const y = 200 - ((val - minProfit) / range) * 180 - 10; 
    polylinePts.push(`${x},${y}`);
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", x); circle.setAttribute("cy", y);
    circle.setAttribute("r", "4"); circle.setAttribute("fill", "var(--color-primary)");
    svg.appendChild(circle);
  });
  
  const polyline = document.createElementNS(svgNS, "polyline");
  polyline.setAttribute("points", polylinePts.join(" "));
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "var(--color-primary)");
  polyline.setAttribute("stroke-width", "3");
  svg.appendChild(polyline);
  mount.appendChild(svg);
}

// ==========================================
// 4. EVENTS & CSV IMPORT/EXPORT LOGIC
// ==========================================
contentContainer.addEventListener('submit', async (e) => {
  if (e.target.id === 'ledger-form') {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('entry-amount').value);
    const newEntry = {
      id: crypto.randomUUID(),
      date: document.getElementById('entry-date').value,
      type: document.getElementById('entry-type').value,
      amount: amount,
      description: document.getElementById('entry-desc').value.trim(),
      createdAt: new Date().toISOString()
    };
    await storageAdapter.set('ledger', newEntry);
    state.formData = getEmptyForm(); // reset form
    await fetchAndRender();
  }
});

// Setup Tool Shell and Wizard
const appMount = document.getElementById('app-mount');
const shell = createToolShell('Financial Ledger', contentContainer);
appMount.appendChild(shell);

const wizardDOM = createImportWizard();
document.body.appendChild(wizardDOM);

// --- CSV Handlers ---
// 1. Export
shell.querySelector('.btn-export').addEventListener('click', () => {
  const exportData = state.ledgerEntries.map(e => ({
    id: e.id, date: e.date, type: e.type, amount: e.amount, description: e.description, createdAt: e.createdAt
  }));
  exportToCSV(exportData, `ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
});

// 2. Import Trigger
shell.querySelector('.btn-import').addEventListener('click', () => {
  wizardDOM.classList.remove('hidden');
  wizardDOM.querySelector('.step-upload').classList.remove('hidden');
  wizardDOM.querySelector('.step-preview').classList.add('hidden');
  document.getElementById('importFileInput').value = '';
});

// 3. Import Validate & Preview
document.getElementById('importFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const expectedHeaders = ['id', 'date', 'type', 'amount', 'description', 'createdAt'];
    const parsed = await parseCSV(file, expectedHeaders);
    state.importPendingData = parsed;
    
    wizardDOM.querySelector('.step-upload').classList.add('hidden');
    wizardDOM.querySelector('.step-preview').classList.remove('hidden');
    wizardDOM.querySelector('.preview-stats').textContent = `Validated! Ready to import ${parsed.length} records.`;
  } catch (err) {
    alert(err.message); // Native alert per Phase 3 error rules
    e.target.value = '';
  }
});

// 4. Import Confirm
document.getElementById('btnConfirmImport').addEventListener('click', async () => {
  if (!state.importPendingData) return;
  for (const item of state.importPendingData) {
    item.amount = parseFloat(item.amount); // Ensure strict typing
    await storageAdapter.set('ledger', item);
  }
  state.importPendingData = null;
  wizardDOM.classList.add('hidden');
  alert('Import successful.');
  await fetchAndRender();
});

document.getElementById('btnCancelImport').addEventListener('click', () => {
  state.importPendingData = null;
  wizardDOM.classList.add('hidden');
});

// ==========================================
// 5. INITIALIZATION
// ==========================================
async function fetchAndRender() {
  state.ledgerEntries = await storageAdapter.list('ledger') || [];
  render();
}

fetchAndRender();