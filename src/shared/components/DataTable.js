/**
 * Generates a standard data table with dynamic headers.
 * @param {Array<string>} headers - Column titles
 * @param {Array<Object>} rows - Data matching the headers
 * @returns {HTMLElement}
 */
export function createDataTable(headers, rows) {
  const container = document.createElement('div');
  container.className = 'data-table-container';
  
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="empty-state">No records found.</div>`;
    return container;
  }

  const table = document.createElement('table');
  table.className = 'data-table';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = headers.map(key => `<td>${row[key.toLowerCase()] || ''}</td>`).join('');
    tbody.appendChild(tr);
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
  
  return container;
}