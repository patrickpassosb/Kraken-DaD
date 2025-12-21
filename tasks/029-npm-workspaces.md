# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** Implement npm workspaces for monorepo

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Configure npm workspaces at the repo root to reduce dependency duplication, add shared typecheck script, and re-export Kraken API surface to avoid duplicate implementations.

---

## 2. Project Analysis & Current State

### Technology & Architecture
<!-- This is where you document your current tech stack so the AI understands your environment -->
- **Frameworks & Versions:** Fastify backend, Vite + React frontend
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React + React Flow
- **Authentication:** None
- **Key Architectural Patterns:** Monorepo with shared packages

### Current State
<!-- Describe what exists today - what's working, what's broken, what's missing -->
Root package.json exists but apps/packages install separately; introduce npm workspaces to consolidate installs.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
Multiple package-lock.json/node_modules create drift risk and extra install time; workspaces unify installs and simplify script execution.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [x] Root package.json defines npm workspaces for apps/* and packages/*
- [x] Root scripts or usage notes documented for running workspace commands
- [x] Add shared TypeScript typecheck script at repo root
- [x] Remove unused strategy-core/kraken legacy adapters
- [x] Remove per-package package-lock.json files and keep only the root lockfile
- [x] Update docs to describe workspace-first npm scripts and adapter replacement

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** Prototype
- **Breaking Changes:** Acceptable if they improve maintainability
- **Data Handling:** No persistent data
- **User Base:** Internal demo
- **Priority:** Maintainability over speed

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->

- System uses npm workspaces to manage dependencies across apps and packages

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** No runtime impact; install time improves
- **Security:** No change
- **Usability:** Clear developer workflow
- **Responsive Design:** N/A
- **Theme Support:** N/A

### Technical Constraints
<!-- This is where you list limitations the AI agent must work within -->
- Must keep existing package.json scripts working

---

## 6. Data & Database Changes

### Database Schema Changes
<!-- This is where you specify any database modifications needed -->

TODO: Add your SQL schema changes here (new tables, columns, indexes, etc.)

### Data Model Updates
<!-- This is where you define TypeScript types, schema updates, or data structure changes -->

TODO: Define your TypeScript types, interfaces, and data structure changes

### Data Migration Plan
<!-- This is where you plan how to handle existing data during changes -->

TODO: Plan your data migration steps (backup, apply changes, transform data, validate)

---

## 7. API & Backend Changes

### Data Access Pattern Rules
<!-- This is where you tell the AI agent how to structure backend code in your project -->

TODO: Define where different types of code should go in your project (mutations, queries, API routes)

### Server Actions
<!-- List the backend mutation operations you need -->

TODO: List your create, update, delete operations and what they do

### Database Queries
<!-- Specify how you'll fetch data -->

TODO: Define your data fetching approach (direct queries vs separate functions)

---

## 8. Frontend Changes

### New Components
<!-- This is where you specify UI components to be created -->

TODO: List the new components you need to create and their purpose

### Page Updates
<!-- This is where you list pages that need modifications -->

TODO: List the pages that need changes and what modifications are required

### State Management
<!-- This is where you plan how data flows through your frontend -->

TODO: Define your state management approach and data flow strategy

---

## 9. Implementation Plan

1) Update root package.json to add workspaces and scripts
2) Add shared typecheck script
3) Remove unused strategy-core/kraken legacy adapters
4) Regenerate root package-lock.json (if needed)
5) Document usage for workspace installs and scripts

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Track progress in this task file.

---

## 11. File Structure & Organization

Modify: package.json, package-lock.json (if regenerated), docs/README if needed.

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
Use Context7 for npm workspaces references; keep edits minimal.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise, step-by-step notes.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
Follow existing formatting.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Minimize breaking changes to existing scripts.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
