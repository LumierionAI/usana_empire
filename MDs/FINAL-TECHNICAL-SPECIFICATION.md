# USANA Empire — Final Technical Specification

**Document type:** Final SDLC deliverable — source of truth for implementation
**Supersedes:** all three draft SRS/SRA documents and the prior comparative analysis
**Status:** Approved for coding. Architectural decisions in this document are final unless a genuine contradiction or technical impossibility is discovered during implementation — in that case, revisit this document before writing around the problem.

---

## 1. Project Overview

### 1.1 Purpose
USANA Empire is a two-part web platform for an independent USANA distributor: a public marketing/education site that presents the company, products, and business opportunity to prospects, and a private suite of business-management tools the distributor uses to run day-to-day operations (tracking sales, finances, and prospects).

### 1.2 Core problem being solved
The distributor currently has no unified, professional web presence and no digital tooling — prospecting, receipts, and financial tracking are ad hoc. The project replaces that with (a) a polished, presentation-style site that can be shown live to prospects on any device with no login friction and no dependency on a live backend, and (b) a lightweight, private operations toolkit that works offline and costs nothing to run.

### 1.3 Target users
- **Primary:** the distributor themself, as both the presenter of the public site and the sole operator of the Tools workspace.
- **Secondary:** prospects and customers who view the public site (never touch the Tools workspace).

### 1.4 Key objectives
1. A public site that loads fast, works with zero backend dependency, and can be presented live (including with no or poor internet).
2. A private tools workspace that replaces manual/ad hoc tracking of receipts, finances, and prospects.
3. Zero recurring cost for the initial build.
4. Content and business logic that are safe from a regulatory-compliance standpoint (health claims, income claims).
5. An architecture that can absorb future needs (cross-device sync, richer AI assistance) without a rewrite.

### 1.5 Scope and boundaries
**In scope:** static public site (Landing, Product, Business), five Tools modules (Genealogy Simulator, Product Guidance, Receipt Generator, Financial Ledger, Prospect Planner), local-first data storage with CSV/JSON import-export.

**Out of scope (explicitly excluded, not deferred):** payment processing/checkout, multi-tenant support for other distributors, a general CMS/admin panel beyond editing JSON content files directly.

**Deferred (architected for, not built now):** Firebase-based cross-device sync, an LLM narration layer on top of the Product Guidance rule engine, authentication/multi-user access, a Django/PostgreSQL backend.

---

## 2. Final System Architecture

### 2.1 Overall architecture
Two independently deployable systems. System A never depends on System B being available, deployed, or online.

```
                          USANA EMPIRE
                               │
                 ┌─────────────┴─────────────┐
                 ▼                            ▼
        SYSTEM A — PUBLIC SITE       SYSTEM B — TOOLS WORKSPACE
        Static HTML/CSS/JS           Static HTML/CSS/JS + IndexedDB
        GitHub Pages                 GitHub Pages (same repo, /tools path)
        No backend, no login         No backend, no login (current phase)
        Content from local JSON      Data from local IndexedDB
```

### 2.2 Frontend structure
Both systems are plain HTML/CSS/JavaScript, no framework, no build-time transpilation required to run (a build step is used only for optional minification/bundling — see §3). System A renders content from static JSON files at load time. System B is a client-side application: each tool is its own page (or view within a small client-side router) that reads/writes through a shared storage abstraction module.

### 2.3 Backend structure
None, for the current implementation phase. There is no server, no API, and no server-side code anywhere in this build. Section 7 documents this explicitly per feature, and documents the one future backend shape (Firebase) that is architected for but not built now.

### 2.4 Data and storage strategy
- **System A:** static JSON files bundled with the site (`products.json`, `compensation.json`, `sections.json`), read at page load, never written to at runtime.
- **System B:** IndexedDB is the system of record for Receipt Generator, Financial Ledger, and Prospect Planner data. LocalStorage is used only for UI state/preferences (last-opened tool, last-used Genealogy Simulator inputs, last-submitted Product Guidance intake form) — never for business records. All reads/writes go through a single storage-abstraction module (`storage-adapter.js`) so the underlying engine can be swapped or extended (e.g., a future Firebase adapter) without touching tool code.
- **Manual backup:** full-state JSON export/import and per-tool CSV export/import are required features, not optional ones (§6.6).

### 2.5 APIs and external services
None in the current build. No third-party API calls, no analytics script, no font/CDN dependency beyond what's explicitly listed in §3. This is intentional: it keeps System A's "always works, no dependency" guarantee absolute.

### 2.6 Hosting and deployment model
Single GitHub repository, deployed via GitHub Pages from the `main` branch (or a `gh-pages` branch produced by a simple build step — see §12). System A lives at the site root; System B lives under `/tools/`. One deploy publishes both, but they remain architecturally independent — a bug in a Tools module cannot break the public site because they share no runtime code path (only shared static assets like fonts/design tokens, which is safe coupling).

### 2.7 How major components communicate
```
System A:  JSON content files  →  render module  →  DOM
System B:  User action  →  Tool module  →  calc-engine (if math involved)
                                        →  storage-adapter  →  IndexedDB / LocalStorage
           Export action  →  storage-adapter.export()  →  downloaded JSON/CSV file
           Import action  →  file  →  validator  →  preview UI  →  storage-adapter.import()
```
System A and System B share nothing at runtime except static design-token CSS (colors, spacing, type scale) — this is a build-time/asset-level dependency, not a runtime one, and does not violate the independence rule.

---

## 3. Final Technology Stack

| Category | Choice | Why |
|---|---|---|
| Markup/styling | HTML5, CSS3 (custom properties for design tokens) | Zero dependency, fastest possible load, full control over the two required layout modes (portrait/landscape composition, not just fluid scaling) |
| Scripting language | Vanilla JavaScript (ES2020+, native ES modules) | No framework justified by current feature set; keeps bundle size at zero for System A |
| Scroll/presentation | Native CSS Scroll Snap + `IntersectionObserver` | Delivers the "presentation deck" scroll effect and progress-rail tracking without a JS animation library; respects `prefers-reduced-motion` for free |
| IndexedDB access | `idb` (small Promise-based wrapper, npm) | Removes IndexedDB's callback-based ergonomics without adding meaningful weight (~1.5KB) |
| CSV parsing | PapaParse (npm) | De facto standard for robust CSV parse/serialize, needed for the import/export requirement |
| Build tool | Vite (dev server + production build) | Handles ES module bundling, minification, and a local dev server with zero custom config; output is still plain static files GitHub Pages can serve |
| Package manager | npm | Standard, no reason to deviate |
| Version control / CI | Git + GitHub Actions (build → deploy to Pages) | Free, integrates natively with GitHub Pages hosting |
| Hosting | GitHub Pages | Free, matches the zero-cost requirement, sufficient for a fully static deployable |
| Storage (client) | IndexedDB (via `idb`), LocalStorage | Local-first, zero cost, offline-capable, matches confirmed single-admin use case (see §13 for the assumption this rests on) |
| Testing | Vitest (unit tests for calc-engine and storage-adapter), Playwright (basic UI/e2e smoke tests) | Both integrate cleanly with a Vite project; Vitest is fast for pure-logic unit tests, Playwright covers cross-browser UI behavior cheaply |

**Rejected/not used in this build (documented so they aren't re-introduced without cause):** React/Vue/Alpine.js, GSAP or any scroll animation library, Firebase (any product), Django/PostgreSQL, any LLM API integration. Each is a legitimate future option (see §13) but none is justified by current requirements.

**Version requirements:** Node.js 18+ (LTS) for the build toolchain; no runtime version requirement for the shipped site itself beyond evergreen-browser JS (ES2020 module support — Chrome/Edge/Firefox/Safari all current versions).

---

## 4. Functional Requirements

### 4.1 Core (required for launch)

**System A — Public Site**
- FR-A1: Persistent top navigation (Product / Business / Tools) visible on every page.
- FR-A2: Landing page renders as a full-viewport, scroll-snapped sequence of 10 sections (Hero, About USANA, Eligibility & Legal, Why Join, Business Model Summary, MLM Leverage vs. Traditional Business, Earnings Roadmap, Ranks & Benefits, Effort & Reality, Disclaimers/Final CTA).
- FR-A3: Side progress-bookmark rail on the Landing page shows all 10 sections, highlights the current one, and clicking any bookmark smooth-scrolls directly to it.
- FR-A4: Hero section provides two primary CTAs ("Explore Products," "Explore the Business") that navigate to `/product` and `/business` respectively.
- FR-A5: Product page splits into two paths: Nutritionals (data-driven list from `products.json`, one sub-view per product with overview/benefits/body-systems/usage) and Celavive (4 fixed stages, each with purpose/products/sequence/usage).
- FR-A6: Business page contains three sections: Business Model, Ethical Business Practice, Compensation Plan (with a visual breakdown of bonus types).
- FR-A7: All portrait vs. landscape layouts use intentionally different compositions (not uniform scaling) per NFR-A2.
- FR-A8: Every page functions with zero network calls beyond the initial asset load (no backend, no third-party API).

**System B — Tools Workspace**
- FR-B1 (Genealogy Simulator): renders a visual downline tree; supports adding/removing/moving nodes; accepts adjustable inputs (recruits per level, PSV per person); computes and displays simulated point/bonus outcomes in real time; all outputs are visibly labeled as simulated/hypothetical.
- FR-B2 (Product Guidance): intake form (age, goals, conditions, diet); matches the intake against a static rule-based knowledge base (`guidance-rules.json`); outputs a product list with a plain-language rationale citing the source used; never claims to diagnose or treat disease; displays a persistent "not medical advice" notice.
- FR-B3 (Receipt Generator): create/edit/delete customer purchase records; generate a printable/exportable receipt view; CSV import/export; computes and flags customers due for repurchase based on a per-product replenishment-cycle field.
- FR-B4 (Financial Ledger): create/edit/delete ledger entries (date, type, amount, notes); computed views for total capital, total revenue, net profit, commission-vs-retail breakdown; CSV export; simple trend chart (native `<canvas>` or SVG, no charting library required at this scale).
- FR-B5 (Prospect Planner): create/edit/delete prospect records (name, contact, status, temperature, last contact, next follow-up, notes); list/board view groupable by status; CSV export.
- FR-B6 (all data tools): full-workspace JSON export/import (backup/restore) with a validate → preview → duplicate-check → confirm import workflow — no import is committed silently.

### 4.2 Recommended (build if time allows within Phase 2, not launch-blocking)
- Simple in-app search/filter across Prospect Planner and Receipt records.
- Basic month-over-month trend view in the Ledger beyond raw totals.

### 4.3 Future/optional (explicitly deferred — see §13, not built now)
- Firebase-backed cross-device sync for Tools 3–5.
- LLM narration layer on top of the Product Guidance rule engine (via a server-side Cloud Function, API key never client-side, if ever added).
- Authentication / multi-user roles.
- Analytics on the public site.
- Automated scheduled backups beyond manual export.

---

## 5. UI / UX Structure

### 5.1 Pages/screens
```
/                       Landing (scroll presentation)
/product                Product hub (Nutritionals | Celavive switch)
/product/nutritionals/:id   Individual product detail
/product/celavive       4-stage Celavive view
/business               Business hub (Model | Ethics | Compensation)
/tools                  Tools hub (links to the five tool views)
/tools/genealogy
/tools/guidance
/tools/receipts
/tools/ledger
/tools/prospects
```
System A pages are conventional static routes (can be plain multi-page HTML files — no client-side router required, since each is a real page and this keeps things simplest). System B may use a lightweight client-side router (vanilla, no library) within `/tools/` since it behaves more like an app, but each tool must also be reachable via a direct URL for bookmarking.

### 5.2 Navigation structure
- Global top nav: Product / Business / Tools, present on every System A page.
- Landing page adds the side progress-bookmark rail (Landing-only, since it's the one true "presentation" page).
- Tools hub provides a simple card/list nav to the five tools; each tool has a "back to Tools" link, not a full page reload.

### 5.3 Major components
- `NavBar` (System A, shared across pages)
- `ProgressRail` (Landing only)
- `SectionPanel` (one per Landing section, scroll-snap child)
- `ProductCard` / `ProductDetail` (data-driven from `products.json`)
- `CelaviveStage`
- `CompensationChart` (SVG/canvas visual for the compensation breakdown)
- `ToolShell` (common chrome for all five Tools views: title, back-link, export/import controls)
- `DataTable` (shared list/edit UI used by Receipts, Ledger, Prospects — one component, three configurations)
- `TreeView` (Genealogy Simulator)
- `IntakeForm` / `RecommendationList` (Product Guidance)
- `ImportWizard` (shared validate → preview → confirm flow, used by every CSV/JSON import)

### 5.4 Important user flows
- **Prospect flow:** Landing hero → scroll through presentation or jump via progress rail → CTA to Product or Business → optional deep dive into a specific product or the compensation plan.
- **Receipt flow:** open Receipt Generator → new receipt → select/add customer → add line items → save → record appears in customer's history → replenishment reminder computed automatically.
- **Ledger flow:** open Ledger → add entry (type, amount, notes) → totals recompute live → export CSV/JSON at any time.
- **Prospect flow (CRM):** add prospect → set temperature/status → log an interaction outcome → set next follow-up → view due follow-ups from the Tools hub or the Planner's own view.
- **Import flow (shared):** choose file → system validates format → preview shows what will change, including flagged duplicates → user confirms or cancels → data commits only on confirmation.

### 5.5 Responsive behavior
Every page ships two intentionally distinct compositions — not one fluid layout scaled down — for portrait and landscape, per FR-A7/NFR-A2. Breakpoint logic is orientation-aware first, width-based second (i.e., check `orientation` media feature before falling back to width breakpoints), because a landscape phone and a portrait tablet should not receive the same layout just because their widths are similar.

### 5.6 Accessibility
Semantic HTML throughout; visible keyboard focus states; full keyboard operability of the scroll-snap presentation (arrow keys / Tab move between sections, matching the progress rail); sufficient color contrast for all text against the "luxury" palette (verify contrast numerically once the palette is set, not by eye); alt text required on all product imagery; `prefers-reduced-motion` respected by disabling scroll-snap smoothing and section transition animation (instant jumps instead).

---

## 6. Data Architecture

### 6.1 Entities — System A (static content, not user data)

**Product**
```
id: string (unique slug)
name: string
category: "nutritionals" | "celavive"
overview: string
benefits: string[]
bodySystems: string[]
usage: string
warnings: string[]
officialUrl: string
source: { title: string, retrievedDate: date, url: string }
```

**CompensationComponent** (for `compensation.json`)
```
id: string
name: string
description: string
type: "sponsorship" | "matching" | "retail" | "rank-bonus" | "other"
source: { title: string, version: string, effectiveDate: date, retrievedDate: date, url: string }
```
Every product and compensation entry carries a `source` object (title/version/date/URL) per the content-governance requirement — no claim ships without a traceable source, and stale content is detectable by checking `retrievedDate` against the current official material.

### 6.2 Entities — System B (user data, IndexedDB)

**Customer** (Receipt Generator)
```
id: string (UUID)
name: string (required)
contact: string
address: string (optional)
notes: string (optional)
createdAt: ISO datetime
```

**Purchase** (Receipt Generator)
```
id: string (UUID)
customerId: string (FK → Customer.id)
date: ISO date (required)
lineItems: [{ productName: string, quantity: number, unitPrice: number }] (at least 1 required)
total: number (computed, not user-entered)
paymentStatus: "paid" | "pending" | "partial"
nextReminderDate: ISO date (computed from product replenishment cycle)
```

**LedgerEntry** (Financial Ledger)
```
id: string (UUID)
date: ISO date (required)
type: "sale" | "commission" | "expense" | "inventory" (required)
amount: number (required, must be > 0; sign/direction is derived from `type`, never entered as negative by the user)
description: string
createdAt: ISO datetime
```

**Prospect** (Prospect Planner)
```
id: string (UUID)
name: string (required)
contact: string
source: string (optional — how they were found)
status: "new" | "contacted" | "presented" | "interested" | "follow-up" | "customer" | "business-partner" | "not-interested" | "inactive"
temperature: "hot" | "warm" | "cold"
lastContactDate: ISO date
nextFollowupDate: ISO date
responseOutcome: "positive" | "negative" | "pending"
notes: string
createdAt: ISO datetime
```

### 6.3 Relationships
Purchase → Customer (many-to-one, via `customerId`). No other cross-entity relationships exist in the current scope — Ledger and Prospect records are standalone (a future enhancement could link a Purchase to a Ledger "sale" entry automatically; not built now — see §13).

### 6.4 LocalStorage / state requirements
LocalStorage keys are UI-state only, never business data:
```
usana-tools:last-active-tool
usana-tools:genealogy-last-inputs
usana-tools:guidance-last-intake
usana-tools:ui-theme (if a theme toggle is ever added)
```
Business records (Customer, Purchase, LedgerEntry, Prospect) live only in IndexedDB, never LocalStorage.

### 6.5 Validation rules
- All required fields enforced client-side before an IndexedDB write is attempted; invalid submissions are rejected with an inline error, never silently dropped or silently defaulted.
- `LedgerEntry.amount` must be a positive number; the entry's effect on totals (add/subtract) is derived purely from `type`, so a user can never accidentally flip a sign.
- Dates are stored as ISO 8601 strings; never as locale-formatted strings, to keep sort/filter/export deterministic.
- CSV import validates column headers against the expected schema before any row is parsed into a record; a mismatched header set rejects the whole file with a clear message rather than partially importing.
- Duplicate detection on import compares by natural key (e.g., `Customer.name` + `contact` for customers, `name` + `contact` for prospects) and flags — never silently merges or silently skips.

### 6.6 Import/export requirements
- **Per-tool CSV export:** `customers.csv`, `purchases.csv`, `ledger.csv`, `prospects.csv` — one file per entity, standard comma-delimited, header row included.
- **Per-tool CSV import:** same shape, run through the validate → preview → duplicate-check → confirm flow (§5.4) before commit.
- **Full-workspace JSON backup:** single file, `usana-empire-backup-YYYY-MM-DD.json`, containing every entity from every tool, restorable in one action (overwrite-with-confirmation, not silent merge).

---

## 7. Backend / API Specification

**No backend exists in this build.** This section documents, per feature, how each requirement is met without one, and specifies the one future backend shape that is architected for but not implemented now.

| Feature that might suggest a backend | How it works without one |
|---|---|
| Persisting Receipt/Ledger/Prospect data | IndexedDB in the browser, via `storage-adapter.js` (§2.4) |
| Cross-device access to that data | Not available in this build; manual export/import is the workaround (§6.6). This is a known, accepted limitation — see §13 |
| "AI" product recommendation | A static, versioned JSON rule set (`guidance-rules.json`) matched client-side; no server call, no API key to protect |
| Data validation | Performed entirely client-side in the tool modules before any IndexedDB write |

### 7.1 Future backend (architected for, not built) — if Firebase sync is ever added
This is documented so that if it's built later, it slots into the existing structure rather than requiring a redesign:
- Firestore collections: `receipts`, `ledger`, `prospects` — mirrors the IndexedDB entity shapes in §6.2 exactly, so the storage-adapter's Firebase implementation is a drop-in alternative to its IndexedDB implementation, not a parallel data model.
- Auth: only introduced alongside Firebase, only if multi-user access is confirmed as needed (see §13's OPEN DECISION on single-admin status). Until then, no auth exists or is designed around.
- Security rules: any Firestore deployment must restrict reads/writes to the authenticated owner only; this is a hard requirement the moment Firestore is introduced, not an afterthought.

### 7.2 Future backend (documented option, not architected for imminently)
Django + DRF + PostgreSQL remains a documented possibility only if a genuine need for server-side business logic or multi-user roles emerges. No scaffolding, no dependency, no code for this exists in the current build.

---

## 8. Business Logic & Rules

### 8.1 Core application logic
- **Ledger totals:** `netProfit = revenue - costOfGoods - expenses`; `commissionTotal` and `retailSalesTotal` are summed separately from the same entries by filtering on `type`, never double-counted.
- **Replenishment reminders (Receipts):** `nextReminderDate = purchase.date + product.replenishmentCycleDays`; a customer is "due" when `today >= nextReminderDate`.
- **Genealogy simulation:** point/bonus flow is computed by a pure function `calculateGenealogyOutcome(tree, assumptions)` that takes the current tree structure and the user's adjustable assumptions (recruits per level, PSV per person) and returns computed totals — this function lives in `calc-engine/`, has no DOM access, and is the only place this math exists.
- **Product Guidance matching:** intake answers are matched against `guidance-rules.json` entries by a pure function `matchGuidanceRules(intake, rules)` that returns a ranked list of `{ product, rationale, sourceRefs }` — never free-text generation, always a lookup against authored, sourced rules.

### 8.2 Validation rules
See §6.5. Additionally: no tool allows a save action with a required field empty; no CSV/JSON import is committed without passing through the preview/confirm step.

### 8.3 Edge cases to handle explicitly
- Empty states: every list view (Prospects, Ledger, Receipts) has a defined empty state, not a blank screen.
- Duplicate import rows: flagged, not auto-merged (§6.5).
- Malformed import file (wrong headers, corrupt JSON): rejected with a clear error before any data is touched.
- IndexedDB unavailable (e.g., private browsing mode in some browsers): tool views detect this on load and show an explicit "your browser doesn't support local storage in this mode" message rather than failing silently on first save.
- Genealogy Simulator with zero nodes: shows a "start by adding your first team member" state, not an error.
- Product Guidance intake with no matching rules: returns a general-guidance fallback message, never an empty result with no explanation.

### 8.4 Constraints
- All business math (§8.1) lives exclusively in `calc-engine/` modules — this is a hard architectural constraint, not a style preference (see §14).
- No tool module may import Firebase or any network client directly; if a future sync layer is added, it is added only inside `storage-adapter.js`'s implementation, never called ad hoc from a tool.

### 8.5 Error states
Every user-facing error (validation failure, import rejection, storage unavailable) surfaces a specific, actionable message — never a raw exception, a console-only error, or a silent no-op.

### 8.6 Security considerations
- No secrets exist in this build (no API keys, no auth tokens) — this is correct for the current architecture and must be revisited the moment any external service is added (§7.1's rule about Firestore security rules being non-negotiable at that point).
- Business data (Customer, Purchase, LedgerEntry, Prospect) never leaves the device in this build except via an explicit, user-initiated export action — there is no background sync, no telemetry, no analytics call that could leak it.
- Public-site content (`products.json`, `compensation.json`) contains no sensitive data by definition, so no access control is needed there.

---

## 9. Project / File Structure

```
usana-empire/
├── index.html                     System A: Landing page
├── product/
│   ├── index.html                 Product hub
│   └── (product detail rendered client-side from products.json, or one static file per product if simpler)
├── business/
│   └── index.html
├── tools/
│   ├── index.html                 Tools hub
│   ├── genealogy/
│   ├── guidance/
│   ├── receipts/
│   ├── ledger/
│   └── prospects/
├── content/                        System A static data
│   ├── products.json
│   ├── compensation.json
│   └── sections.json               Landing page copy, per-section
├── src/
│   ├── shared/
│   │   ├── storage-adapter.js       IndexedDB (current) + future Firebase implementation, single interface
│   │   ├── calc-engine/
│   │   │   ├── ledger-calc.js
│   │   │   ├── genealogy-calc.js
│   │   │   └── receipts-calc.js
│   │   ├── import-export/
│   │   │   ├── csv.js
│   │   │   └── json-backup.js
│   │   └── components/              Shared UI: DataTable, ToolShell, ImportWizard, NavBar
│   ├── landing/
│   │   ├── scroll-engine.js         Scroll-snap + IntersectionObserver progress tracking
│   │   └── progress-rail.js
│   ├── product/
│   ├── business/
│   └── tools/
│       ├── genealogy/
│       ├── guidance/
│       │   └── guidance-rules.json  Static rule/knowledge base (content, not code)
│       ├── receipts/
│       ├── ledger/
│       └── prospects/
├── styles/
│   ├── tokens.css                   Design-system custom properties (color, type, spacing)
│   ├── base.css
│   └── (per-page/per-component stylesheets)
├── tests/
│   ├── unit/                        Vitest — calc-engine and storage-adapter tests
│   └── e2e/                         Playwright — smoke tests per page/tool
├── .github/workflows/deploy.yml     CI: build → deploy to GitHub Pages
├── vite.config.js
├── package.json
└── README.md
```

**Purpose notes:** `content/` and `guidance-rules.json` are treated as data, editable without touching code — this is what makes NFR-5 ("content shouldn't require touching layout code") real rather than aspirational. `storage-adapter.js` is the single seam where a future Firebase implementation gets added; nothing outside it should ever import a storage-specific API directly.

---

## 10. Development Plan

### Phase 0 — Foundation/setup
- Initialize repo, Vite project, npm dependencies (`idb`, PapaParse, Vitest, Playwright).
- Set up GitHub Actions workflow to build and deploy to GitHub Pages on push to `main`.
- Establish `styles/tokens.css` with a placeholder palette/typography (final palette pending the brand-assets decision — see §13).

### Phase 1 — Core architecture
- Build `storage-adapter.js` with its IndexedDB implementation and full CRUD + export/import interface, unit-tested in isolation before any tool UI is built against it.
- Build `calc-engine/` pure functions (ledger totals, genealogy outcome, receipt reminder dates) with unit tests, before wiring them to any UI.
- Build shared components: `NavBar`, `ToolShell`, `DataTable`, `ImportWizard`.

### Phase 2 — Core features (System A)
- Landing page: all 10 sections' markup + `scroll-engine.js` + `progress-rail.js`, content sourced from `sections.json`.
- Product page: Nutritionals rendering from `products.json`, Celavive's 4 fixed stages.
- Business page: Model, Ethics, Compensation Plan (with the compensation visual).

### Phase 3 — Core features (System B)
- Genealogy Simulator: tree UI + wiring to `genealogy-calc.js`.
- Receipt Generator: Customer/Purchase CRUD via `DataTable` + `storage-adapter`, reminder logic, CSV/JSON import-export.
- Financial Ledger: entry CRUD, computed totals view, trend visualization, CSV export.
- Prospect Planner: prospect CRUD, status/temperature grouping view, CSV export.
- Product Guidance: intake form + `guidance-rules.json` + `matchGuidanceRules()`.

### Phase 4 — UI/UX polish
- Portrait/landscape composition pass on every page (not just responsive scaling).
- Accessibility pass: keyboard nav, focus states, contrast check, `prefers-reduced-motion` handling.
- Empty-state and error-state UI for every list/tool view (§8.3).

### Phase 5 — Integration
- Full-workspace JSON backup/restore wired across all five tools.
- Cross-tool consistency check (e.g., confirm date formats, ID schemes are consistent everywhere per §6).

### Phase 6 — Testing
- Vitest coverage for every `calc-engine` and `storage-adapter` function (§11.1).
- Playwright smoke tests for each page and each tool's primary CRUD flow (§11.2).
- Manual responsive/orientation testing across at least one real phone, one tablet, one desktop.
- Manual accessibility pass with a screen reader on the Landing page at minimum.

### Phase 7 — Deployment
- Production build via Vite, verify output is fully static and hash-free-cacheable where appropriate.
- Deploy via the GitHub Actions workflow to GitHub Pages.
- Smoke-test the live URL end to end before considering launch complete.

---

## 11. Testing Requirements

### 11.1 Unit testing
- Every function in `calc-engine/` (ledger math, genealogy outcome calculation, reminder-date calculation, guidance rule matching) must have unit tests covering normal input, boundary input (zero entries, zero recruits), and invalid input.
- Every method on `storage-adapter.js` (get/set/delete/list/export/import) must have unit tests against a mocked/fake IndexedDB (e.g., `fake-indexeddb`).

### 11.2 Integration testing
- Playwright tests covering: adding a Ledger entry and confirming totals update; adding a Prospect and confirming it appears in the correct status group; creating a Receipt and confirming the reminder date computes correctly; exporting and re-importing a CSV file and confirming round-trip data integrity.

### 11.3 UI/functionality testing
- Manual verification that portrait and landscape layouts render their intended distinct compositions (not just scaled versions of each other) on the Landing, Product, and Business pages.
- Manual verification that the scroll-snap presentation and progress rail stay in sync (clicking a rail item lands on the correct section; scrolling manually updates the rail's highlighted item).

### 11.4 Edge cases (must be explicitly tested, not just handled in code)
- Import a CSV with mismatched headers → rejected with a clear message.
- Import a CSV with rows that duplicate existing records → flagged in the preview, not auto-merged.
- Use a tool with IndexedDB unavailable (simulate via browser private mode) → explicit fallback message appears.
- Submit the Product Guidance intake with no fields filled → validation blocks submission with a clear message.

### 11.5 Acceptance criteria / Definition of Done
A feature is "done" when: it matches its functional requirement in §4 exactly; it has passing unit tests for any logic it introduces into `calc-engine` or `storage-adapter`; it has at least one Playwright test covering its primary flow; it renders correctly in both portrait and landscape; it has no console errors or warnings; and — for anything touching health or income-related content — it has been checked against the compliance rules in §13 before merging.

---

## 12. Deployment & Operations

### 12.1 Development environment
Local Vite dev server (`npm run dev`), no environment variables required (no backend, no API keys in this build).

### 12.2 Production environment
Static files served by GitHub Pages. No server process, no environment-specific configuration beyond the base URL (relevant only if a custom domain is later configured — see §13's OPEN DECISION on domain).

### 12.3 Build process
`npm run build` (Vite) → static output directory → committed/pushed via the GitHub Actions workflow (`.github/workflows/deploy.yml`) to the Pages deployment branch.

### 12.4 Deployment process
Push to `main` triggers the GitHub Actions workflow: install dependencies → run unit tests (block deploy on failure) → build → deploy to GitHub Pages. No manual deployment step should be needed once this is set up.

### 12.5 Environment variables / configuration
None required in the current build (no backend, no secrets). If Firebase is added in a future phase, its config values are public-safe client config (not secrets) but should still be reviewed against Firestore security rules (§7.1) before going live.

### 12.6 Backup/recovery considerations
Since IndexedDB is the sole copy of Tools data in this build, the full-workspace JSON export (§6.6) is the only recovery path if browser data is lost. This is a known, accepted limitation of the local-first approach (see §13) — it is not a bug to "fix" by silently adding a backend; it's a tradeoff to communicate to the user (e.g., a periodic in-app reminder to export a backup is a reasonable Phase 3+ enhancement, not a Phase 1–2 requirement).

---

## 13. Known Risks & Technical Constraints

| Item | Status |
|---|---|
| **OPEN DECISION — single-admin confirmation:** the entire no-auth, IndexedDB-first architecture assumes the Tools workspace is used by one person on their own device(s). This has not been confirmed by the project owner. The architecture in this document is built on that assumption. If it turns out to be false, the storage-adapter's Firebase implementation and an auth layer must be built before Tools 3–5 can be used safely by more than one person — do not add multi-user access on top of the current no-auth build without that work. | Must be confirmed before Phase 3 planning; does not block Phase 0–2 |
| **OPEN DECISION — existing Receipt Generator file:** an existing HTML receipt generator was referenced but not yet reviewed. This spec assumes a fresh build against the schema in §6.2. If the existing file is later provided and contains reusable logic or a different data shape, reconcile it against §6.2 before or during Phase 3 — do not silently adopt a conflicting schema. | Must be resolved before Phase 3 (Receipt Generator) begins |
| **OPEN DECISION — Product Guidance grounding content:** `guidance-rules.json`'s content depends on having a sourced, authoritative "Comprehensive Guide to Nutritional Product Recommendation" or equivalent. Without it, Tool 2 cannot ship with defensible content. | Blocks Phase 3's Product Guidance work specifically; does not block other Phase 3 tools |
| **OPEN DECISION — brand assets:** no confirmed logo/palette/typography exists yet. Phase 0's `tokens.css` uses a placeholder; a real palette must be proposed or supplied before Phase 4's polish pass. | Should be resolved by Phase 2; does not block Phase 0–1 |
| **OPEN DECISION — USANA distributor policy review:** this project's branding ("USANA Empire") and its health/income-related content have not been checked against USANA's current distributor website Policies & Procedures. This is a compliance gate, not an engineering task. | Must be resolved before any content ships publicly; should run in parallel with Phase 2, not after |
| Local-first data has no automatic backup | Accepted tradeoff of the local-first architecture (§12.6); mitigated by required export features, not a background sync |
| Firebase (if ever added) introduces a real security-rules requirement | Documented in §7.1 as non-negotiable at the moment Firestore is introduced — must not be deployed with open/default rules |
| Health claims (Product page) and income claims (Business/Roadmap) carry regulatory risk | Content pipeline requires sourced, qualified language (§6.1's `source` metadata) and the compliance gate above; the Roadmap section is explicitly illustrative math, never a guarantee (§4.1 FR-A2) |
| No framework means more manual DOM work | Accepted tradeoff for load-time/simplicity goals; if a specific feature later proves genuinely unworkable without a framework, that is grounds to revisit §3 — but the bar is "genuinely unworkable," not "would be more convenient" |

---

## 14. Implementation Rules

These are binding constraints for anyone writing code against this specification.

1. **No business math outside `calc-engine/`.** Compensation, ledger, genealogy, and reminder-date calculations must live only in the pure functions specified in §8.1. UI code calls these functions; it never re-implements the math inline.
2. **No direct storage calls outside `storage-adapter.js`.** Tool modules call the storage-adapter's interface (get/set/delete/list/export/import); they never touch IndexedDB, LocalStorage (for business data), or any future Firebase client directly.
3. **No framework, animation library, or new runtime dependency added without a specific, demonstrated need that native CSS/JS cannot meet.** "It would be more convenient" is not sufficient justification — see the rejected list in §3.
4. **No content ships without source metadata.** Every `Product` and `CompensationComponent` entry requires its `source` object (§6.1) filled in before publishing, not as a follow-up task.
5. **No import commits without the validate → preview → duplicate-check → confirm sequence.** This applies to every CSV and JSON import path, with no exceptions for "trusted" files.
6. **No health claim implies disease prevention/treatment; no income figure is presented without qualification.** This applies to every place content is authored (Product page copy, Landing's Earnings Roadmap section, guidance-rules.json's rationale text) and is a hard content rule, not a style suggestion.
7. **System A must never import, call, or depend on anything from System B's tool code, storage-adapter, or calc-engine, or vice versa** beyond shared static design tokens/CSS and shared pure UI components (`NavBar`, base component styles). This is what keeps the independence guarantee in §2.1 real rather than aspirational.
8. **Do not add authentication, Firebase, or any backend without first resolving the single-admin OPEN DECISION in §13.** Adding auth "just in case" adds complexity and attack surface with no confirmed benefit.
9. **All dates are stored as ISO 8601 strings.** No locale-formatted date strings in stored data, ever — formatting happens only at render time.
10. **Every error state shown to the user must be specific and actionable** (§8.5) — no bare exceptions, no silent failures, no console-only errors for anything the user needs to know about.
11. **Every new page or tool view must be checked in both portrait and landscape composition before being considered complete** — a page that only works in one orientation does not meet FR-A7/NFR-A2.
12. **Do not treat this document's OPEN DECISION items as blockers for all work.** Each one blocks only the specific phase/feature noted in §13 — Phase 0–2 work can and should proceed while they're being resolved.

---

**This document is the implementation baseline.** Begin with Phase 0 (§10) directly from this specification. Any deviation discovered to be necessary during coding should be resolved by amending this document, not by silently diverging from it in code.
