# AI Task Planning Template - Starter Framework

> **About This Template:** This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

---

## 1. Task Overview

### Task Title
<!-- Give your task a clear, specific name that describes what you're building or fixing -->
**Title:** MovingAverageNode best-practices updates

### Goal Statement
<!-- Write one paragraph explaining what you want to achieve and why it matters for your project -->
**Goal:** Update `MovingAverageNode.tsx` to follow UI and state management best practices (validation, efficient updates) while keeping behavior consistent for positive integer periods.

---

## 2. Project Analysis & Current State

### Technology & Architecture
<!-- This is where you document your current tech stack so the AI understands your environment -->
- **Frameworks & Versions:** TODO: List your main frameworks and versions
- **Frameworks & Versions:** React Flow (frontend), Vite + React
- **Language:** TypeScript
- **Database & ORM:** None
- **UI & Styling:** React Flow nodes
- **Authentication:** None
- **Key Architectural Patterns:** React Flow canvas with custom node components

### Current State
<!-- Describe what exists today - what's working, what's broken, what's missing -->
Moving average node renders and writes to React Flow node data on each keystroke; input parsing is permissive.

## 3. Context & Problem Definition

### Problem Statement
<!-- This is where you clearly define the specific problem you're solving -->
Align the node UI with best practices by enforcing integer-only period input and reducing unnecessary node data updates.

### Success Criteria
<!-- Define exactly how you'll know when this task is complete and successful -->
- [ ] Period input accepts only positive integers and sanitizes invalid input
- [ ] Node data updates avoid per-keystroke graph updates (save on blur)
- [ ] Method value is normalized to valid options

---

## 4. Development Mode Context

### Development Mode Context
<!-- This is where you tell the AI agent about your project's constraints and priorities -->
- **🚨 Project Stage:** TODO: Define if this is new development, production system, or legacy migration
- **🚨 Project Stage:** Demo/prototype
- **Breaking Changes:** Avoid unless required for correctness
- **Data Handling:** No persistence
- **User Base:** Internal demo users
- **Priority:** Correctness and clarity

---

## 5. Technical Requirements

### Functional Requirements
<!-- This is where the AI will understand exactly what the system should do - be specific about user actions and system behaviors -->

User can select method and enter a positive integer period.
System normalizes invalid method values.
When period input loses focus, the node data updates with a validated integer or clears the value.

### Non-Functional Requirements
<!-- This is where you define performance, security, and usability standards -->
- **Performance:** Avoid per-keystroke full graph updates
- **Security:** No sensitive data
- **Usability:** Clear, predictable integer-only input behavior
- **Responsive Design:** Not applicable
- **Theme Support:** Not applicable

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

Not applicable.

### Server Actions
<!-- List the backend mutation operations you need -->

None.

### Database Queries
<!-- Specify how you'll fetch data -->

Not applicable.

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

Local component state with updates to React Flow node data on blur.

---

## 9. Implementation Plan

1. Review `apps/frontend/src/nodes/MovingAverageNode.tsx` and desired input behavior.
2. Update parsing/validation and adjust update timing to blur.
3. Confirm method normalization and handle empty input.

---

## 10. Task Completion Tracking

### Real-Time Progress Tracking
<!-- This is where you tell the AI agent to update progress as work is completed -->

Progress:
- [x] Update `MovingAverageNode.tsx` to validate period input and write on blur
- [x] Normalize method value on incoming data
- [x] Verify behavior against success criteria

---

## 11. File Structure & Organization

Modify `apps/frontend/src/nodes/MovingAverageNode.tsx` only.

---

## 12. AI Agent Instructions

### Implementation Workflow
<!-- This is where you give specific instructions to your AI agent -->
🎯 **MANDATORY PROCESS:**
1) Update `MovingAverageNode.tsx` per success criteria.
2) Keep changes minimal and aligned with existing patterns.
3) Report changes concisely.

### Communication Preferences
<!-- This is where you set expectations for how the AI should communicate -->
Concise, prioritized notes and clear file references.

### Code Quality Standards
<!-- This is where you define your coding standards for the AI to follow -->
Prefer minimal, high-impact changes.

---

## 13. Second-Order Impact Analysis

### Impact Assessment
<!-- This is where you think through broader consequences of your changes -->

Ensure node input behavior remains intuitive and does not introduce extra re-renders on large graphs.

---

**🎯 Ready to Plan Your Next Project?**

This template gives you the framework - now fill it out with your specific project details! 

*Want the complete version with detailed examples, advanced strategies, and full AI agent workflows? [Watch the full tutorial video here]*

---

*This template is part of ShipKit - AI-powered development workflows and templates*  
*Get the complete toolkit at: https://shipkit.ai* 
