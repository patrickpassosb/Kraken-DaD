# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
**Title:** Default Kraken validation on, hide toggle, clean UI

### Goal Statement
**Goal:** Keep Kraken validation always on for dry-runs, remove the UI toggle/label to declutter, and preserve the non-executing safety behavior.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Node.js TypeScript monorepo; Fastify backend; Vite + React Flow frontend
- **Language:** TypeScript
- **Database & ORM:** None (dry-run demo)
- **UI & Styling:** React + React Flow; custom styles
- **Authentication:** None
- **Key Architectural Patterns:** Monorepo with shared `strategy-core`; Fastify routes; React Flow canvas

### Current State
Dry-run UI has a “Validate orders on Kraken (no execution)” toggle. Request: make it default ON and improve label/tooltip clarity without altering other UI.

## 3. Context & Problem Definition

### Problem Statement
Users want validation safety on by default and clearer wording. Current copy is verbose; default state unclear.

### Success Criteria
- [ ] Validation runs by default (no user toggle shown)
- [ ] No UI element for validation toggle/label remains
- [ ] Dry-run remains non-executing and stable

---

## 4. Development Mode Context

### Development Mode Context
- **🚨 Project Stage:** Early demo/prototype
- **Breaking Changes:** Avoid UX regressions; behavior change limited to default toggle ON
- **Data Handling:** No persistence
- **User Base:** Internal demo users
- **Priority:** Clarity and safety over novelty

---

## 5. Technical Requirements

### Functional Requirements
- Validation is always enabled for dry-run requests (`validate: true`)
- Remove validation toggle UI/label entirely
- Keep dry-run non-executing behavior unchanged

### Non-Functional Requirements
- **Performance:** Same validation call latency
- **Security:** No secrets; no live trading
- **Usability:** Cleaner header; no toggle
- **Responsive Design:** Maintain existing behavior
- **Theme Support:** Unchanged

### Technical Constraints
- Maintain dry-run only; do not enable execution
- Keep request shape compatible with backend (validate flag true)

---

## 6. Data & Database Changes

### Database Schema Changes
None

### Data Model Updates
None expected; only UI state defaults and strings

### Data Migration Plan
Not applicable

---

## 7. API & Backend Changes

### Data Access Pattern Rules
Backend unchanged for this task; toggle continues to send `validate`

### Server Actions
None

### Database Queries
N/A

---

## 8. Frontend Changes

### New Components
None

### Page Updates
Remove the validation toggle UI in the main canvas header (`apps/frontend/src/App.tsx` or related component)

### State Management
Hardcode validation flag true; no toggle state

---

## 9. Implementation Plan
1) Remove toggle state/label and hardcode validation true in `apps/frontend/src/App.tsx`.
2) Verify request payload sends `validate: true` by default.
3) Quick UI sanity check (header decluttered).

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
Update this checklist when steps complete; note files touched in PR

---

## 11. File Structure & Organization
- Modify: `apps/frontend/src/App.tsx`
- No new files

---

## 12. AI Agent Instructions

### Implementation Workflow
🎯 **MANDATORY PROCESS:**
- Use GitHub MCP for code context if needed; keep edits minimal and scoped

### Communication Preferences
Concise status updates; cite files/lines

### Code Quality Standards
Type-safe TS/JSX; keep behavior unchanged except always-on validation

---

## 13. Second-Order Impact Analysis

### Impact Assessment
Risks: forgetting to send validate flag; removing UI could hide validation/network errors—ensure errors still surface elsewhere if needed.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
