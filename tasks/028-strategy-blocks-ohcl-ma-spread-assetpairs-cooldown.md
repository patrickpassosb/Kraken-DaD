# Task: Implement Core Data/Logic/Control Blocks (OHLC, MA, Spreads, AssetPairs, Cooldown)

## 1. Task Overview

### Task Title
**Title:** Add OHLC, Moving Average, Recent Spreads, AssetPairs Metadata, and Cooldown/Time Window blocks

### Goal Statement
**Goal:** Implement five new strategy blocks end-to-end (strategy-core definitions + executor behavior, backend Kraken data plumbing, and frontend nodes/palette) to enable trend/indicator logic, stronger spread checks, and time-based safety gating in the Kraken DaD builder without breaking existing strategies.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18 + @xyflow/react (frontend); Fastify (backend)
- **Language:** TypeScript (frontend + backend)
- **Database & ORM:** None
- **UI & Styling:** Custom Kraken dark theme CSS
- **Authentication:** None (optional server-side Kraken credentials)
- **Key Architectural Patterns:** Shared `strategy-core` schema/executor; Kraken REST + WS adapter; Fastify routes; React Flow canvas

### Current State
- Existing blocks: Start, Kraken Ticker, Constant, If, Risk Guard, Place/Cancel Order, Log Intent.
- `strategy-core` dry-run uses pre-fetched market data injected by backend.
- Kraken client supports ticker, depth, assets, asset pairs; no OHLC/Spread helpers.
- UI node registry and palette exist; add-block guide documents flow.

## 3. Context & Problem Definition

### Problem Statement
The builder needs real Kraken OHLC and spread data for richer strategy logic and demos, metadata for tick size/min order risk checks, and a control block to gate execution by time/cooldown. These blocks must be fully wired across core, backend, and UI to stay consistent with the architecture-first goals.

### Success Criteria
- [ ] `strategy-core` defines and handles: `data.kraken.ohlc`, `logic.movingAverage`, `data.kraken.spread`, `data.kraken.assetPairs`, `control.timeWindow`.
- [ ] Defaults applied: OHLC interval `1` minute + `120` candles; spreads window `50` entries; MA supports `SMA` and `EMA` (default `SMA`); time window uses UTC day/time gating only.
- [ ] Backend fetches Kraken OHLC/Spread/AssetPairs data and injects it into execution context for dry-run (with safe fallbacks).
- [ ] Frontend has new node components, types, and palette entries with config fields and correct port/handle wiring.
- [ ] Optional implied data edges added for common flows (e.g., OHLC → Moving Average).
- [ ] Strategy-core tests cover new blocks’ validation + output behavior.
- [ ] No schema version change; existing strategies still run.

---

## 4. Development Mode Context

- **🚨 Project Stage:** Hackathon feature buildout
- **Breaking Changes:** Avoid; additive only
- **Data Handling:** No persistence; runtime-only data from Kraken public endpoints
- **User Base:** Hackathon judges + demo users
- **Priority:** Correctness + extensibility over speed

---

## 5. Technical Requirements

### Functional Requirements
- OHLC block outputs recent candles + derived values for a pair/interval (default 1m x 120).
- Moving Average block computes SMA/EMA from an input series (default SMA, period 14).
- Recent Spreads block outputs latest + summary spread stats for last 50 entries.
- AssetPairs Metadata block outputs tick size/lot/precision fields for a pair.
- Time Window block gates control flow based on UTC day/time rules (no cross-run cooldown state).

### Non-Functional Requirements
- **Performance:** Kraken calls should be bounded and cached per execution; timeouts/fallbacks retained.
- **Security:** Public endpoints only; no credential exposure.
- **Usability:** Nodes show clear outputs and configuration labels.
- **Responsive Design:** Keep existing node layout/responsiveness.
- **Theme Support:** Use existing Kraken dark theme.

### Technical Constraints
- Keep schema version unchanged.
- Use existing `@kraken-dad/kraken-client` + Fastify route patterns.
- Avoid new dependencies unless absolutely required.

---

## 6. Data & Database Changes

### Database Schema Changes
None.

### Data Model Updates
- Extend execution context types to include OHLC, spread, and asset-pair metadata snapshots (runtime-only).

### Data Migration Plan
Not applicable.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
- Kraken public API helpers live in `packages/kraken-client`.
- Execution-time data gathering stays in `apps/backend/src/routes/execute.ts`.

### Server Actions
- No new mutation endpoints required unless UI needs previews.

### Database Queries
None.

---

## 8. Frontend Changes

### New Components
- Node components for OHLC, Moving Average, Recent Spreads, AssetPairs Metadata, Cooldown/Time Window.

### Page Updates
- `apps/frontend/src/nodes/*`, `apps/frontend/src/nodes/nodeTypes.ts`, `apps/frontend/src/nodes/nodeRegistry.ts`, optional `apps/frontend/src/canvas/FlowCanvas.tsx`.

### State Management
- Keep node config in `node.data`; update via `useReactFlow().setNodes` as in existing nodes.

---

## 9. Implementation Plan

1) Define block types/ports and handlers in `strategy-core`.
2) Extend execution context types and backend data collection for OHLC/Spread/AssetPairs.
3) Add frontend node components + registry entries + nodeTypes registration.
4) Add implied edges where helpful.
5) Add/update tests for new blocks.

---

## 10. Task Completion Tracking

Update success-criteria checkboxes as items are completed.

---

## 11. File Structure & Organization

- Update: `packages/strategy-core/schema.ts`, `packages/strategy-core/executor/dryRunExecutor.ts`
- Update: `packages/kraken-client/index.ts`
- Update: `apps/backend/src/routes/execute.ts`
- Add: `apps/frontend/src/nodes/*Node.tsx`
- Update: `apps/frontend/src/nodes/nodeTypes.ts`, `apps/frontend/src/nodes/nodeRegistry.ts`, `apps/frontend/src/canvas/FlowCanvas.tsx`
- Update: `tests/strategy-core/strategy-core.test.ts`

---

## 12. AI Agent Instructions

### Implementation Workflow
- Use Context7 for any library/API usage.
- Keep changes additive; no schema version bump.
- Follow existing node/handle naming conventions (`control:*`, `data:*`).

### Communication Preferences
- Concise updates with file references.

### Code Quality Standards
- Small, focused helpers.
- Deterministic tests (no network).

---

## 13. Second-Order Impact Analysis

- Additional Kraken calls may increase latency; ensure timeouts + fallbacks.
- New context fields must not break existing executor usage.
- Risk guard behavior may change if it starts using spread history; confirm desired default.
