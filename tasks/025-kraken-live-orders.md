# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Enable Kraken live orders in the strategy builder

### Goal Statement
**Goal:** Let users securely store Kraken API credentials, enable a live execution mode, and place real orders through Kraken private endpoints while keeping dry-run as the default.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React 18 + @xyflow/react 12, Fastify backend, TypeScript monorepo
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React + React Flow; custom styles
- **Authentication:** None
- **Key Architectural Patterns:** Monorepo with shared `strategy-core`; Fastify routes; React Flow canvas

### Current State
Kraken integration is public-market-data only. The executor runs dry-run validation and does not place live orders. There is no API key storage or live-mode toggle in the UI.

## 3. Context & Problem Definition

### Problem Statement
Users cannot enable real order execution because there is no credential storage or authenticated Kraken API integration. The strategy builder lacks a safe, explicit path to opt into live execution.

### Success Criteria
- [x] Kraken private API integration supports authenticated order placement (and cancel if needed for workflow)
- [x] API keys are stored server-side only; frontend never retains secrets after submit
- [x] Strategy builder provides a live-mode toggle gated by credential status with clear risk warnings
- [x] Live-mode selection is sent with workflow execution requests and defaults to dry-run when unset
- [x] Execution uses live mode only when explicitly enabled; dry-run remains default
- [x] README documents live-mode setup, safety notes, and rollback/disable steps

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Feature enablement in an existing demo app
- **Breaking Changes:** Avoid breaking current dry-run flows
- **Data Handling:** No existing persistence layer; introduce minimal secure storage
- **User Base:** Internal/test users; potential real funds
- **Priority:** Safety and explicit opt-in over convenience

---

## 5. Technical Requirements

### Functional Requirements
- User can submit Kraken API key + secret via UI form
- System stores credentials server-side and returns a status flag (configured / not configured)
- User can enable live execution mode only when credentials are configured
- Executor uses Kraken private endpoints to place real orders when live mode is enabled
- User can disable live mode and clear stored credentials

### Non-Functional Requirements
- **Performance:** Live execution adds minimal overhead beyond Kraken API latency
- **Security:** Secrets never logged or stored in browser; stored server-side with at-rest protection if possible
- **Usability:** Clear risk messaging for live mode; status indicator for credentials
- **Responsive Design:** Live-mode controls usable on mobile and desktop
- **Theme Support:** Preserve existing styling conventions

### Technical Constraints
- Must use existing `strategy-core` Kraken adapter patterns
- No external DB dependency unless already present
- Keep dry-run path intact and default

---

## 6. Data & Database Changes

### Database Schema Changes
None (no DB)

### Data Model Updates
- Add `ExecutionMode` type or schema updates to include `live`
- Add types for stored credentials metadata (configured flag + source)

### Data Migration Plan
Not applicable (new storage)

---

## 7. API & Backend Changes

### Data Access Pattern Rules
- Centralize Kraken credential storage behind a backend service module
- Use a single Kraken private adapter for signing/authenticated calls

### Server Actions
- `POST /kraken/credentials` to store API key/secret
- `GET /kraken/credentials/status` to check if credentials are configured
- `DELETE /kraken/credentials` to clear stored credentials
- Order execution endpoint uses live mode only when enabled and credentials present

### Database Queries
N/A

---

## 8. Frontend Changes

### New Components
- Credential form (API key + secret) with save/clear actions
- Live-mode toggle with risk warning and credential status display

### Page Updates
- Strategy builder header or settings area to include live-mode controls

### State Management
- Store only a credential status flag in client state
- Live-mode setting stored in workflow/node config and validated before execution

---

## 9. Implementation Plan

1) Use Context7 to fetch Kraken private API docs and any SDK requirements; confirm signing/nonce behavior.
2) Implement Kraken private adapter and backend credential storage/service; add live execution path in executor.
3) Add UI for credential entry and live-mode toggle; update schema and README.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
Update the Success Criteria checklist as items are completed; note files touched.

---

## 11. File Structure & Organization

- New/modify: `packages/strategy-core/kraken/*`
- Modify: `packages/strategy-core/schema.ts`
- Modify: `apps/backend/src/*` (routes, services)
- Modify: `apps/frontend/src/*` (builder UI)
- Modify: `README.md`

---

## 12. AI Agent Instructions

### Implementation Workflow
🎯 **MANDATORY PROCESS:**
- Use Context7 MCP for Kraken API docs and any SDK/library usage
- Keep live trading opt-in and gated by credential status
- Never log or return secrets to the frontend
- Validate success criteria before marking complete

### Communication Preferences
Concise updates with file references; ask before expanding scope

### Code Quality Standards
Type-safe TypeScript; minimal UI changes; clear error handling for live mode

---

## 13. Second-Order Impact Analysis

### Impact Assessment
Risks: accidental live trades, secret leakage, unclear UI state. Mitigate with explicit warnings, hard gating, and safe defaults.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
