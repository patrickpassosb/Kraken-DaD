# Task: React Flow Usability Fixes

## 1. Task Overview

**Title:** N8n-like flow controls (edges + node actions)  
**Goal:** Improve edge rendering/controls and add node actions (run/deactivate/delete) while keeping strategy execution consistent.

---

## 2. Project Analysis & Current State

- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite, TS 5  
- **Language:** TypeScript  
- **UI & Styling:** Custom dark theme CSS  
- **Backend:** Already works (dry-run executor, Kraken adapter, action intents)  
- **Current State:** Graph editor supports basic connections and deletion but lacks edge insertion tools, node action controls, and N8n-like curved edges.
  - **Build Status:** Frontend build fails due to TypeScript errors around custom edge typings.

## 3. Context & Problem Definition

- **Problem:** Edges are visually harsh and lack N8n-like actions; users can’t insert/delete edges easily or run/deactivate nodes from the canvas.  
- **Success Criteria:**  
  - [ ] `apps/frontend` builds without TypeScript errors (custom edge types compile cleanly)
  - [ ] Edges render with smooth curved paths (no sharp step corners) and preserve control/data coloring  
  - [ ] Edge actions allow deleting a selected edge and inserting a node into a control edge  
 - [ ] Edge insertion opens the palette and inserts a compatible node between the two endpoints  
 - [ ] Nodes expose actions to run a single node, deactivate/reactivate it, and delete it  
 - [ ] Deactivated nodes are visually distinct and skipped during execution (no action intents)  
 - [ ] Backend supports running a specific node via `targetNodeId` with upstream dependencies executed  
 - [ ] UI supports running a specific node and reflects node status updates from the response  
 - [ ] Template load and Tidy Up place nodes in clean lanes/columns without overlapping edges
- [ ] Nodes show a single visible handle/edge per connection (data edges are implicit)
- [x] If node has only one data handle (remove the second data handle)
- [ ] Conditional nodes only allow actions on the chosen branch (false paths do not trigger live orders)
- [ ] Settings panel warns that live mode is in test and not ready

---

## 4. Development Mode Context

- **Stage:** Demo-focused feature hardening  
- **Breaking Changes:** Backend execution path may expand to handle target node runs  
- **Priority:** Usability and parity with N8n node actions/edges

---

## 5. Technical Requirements

- **Functional:**  
  - Replace Step edges with smooth curved edges using a custom edge component  
  - Add edge toolbar with delete and insert actions (insert limited to control edges)  
  - Add node action toolbar (run/deactivate/delete)  
  - Store node deactivation state in config and skip in executor  
  - Extend execution route and strategy execution to support `targetNodeId`  
- **Non-Functional:** Keep UI responsive and provide clear visual affordances.  
- **Constraints:** Maintain existing schema version and avoid breaking stored strategies.

---

## 6. Data & Database Changes

Optional: `config.disabled` stored on nodes.

---

## 7. API & Backend Changes

- `/execute` accepts optional `targetNodeId`; execution engine respects it.

---

## 8. Frontend Changes

- Add custom edge component and edge toolbar actions.  
- Add node action toolbar (run/deactivate/delete).  
- Update `FlowCanvas` to support edge insertion, node actions, and disabled styling.  
- Update execution path and API types to allow `targetNodeId`.

---

## 9. Implementation Plan

1) Implement custom curved edges with toolbar actions and edge insertion.  
2) Add node action controls and disabled styling/state.  
3) Extend execution path to support `targetNodeId` and disabled nodes; wire UI run action.

---

## 10. Task Completion Tracking

- Track via success criteria checklist above.

---

## 11. File Structure & Organization

- Likely touches: `apps/frontend/src/canvas/FlowCanvas.tsx`, `apps/frontend/src/nodes/*`, `apps/frontend/src/edges/*`, `apps/frontend/src/App.tsx`, `apps/frontend/src/utils/toStrategyJSON.ts`, `packages/strategy-core/executor/dryRunExecutor.ts`, `apps/backend/src/routes/execute.ts`.

---

## 12. AI Agent Instructions

- Follow React Flow best practices; prefer clarity over abstraction; keep ASCII.

---

## 13. Second-Order Impact Analysis

- Ensure serialization still matches backend expectations; ensure disabled/target runs do not break validation.
