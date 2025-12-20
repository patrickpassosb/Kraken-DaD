# Task: Hackathon Improvements Implementation

## 1. Task Overview

### Task Title
**Title:** Implement docs, reusability guides, validation/tests, and streaming/validate-only visibility

### Goal Statement
**Goal:** Implement the prioritized hackathon improvements (documentation/presentation, reusability guides, strategy-core validation/tests, Kraken WS stream usage, validate-only order intent visibility) without altering live-trade safety defaults, so the submission reads as complete, reusable, and technically credible.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18 + @xyflow/react 12 + Vite 5 (frontend); Fastify (backend)
- **Language:** TypeScript (frontend + backend)
- **Database & ORM:** None
- **UI & Styling:** Custom Kraken dark theme CSS
- **Authentication:** None (dry-run by default; optional credentials server-side)
- **Key Architectural Patterns:** Shared `strategy-core` schema/executor; Kraken REST + WS adapter; Fastify routes; React Flow canvas

### Current State
- Market streaming already exists (backend SSE from Kraken WS; frontend hook consumes it).
- Strategy-core has validation inside `executeDryRun` but no unit tests.
- Docs cover architecture/usage but lack reusability API/JSON examples and judge walkthrough.
- Kraken validate-only results are produced but not surfaced in the UI.

## 3. Context & Problem Definition

### Problem Statement
Hackathon judging emphasizes documentation, reusability, and technical execution. The project needs clearer reuse docs, test coverage for core logic, and visible validate-only intent results to prove Kraken integration depth.

### Success Criteria
- [x] README includes demo video link placeholder, optional live URL, and a judge walkthrough + checklist.
- [x] New docs explain how to reuse the strategy builder component (props/events/data model), include an example strategy JSON, and provide an “add a new block” guide.
- [x] Strategy-core has unit tests for validation and execution ordering; tests can run via a documented command.
- [x] Validate-only Kraken intent results are visible in the UI when `validate` is enabled.
- [x] Streaming usage is documented (Kraken WS → backend SSE → frontend hook) without changing safety defaults.
- [x] No live-trade safety regression; dry-run remains default.

---

## 4. Development Mode Context

- **🚨 Project Stage:** Hackathon submission hardening
- **Breaking Changes:** Avoid breaking schema; UI changes acceptable
- **Data Handling:** No persistence; optional server-side credentials only
- **User Base:** Hackathon judges and demo viewers
- **Priority:** Documentation clarity + technical credibility

---

## 5. Technical Requirements

### Functional Requirements
- Document demo/presentation assets in README.
- Add reusable component docs + example strategy JSON + block authoring guide.
- Add tests for strategy validation and topological order determinism.
- Surface `krakenValidations` in execution summary UI when validate is requested.
- Document existing WS/SSE stream path.

### Non-Functional Requirements
- **Performance:** No regressions on canvas interactions.
- **Security:** Keep credentials server-side; validate-only is safe.
- **Usability:** Validation output should be readable and non-intrusive.
- **Responsive Design:** Desktop-first; keep right-rail layout intact.
- **Theme Support:** Use existing Kraken dark theme tokens.

### Technical Constraints
- Keep schema version unchanged.
- Avoid new dependencies unless required for tests.

---

## 6. Data & Database Changes

### Database Schema Changes
None.

### Data Model Updates
Optional: export validation helpers for testing.

### Data Migration Plan
Not applicable.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
Keep Kraken usage in `packages/kraken-client`; Fastify routes remain in `apps/backend/src/routes`.

### Server Actions
None required; reuse existing validate-only execution path.

### Database Queries
None.

---

## 8. Frontend Changes

### New Components
- Validation results block in the right-rail summary (or within Order Preview panel).

### Page Updates
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/styles/theme.css`

### State Management
Use existing execution result state; render `krakenValidations` when present.

---

## 9. Implementation Plan

1) Update README with demo/presentation sections and judge walkthrough/checklist.
2) Add docs: reusable component API, example strategy JSON, add-block guide.
3) Add strategy-core tests (validation + ordering) using Node’s test runner.
4) Render validate-only Kraken results in UI; keep layout concise.
5) Document existing streaming path (Kraken WS → backend SSE → frontend hook).

---

## 10. Task Completion Tracking

Track progress against success criteria; update checkboxes when each item is done.

---

## 11. File Structure & Organization

- Update: `README.md`, `apps/frontend/src/App.tsx`, `apps/frontend/src/styles/theme.css`
- Add: `docs/strategy-builder-reuse.md`, `docs/strategy-json-example.md`, `docs/add-block-guide.md`
- Add: `tests/strategy-core/*.test.ts` (or `packages/strategy-core/__tests__`)

---

## 12. AI Agent Instructions

### Implementation Workflow
- Use Context7 for any library/tool/test framework usage.
- Keep edits minimal and aligned with existing TypeScript patterns.
- No live-trade enablement; dry-run remains default.

### Communication Preferences
Concise updates with file references.

### Code Quality Standards
- Prefer small helper exports over refactors.
- Keep tests deterministic and fast.

---

## 13. Second-Order Impact Analysis

- Validation changes can reject existing graphs; keep validation behavior stable.
- UI additions should not crowd the right rail.
- Tests must not require network access.
