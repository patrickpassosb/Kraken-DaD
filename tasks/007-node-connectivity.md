# Task: Node Connectivity and Action Blocks

## 1. Task Overview

**Title:** Fix Node Connectivity and Implement Action Blocks

**Goal:** Make the React Flow UI usable for building real strategies with proper edge handling, action blocks, and validation.

---

## 2. Success Criteria

- [x] Fix node connectivity with explicit handles (`control:*` and `data:*`)
- [x] Implement `action.placeOrder` block (frontend + backend)
- [x] Implement `action.cancelOrder` block (frontend + backend)
- [x] Implement `logic.if` block (frontend + backend)
- [x] Enforce connection validation (data↔data, control↔control only)
- [x] Load demo strategy on startup

---

## 3. Files Modified

### Backend
- `dryRunExecutor.ts` - Added 3 block definitions (placeOrder, cancelOrder, logic.if)

### Frontend
- `StartNode.tsx` - Updated handle to `control:out`
- `KrakenTickerNode.tsx` - Updated handles to `data:price`, `control:out`
- `LogIntentNode.tsx` - Updated handles to `control:in`, `data:price`
- `PlaceOrderNode.tsx` - NEW: action block with config fields
- `CancelOrderNode.tsx` - NEW: action block
- `IfNode.tsx` - NEW: logic block with true/false outputs
- `nodeTypes.ts` - Registered all 6 node types
- `FlowCanvas.tsx` - Fixed onConnect, isValidConnection
- `toStrategyJSON.ts` - Parse handle prefixes for edge types
- `App.tsx` - Demo strategy auto-loads

---

## 4. Task Status

Complete
