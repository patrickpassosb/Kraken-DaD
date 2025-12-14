# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Implement critical fixes from code review (condition logic, risk guard export, market data resilience, API config)

### Goal Statement
**Goal:** Apply the high-impact review items so the canvas condition node performs numeric comparisons, risk guard nodes export correctly, backend market data handles failures transparently, and API clients support configurable hosts.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Node.js/TypeScript; Fastify backend; Vite + React (React Flow) frontend
- **Language:** TypeScript
- **Database & ORM:** None (dry-run demo)
- **UI & Styling:** React + React Flow + CSS
- **Authentication:** None (demo)
- **Key Architectural Patterns:** Monorepo with shared `strategy-core` executor; Fastify routes; React Flow nodes

### Current State
Condition node UI captures comparator/threshold but executor expects boolean input, bypassing logic. `risk.guard` nodes are remapped to `action.logIntent` on export. Market data builder suppresses failures and drops pairs. Frontend API clients hardcode localhost. Latest change added `import.meta.env` usage without Vite types, breaking the frontend TypeScript build.

## 3. Context & Problem Definition

### Problem Statement
Strategy execution should reflect user-defined numeric conditions and risk checks while surfacing market data issues and allowing deployments beyond localhost. Current mismatches lead to skipped guards, misleading condition routing, and brittle API access.

### Success Criteria
- [ ] Condition node evaluates numeric comparisons using comparator + threshold config and rejects missing/invalid values.
- [ ] Condition control handle IDs remain aligned between UI and executor (no `UNKNOWN_PORT` errors for the trigger input).
- [ ] `risk.guard` nodes export with native type/config instead of remapping, retaining defaults for pair/spread.
- [ ] Backend market data builder records per-pair failures with deterministic fallback data instead of silent drops.
- [ ] Frontend API base URL is configurable (env with localhost default) and applied across API clients/docs.
- [x] Frontend TypeScript build passes with Vite environment typings available for `import.meta.env`.

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Early demo/prototype
- **Breaking Changes:** Allowed when fixing correctness gaps
- **Data Handling:** Dry-run only; no persistence
- **User Base:** Internal demo users
- **Priority:** Correctness/resilience over speed

---

## 5. Technical Requirements

### Functional Requirements
- Execute numeric condition comparisons against ticker price (or provided number) using comparator/threshold config.
- Preserve risk guard semantics in exported strategy JSON with proper config defaults.
- Capture market data fetch failures, include deterministic mock data, and expose warnings to clients.
- Support configurable API host for frontend requests.

### Non-Functional Requirements
- **Performance:** Keep market data fetch parallelism; avoid excessive retries.
- **Security:** No live trading; no secret handling.
- **Usability:** Clear warnings/errors for missing condition inputs or market data gaps.
- **Responsive Design:** Not applicable (logic only).
- **Theme Support:** Not required.

### Technical Constraints
- Maintain dry-run behavior; no private Kraken calls.

---

## 6. Data & Database Changes

### Database Schema Changes
None.

### Data Model Updates
- Update `logic.if` block definition/config expectations for comparator/threshold numeric evaluation.
- Ensure `risk.guard` config carries `pair` and `maxSpread`.
- Include market data fallback metadata (pair, last, spread) when fetch fails.

### Data Migration Plan
Not applicable.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
Backend route `apps/backend/src/routes/execute.ts` builds market data and executes strategy via shared executor.

### Server Actions
- Enhance market data builder to emit warnings and fallback snapshots.

### Database Queries
None.

---

## 8. Frontend Changes

### New Components
None.

### Page Updates
- Update condition node wiring and demo edges if handle IDs change.
- Apply configurable API base in `executeDryRun` and `marketContext` clients; adjust README.

### State Management
Reuse existing React state/hooks; ensure condition node data persists comparator/threshold.

---

## 9. Implementation Plan
1. Update `logic.if` block definition/handler for numeric comparisons; align handles/default edges and surface validation errors when inputs missing/invalid.
2. Remove `risk.guard` remapping in `toStrategyJSON`; keep defaults for pair/maxSpread.
3. Improve `buildMarketData` to gather per-pair warnings, provide deterministic fallback snapshots, and return alongside data.
4. Make frontend API base configurable via Vite env with localhost default and update documentation.
5. Validate by running type checks or lightweight build steps if available.

---

## 10. Task Completion Tracking
### Real-Time Progress Tracking
Manual tracking via checklist updates in this file.

---

## 11. File Structure & Organization
- Update frontend nodes/utilities under `apps/frontend/src`.
- Update backend route `apps/backend/src/routes/execute.ts`.
- Update executor in `packages/strategy-core/executor/dryRunExecutor.ts`.
- Update docs if API URL changes.

---

## 12. AI Agent Instructions
### Implementation Workflow
Follow plan above; keep changes minimal and well-commented where needed.

### Communication Preferences
Concise, bullet-oriented updates.

### Code Quality Standards
Type-safe TypeScript, explicit defaults, no silent fallbacks without warnings.

---

## 13. Second-Order Impact Analysis
### Impact Assessment
- Condition logic changes may invalidate existing strategies relying on boolean input; ensure error messaging clarifies expected numeric input.
- Market data warnings should not break response shape; ensure executor tolerates added metadata.
- Configurable API base must still default to localhost for dev convenience.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details!

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*
*Get the complete toolkit at: https://shipkit.ai*
