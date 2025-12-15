# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Live market data streaming (Kraken WS) with UI updates

### Goal Statement
**Goal:** Provide near-real-time market data in the builder by ingesting Kraken WS ticker snapshots, caching them, and pushing updates to the frontend with fallbacks; ensure stable UX (throttled updates, reconnect handling) for demo/hackathon.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Node.js TypeScript monorepo; Fastify backend; Vite + React Flow frontend
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React + React Flow
- **Authentication:** None (public data only for this feature)
- **Key Architectural Patterns:** Shared `strategy-core`; Fastify routes; frontend fetches REST endpoints for context

### Current State
Market data is fetched per request (REST + single WS snapshot) with fallbacks; no continuous updates. UI shows static snapshot unless user re-runs dry-run/context.

## 3. Context & Problem Definition

### Problem Statement
Need continuous-ish live market updates without manual refresh, while keeping reliability and avoiding UI thrash. Must handle Kraken WS disconnects and fall back gracefully.

### Success Criteria
- [ ] Backend maintains per-pair live cache from Kraken WS ticker (with reconnect/backoff)
- [ ] Frontend receives updates (SSE or WS) and refreshes market context with throttling (e.g., 2–5 Hz max)
- [ ] Fallback to existing REST/mock when WS unavailable; warnings surfaced
- [ ] No regressions to dry-run/validation paths

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Hackathon/demo
- **Breaking Changes:** Avoid; keep existing endpoints working
- **Data Handling:** No persistence; in-memory only
- **User Base:** Demo users
- **Priority:** Stability and clarity over ultra-low latency

---

## 5. Technical Requirements

### Functional Requirements
- Subscribe to Kraken public WS ticker for active pairs
- Cache latest {pair,last,bid,ask,spread,ts}; expose via stream endpoint (SSE or WS) and optional snapshot endpoint reuse
- Frontend consumes stream and updates market context panel
- Fallback to REST + mock when WS down; surface warning

### Non-Functional Requirements
- **Performance:** Throttle UI updates (~2–5 Hz); avoid memory leaks
- **Security:** Public data only; no secrets
- **Usability:** Smooth updates; indicate fallback status
- **Responsive Design:** Maintain existing layout
- **Theme Support:** Unchanged

### Technical Constraints
- No DB; in-memory cache only
- Must coexist with existing REST endpoints and dry-run flow

---

## 6. Data & Database Changes

### Database Schema Changes
None

### Data Model Updates
Add in-memory cache shape and stream payload type (pair, last, bid, ask, spread, ts, source/fallback flag).

### Data Migration Plan
Not applicable

---

## 7. API & Backend Changes

### Data Access Pattern Rules
- WS ingest module under `packages/kraken-client` or `apps/backend/src/lib`.
- Stream endpoint in backend (SSE or WS) under `apps/backend/src/routes`.

### Server Actions
- Start/maintain WS subscriptions for requested pairs with reconnect/backoff
- Serve live cache to clients; include fallback flag when using REST/mock

### Database Queries
None

---

## 8. Frontend Changes

### New Components
- Hook/util to subscribe to stream (SSE/WS) and expose throttled updates

### Page Updates
- Market context panel consumes stream updates

### State Management
- Keep market context state; add throttled live updates and fallback warnings

---

## 9. Implementation Plan
1) Backend: add WS ingest + cache and stream endpoint (SSE/WS); include reconnection/backoff and fallback flag.
2) Frontend: add stream subscription hook; update market context to use stream when available, fallback to REST/mock.
3) Throttle updates; surface warnings when on fallback.
4) Validate via manual run (updates appear over time; fallback works on WS drop).

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
Update checklist when backend stream, frontend subscription, and fallbacks are verified.

---

## 11. File Structure & Organization
- Backend: new module for WS cache; new route for stream
- Frontend: hook for stream; minimal UI touches in App/context components

---

## 12. AI Agent Instructions

### Implementation Workflow
- Use GitHub MCP for code context; keep changes small and isolated per step

### Communication Preferences
- Concise updates with file references

### Code Quality Standards
- Type-safe TS; handle reconnects/backoff; throttle UI updates; clear warnings

---

## 13. Second-Order Impact Analysis

### Impact Assessment
- Risk of overloading UI with updates; mitigate with throttling
- Ensure WS failures fall back to REST/mock without breaking dry-run
- Consider rate limits; avoid excessive subscriptions

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
