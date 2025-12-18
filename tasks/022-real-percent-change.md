# Task: Real 24h Percent Change Badge

## 1. Task Overview

### Task Title
**Title:** Show real 24h percent change using Kraken opening price

### Goal Statement
**Goal:** Replace the bogus 24h change badge with a true percent derived from Kraken’s opening price so users see an accurate daily move.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18, @xyflow/react 12, Vite 5; Fastify backend; custom Kraken client
- **Language:** TypeScript/TSX
- **Database & ORM:** None
- **UI & Styling:** Custom Kraken dark theme
- **Authentication:** None
- **Key Architectural Patterns:** Frontend React Flow canvas; backend proxy to Kraken; shared client package

### Current State
- UI badge uses `change` from `/market/context`, which currently returns Kraken `p[1]` (24h VWAP price) formatted as percent—nonsense values.
- Badge was hidden to avoid the wrong number; no real percent is shown.

## 3. Context & Problem Definition

### Problem Statement
24h percent change is incorrect because the backend provides a price, not a percentage. Need to compute from opening price and last price.

### Success Criteria
- [ ] Kraken client computes `change24hPct` from `o` (open) and `last`.
- [ ] `/market/context` exposes the percent field.
- [ ] Frontend types and UI render the badge using the real percent and hide gracefully if missing.

---

## 4. Development Mode Context
- **🚨 Project Stage:** Demo polish
- **Breaking Changes:** Avoid; additive fields preferred
- **Data Handling:** Client state only
- **User Base:** Demo users/judges
- **Priority:** Correctness of market display

---

## 5. Technical Requirements

### Functional Requirements
- Compute percent change as `(last - open) / open * 100` when open > 0.
- Preserve existing price fields; add percent as separate field.
- Fallback: hide badge if percent missing.

### Non-Functional Requirements
- Minimal UI churn; keep styling.

### Technical Constraints
- Frontend/backends only; ASCII.

---

## 6. Data & Database Changes
- None.

---

## 7. API & Backend Changes
- Add `change24hPct` to market context response.

---

## 8. Frontend Changes

### Page Updates
- `apps/frontend/src/App.tsx` (types/state)
- `apps/frontend/src/api/marketContext.ts`
- `apps/frontend/src/components/MarketContextDock.tsx`

### Shared Client
- `packages/kraken-client/index.ts`
- `apps/backend/src/routes/market.ts`

---

## 9. Implementation Plan
1) Compute `change24hPct` in Kraken client (use opening price `o` and `last`).
2) Add percent field to `/market/context` response.
3) Update frontend types/state and restore badge to use real percent with fallback.

---

## 10. Task Completion Tracking
- Track via success criteria above.

---

## 11. File Structure & Organization
- Modify: `packages/kraken-client/index.ts`, `apps/backend/src/routes/market.ts`, `apps/frontend/src/api/marketContext.ts`, `apps/frontend/src/App.tsx`, `apps/frontend/src/components/MarketContextDock.tsx`

---

## 12. AI Agent Instructions
- Keep existing fields; add percent separately.
- Handle missing data gracefully; no noisy console.

---

## 13. Second-Order Impact Analysis
- Ensure downstream consumers ignore/handle optional percent; no breaking schema changes to executor.

---
