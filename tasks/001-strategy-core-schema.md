# Task: Design Strategy-Core Schema

## 1. Task Overview

**Title:** Design and Lock Strategy-Core Schema

**Goal:** Define the foundational TypeScript schema for representing trading strategies as directed graphs. This schema is the single source of truth shared between frontend and backend, and must be treated as stable once locked.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** React, Fastify, react-flow (TBD versions)
- **Language:** TypeScript (frontend & backend)
- **Database & ORM:** None initially
- **UI & Styling:** Tailwind CSS (dark theme, Kraken Pro-inspired)
- **Authentication:** None
- **Key Architectural Patterns:** Monorepo, JSON-serializable strategy graphs

### Current State
- Greenfield project for Kraken Forge hackathon
- No existing code prior to this task
- `packages/strategy-core/schema.ts` created with initial design

---

## 3. Context & Problem Definition

### Problem Statement
The Strategy Builder requires a stable contract for representing strategies. Without a locked schema, frontend and backend cannot develop independently, and serialization/execution becomes fragile.

### Success Criteria
- [x] Schema is written in TypeScript
- [x] Represents strategies as directed graphs (nodes + edges)
- [x] Supports block categories: data, logic, action
- [x] Enables deterministic execution order (topological via edge types)
- [x] Fully serializable to JSON
- [x] Minimal but intentionally extensible
- [ ] User confirmation received to lock schema

---

## 4. Development Mode Context

- **🚨 Project Stage:** New development (hackathon greenfield)
- **Breaking Changes:** Acceptable during design phase, avoid after lock
- **Data Handling:** No persistent data yet
- **User Base:** Hackathon judges + demo
- **Priority:** Correctness and extensibility over speed

---

## 5. Technical Requirements

### Functional Requirements
- Schema defines `Strategy` (top-level), `StrategyNode`, `StrategyEdge`
- Each node has typed input/output ports
- Edges have `type` (data | control) for execution ordering
- Schema version number for future migrations

### Non-Functional Requirements
- **Performance:** N/A (types only)
- **Security:** N/A (types only)
- **Usability:** Clear, documented interfaces

### Technical Constraints
- Must be pure TypeScript (no runtime dependencies)
- Must be JSON-serializable (no functions, symbols, etc.)

---

## 6. Data & Database Changes

### Database Schema Changes
N/A - No database in this project phase.

### Data Model Updates
Created in `packages/strategy-core/schema.ts`:
- `BlockCategory`, `PortDataType`, `Port`
- `BlockDefinition`, `NodeConfig`, `StrategyNode`
- `EdgeType`, `StrategyEdge`
- `StrategyMetadata`, `Strategy`
- `ExecutionMode`, `ExecutionContext`
- `ValidationResult`, `ValidationError`, `ValidationWarning`

---

## 7. API & Backend Changes

N/A - This task defines types only, no runtime code.

---

## 8. Frontend Changes

N/A - This task defines types only, no UI components.

---

## 9. Implementation Plan

### Phase 1: Schema Design [COMPLETE]
- [x] Read context files (`context.md`, `takai-site.md`)
- [x] Design directed graph model
- [x] Define block categories and port types
- [x] Create `packages/strategy-core/schema.ts`

### Phase 2: Lock Schema [PENDING]
- [ ] Receive user confirmation
- [ ] Mark schema as locked in documentation

---

## 10. Task Completion Tracking

| Phase | Status |
|-------|--------|
| Schema Design | ✅ Complete |
| User Confirmation | ⏳ Waiting |

---

## 11. File Structure & Organization

### New Files Created
- `packages/strategy-core/schema.ts` - Core strategy schema types

### Files Not Modified
- `ai-task-templates-main/ai_task_template_skeleton.md` - Template (never modify)

---

## 12. AI Agent Instructions

### Implementation Workflow
1. Read all context files before starting
2. Use Context7 for any library/framework decisions
3. Update this task file as work progresses

### Code Quality Standards
- Use `readonly` for all interface properties (immutability)
- Document all types with JSDoc comments
- Use discriminated unions where appropriate

---

## 13. Second-Order Impact Analysis

### Impact Assessment
- **Future blocks:** `BlockDefinition` and `NodeConfig` are generic, new block types won't require schema changes
- **Execution engine:** Will consume `Strategy` type directly
- **Frontend:** react-flow integration will map to these types
