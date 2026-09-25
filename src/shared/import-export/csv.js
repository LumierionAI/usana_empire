import Papa from 'papaparse';

/**
 * Exports an array of objects to a downloaded CSV file.
 * @param {Array<Object>} data - The records to export.
 * @param {string} filename - Target filename (e.g., 'customers.csv').
 */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses a CSV file and validates it against expected headers.
 * @param {File} file - The uploaded CSV file.
 * @param {Array<string>} expectedHeaders - Strict schema requirements.
 * @returns {Promise<Array<Object>>} Resolves with parsed data or rejects on invalid schema.
 */
export function parseCSV(file, expectedHeaders = []) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Strict header validation per Section 6.5
        if (expectedHeaders.length > 0 && results.meta.fields) {
          const missing = expectedHeaders.filter(h => !results.meta.fields.includes(h));
          if (missing.length > 0) {
            return reject(new Error(`Invalid format. Missing headers: ${missing.join(', ')}`));
          }
        }
        resolve(results.data);
      },
      error: (err) => reject(new Error(`CSV Parse Error: ${err.message}`))
    });
  });
}