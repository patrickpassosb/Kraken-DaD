# Task: Design Dry-Run Execution Lifecycle

## 1. Task Overview

**Title:** Design Dry-Run Execution Lifecycle

**Goal:** Define the step-by-step execution model for running strategies in dry-run mode. This is a design document—no code implementation.

---

## 2. Project Analysis & Current State

### Current State
- `packages/strategy-core/schema.ts` is locked
- Schema defines: `Strategy`, `StrategyNode`, `StrategyEdge`, `EdgeType`, `ExecutionContext`
- No execution engine exists yet

### Key Schema Types Referenced
- `EdgeType`: `'data'` | `'control'`
- `ExecutionMode`: `'dry-run'` | `'paper'` | `'live'`
- `BlockCategory`: `'data'` | `'logic'` | `'action'`

---

## 3. Success Criteria

- [x] Step-by-step execution lifecycle defined
- [x] Entry point rules defined
- [x] Node execution order rules defined
- [x] Data resolution rules defined
- [x] Action behavior in dry-run defined
- [x] Error handling rules defined
- [x] Explicit non-goals listed
- [ ] User confirmation received

---

## 4. Non-Goals (Explicit)

- ❌ No code implementation in this task
- ❌ No UI components
- ❌ No Kraken API integration
- ❌ No live/paper execution modes
- ❌ No database or persistence
- ❌ No scheduling or triggers
- ❌ No backtesting with historical data
- ❌ No modification to the locked schema

---

## 5. Execution Lifecycle Design

See: `docs/execution-lifecycle.md`
