# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** MovingAverageNode code review

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Deliver a focused code review of `apps/frontend/src/nodes/MovingAverageNode.tsx` with prioritized, actionable improvements across correctness, readability, performance, maintainability, and security.

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
Moving average node UI exists under `apps/frontend/src/nodes/MovingAverageNode.tsx`.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
Provide a high-quality review of `MovingAverageNode.tsx` with prioritized findings and concrete fixes.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [x] Identify potential bugs/edge cases with file references
- [x] Recommend improvements for code quality, readability, and maintainability
- [x] Note performance or security concerns (if any) with specific fixes

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** Demo/prototype
- **Breaking Changes:** Avoid unless required for correctness
- **Data Handling:** No persistence
- **User Base:** Internal demo users
- **Priority:** Correctness and clarity

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->
Review `apps/frontend/src/nodes/MovingAverageNode.tsx` only; no code changes required unless requested.

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** Keep node rendering efficient
- **Security:** No secrets or sensitive data handling
- **Usability:** Clear configuration UI for node settings
- **Responsive Design:** Not required for this review
- **Theme Support:** Not required

### Technical Constraints
<!-- This is where you list limitations the AI agent must work within -->
- Must align with existing frontend patterns

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

Not applicable (frontend review only).

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

1. Inspect `MovingAverageNode.tsx` for issues and improvements.
2. Provide prioritized findings with file references.
3. Offer concrete implementation suggestions.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Progress:
- [x] Inspect `apps/frontend/src/nodes/MovingAverageNode.tsx` for issues and improvements
- [x] Cross-check relevant React Flow API usage via Context7
- [x] Deliver prioritized findings with concrete fixes

---

## 11. File Structure & Organization

No new code files planned; reporting only.

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
1) Review `apps/frontend/src/nodes/MovingAverageNode.tsx`.
2) Report findings with file pointers and suggested fixes.
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

Note if changes would affect other nodes, shared types, or graph behavior.

---
