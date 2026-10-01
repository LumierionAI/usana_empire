# PHASE 3 — Core Features (System B): Execution & Close-Out Guide

**Written against:** `PROJECT_STATE.md` as of 2026-09-28.
**Spec version aligned to:** `FINAL-TECHNICAL-SPECIFICATION.md` ("Approved for coding").
**Supersedes:** The original Phase 3 close-out guide. This revision explicitly prioritizes the Genealogy Simulator overhaul before addressing broader system compliance tasks.

---

## 1. Phase 3 Execution Rules

These operating principles govern all remaining work in Phase 3. They are non-negotiable and override previous roadmaps.

1. **Genealogy First:** The Genealogy Simulator is the immediate and highest priority. All planned improvements for it must be completed and refined before moving to any other Phase 3 work. Do not let broader refactoring, React migration, public-page work, or future commercialization distract from completing Genealogy unless they are a direct dependency.
2. **PROJECT_STATE.md is the Compass:** Use `PROJECT_STATE.md` to establish shared context, but actively verify against the actual source code when implementation details matter. Do not redo completed work. Keep the state/checklist synchronized after significant work.
3. **Coding Consistency:** Maintain strict separation of concerns (HTML → structure, CSS → styling, JS → logic/behavior). Reuse existing project patterns and abstractions before introducing new ones.
4. **Routing and GitHub Pages:** GitHub Pages compatibility is a first-class requirement. The project uses the `resolvePath` base-path helper. Use it consistently. Do not introduce competing path-resolution mechanisms or hard-coded root paths.
5. **Safe, Sequential Changes:** For every task: Inspect → Decide → Implement → Verify → Update State → Proceed. Preserve working functionality unless the current task explicitly requires changing it.

---

## 2. Part 1: Genealogy Simulator Overhaul (ACTIVE PRIORITY)

The following sequence must be completed, tested, and verified before any other Phase 3 tasks are initiated.

**Task 1.1 — Blank Starting Canvas & Enrollment Flow**
- Remove the default loading of a 1BC or 3BC structure.
- The simulator must start with a blank genealogy canvas featuring a clear "Join USANA" action.
- Triggering the action presents a choice: 200 PSP (1BC) or 500 PSP (3BC).
- The selected option generates the corresponding initial nodes.

**Task 1.2 — Add-Node Flow for Existing Legs**
- Replaces the immediate creation of blank nodes on `+ L` and `+ R` clicks.
- Clicking an empty leg triggers the same enrollment choice (200 PSP / 1BC or 500 PSP / 3BC) to generate the new downline structure.

**Task 1.3 — Correct PSP to GSP Data Flow**
- Differentiate PSP (Personal Sales Points) and GSP (Group Sales Points).
- **Rule:** A newly born node receives its PSP, but starts with 0 GSP.
- **Rule:** The PSP used to create a new node immediately becomes GSP for its direct upline(s).

**Task 1.4 — Resolve GSP Accumulation Bug**
- Fix the existing bug where adding a child node destroys or resets the mother node's existing GSP.
- New GSP contributions must strictly append/accumulate to the existing upline volume.

**Task 1.5 — Preserve & Clarify CP Calculations**
- 1BC Calculation: `Final matched GSP × 20% = CP`.
- 3BC Calculation: `(Matched GSP BC1 + Matched GSP BC2 + Matched GSP BC3) × 20% = Total CP`.
- Ensure the UI clearly distinguishes between PSP, GSP, Final GSP, and CP.

**Task 1.6 — Implement Rank System Evaluator**
- Implement an evaluator that checks CP against the following tiers:
  - **Sharer:** 50 CP
  - **Believer:** 100 CP
  - **Builder:** 200 CP
  - **Achiever:** 400 CP
  - **Director:** 600 CP
  - **Bronze Director:** 800 CP
  - **Silver Director:** 1,000 CP
  - **Gold Director:** 1,000 CP (4 weeks)
  - **Ruby Director:** 2,000 CP (4 weeks)
  - **Emerald Director:** 3,000 CP (4 weeks)
  - **Diamond Director:** 4,000 CP (4 weeks)
  - **Star Diamond Director:** +1,000 CP increments (4 weeks)
- *Note:* Architect this to support future weekly historical array inputs, rather than hardcoding a single static integer check.

**Task 1.7 — Currency Toggle**
- Implement a UI toggle to switch the display currency between Dollars ($) and Pesos (₱).
- Retain the editable conversion rate input to calculate the final projected income from the generated CP.

---

## 3. Part 2: System B Tools Close-Out (DEFERRED)

These tasks are explicitly frozen until Part 1 is 100% complete and verified.

**Task 2.1 — Schema Reconciliation (Decide & Apply)**
- Resolve `Purchase.lineItems` field mismatches between spec §6.2 (`{productName, quantity, unitPrice}`) and code (`{desc, qty, price}`).
- Resolve `paymentStatus` enum mismatches between spec (`paid|pending|partial`) and code (`Paid|Unpaid`).
- Add missing `source` and `responseOutcome` fields to the Prospect Planner, and resolve the unreachable `"inactive"` status.

**Task 2.2 — Wire CSV Import/Export**
- Connect `csv.js` and `ImportWizard.js` to the Receipt, Ledger, and Prospect tools.
- Implement the validate → preview → duplicate-check → confirm sequence per spec §6.5.

**Task 2.3 — Product Guidance Disclaimers**
- Modify `generateProtocol()` in `guidance/main.js` to visibly render `_meta.source` and `_meta.disclaimer` from `guidance-rules.json` into the generated UI.

---

## 4. Acceptance Criteria for Phase 3 Exit

1. The Genealogy Simulator successfully loads from a blank state, accurately models 1BC/3BC enrollments, distinctively tracks PSP vs. GSP without overwriting previous volumes, calculates CP correctly, evaluates rank, and toggles currency.
2. All three CSV-enabled tools (Receipts, Ledger, Prospects) successfully pass export/re-import round-trip tests using the reconciled data schemas.
3. Product Guidance visibly displays provenance and disclaimers.
4. All tool pages resolve every asset correctly under a production build utilizing `resolvePath`.
5. No console errors/warnings are present in the final build.

# PHASE 3 — Core Features (System B): Close-Out Guide

**Written against:** `PROJECT_STATE.md` as of the session that reviewed
`app/tools/receipts`, `app/tools/ledger`, `app/tools/prospects`, and
`FINAL-TECHNICAL-SPECIFICATION.md` in full.
**Spec version aligned to:** `FINAL-TECHNICAL-SPECIFICATION.md` ("Approved
for coding" status, unchanged since review).
**Supersedes:** nothing — this is the first Phase Guide for this project.
**Companion files:** `PROJECT_STATE.md` (what exists), `project-checklist.json`
(machine-readable status this guide is derived from).

---

## 1. Phase Objective

Phase 3 is **not** "build the five System B tools" — the checklist and the
source review agree that all five already exist and are functionally real
(none are shells). Phase 3's actual remaining objective is narrower and
more specific:

> Bring all five tools into full compliance with §4.1, §6.2, and §14 of
> the spec — real CSV import/export, reconciled data schemas, and visible
> provenance/disclaimers — so Phase 3 can be closed honestly rather than
> left "believed done, never fully verified."

Phase 3 is done when every task in §5 below is checked off **and**
`generate-project-state.js`'s Module Usage Graph and file-existence
percentage reflect that reality — not before.

---

## 2. Inherited Decisions (binding for this phase)

These were resolved this session and constrain every task below. Don't
relitigate them without a concrete new contradiction.

| Decision | Resolution |
|---|---|
| Product Guidance scope | Private/local tool for the Alpha. Source: *Comprehensive Guide to Nutritional Product Recommendation*. Uplines with USANA compliance familiarity have reviewed and agreed. Preserve attribution and disclaimers — do not strip functionality. Architect for future access control, don't build it now. |
| Genealogy Simulator persistence | **Not required.** It's an exploratory/educational tool, not a system of record. Scenario templates are a future enhancement — architect so they *can* be added later, but do not build them in Phase 3. |
| Public-page rendering | Consolidate Landing/Product/Business into a shared `SectionRenderer` **now** (tracked as a Phase 2 item in the checklist — parallel to this phase, not blocking it, but don't let it silently slip). |
| Asset paths / GitHub Pages | Centralized `BASE_URL`-aware helper, used everywhere — no ad-hoc path manipulation. JSON content prefers relative paths. This is confirmed broken today in all three Phase-3 tool files (`/styles/tokens.css`, `/favicon-*.png` hardcoded as root-absolute) — see §4, Task 5. |
| Design system | Move toward React eventually, but the specific library is still open — **out of scope for Phase 3 entirely.** |
| Multi-user/auth | Alpha is single-user/local, no backend, no auth. Not revisited in Phase 3. |
| `diagnostic-id`/"Ghost Log" (15661635) | Resolved: intentional build fingerprint, confirmed by project owner. No action needed, no longer an open question. |

---

## 3. Scope: In / Out

**In scope for Phase 3 close-out:**
- CSV import/export wiring for Receipts, Ledger, Prospects (FR-B6).
- Schema reconciliation between spec §6.2 and actual code for `Purchase` and `Prospect`.
- Rendering `guidance-rules.json`'s `_meta.source`/`_meta.disclaimer` in the Product Guidance UI.
- The centralized asset-path helper, at minimum applied to the five tool pages (full site-wide rollout can extend into Phase 4, but the helper itself should exist now since Phase 3 files need it).

**Explicitly out of scope for Phase 3** (tracked elsewhere, don't pull forward):
- Portrait/landscape composition pass, full a11y pass — Phase 4.
- Genealogy scenario templates — future enhancement, not this phase.
- React/component-library selection — Phase 5+.
- USANA public-content policy review, brand palette — separate open decisions, not Phase 3 blockers (they block *public launch*, not this phase's tools work).

---

## 4. Inherited Findings (what this phase is actually fixing)

From the direct source review this session — treat these as verified,
not hypothetical:

1. **CSV import/export is entirely unwired.** All three tools (`receipts`, `ledger`, `prospects`) render `ToolShell`'s Export/Import CSV buttons but none attach a handler or import `csv.js`/`ImportWizard.js`. This is the single largest gap between "looks done" and "is done" in the whole phase.
2. **`Purchase.lineItems` field names disagree with spec.** Spec §6.2: `{productName, quantity, unitPrice}`. Code (`receipts/index.html`): `{desc, qty, price}`.
3. **`paymentStatus` enum disagrees with spec.** Spec: `paid|pending|partial`. Code: `Paid|Unpaid` — no `pending` or `partial` path exists.
4. **`Prospect` is missing two spec fields entirely** (`source`, `responseOutcome`), and the `"inactive"` status is referenced in board-column logic but unreachable from the form's `<select>`.
5. **`guidance-rules.json`'s `_meta.source` and `_meta.disclaimer` are never rendered.** The data carries them; `generateProtocol()` in `guidance/main.js` ignores both.
6. **All three tool HTML files hardcode root-absolute asset paths** (`/styles/tokens.css`, `/favicon-96x96.png`, etc.), the same bug class already found on the landing page — will 404 under the GitHub Pages project-subpath build.

---

## 5. Task List (with dependencies)

Ordered so nothing gets built twice.

**Task 1 — Decide schema authority (no dependencies; blocks Tasks 2 & 3)**
For `Purchase.lineItems` and `paymentStatus`: pick spec-wins or code-wins for each, update whichever side loses. Recommendation: spec wins on both, since `productName/quantity/unitPrice` is clearer for future CSV headers and `paid/pending/partial` is a real state your invoice UI already half-supports (there's a `Status` dropdown, just missing two options). This is a decision, not implementation — make it explicitly before touching code.

**Task 2 — Apply the schema decision (depends on Task 1)**
Update `receipts/index.html`'s line-item object shape and `invStatus` `<select>` options to match whatever Task 1 decided. Update `FINAL-TECHNICAL-SPECIFICATION.md` §6.2 if code was chosen to win instead.

**Task 3 — Wire CSV import/export (depends on Task 1, touches Receipts/Ledger/Prospects)**
For each of the three tools: import `csv.js` and `ImportWizard.js`, attach real handlers to the existing Export/Import buttons, and implement the validate → preview → duplicate-check → confirm sequence per spec §6.5/§14 Rule 5 — no silent commits. CSV headers must match whatever field names Task 1/2 settled on. This is the biggest single task in the phase; consider doing Ledger first (simplest schema, no FK to Customer) as the template for Receipts and Prospects.

**Task 4 — Complete the Prospect schema (independent, can run in parallel)**
Add `source` and `responseOutcome` fields to the form and saved record. Decide whether `"inactive"` should be a real, reachable status (add it to the `<select>`) or should be removed from the board-column matching logic instead — right now it's dead code in one direction.

**Task 5 — Render Guidance provenance and disclaimer (independent, smallest task, do it first for a quick win)**
In `generateProtocol()`, render `guidanceRules._meta.source` and `guidanceRules._meta.disclaimer` into the results output — persistently visible, not just on first load, per the project's own decision to preserve attribution.

**Task 6 — Build and apply the centralized asset-path helper (independent, but touches every file the other tasks touch — do this *first* to avoid re-touching the same `<head>` blocks twice)**
One small module (e.g. `src/shared/base-path.js`) exporting a helper that prefixes any root-relative asset path with `import.meta.env.BASE_URL`, used in every tool's `<head>` and in `products.json`'s image references. Apply it to all five tool pages minimum; full site-wide rollout (landing CTAs, product images) can be its own follow-up if time-boxing Phase 3 strictly.

**Task 7 — Re-verify (depends on all above)**
Re-run `generate-project-state.js`. Confirm: `calculateNextReminderDate`/`calculateLedgerTotals` still show real importers in the Module Usage Graph (not broken by refactors), `csv.js`/`ImportWizard.js` now show non-empty importer lists (currently they'll show "imported by nobody"), and the file-existence percentage's manual-item checklist for Phase 3 is fully checked.

---

## 6. Verification Requirements (per task, tied to spec §11)

- **Task 3 (CSV):** Playwright test per spec §11.2 — export then re-import a CSV, confirm round-trip data integrity; import a CSV with mismatched headers and confirm rejection with a clear message (§11.4).
- **Task 1/2 (schema):** Vitest unit test confirming `calculateLedgerTotals`/`calculateNextReminderDate` still behave correctly against the (possibly renamed) field shapes.
- **Task 4 (Prospect fields):** manual check — new fields save and reload correctly via `storageAdapter`.
- **Task 5 (Guidance):** manual check — source/disclaimer visible after generating any protocol, not just present in the JSON.
- **Task 6 (asset paths):** run `vite build` with the production `base` config and serve the output locally (or use `vite preview`) to confirm assets actually resolve under the subpath — don't just trust dev-server behavior, since dev serves from root and won't reproduce this bug.

---

## 7. Known Risks / Open Questions Carried Into This Phase

- **Brand assets/palette still unresolved** — doesn't block Phase 3 tool work, but don't let Task 6's path-helper work bleed into "let's also fix the colors while we're in here" scope creep.
- **USANA public-content policy review still open** — irrelevant to Phase 3 (private tools), relevant the moment any public-facing content changes.
- **`SectionRenderer` consolidation (Phase 2 item) is a parallel track** — if it's tackled in the same window as Phase 3, watch for it touching `NavBar`/`ToolShell` in ways that could affect Task 6's helper placement.

---

## 8. Acceptance Criteria for Phase 3 Exit

Per spec §11.5, plus phase-specific criteria:
- [ ] All three CSV-enabled tools pass the export/re-import round-trip test.
- [ ] `Purchase` and `Prospect` records match spec §6.2 exactly (or the spec has been amended to match a deliberate, documented code decision — not silently diverged).
- [ ] Product Guidance visibly displays source and disclaimer on every generated protocol.
- [ ] All five tool pages resolve every asset correctly under a production (`base`-prefixed) build — verified by actually building and previewing, not assumed.
- [ ] `generate-project-state.js` re-run, Module Usage Graph shows no unexpected "imported by nobody" for anything touched this phase.
- [ ] No console errors/warnings introduced by any of the above (spec §11.5).

---

## 9. Next Phase Preview

**Phase 4 (UI/UX polish):** portrait/landscape composition pass, full accessibility pass, and the remainder of the asset-path helper rollout if Task 6 was scoped narrowly to just the tools in this phase.

**Phase 5 (Integration):** full-workspace JSON backup/restore already exists per the checklist — this phase becomes mostly a cross-tool consistency check once Phase 3's schema reconciliation (Task 1/2) is final, since date formats and ID schemes need to agree across all five tools before backup/restore round-trips can be trusted.

**Design system phase (post Phase 5):** React ecosystem selection — deliberately deferred, do not start early.