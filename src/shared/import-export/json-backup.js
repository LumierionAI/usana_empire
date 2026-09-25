import { storageAdapter } from '../storage-adapter.js';

/**
 * Gathers all workspace data and triggers a JSON file download.
 */
export async function exportWorkspaceBackup() {
  const workspace = {
    metadata: {
      version: "1.0",
      timestamp: new Date().toISOString(),
      appName: "USANA Empire"
    },
    data: {
      customers: await storageAdapter.list('customers') || [],
      purchases: await storageAdapter.list('purchases') || [],
      ledger: await storageAdapter.list('ledger') || [],
      prospects: await storageAdapter.list('prospects') || []
    }
  };

  const jsonString = JSON.stringify(workspace, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  const dateStr = workspace.metadata.timestamp.split('T')[0];
  const filename = `usana-empire-backup-${dateStr}.json`;

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
 * Parses a workspace backup file for preview.
 * @param {File} file - The uploaded JSON file.
 * @returns {Promise<Object>} The parsed workspace data object.
 */
export function parseWorkspaceBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.metadata || parsed.metadata.appName !== "USANA Empire") {
          throw new Error("Invalid backup file: Unrecognized format.");
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error("Failed to parse JSON backup. The file may be corrupt."));
      }
    };
    reader.onerror = () => reject(new Error("File read error."));
    reader.readAsText(file);
  });
}

/**
 * Commits the validated backup data to IndexedDB.
 * @param {Object} parsedData - The validated data payload from the preview step.
 */
export async function restoreWorkspace(parsedData) {
  const stores = ['customers', 'purchases', 'ledger', 'prospects'];
  
  for (const store of stores) {
    const items = parsedData.data[store];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await storageAdapter.set(store, item);
      }
    }
  }
}