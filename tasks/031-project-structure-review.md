# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** Project structure and redundancy review

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Identify unnecessary files, redundancy, and structural issues across the repo, then recommend removals or consolidations that improve maintainability and clarity without breaking current behavior.

---

## 2. Project Analysis & Current State

### Technology & Architecture
<!-- This is where you document your current tech stack so the AI understands your environment -->
- **Frameworks & Versions:** React Flow (frontend), Vite + React
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React Flow nodes
- **Authentication:** None
- **Key Architectural Patterns:** React Flow canvas with custom node components

### Current State
<!-- Describe what exists today - what's working, what's broken, what's missing -->
Repo contains frontend app, packages, scripts, tests, and task docs. Need a holistic review for redundant or unused artifacts and structural inconsistencies.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
Provide a concise audit of redundant files, overlapping docs/tasks, unused code, and structural inconsistencies with actionable cleanup guidance.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [ ] Identify candidate files/folders for removal or consolidation with file references
- [ ] Highlight structural improvements (naming, grouping, duplication) with rationale
- [ ] Note risks/assumptions and validate against repo usage where feasible

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** Demo/prototype
- **Breaking Changes:** Avoid unless necessary for correctness
- **Data Handling:** No persistence
- **User Base:** Internal demo users
- **Priority:** Correctness and clarity

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->

Review repo structure and identify redundant or unnecessary files; report findings only (no code changes unless requested).

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** Avoid suggestions that add build or runtime overhead
- **Security:** Do not suggest removing security-relevant checks without proof
- **Usability:** Recommendations should improve clarity for maintainers
- **Responsive Design:** Not applicable
- **Theme Support:** Not applicable

### Technical Constraints
<!-- This is where you list limitations the AI agent must work within -->
- Must align with current repo structure and tooling

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

None (review only).

### Page Updates
<!-- This is where you list pages that need modifications -->

None (review only).

### State Management
<!-- This is where you plan how data flows through your frontend -->

None (review only).

---

## 9. Implementation Plan

1. Scan repo for unused/duplicate files and documentation overlap.
2. Cross-check imports, references, and scripts where possible.
3. Report prioritized findings with file references and remediation options.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Progress:
- [x] Scanned repo structure and key docs/configs
- [x] Cross-checked references for redundancy signals
- [x] Deliver prioritized findings and cleanup recommendations

---

## 11. File Structure & Organization

No new files planned; reporting only.

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
1) Review repo structure and identify redundancy or unused artifacts.
2) Report findings with file pointers and suggested cleanup steps.
3) Ask clarifying questions only if required for accuracy.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise findings first, then recommendations and optional next steps.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
Prefer minimal, high-impact changes.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Note if removals would affect build scripts, runtime behavior, or developer workflows.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
