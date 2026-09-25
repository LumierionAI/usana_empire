/**
 * Scaffolds the validate -> preview -> confirm import UI.
 * @returns {HTMLElement}
 */
export function createImportWizard() {
  const wizard = document.createElement('div');
  wizard.className = 'import-wizard hidden';
  
  wizard.innerHTML = `
    <div class="wizard-modal">
      <h2>Import Data</h2>
      <div class="wizard-step step-upload">
        <input type="file" accept=".csv, .json" id="importFileInput" />
      </div>
      <div class="wizard-step step-preview hidden">
        <p class="preview-stats"></p>
        <div class="preview-duplicates"></div>
        <button id="btnConfirmImport" class="btn-primary">Confirm Import</button>
        <button id="btnCancelImport" class="btn-secondary">Cancel</button>
      </div>
    </div>
  `;
  
  return wizard;
}