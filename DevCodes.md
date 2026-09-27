# USANA Empire: Developer Workflow Guide

This document contains the core terminal commands and operational workflows for the USANA Empire Alpha build. 

## 1. Local Development
Run these commands in your terminal at the root of the project to manage your local environment.

*   **Start the Local Server:**
    ```bash
    npm run dev
    ```
    *Spins up the Vite development server with Hot Module Replacement (HMR). Accessible typically at `http://localhost:5173`.*

*   **Generate Project State:**
    ```bash
    npm run state
    ```
    *Executes `scripts/generate-project-state.js` to scan the directory tree, detect completed files against the technical spec, and update `PROJECT_STATE.md`.*

*   **Test Production Build Locally:**
    ```bash
    npm run build
    npm run preview
    ```
    *Compiles the project into the `dist/` folder and serves the production-ready files locally to verify everything works before pushing.*

---

## 2. Testing Framework
The project uses Vitest for unit testing and E2E testing (configured in `vite.config.js`).

*   **Run All Unit Tests:**
    ```bash
    npm run test
    ```
    *Executes the test suites in `tests/unit/`, such as `calc-engine.test.js`, to verify the genealogy and ledger math engines.*

*   **Run Tests with UI (Optional):**
    ```bash
    npm run test -- --ui
    ```
    *Opens a browser dashboard to visually inspect passing/failing tests.*

*   **Run End-to-End (E2E) Tests:**
    ```bash
    npm run test:e2e
    ```
    *Executes `tests/e2e/smoke.spec.js` to ensure the UI loads, routing works, and critical user paths do not crash in the browser.*

---

## 3. Git & Version Control
Standard command sequences for saving and uploading your progress to GitHub.

*   **The Standard Save & Push Cycle:**
    ```bash
    git add .
    git commit -m "brief description of what you changed"
    git push
    ```

*   **Tagging a Milestone Release (e.g., Alpha/Beta):**
    ```bash
    git tag v0.1.0-alpha
    git push origin --tags
    ```

*   **First-Time Repository Link (If starting fresh):**
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin [https://github.com/LumierionAI/usana_empire.git](https://github.com/LumierionAI/usana_empire.git)
    git push -u origin main
    ```

---

## 4. Deployment Workflow
Deployments are handled automatically by the `.github/workflows/deploy.yml` file.

1. Ensure `vite.config.js` has `base: '/usana_empire/'` set.
2. Push your code to the `main` branch.
3. In GitHub, navigate to **Settings > Pages**.
4. Set the **Source** to **GitHub Actions**.
5. The live site will automatically update within 1-2 minutes at: `https://LumierionAI.github.io/usana_empire/`