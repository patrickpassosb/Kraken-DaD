# Task: React Flow Usability Fixes

## 1. Task Overview

**Title:** Make React Flow strategy builder usable and demo-ready  
**Goal:** Fix connections/deletion/validation so the frontend produces valid strategies by default and supports Track #3 demo.

---

## 2. Project Analysis & Current State

- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite, TS 5  
- **Language:** TypeScript  
- **UI & Styling:** Custom dark theme CSS  
- **Backend:** Already works (dry-run executor, Kraken adapter, action intents)  
- **Current State:** Graph editor allows invalid links, can’t reliably connect/delete, orphan start nodes allowed, default graph wiring incorrect.

## 3. Context & Problem Definition

- **Problem:** Users cannot reliably connect or delete nodes/edges; control vs data flow not enforced; invalid graphs easy; default graph not guaranteed valid.  
- **Success Criteria:**  
  - [ ] `onConnect` uses `addEdge` and classifies `control` vs `data` from handle IDs  
  - [ ] `isValidConnection` blocks control↔data and duplicate data inputs  
  - [ ] Nodes/edges selectable and deletable via Delete/Backspace with state updates  
  - [ ] Explicit handles per node; only one Start node allowed; orphan warning UX  
  - [ ] Required blocks present and usable: control.start, data.kraken.ticker, logic.if, action.placeOrder, action.cancelOrder  
  - [ ] Default graph loads valid Start → Kraken Ticker → If → Place Order strategy that dry-runs

---

## 4. Development Mode Context

- **Stage:** Demo-focused feature hardening  
- **Breaking Changes:** Avoid backend changes; keep schema/adapter intact  
- **Priority:** Stability/usability for demo over new features

---

## 5. Technical Requirements

- **Functional:**  
  - Implement mandated `onConnect` (typed handles, edge type set)  
  - Enforce connection rules with `isValidConnection` on ReactFlow  
  - Enable delete key for nodes/edges; selection supported  
  - Enforce explicit handle IDs (`control:*`, `data:*`) across nodes  
  - Limit to one Start node; highlight orphans; optional auto-connect first action  
  - Load required blocks and demo strategy on start
- **Non-Functional:** Keep UI responsive and clear feedback; no backend/API changes.
- **Constraints:** No network calls needed; follow existing schema; do not touch backend logic.

---

## 6. Data & Database Changes

None.

---

## 7. API & Backend Changes

None (frontend-only).

---

## 8. Frontend Changes

- Update `FlowCanvas` (connect handler, validation, delete handlers, start limit/orphan warning, selection config).  
- Update node components to use explicit handles/IDs for control and data ports.  
- Ensure `App` default graph wires valid strategy; adjust serialization helper if needed for edge typing.

---

## 9. Implementation Plan

1) Add `onConnect` with edge typing and validation; wire `isValidConnection` and selection/delete handlers.  
2) Normalize handles for all required nodes; enforce one Start node and orphan warnings; palette logic as needed.  
3) Fix default demo graph wiring and validate serialization/dry-run path.

---

## 10. Task Completion Tracking

- Track via success criteria checklist above.

---

## 11. File Structure & Organization

- Likely touches: `apps/frontend/src/canvas/FlowCanvas.tsx`, `apps/frontend/src/nodes/*`, `apps/frontend/src/App.tsx`, `apps/frontend/src/utils/toStrategyJSON.ts`.

---

## 12. AI Agent Instructions

- Follow React Flow best practices; no backend edits; prefer clarity over abstraction; keep ASCII.

---

## 13. Second-Order Impact Analysis

- Ensure serialization still matches backend expectations; avoid creating duplicate Start nodes or invalid edges that could cause executor validation errors.

