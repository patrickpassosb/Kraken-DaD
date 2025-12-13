# Task: Kraken API Clarity & Execution Mode UX

## 1. Task Overview

**Title:** Separate Kraken adapters, add execution mode UX, document dry-run safety  
**Goal:** Make Kraken API usage explicit (public vs private stub), surface execution mode in UI, and document dry-run behavior for demo safety.

---

## 2. Project Analysis & Current State

- **Frameworks & Versions:** React 18 + @xyflow/react 12, Fastify backend, TypeScript.
- **Current State:** Single Kraken REST adapter (public ticker), dry-run executor only, UI lacks mode badge/warnings, README missing Kraken API usage section.

## 3. Context & Problem Definition

- **Problem:** Kraken API interactions aren’t clearly separated; no visible execution mode or safety messaging; docs don’t explain public vs private usage. Live trading must remain disabled.
- **Success Criteria:**
  - [ ] Public vs private Kraken adapters split; private stub throws “Live trading not enabled”; comments map actions to Kraken endpoints.
  - [ ] ExecutionMode includes `'dry-run' | 'live'` (live wired, disabled); dry-run default.
  - [ ] UI shows execution mode badge, tooltip on Kraken API usage, and warning banner “This demo does NOT execute real trades.”
  - [ ] README section “Kraken API Usage” explaining public endpoints used, dry-run default, and how live would work (conceptually).

---

## 4. Development Mode Context

- **Stage:** Hackathon demo; prioritize clarity and safety messaging over feature depth.
- **Breaking Changes:** Avoid API breaking changes; keep dry-run fully working.
- **Priority:** Demo readiness and explicit safety.

---

## 5. Technical Requirements

- **Functional:** Split adapters (public ticker vs private order stub); ExecutionMode union updated; UI badges/warnings; docs updated.
- **Non-Functional:** No real trading, no API key storage, minimal UI changes, clear comments.

---

## 6. Data & Database Changes

None.

---

## 7. API & Backend Changes

- Add KrakenPrivateAdapter stub that throws on live actions; keep public ticker adapter.
- Keep dry-run endpoints; wire mode type without enabling live.

---

## 8. Frontend Changes

- Add execution mode badge text “Dry-run mode (safe, no real orders)”.
- Add tooltip/inline hint describing Kraken public/private usage.
- Add warning banner “This demo does NOT execute real trades”.

---

## 9. Implementation Plan

1) Define public/private adapter interfaces; convert REST ticker to public adapter; add private stub + endpoint mapping comments.  
2) Update ExecutionMode typing and docs; keep dry-run default in backend.  
3) Add UI badge, tooltip, and warning banner; update README with Kraken API Usage section.

---

## 10. Task Completion Tracking

Track via the success criteria checklist above.

---

## 11. File Structure & Organization

- `packages/strategy-core/kraken/*` (adapters)
- `packages/strategy-core/schema.ts`, `docs/execution-lifecycle.md`
- `apps/backend/src/*`
- `apps/frontend/src/App.tsx`
- `README.md` (add/update)

---

## 12. AI Agent Instructions

- Keep changes minimal, readable, hackathon-friendly; no live trading; add clear comments.

---

## 13. Second-Order Impact Analysis

- Ensure dry-run executor remains unchanged; no new network calls; UI messaging aligns with disabled live trading.

