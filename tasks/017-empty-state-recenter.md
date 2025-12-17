# Task: Empty State + Recenter Controls

## 1. Task Overview

### Task Title
**Title:** Add empty-state CTA and recenter; remove prebuilt workflow/palette

### Goal Statement
**Goal:** Start the canvas clean (no demo nodes/edges or prefilled palette), show a Kraken-themed “add first step” overlay, and add a recenter control so users can quickly fit the workflow, mirroring n8n-like onboarding and navigation.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5
- **Language:** TypeScript/TSX
- **Database & ORM:** None (frontend-only)
- **UI & Styling:** Custom Kraken dark theme (tokens.css/theme.css)
- **Authentication:** None
- **Key Architectural Patterns:** Node-based canvas, control/data handles, dry-run UI

### Current State
- Demo nodes/edges load automatically.
- Palette shows predefined strategy blocks.
- No empty-state CTA when empty; no recenter control to fit view.

## 3. Context & Problem Definition

### Problem Statement
Users cannot start from a blank slate, lack guidance when empty, and can pan/zoom away with no quick way to refit the canvas. Palette forces predefined blocks instead of user-defined ones.

### Success Criteria
- [ ] Canvas loads with zero nodes/edges; no demo workflow.
- [ ] Palette starts empty/hidden (no prebuilt blocks).
- [ ] Empty-state overlay with “Add first step” + template link appears when empty.
- [ ] Recenter (“tie up”) control fits the view to nodes (or center if none).
- [ ] Styling matches Kraken theme and coexists with rail/palette toggles.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Hackathon demo hardening
- **Breaking Changes:** Avoid backend changes; frontend-only
- **Data Handling:** Client-side state only
- **User Base:** Demo judges/users
- **Priority:** UX clarity and usability

---

## 5. Technical Requirements

### Functional Requirements
- User can add first step via empty-state CTA.
- User can recenter the canvas at any time.
- System starts with zero nodes/edges and no prebuilt palette blocks.
- System shows empty-state overlay only when canvas is empty.

### Non-Functional Requirements
- **Performance:** Keep React Flow smooth; minimal re-renders.
- **Security:** No changes.
- **Usability:** Clear CTA, non-intrusive; recenter always reachable.
- **Responsive Design:** Desktop-first; preserve existing layout behavior.
- **Theme Support:** Kraken dark theme only.

### Technical Constraints
- No backend/schema changes; keep handle naming/serialization intact.

---

## 6. Data & Database Changes
- None

---

## 7. API & Backend Changes
- None

---

## 8. Frontend Changes

### New Components
- Empty-state overlay CTA component or inline block
- Recenter control button

### Page Updates
- `App.tsx` (initial nodes/edges, palette state, recenter control)
- `FlowCanvas.tsx` (empty-state overlay, fitView handler)
- `styles/theme.css` (CTA, controls styling)

### State Management
- Reuse existing React state; add flags for empty state and recenter handler.

---

## 9. Implementation Plan
1) Remove demo nodes/edges and prebuilt palette items; default palette hidden/empty.  
2) Add empty-state overlay CTA with “Add first step” and template link; hook to add Strategy Start or open palette.  
3) Add recenter (“tie up”) button calling fitView; ensure accessible when rail is hidden.  
4) Style CTA and controls to Kraken theme; verify rail/palette toggles and empty state interplay.

---

## 10. Task Completion Tracking
- Track via success criteria above.

---

## 11. File Structure & Organization
- Modify: `apps/frontend/src/App.tsx`, `apps/frontend/src/canvas/FlowCanvas.tsx`, `apps/frontend/src/styles/theme.css`

---

## 12. AI Agent Instructions
- Small, focused TSX/CSS edits; keep types; no backend changes.
- Concise updates with file references.
- Use Kraken tokens; avoid inline magic colors; keep handles intact.

---

## 13. Second-Order Impact Analysis
- Ensure recenter doesn’t conflict with rail/palette toggles.
- Empty-state overlay should not obstruct nodes once created.

---
