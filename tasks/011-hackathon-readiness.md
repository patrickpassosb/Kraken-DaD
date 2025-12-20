# Task: Hackathon Readiness & Improvement Plan

## 1. Task Overview

### Task Title
**Title:** Hackathon readiness audit and improvement backlog

### Goal Statement
**Goal:** Produce a concrete, prioritized improvement plan and alignment assessment against Kraken Forge Track #3 requirements, judging criteria, and rules (`context/context.md`, `context/rules.md`, `context/takai-site.md`), so the prototype, README, and demo clearly meet hackathon expectations.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18 + @xyflow/react 12 + Vite 5 (frontend); Fastify (backend); Node.js 18 runtime
- **Language:** TypeScript (frontend and backend)
- **Database & ORM:** None (stateless demo)
- **UI & Styling:** Custom dark Kraken-inspired theme; React Flow nodes; CSS modules/TS helpers
- **Authentication:** None (dry-run only; optional env for validate-only Kraken private calls)
- **Key Architectural Patterns:** Shared `strategy-core` schema/executor; Fastify API (`/execute/dry-run`, `/market/context`); Kraken REST adapter (public ticker/depth, validate-only private scaffold)

### Current State
- Visual strategy canvas with control/data handles, start guard, and lane layout; dry-run executor returns execution log.
- Kraken public API integration for Ticker/Depth in backend; private endpoints scaffolded as validate-only; dry-run enforced.
- Kraken Pro UX pass started (nodes, order preview, market context dock) but needs judge-ready polish and explicit criteria coverage.
- Docs: README outlines architecture and safety; tasks/docs capture execution lifecycle; demo video not yet noted.

## 3. Context & Problem Definition

### Problem Statement
Project must convincingly satisfy Kraken Forge requirements (Track #3) and judging criteria, but gaps remain in visible Kraken API coverage (WS/validate-only clarity), evidence of reusability, UX polish, and submission assets (demo video, README sections tailored to judges). Need a targeted backlog to close these before submission.

### Success Criteria
- [ ] Alignment assessment against `context/context.md`, `context/rules.md`, and `context/takai-site.md` documented (pass/fail + gaps).
- [ ] Prioritized improvement list mapped to each judging criterion and non-negotiable constraint from `context/context.md` with owners/effort notes.
- [ ] Explicit coverage plan for Kraken API usage (public + private validate-only + WS roadmap) and dry-run safety surfaced in UI/docs.
- [ ] Demo/readme checklist (architecture summary, API usage, safety, how to run, video plan) finalized.
- [ ] Risk/feasibility notes for each improvement with minimal viable slice identified.

---

## 4. Development Mode Context

- **🚨 Project Stage:** Hackathon submission hardening (demo-first, no prod data)
- **Breaking Changes:** Avoid; preserve strategy schema and dry-run behavior
- **Data Handling:** No persistence; live trading disabled; keep credentials server-only/optional
- **User Base:** Hackathon judges and demo viewers
- **Priority:** Clarity and credibility over breadth; highlight Kraken-native integration

---

## 5. Technical Requirements

### Functional Requirements
- Produce backlog items that strengthen: Kraken API integration evidence (REST today, WS path), strategy execution clarity, and UI trust signals.
- Ensure improvements keep drag-and-drop strategy builder functional and dry-run safe.
- Map each recommendation to judging criteria (innovation, technical execution, reusability, UX, documentation, presentation).

### Non-Functional Requirements
- **Performance:** Keep canvas smooth; avoid heavy WS polling suggestions without plan.
- **Security:** No live trading; credentials never reach frontend; private calls remain validate-only unless explicitly opted-in server-side.
- **Usability:** Kraken Pro-inspired copy/visuals; clear execution state and API provenance.
- **Responsive Design:** Desktop-first; acceptable on laptop widths.
- **Theme Support:** Dark Kraken palette; no light mode required.

### Technical Constraints
- Do not change schema version or block handle naming (`control:*`, `data:*`).
- Keep backend Fastify + TypeScript; avoid new services/datastores.
- Kraken ecosystem only; no non-Kraken exchanges.

---

## 6. Data & Database Changes

### Database Schema Changes
None (stateless demo).

### Data Model Updates
Document any proposed node data additions (e.g., risk guard configs, order preview fields) in `strategy-core` before implementation.

### Data Migration Plan
Not applicable.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
Keep Kraken integration in `packages/kraken-client`; expose via Fastify routes; share types from `strategy-core`.

### Server Actions
Potential additions: optional WS market stream endpoint proxy; explicit validate-only order intent logging in dry-run results.

### Database Queries
Not applicable (no DB).

---

## 8. Frontend Changes

### New Components
Potential: WS status badge, Kraken API usage tooltip/modal, submission-ready run checklist panel, demo CTA to video link.

### Page Updates
`App.tsx`, `canvas/FlowCanvas.tsx`, nodes layout, market context dock/order preview copy, README/demo instructions surface.

### State Management
Extend existing state to carry execution mode/validate-only flags, WS status, and market pair context without breaking serialization.

---

## 9. Implementation Plan

1) Audit against Track #3 requirements, judging criteria, and rules in `context/context.md`, `context/rules.md`, `context/takai-site.md`; list alignment + gaps for API integration, UX, reusability, docs, presentation.  
2) Draft prioritized backlog with effort/impact tags; align each item to criteria and context doc constraints.  
3) Define submission assets: README updates, demo video script/storyboard, run instructions, evidence of Kraken API usage.  
4) Validate plan with dry-run safety: ensure any new API usage stays validate-only; note verification steps.  
5) Hand off actionable checklist to execution tasks (link to relevant task files like `009-kraken-api-mode.md`, `010-kraken-pro-ux.md`).

---


## 9.1 Improvement Impact Assessment

- Presentation/Documentation (demo video link, optional live URL, judge walkthrough/checklist)
  - Break risk: Low
  - Structural depth: None (docs-only)
  - Touches: `README.md`, `docs/` (new walkthrough/checklist)
  - Mitigation: Use placeholders until assets are ready; keep links stable
  - Hackathon value: High (documentation + presentation)
- Reusability docs (component API, events, data model, example strategy JSON, add-block guide)
  - Break risk: Low (docs-only); Medium if you extract a reusable package
  - Structural depth: None for docs; Medium for extraction
  - Touches: `docs/` (new guides), `README.md` (entry points)
  - Mitigation: Start with docs-only; keep component API stable if later extracted
  - Hackathon value: High (reusability criterion)
- Technical execution (schema validation + unit tests in strategy-core)
  - Break risk: Medium (validation can reject previously accepted graphs)
  - Structural depth: Medium (shared core used by frontend/backend)
  - Touches: `packages/strategy-core/*`, test files under `packages/strategy-core`, `package.json` scripts
  - Mitigation: Add non-breaking validation paths first; cover fixtures; gate strict validation behind a flag
  - Hackathon value: High (technical execution + correctness)
- UX & clarity (Kraken API source badge/timestamp)
  - Break risk: Low
  - Structural depth: Low (UI + optional API field)
  - Touches: `apps/frontend/src/components/MarketContextDock.tsx`, `apps/frontend/src/components/OrderPreviewPanel.tsx`, `apps/frontend/src/App.tsx`, `apps/frontend/src/styles/theme.css`; optional `apps/frontend/src/api/marketContext.ts`, `apps/backend/src/routes/market/context.ts`
  - Mitigation: Make badge optional; fallback text when timestamp missing
  - Hackathon value: Medium (Kraken integration visibility + UX clarity)
- Innovation/depth (Kraken WS stream OR validate-only order intent visualization)
  - WS stream: Break risk Medium-High; Structural depth High; touches `packages/kraken-client`, backend stream route/proxy, frontend stream hook/state
  - Validate-only intent: Break risk Medium; Structural depth Medium; touches `packages/strategy-core`, backend execute/validate path, frontend execution summary
  - Mitigation: Feature-flag both; fallback to REST/dry-run; show connection/status errors without blocking
  - Hackathon value: High for innovation/technical execution, but higher complexity

## 10. Task Completion Tracking

Track backlog items and criteria coverage in this file; mark success criteria checkboxes upon completion.

---

## 11. File Structure & Organization

- Update this task file.  
- Reference existing task files (`009-kraken-api-mode.md`, `010-kraken-pro-ux.md`) for linked actions.  
- Add any supporting notes to `docs/` if architecture changes are proposed.

---

## 12. AI Agent Instructions

### Implementation Workflow
Use Context7 for any library or API reference; keep changes in TypeScript with 4-space indent; avoid `any`; respect handle naming and dry-run defaults.

### Communication Preferences
Keep updates concise; tie recommendations back to judging criteria and context constraints.

### Code Quality Standards
Kraken terminology only; no live trading enablement; document any schema/type updates before coding.

---

## 13. Second-Order Impact Analysis

Highlight risks: schema drift between UI and `strategy-core`, WS addition complexity/perf, demo instability if Kraken API unavailable (need graceful fallback messaging). Ensure new UX elements do not confuse dry-run safety promises.
