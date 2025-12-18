# Task: Consolidate Node Metadata & Template Wiring

## 1. Task Overview

### Task Title
**Title:** Centralize node definitions for palette, template, and add-node logic

### Goal Statement
**Goal:** Move node labels/icons/default data/positions into a single registry so palette rendering, template loading, and add-node behavior stay consistent and easier to maintain.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5
- **Language:** TypeScript/TSX
- **Database & ORM:** None (frontend-only)
- **UI & Styling:** Custom Kraken dark theme
- **Authentication:** None
- **Key Architectural Patterns:** Node-based canvas with React Flow; local state

### Current State
- Palette entries, template nodes, and add-node defaults are duplicated in `FlowCanvas.tsx`. Positions/default data are manually repeated, risking drift.

## 3. Context & Problem Definition

### Problem Statement
Duplicated node metadata can diverge (positions, defaults, labels), causing inconsistent UX and harder changes.

### Success Criteria
- [ ] Single registry defines node label/icon/role/group, default data, and default position.
- [ ] Palette rendering, template loader, and add-node logic all consume the registry.
- [ ] Existing handles/types/edge templates remain unchanged.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Demo-focused frontend polish
- **Breaking Changes:** Avoid; maintain current node/edge semantics
- **Data Handling:** Client state only
- **User Base:** Demo users/judges
- **Priority:** Consistency and maintainability

---

## 5. Technical Requirements

### Functional Requirements
- Registry exports grouped palette data and helpers to create nodes with defaults.
- Template generation uses registry defaults and keeps current wiring/handles.
- Add-node uses registry defaults and preserves one-start constraint.

### Non-Functional Requirements
- No visual regressions; keep existing positions/labels/icons.

### Technical Constraints
- ASCII only; frontend-only changes.

---

## 6. Data & Database Changes
- None.

---

## 7. API & Backend Changes
- None.

---

## 8. Frontend Changes

### New Components/Modules
- Node registry module (e.g., `apps/frontend/src/nodes/nodeRegistry.ts`).

### Page Updates
- `apps/frontend/src/canvas/FlowCanvas.tsx` to consume registry for palette, template, add-node.

---

## 9. Implementation Plan
1) Define node registry with metadata, defaults, positions, and palette grouping.
2) Update FlowCanvas to use registry for palette rendering, add-node, and template loader.
3) Verify handles/edge wiring unchanged and clean up duplicated code.

---

## 10. Task Completion Tracking
- Track via success criteria above.

---

## 11. File Structure & Organization
- New: `apps/frontend/src/nodes/nodeRegistry.ts`
- Update: `apps/frontend/src/canvas/FlowCanvas.tsx`

---

## 12. AI Agent Instructions
- Keep existing node semantics/handles; avoid visual drift.
- Minimal comments; keep types clear.

---

## 13. Second-Order Impact Analysis
- Centralizing may require future node changes to go through registry, which is intended; no backend impact.

---
