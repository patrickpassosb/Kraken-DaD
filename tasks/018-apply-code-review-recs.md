# AI Task Planning Template - Starter Framework

## 1. Task Overview

### Task Title
**Title:** Apply code-review recommendations safely

### Goal Statement
**Goal:** Implement prioritized code-review fixes (schema version reuse, execution ordering, Kraken bootstrapping resilience, stream lifecycle cleanup) without disrupting existing structure.

## 2. Project Analysis & Current State
- Node.js/TypeScript monorepo with Fastify backend and React frontend.
- Current issues: hardcoded schema version in exports; executor ignores data-edge ordering; Kraken data bootstrap is sequential and fragile; SSE/WS lifecycle leaks sockets.

## 3. Context & Problem Definition
### Problem Statement
Adopt prior review feedback to improve correctness, reliability, and maintainability across strategy export, execution ordering, Kraken data fetching, and streaming lifecycle.

### Success Criteria
- [x] Strategy exports reuse centralized schema version constant.
- [x] Executor enforces data-edge ordering to prevent missing inputs.
- [x] Kraken market bootstrap runs per-pair fetches concurrently and handles timeouts/fallbacks without hanging the dry-run.
- [x] SSE/WebSocket stream lifecycle cleans up sockets/timers when subscribers disconnect.
- [x] Tests or minimal validation updated/executed to confirm behavior.

## 4. Development Mode Context
- Preserve existing API shapes and frontend structure; avoid disruptive refactors.
- Favor small, well-scoped changes with clear error handling and logging.

## 5. Technical Requirements
- Update frontend strategy export to import `SCHEMA_VERSION` from shared schema.
- Adjust executor ordering to include data dependencies in topological sort.
- Parallelize Kraken market data fetches with per-call timeouts/abort support and faster fallback to cached/mock data.
- Track SSE subscribers and close WebSocket connections plus timers when no listeners remain.

## 6. Data & Database Changes
None.

## 7. API & Backend Changes
Fastify route behaviors should remain the same externally; resilience improvements are internal.

## 8. Frontend Changes
Strategy export JSON should remain backwards compatible aside from correct schema version.

## 9. Implementation Plan
1) Update frontend export to reuse shared schema version.
2) Add data-edge awareness to executor ordering logic.
3) Improve Kraken market bootstrap concurrency and timeout handling.
4) Manage SSE/WebSocket lifecycle with subscriber tracking and cleanup.
5) Run relevant tests/checks.

## 10. Task Completion Tracking
Progress tracked via git history and PR summary.

## 11. File Structure & Organization
No new top-level directories expected.
