import { createToolShell } from '../../shared/components/ToolShell.js';
import { createDataTable } from '../../shared/components/DataTable.js';
import { storageAdapter } from '../../shared/storage-adapter.js';
import { calculateNextReminderDate } from '../../shared/calc-engine/receipts-calc.js';
import { createImportWizard } from '../../shared/components/ImportWizard.js';
import { exportToCSV, parseCSV } from '../../shared/import-export/csv.js';

// --- State ---
let purchases = [];
let customers = [];
let currentLineItems = [{ productName: '', quantity: 1, unitPrice: 0 }];

// --- UI Scaffolding ---
function renderApp() {
  const container = document.createElement('div');
  
  container.innerHTML = `
    <div class="header-actions" style="margin-bottom: 1rem;">
      <button id="btn-show-list" class="btn btn-outline">History Dashboard</button>
      <button id="btn-show-editor" class="btn btn-primary">+ New Receipt</button>
    </div>
    
    <!-- View 1: History List -->
    <div id="view-list" class="view-section active">
      <div id="table-mount"></div>
    </div>
    
    <!-- View 2: Invoice Editor -->
    <div id="view-editor" class="view-section">
      <div class="app-container">
        <div class="editor-pane no-print">
          <div class="action-bar" style="display:flex; gap: 1rem; margin-bottom: 1rem;">
              <button class="btn btn-outline" onclick="window.print()">Print PDF</button>
              <button class="btn btn-primary" id="btn-save-db">Save to Database</button>
          </div>
          
          <div class="section-title">Invoice Metadata</div>
          <div class="form-grid">
              <div class="form-group">
                  <label>Invoice Number</label>
                  <input type="text" id="invNumber" value="INV-${Date.now().toString().slice(-4)}">
              </div>
              <div class="form-group">
                  <label>Date</label>
                  <input type="date" id="invDate" value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div class="form-group">
                  <label>Status</label>
                  <select id="invStatus">
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                  </select>
              </div>
              <div class="form-group">
                  <label>Replenishment Cycle (Days)</label>
                  <input type="number" id="cycleDays" value="30" min="0">
              </div>
          </div>

          <div class="section-title">Customer Information</div>
          <div class="form-grid">
              <div class="form-group full-width">
                  <label>Customer Name</label>
                  <input type="text" id="clientName" placeholder="Client Name">
              </div>
              <div class="form-group full-width">
                  <label>Customer Details (Address, Email)</label>
                  <textarea id="clientDetails" placeholder="Client Address and Contact Info"></textarea>
              </div>
          </div>

          <div class="section-title">Line Items</div>
          <div id="lineItemsContainer"></div>
          <button class="btn btn-outline" style="width:100%; margin-top:0.5rem;" id="btn-add-line">+ Add Line Item</button>
        </div>

        <div class="preview-pane">
          <div class="invoice-paper template-modern" id="invoicePaper"></div>
        </div>
      </div>
    </div>
  `;
  return container;
}

const appMount = document.getElementById('app-mount');
const shell = createToolShell('Receipt Generator', renderApp());
appMount.appendChild(shell);

const wizardDOM = createImportWizard();
document.body.appendChild(wizardDOM);

let importPendingData = null;

// Export CSV
shell.querySelector('.btn-export').addEventListener('click', () => {
  // Serialize lineItems to a string so it fits safely in a single CSV column
  const exportData = purchases.map(p => ({
    ...p,
    lineItems: JSON.stringify(p.lineItems)
  }));
  exportToCSV(exportData, `receipts_export_${new Date().toISOString().split('T')[0]}.csv`);
});

// Import Flow
shell.querySelector('.btn-import').addEventListener('click', () => {
  wizardDOM.classList.remove('hidden');
  wizardDOM.querySelector('.step-upload').classList.remove('hidden');
  wizardDOM.querySelector('.step-preview').classList.add('hidden');
  document.getElementById('importFileInput').value = '';
});

document.getElementById('importFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const expectedHeaders = ['id', 'customerId', 'date', 'lineItems', 'total', 'paymentStatus', 'nextReminderDate'];
    const parsed = await parseCSV(file, expectedHeaders);
    importPendingData = parsed;
    wizardDOM.querySelector('.step-upload').classList.add('hidden');
    wizardDOM.querySelector('.step-preview').classList.remove('hidden');
    wizardDOM.querySelector('.preview-stats').textContent = `Validated! Ready to import ${parsed.length} records.`;
  } catch (err) {
    alert(err.message);
    e.target.value = '';
  }
});

document.getElementById('btnConfirmImport').addEventListener('click', async () => {
  if (!importPendingData) return;
  for (const item of importPendingData) {
    item.total = parseFloat(item.total) || 0;
    try {
      item.lineItems = typeof item.lineItems === 'string' ? JSON.parse(item.lineItems) : item.lineItems;
    } catch (e) {
      item.lineItems = []; // fallback if stringified JSON fails
    }
    await storageAdapter.set('purchases', item);
  }
  importPendingData = null;
  wizardDOM.classList.add('hidden');
  alert('Import successful.');
  await loadDashboard();
});

document.getElementById('btnCancelImport').addEventListener('click', () => {
  importPendingData = null;
  wizardDOM.classList.add('hidden');
});

// --- DOM Elements & Listeners ---
const viewList = document.getElementById('view-list');
const viewEditor = document.getElementById('view-editor');
const btnShowList = document.getElementById('btn-show-list');
const btnShowEditor = document.getElementById('btn-show-editor');
const tableMount = document.getElementById('table-mount');

btnShowList.addEventListener('click', () => switchView('list'));
btnShowEditor.addEventListener('click', () => switchView('editor'));
document.getElementById('btn-add-line').addEventListener('click', addLineItem);
document.getElementById('btn-save-db').addEventListener('click', saveInvoiceToDB);

['invNumber', 'invDate', 'invStatus', 'clientName', 'clientDetails'].forEach(id => {
  document.getElementById(id).addEventListener('input', updatePreview);
});

function switchView(view) {
  if (view === 'list') {
    viewList.classList.add('active'); viewEditor.classList.remove('active');
    loadDashboard();
  } else {
    viewEditor.classList.add('active'); viewList.classList.remove('active');
    updatePreview();
  }
}

// --- Editor Logic ---
function addLineItem() {
  currentLineItems.push({ productName: '', quantity: 1, unitPrice: 0 });
  renderEditorItems();
  updatePreview();
}

window.removeLineItem = (index) => {
  currentLineItems.splice(index, 1);
  renderEditorItems();
  updatePreview();
};

window.updateLineItem = (index, field, value) => {
  currentLineItems[index][field] = value;
  updatePreview();
};

function renderEditorItems() {
  const container = document.getElementById('lineItemsContainer');
  container.innerHTML = '';
  currentLineItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'line-item-row';
    row.innerHTML = `
      <input type="text" placeholder="Product Name" value="${item.productName}" oninput="window.updateLineItem(${index}, 'productName', this.value)">
      <input type="number" placeholder="Qty" value="${item.quantity}" min="1" oninput="window.updateLineItem(${index}, 'quantity', parseFloat(this.value) || 0)">
      <input type="number" placeholder="Unit Price (Php)" value="${item.unitPrice}" min="0" step="1" oninput="window.updateLineItem(${index}, 'unitPrice', parseFloat(this.value) || 0)">
      <button class="btn btn-danger" onclick="window.removeLineItem(${index})">X</button>
    `;
    container.appendChild(row);
  });
}

function formatCurrency(num) {
  return 'Php ' + parseFloat(num).toFixed(2);
}

function updatePreview() {
  const invNumber = document.getElementById('invNumber').value;
  const invDate = document.getElementById('invDate').value;
  const status = document.getElementById('invStatus').value;
  const clientName = document.getElementById('clientName').value || '<em>Client Name</em>';
  const clientDetails = document.getElementById('clientDetails').value.replace(/\n/g, '<br>');
  
  let subtotal = 0;
  let itemsHtml = '';
  
  currentLineItems.forEach(item => {
    const total = item.quantity * item.unitPrice;
    subtotal += total;
    itemsHtml += `
      <tr>
        <td>${item.productName || '<em>Product name</em>'}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align: right;">${formatCurrency(total)}</td>
      </tr>
    `;
  });

  const paper = document.getElementById('invoicePaper');
  const isPaid = status === 'paid';
  const statusColor = isPaid ? '#16a34a' : 'var(--text-muted)';
  const watermark = isPaid ? '<div class="watermark-paid">PAID</div>' : '';

  paper.innerHTML = `
    ${watermark}
    <div class="invoice-content-wrapper">
      <div class="inv-header">
        <div>
          <div class="inv-title">INVOICE</div>
          <div style="color: ${statusColor}; margin-top: 0.5rem; font-weight:700; text-transform: capitalize;">Status: ${status}</div>
        </div>
        <div style="text-align: right;">
          <strong>USANA Empire</strong><br>
          Independent Distributor
        </div>
      </div>
      <div class="billing-section">
        <div>
          <div style="color: #666; font-size: 0.875rem; margin-bottom: 0.5rem; text-transform:uppercase;">Bill To</div>
          <strong>${clientName}</strong><br>${clientDetails}
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 0.5rem;"><strong>Invoice #:</strong> ${invNumber}</div>
          <div style="margin-bottom: 0.5rem;"><strong>Date:</strong> ${invDate}</div>
        </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center; width: 10%;">Qty</th>
            <th style="text-align: right; width: 25%;">Unit Price</th>
            <th style="text-align: right; width: 25%;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row grand-total">
            <span>Total</span>
            <span>${formatCurrency(Math.max(0, subtotal))}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Database Logic ---
async function saveInvoiceToDB() {
  const clientName = document.getElementById('clientName').value.trim();
  if (!clientName) return alert('Customer Name is required');
  if (currentLineItems.length === 0 || !currentLineItems[0].productName) return alert('At least one product name is required');

  let customerId = crypto.randomUUID();
  const existingCust = customers.find(c => c.name.toLowerCase() === clientName.toLowerCase());
  if (existingCust) {
    customerId = existingCust.id;
  } else {
    const newCust = {
      id: customerId,
      name: clientName,
      contact: document.getElementById('clientDetails').value,
      createdAt: new Date().toISOString()
    };
    await storageAdapter.set('customers', newCust);
  }

  const purchaseDate = document.getElementById('invDate').value;
  const cycleDays = parseInt(document.getElementById('cycleDays').value, 10) || 30;
  const reminderDate = calculateNextReminderDate(purchaseDate, cycleDays);
  const total = currentLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const purchaseData = {
    id: document.getElementById('invNumber').value || crypto.randomUUID(),
    customerId: customerId,
    date: purchaseDate,
    lineItems: currentLineItems,
    total: total,
    paymentStatus: document.getElementById('invStatus').value,
    nextReminderDate: reminderDate
  };

  await storageAdapter.set('purchases', purchaseData);
  alert('Receipt saved securely to IndexedDB.');
  switchView('list');
}

async function loadDashboard() {
  customers = await storageAdapter.list('customers') || [];
  purchases = await storageAdapter.list('purchases') || [];

  const joinedData = purchases.map(p => {
    const cust = customers.find(c => c.id === p.customerId);
    return {
      'Invoice ID': p.id,
      'Date': p.date,
      'Customer': cust ? cust.name : 'Unknown',
      'Total': formatCurrency(p.total),
      'Status': p.paymentStatus.toUpperCase(),
      'Reminder Due': p.nextReminderDate
    };
  });

  const headers = ['Invoice ID', 'Date', 'Customer', 'Total', 'Status', 'Reminder Due'];
  tableMount.innerHTML = '';
  tableMount.appendChild(createDataTable(headers, joinedData));
}

// --- Init ---
renderEditorItems();
updatePreview();
loadDashboard();