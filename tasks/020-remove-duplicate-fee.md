# Task: Remove Duplicate Fee Block

## 1. Task Overview

### Task Title
**Title:** Remove duplicated fee card from right-rail summary

### Goal Statement
**Goal:** Eliminate the extra fees summary card under the right-rail result summary because the Order Preview already shows fees, keeping the panel concise.

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
Order Preview panel shows fee rate and estimated fees. The result summary below duplicates fee info in a separate card.

## 3. Context & Problem Definition

### Problem Statement
Fee information is shown twice in the right rail, cluttering the summary.

### Success Criteria
- [ ] Remove the duplicate fee summary card from the result summary section.
- [ ] Order Preview continues to show fee rate and estimated fees unchanged.
- [ ] Layout remains intact (Status/Nodes Executed/Warnings still aligned).

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

---

## 9. Implementation Plan
1) Remove the fees summary card from the right-rail result summary.
2) Verify remaining cards render correctly and Order Preview still shows fees.

---

## 10. Task Completion Tracking
- Track via success criteria above.

---

## 11. File Structure & Organization
- Modify: `apps/frontend/src/App.tsx`

---

## 12. AI Agent Instructions
- Keep change minimal; no styling regressions.

---

## 13. Second-Order Impact Analysis
- Low impact; ensure no layout gaps after card removal.

---
