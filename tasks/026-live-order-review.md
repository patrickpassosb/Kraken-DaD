# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** Align limit reference with live order payload (Kraken)

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Ensure limit references deterministically produce Kraken limit orders at the specified price, keep market orders price-free, and align preview, dry-run intent, and live payloads without changing live gating.

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
Limit reference is stored as a price, but order type defaults to market; dry-run intents and live/validate payloads can carry a price with market orders, and preview type does not reflect limit reference intent.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
Limit reference should force limit orders with a required price, while market orders must not include a price. Preview and live payloads should match the same intent resolution.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [ ] Limit reference always resolves to `ordertype=limit` with a price in dry-run intents and live/validate requests
- [ ] Market orders never include a price in live or validation payloads
- [ ] Preview type/price inference matches the live payload resolution
- [ ] Live/validate paths block limit orders that lack a price
- [ ] Dry-run behavior remains non-live and safe
- [ ] Live run returns `liveActions` ok and Kraken order appears (user-verified)

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
- Limit reference deterministically forces a limit order and price.
- Market orders never send a price.
- Preview reflects the same type/price resolution used for live payloads.

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

1) Update success criteria for the limit-reference fix.
2) Resolve order type/price in dry-run so limit reference wins.
3) Ensure validate/live payloads only include price for limit orders and block missing limit prices.
4) Align preview type inference with limit reference when type is unset.
5) (Optional) Auto-set node type to limit when limit reference is set.

---

## 10. Testing and validation

- Dry-run with limit reference and Kraken validate=true; confirm validation ok.
- Live mode with a minimal-sized limit order; confirm `liveActions` ok in the `/execute` response and Kraken order history shows the txid.
- Live mode market order; confirm payload omits price and Kraken accepts.
- Limit order without price; confirm validation/live blocks with an error.

---

## 11. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Track progress against the success criteria with file references.

---

## 12. File Structure & Organization

Update:
- packages/strategy-core/executor/dryRunExecutor.ts
- apps/backend/src/routes/execute.ts
- apps/frontend/src/App.tsx
- apps/frontend/src/nodes/PlaceOrderNode.tsx (optional)
- tasks/026-live-order-review.md

---

## 13. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
- Align intent resolution across dry-run, preview, and live.
- Use Context7 for Kraken API requirements before coding.
- Keep dry-run safety intact; avoid accidental live orders.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise, fix-focused answers.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
Prefer small, deterministic logic updates with clear guards.

---

## 14. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Focus on order intent resolution, preview/live alignment, and missing price safeguards.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
