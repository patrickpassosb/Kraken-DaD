# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** Repository redundancy and structure review

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Identify unnecessary or redundant files, suggest removals or consolidations, and provide project structure/code quality improvements with concrete, prioritized actions.

---

## 2. Project Analysis & Current State

### Technology & Architecture
<!-- This is where you document your current tech stack so the AI understands your environment -->
- **Frameworks & Versions:** Node.js TypeScript monorepo; Fastify backend; Vite + React Flow frontend
- **Language:** TypeScript
- **Database & ORM:** None (dry-run demo, Kraken API stubs)
- **UI & Styling:** React + React Flow, likely CSS modules/vanilla
- **Authentication:** None (demo, dry-run only)
- **Key Architectural Patterns:** Monorepo with shared `strategy-core`; Fastify routes; React flow canvas

### Current State
<!-- Describe what exists today - what's working, what's broken, what's missing -->
Demo implements a flow-based strategy builder and dry-run executor. Needs review for consistency, resiliency, and maintainability across backend, frontend, and shared core.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
We need actionable guidance on risks and improvements before evolving the demo further. The review should highlight high-impact fixes and design improvements.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [x] Deliver a written review identifying redundant/unnecessary files with justification
- [x] Provide prioritized, actionable structure and code quality recommendations with file-level pointers
- [x] Validate suggestions against current code to ensure accuracy

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** Early demo/prototype
- **Breaking Changes:** Acceptable if they improve correctness/stability
- **Data Handling:** No persistent data; keep dry-run only
- **User Base:** Internal demo users
- **Priority:** Prioritize correctness and clarity over speed

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->

Review focus areas: overall repo layout, duplicated configs/scripts, unused docs/tasks/tests, and cross-package redundancy. Identify maintainability and structure concerns.

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** Snappy canvas interactions; backend dry-run should respond quickly for small strategies
- **Security:** No secrets; enforce dry-run, avoid enabling private trading
- **Usability:** Clear node labels, validation, and error surfacing
- **Responsive Design:** Desktop-focused; note gaps if found
- **Theme Support:** Not required

### Technical Constraints
<!-- This is where you list limitations the AI agent must work within -->
- Maintain dry-run behavior and public Kraken-only usage

---

## 6. Data & Database Changes

### Database Schema Changes
<!-- This is where you specify any database modifications needed -->

None (no database)

### Data Model Updates
<!-- This is where you define TypeScript types, schema updates, or data structure changes -->

Not in scope (review only)

### Data Migration Plan
<!-- This is where you plan how to handle existing data during changes -->

Not applicable

---

## 7. API & Backend Changes

### Data Access Pattern Rules
<!-- This is where you tell the AI agent how to structure backend code in your project -->

Backend mutations/routes live in `apps/backend/src/routes`; shared types/executor in `packages/strategy-core`.

### Server Actions
<!-- List the backend mutation operations you need -->

N/A (review task)

### Database Queries
<!-- Specify how you'll fetch data -->

Fastify routes call executor and Kraken adapter; no DB queries.

---

## 8. Frontend Changes

### New Components
<!-- This is where you specify UI components to be created -->

No new components; review existing React nodes and panels.

### Page Updates
<!-- This is where you list pages that need modifications -->

Focus on canvas interactions (`App.tsx`, nodes in `apps/frontend/src/nodes/`).

### State Management
<!-- This is where you plan how data flows through your frontend -->

React Flow state in frontend; shared types drive backend executor.

---

## 9. Implementation Plan

1) Inventory repo structure and key files; 2) Identify redundancy/unnecessary files; 3) Summarize recommendations with file pointers.

## 10b. Notes & Findings

- Review complete. Key findings: unused Kraken adapter under strategy-core, unreferenced shared tsconfig, redundant shell scripts, and Dockerfile missing strategy-core copy for backend runtime.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Track progress in commit/PR summary.

---

## 11. File Structure & Organization

No new code files planned; only documentation/reporting outputs.

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
1) Use this task for repo-wide redundancy review requests.
2) Scan repo for unused/duplicate files and configs; validate with `rg`.
3) Report findings with file pointers and suggested removals/merges.
4) Call out assumptions and ask for confirmation before deletions.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise review findings first, then recommendations and optional next steps.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
Prefer minimal changes; avoid sweeping refactors unless necessary.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Focus on monorepo structure, shared packages, and build/run scripts to avoid breaking dev workflow.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
