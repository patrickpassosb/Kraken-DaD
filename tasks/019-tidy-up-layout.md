# Task: React Flow “Tidy Up” Auto-Layout

## 1. Task Overview

### Task Title
**Title:** Add n8n-style “Tidy Up” auto-layout control

### Goal Statement
**Goal:** Provide a one-click “Tidy Up” control that automatically arranges nodes into a clean layout (lanes, spacing, avoiding overlaps) so users can declutter the canvas beyond the existing recenter/fit view.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5
- **Language:** TypeScript/TSX
- **Database & ORM:** None (frontend-only)
- **UI & Styling:** Custom Kraken dark theme (tokens.css/theme.css)
- **Authentication:** None
- **Key Architectural Patterns:** Node-based canvas with React Flow, client-only state, dry-run executor

### Current State
Canvas supports manual drag, connect, delete, and a recenter (fitView) control. No auto-layout exists; nodes can drift, overlap, or sit far apart, making workflows messy compared to n8n’s “Tidy up.”

## 3. Context & Problem Definition

### Problem Statement
Users want a quick way to reorganize nodes like n8n’s “Tidy up.” Manual dragging is slow, and recenter only adjusts viewport, not node positions. Need an auto-layout that respects control/data flows, lane ordering, and spacing while preserving node data/status.

### Success Criteria
- [ ] “Tidy Up” button (and shortcut if reasonable) appears with canvas controls.
- [ ] Auto-layout repositions all nodes into non-overlapping rows/columns with consistent spacing and lane ordering (control → market → logic/risk → execution/actions), handling disconnected nodes gracefully.
- [ ] Positions update via React Flow state (no visual glitches), then fitView to the new layout.
- [ ] Existing recenter behavior remains unchanged.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Demo-focused feature hardening
- **Breaking Changes:** Avoid; frontend-only
- **Data Handling:** Client state only; preserve node data/status
- **User Base:** Demo judges/users
- **Priority:** UX clarity and polish

---

## 5. Technical Requirements

### Functional Requirements
- Add “Tidy Up” control alongside recenter; optional keyboard shortcut.
- Compute layout using current nodes/edges; group/control order by lane type, avoid overlaps, give consistent spacing.
- Support mixed edge types (control/data) and disconnected nodes; keep deterministic ordering (stable sort).
- Trigger fitView after layout.

### Non-Functional Requirements
- **Performance:** Layout runs fast on modest graphs (<100 nodes).
- **Security:** No changes.
- **Usability:** No data loss; maintain selection/status; clear affordance.
- **Responsive Design:** Works on existing desktop layout.
- **Theme Support:** Use existing Kraken theme tokens.

### Technical Constraints
- Frontend only; no backend/schema changes.
- Keep ASCII; match existing TS/React patterns.

---

## 6. Data & Database Changes
- None.

---

## 7. API & Backend Changes
- None.

---

## 8. Frontend Changes

### New Components
- None expected; reuse FlowCanvas controls or small inline control component.

### Page Updates
- `apps/frontend/src/canvas/FlowCanvas.tsx` (tidy handler, control UI)
- `apps/frontend/src/styles/theme.css` (control styling)

### State Management
- Update node positions via existing `setNodes`; keep edge typings intact.

---

## 9. Implementation Plan
1) Design layout rules: lane mapping (control/market/logic+risk/execution), spacing, ordering fallback for disconnected nodes; plan keyboard shortcut and UX.
2) Implement tidy handler: compute positions from nodes/edges, update node state, then fitView; wire control + styling.
3) Validate: try with mixed/loop/disconnected nodes; ensure recenter still works and statuses/data persist.

---

## 10. Task Completion Tracking
- Track via success criteria checklist above.

---

## 11. File Structure & Organization
- Modify: `apps/frontend/src/canvas/FlowCanvas.tsx`, `apps/frontend/src/styles/theme.css`

---

## 12. AI Agent Instructions
- Keep code concise; avoid new backend deps; prefer deterministic layout; retain node data/status.
- Use existing theme tokens; no magic colors.
- Minimal comments only where logic is non-obvious.

---

## 13. Second-Order Impact Analysis
- Ensure layout doesn’t break serialization or execution mapping (IDs unchanged).
- Avoid jitter by batching setNodes updates; no undo/redo regressions.

---
