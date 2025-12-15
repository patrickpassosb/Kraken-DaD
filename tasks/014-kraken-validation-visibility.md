# Task: Surface Kraken validate-only intents in dry-run output/UI

## 1. Task Overview
**Title:** Show validate-only Kraken order intents and results in dry-run logs/UI
**Goal:** Include validate-only AddOrder/CancelOrder payloads and responses in backend dry-run results and render them in the frontend so users see Kraken-ready orders while live trading stays disabled.

## 2. Project Analysis & Current State
- Monorepo: Fastify backend, React Flow frontend, shared strategy-core.
- Dry-run executor already calls Kraken validation when `validate=true` but responses are not exposed in UI.

## 3. Context & Problem Definition
**Problem:** Users cannot see validate-only private order intents/responses, reducing transparency of dry-run behavior.
**Success Criteria:**
- [x] Backend attaches structured Kraken validation entries (intent + outcome) to dry-run results.
- [x] Frontend renders these entries in a clear list/log with validate-only messaging.
- [x] Live trading remains disabled; calls keep `validate=true` only.

## 4. Development Mode Context
Demo safety-first; no live trading; keep existing endpoints stable.

## 5. Technical Requirements
- Extend execution result type to include validation entries.
- Ensure private client is invoked with `validate=true`; capture request summary + Kraken response/error.
- UI panel/card displays validations (pair, side, type, price, volume, result message) with warning copy.

## 6. Data & Database Changes
None.

## 7. API & Backend Changes
- Update dry-run executor/resolver to include validation detail in response payload.

## 8. Frontend Changes
- Add UI section to show Kraken validation intents/results with disclaimer.

## 9. Implementation Plan
1) Update shared types to carry `krakenValidations` entries.
2) Capture validate-only request/response data during dry-run execution and include in results.
3) Render validations in frontend with clear “validate-only (no real trades)” messaging.

## 10. Task Completion Tracking
Track via success criteria checklist.

## 11. File Structure & Organization
- `packages/strategy-core/*`
- `apps/backend/src/*`
- `apps/frontend/src/*`

## 12. AI Agent Instructions
- Keep dry-run only; no live trading toggles. Minimal UI addition.

## 13. Second-Order Impact Analysis
- Ensure response shape changes don’t break existing UI; provide defaults/fallbacks.
