# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** Live order execution review (Kraken) and workflow verification

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Verify whether the current workflow and live-mode path actually place the intended orders, identify safety gaps, and summarize risks so the user can trust (or disable) live execution.

---

## 2. Project Analysis & Current State

### Technology & Architecture
<!-- This is where you document your current tech stack so the AI understands your environment -->
- **Frameworks & Versions:** React 18 + @xyflow/react 12, Fastify backend
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React + custom CSS
- **Authentication:** None
- **Key Architectural Patterns:** Monorepo with shared `strategy-core`, Fastify routes, React Flow canvas

### Current State
<!-- Describe what exists today - what's working, what's broken, what's missing -->
Live mode appears supported with credential storage and a live toggle, but the user needs confirmation that live orders reflect the workflow inputs (amount + limit reference).

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
User previously spent money unintentionally and needs a deep review to confirm whether enabling live mode will place real Kraken orders matching the workflow configuration.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [x] Identify the exact backend path that executes live orders and its gating conditions
- [x] Verify how Amount and Limit Reference map into the live order request
- [x] List risks and safety gaps with file-level references
- [x] Provide a clear yes/no statement on whether the shown workflow would place a live order at the specified price when live mode is enabled

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** Demo with optional live execution
- **Breaking Changes:** Avoid breaking dry-run paths
- **Data Handling:** No DB; credentials stored server-side
- **User Base:** Internal/test users; real funds risk
- **Priority:** Correctness and safety over speed

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->

- User can execute workflows in dry-run or live mode.
- System should place a real Kraken order only when live mode is enabled and credentials are present.
- Amount and limit reference should map deterministically to order size and limit price.

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** Order placement should be prompt; no retries without user intent
- **Security:** Secrets never sent to frontend; live mode gated
- **Usability:** Clear indicators when live is on; order intent preview matches actual payload
- **Responsive Design:** Desktop-first acceptable
- **Theme Support:** Keep existing theme

### Technical Constraints
<!-- This is where you list limitations the AI agent must work within -->
- Must preserve dry-run behavior and safety defaults

---

## 6. Data & Database Changes

### Database Schema Changes
<!-- This is where you specify any database modifications needed -->

None

### Data Model Updates
<!-- This is where you define TypeScript types, schema updates, or data structure changes -->

None (review only)

### Data Migration Plan
<!-- This is where you plan how to handle existing data during changes -->

Not applicable

---

## 7. API & Backend Changes

### Data Access Pattern Rules
<!-- This is where you tell the AI agent how to structure backend code in your project -->

Backend routes in `apps/backend/src/routes`; core logic in `packages/strategy-core`.

### Server Actions
<!-- List the backend mutation operations you need -->

Review only

### Database Queries
<!-- Specify how you'll fetch data -->

Review only

---

## 8. Frontend Changes

### New Components
<!-- This is where you specify UI components to be created -->

None

### Page Updates
<!-- This is where you list pages that need modifications -->

None (review)

### State Management
<!-- This is where you plan how data flows through your frontend -->

Review only

---

## 9. Implementation Plan

1) Trace live execution path from frontend to backend and Kraken adapter.
2) Validate amount/price mapping and gating logic.
3) Summarize risks and answer the user’s scenario.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Report findings with file references and clear yes/no answers.

---

## 11. File Structure & Organization

No file changes planned.

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
- Provide a review-first response with file/line references.
- Do not assume live trading safety; confirm from code.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise, safety-focused answers.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
No code changes planned.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Focus on live trading safety, credential handling, and order payload correctness.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
