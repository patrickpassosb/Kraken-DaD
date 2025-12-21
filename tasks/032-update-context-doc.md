# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** Update context.md to match current project

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Align `context/context.md` with the current repo (deps, architecture, scope) so it is accurate and trustworthy for AI/user reference.

---

## 2. Project Analysis & Current State

### Technology & Architecture
<!-- This is where you document your current tech stack so the AI understands your environment -->
- **Frameworks & Versions:** React + Vite frontend, Fastify backend, @xyflow/react (React Flow)
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React Flow nodes, Kraken Pro-inspired styling
- **Authentication:** None (server-side Kraken API credentials only)
- **Key Architectural Patterns:** Monorepo with apps + shared packages

### Current State
<!-- Describe what exists today - what's working, what's broken, what's missing -->
`context/context.md` contains outdated claims (e.g., Zustand, Tailwind, Zod, Pino). Needs correction to match repo/package.json and README.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
Update `context/context.md` to accurately reflect current dependencies, architecture, and scope.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [ ] Remove outdated dependency mentions and add current ones
- [ ] Keep statements aligned with README and package.json
- [ ] No changes outside `context/context.md`

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** Demo/prototype
- **Breaking Changes:** Avoid
- **Data Handling:** No persistence
- **User Base:** Internal demo users
- **Priority:** Accuracy of documentation

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->

Update a single document with accurate project context.

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** Not applicable
- **Security:** Do not claim security tooling that is not present
- **Usability:** Keep phrasing concise and accurate
- **Responsive Design:** Not applicable
- **Theme Support:** Not applicable

### Technical Constraints
<!-- This is where you list limitations the AI agent must work within -->
- Only update `context/context.md`

---

## 6. Data & Database Changes

### Database Schema Changes
<!-- This is where you specify any database modifications needed -->

None.

### Data Model Updates
<!-- This is where you define TypeScript types, schema updates, or data structure changes -->

None.

### Data Migration Plan
<!-- This is where you plan how to handle existing data during changes -->

Not applicable.

---

## 7. API & Backend Changes

### Data Access Pattern Rules
<!-- This is where you tell the AI agent how to structure backend code in your project -->

Not applicable.

### Server Actions
<!-- List the backend mutation operations you need -->

None.

### Database Queries
<!-- Specify how you'll fetch data -->

None.

---

## 8. Frontend Changes

### New Components
<!-- This is where you specify UI components to be created -->

None.

### Page Updates
<!-- This is where you list pages that need modifications -->

None.

### State Management
<!-- This is where you plan how data flows through your frontend -->

None.

---

## 9. Implementation Plan

1. Review `context/context.md` against `package.json` and `README.md`.
2. Update dependency and architecture descriptions.
3. Verify no extra claims remain.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Progress:
- [x] Compare current context with repo state
- [x] Update context document

---

## 11. File Structure & Organization

Update: `context/context.md`

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
1) Update `context/context.md` only.
2) Keep changes minimal and accurate.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise summary of changes.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
Plain language, no new assumptions.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Ensure documentation aligns with actual dependencies and features.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
