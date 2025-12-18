# Task: Multi-Asset Pair Selector with Icons

## 1. Task Overview

### Task Title
**Title:** Add pair selector with coin icons for common markets

### Goal Statement
**Goal:** Let users pick from common trading pairs (BTC/USD, ETH/USD, USDC/…) with visible coin icons, updating the canvas nodes and market context accordingly.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5; Fastify backend; custom Kraken client
- **Language:** TypeScript/TSX
- **Database & ORM:** None
- **UI & Styling:** Custom Kraken dark theme
- **Authentication:** None
- **Key Architectural Patterns:** Node-based canvas; market context via backend Kraken proxy

### Current State
- Pairs are typed manually in Market Data/Order nodes; no shared selector.
- No coin icons; only text pairs.

## 3. Context & Problem Definition

### Problem Statement
Users want to switch between multiple pairs quickly (like Kraken’s market list) and see coin icons. Manual typing is slow and error-prone; there’s no shared selection control.

### Success Criteria
- [ ] Pair selector lists common pairs with coin icons and search/filter.
- [ ] Selecting a pair updates market context and node defaults (Market Data, Order, Guard) to that pair.
- [ ] Icons render in the selector and market context badge; fallback to initials when icon missing.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Demo polish
- **Breaking Changes:** Avoid; additive UI only
- **Data Handling:** Client state only
- **User Base:** Demo users/judges
- **Priority:** Usability and clarity

---

## 5. Technical Requirements

### Functional Requirements
- Add pair list with icons (local set for top assets) and search.
- Selecting a pair sets active pair for context fetch and updates relevant nodes’ pair fields.
- Fallback icon uses initials if no asset image.

### Non-Functional Requirements
- Keep UI responsive; minimal layout disruption.

### Technical Constraints
- ASCII; frontend-only; static asset list acceptable.

---

## 6. Data & Database Changes
- None.

---

## 7. API & Backend Changes
- None (use static pair list on frontend).

---

## 8. Frontend Changes

### New Components
- Pair selector component with icon badges.

### Page Updates
- `apps/frontend/src/App.tsx` (active pair state, selector UI, pass to FlowCanvas/MarketContext)
- `apps/frontend/src/canvas/FlowCanvas.tsx` (apply selected pair to relevant nodes)
- `apps/frontend/src/components/MarketContextDock.tsx` (optional icon support)
- New data: asset/pair metadata + icon styling.

---

## 9. Implementation Plan
1) Add asset/pair metadata with icon colors/initials; create pair selector component with search.
2) Wire App with selectedPair state, selector UI, and pass down to FlowCanvas/MarketContext.
3) Update FlowCanvas to sync selectedPair to node pair fields and defaults; render icons where appropriate.

---

## 10. Task Completion Tracking
- Track via success criteria above.

---

## 11. File Structure & Organization
- New: `apps/frontend/src/data/pairs.ts`, `apps/frontend/src/components/PairSelector.tsx`
- Update: `apps/frontend/src/App.tsx`, `apps/frontend/src/canvas/FlowCanvas.tsx`, `apps/frontend/src/components/MarketContextDock.tsx`, `apps/frontend/src/styles/theme.css`

---

## 12. AI Agent Instructions
- Keep colors consistent; fallback initials if no icon file.
- Don’t break existing node/edge logic; additive changes only.

---

## 13. Second-Order Impact Analysis
- Ensure pair updates don’t override custom user input unexpectedly; keep safe defaults.
- Verify serialization still uses updated node data.

---
