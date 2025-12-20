# Task: Simplify Right-Rail Summary

## 1. Task Overview

### Task Title
**Title:** Simplify right-rail summary and chrome

### Goal Statement
**Goal:** Remove the duplicate fees summary card and the extra right-rail background container so Market Context and Order Preview read as standalone panels.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5
- **Language:** TypeScript/TSX
- **Database & ORM:** None (frontend-only)
- **UI & Styling:** Custom Kraken dark theme (tokens.css/theme.css)
- **Authentication:** None
- **Key Architectural Patterns:** React Flow canvas + side panels

### Current State
Order Preview panel shows fee rate and estimated fees. The result summary below duplicates fee info in a separate card. The right-rail wrapper adds an extra background box behind Market Context and Order Preview.

## 3. Context & Problem Definition

### Problem Statement
Fee information is shown twice in the right rail, and the extra right-rail background box adds visual clutter behind the Market Context and Order Preview panels.

### Success Criteria
- [ ] Remove the duplicate fee summary card from the result summary section.
- [ ] Order Preview continues to show fee rate and estimated fees unchanged.
- [ ] Layout remains intact (Status/Nodes Executed/Warnings still aligned).
- [ ] Right-rail background container removed so only the two panels remain visible.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Demo-focused frontend polish
- **Breaking Changes:** Avoid backend or schema changes
- **Data Handling:** Client state only
- **User Base:** Demo users/judges
- **Priority:** UI clarity

---

## 5. Technical Requirements

### Functional Requirements
- Remove the extra fee card from the summary row.
- Remove the right-rail background container styling.

### Non-Functional Requirements
- Preserve styling/spacing for remaining cards.

### Technical Constraints
- Frontend-only; ASCII; minimal edits.

---

## 6. Data & Database Changes
- None.

---

## 7. API & Backend Changes
- None.

---

## 8. Frontend Changes

### Page Updates
- `apps/frontend/src/App.tsx` (remove duplicate fee summary card)
- `apps/frontend/src/styles/theme.css` (remove right-rail background container styling)

---

## 9. Implementation Plan
1) Remove the fees summary card from the right-rail result summary.
2) Remove right-rail container chrome so only panel cards remain.
3) Verify remaining cards render correctly and Order Preview still shows fees.

---

## 10. Task Completion Tracking
- Track via success criteria above.

---

## 11. File Structure & Organization
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/styles/theme.css`

---

## 12. AI Agent Instructions
- Keep change minimal; no styling regressions.

---

## 13. Second-Order Impact Analysis
- Low impact; ensure no layout gaps after card removal or rail chrome removal.

---
