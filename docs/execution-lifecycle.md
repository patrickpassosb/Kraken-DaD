# Dry-Run Execution Lifecycle

> **Status:** Design Document (No Code)  
> **Schema Version:** 1  
> **Execution Mode:** `dry-run` (default), `live` (disabled in this project)

---

## 1. Execution Lifecycle Steps

### Step 1: Load Strategy
- Parse `Strategy` JSON
- Validate schema version matches `SCHEMA_VERSION`

### Step 2: Build Graph Representation
- Index nodes by `id` → `Map<string, StrategyNode>`
- Index edges by source/target → adjacency lists
- Separate edges by type: `controlEdges`, `dataEdges`

### Step 3: Validate Graph Structure
- All edge source/target node IDs must exist
- All edge port IDs must exist on referenced nodes
- No orphan nodes (warning, not error)
- Return `ValidationResult`

### Step 4: Identify Entry Points
- Entry points = nodes with **no incoming control edges**
- If zero entry points → validation error
- Multiple entry points allowed (parallel start)

### Step 5: Compute Execution Order
- Perform **topological sort** on control edges only
- Data edges do not affect execution order
- Cycle detection: if cycle exists in control graph → validation error

### Step 6: Execute Nodes (In Order)
For each node in topological order:
1. **Resolve Inputs**: Collect values from incoming data edges
2. **Execute Node**: Run node logic based on `type` and `config`
3. **Store Outputs**: Cache output values for downstream nodes
4. **Evaluate Control Flow**: Determine which outgoing control edges fire

### Step 7: Collect Execution Result
- Aggregate all node execution results
- Return structured execution log

---

## 2. Entry Point Rules

| Rule | Description |
|------|-------------|
| Definition | A node with **zero incoming control edges** |
| Multiple allowed | Yes — all entry points execute in parallel (conceptually) |
| Zero entry points | Validation error: `NO_ENTRY_POINT` |
| Data-only nodes | Entry points can still have incoming data edges |

---

## 3. Node Execution Order Rules

| Rule | Description |
|------|-------------|
| Ordering basis | **Control edges only** (topological sort) |
| Data edges | Do NOT affect execution order |
| Cycle handling | Error: `CONTROL_CYCLE_DETECTED` |
| Parallel branches | Nodes at same topological level may execute in any order |
| Determinism | Same strategy + same inputs = same execution order |

### Topological Sort Algorithm
```
1. Compute in-degree for each node (control edges only)
2. Queue all nodes with in-degree 0 (entry points)
3. While queue not empty:
   a. Dequeue node N
   b. Add N to execution order
   c. For each outgoing control edge from N:
      - Decrement target's in-degree
      - If target in-degree == 0, enqueue target
4. If execution order length < node count → cycle exists
```

---

## 4. Data Resolution Rules

| Rule | Description |
|------|-------------|
| Resolution timing | **Lazy** — resolve inputs immediately before node execution |
| Missing required data | Error: `MISSING_REQUIRED_INPUT` |
| Missing optional data | Use default value (from `BlockDefinition` or `null`) |
| Type mismatch | Warning (soft) or Error (strict) based on config |
| Multiple sources | Error: `AMBIGUOUS_DATA_SOURCE` (one input port = one source) |

### Data Flow
```
SourceNode.output[portId] → Edge → TargetNode.input[portId]
```

Data values are cached in a `Map<nodeId:portId, value>` after each node executes.

---

## 5. Action Behavior in Dry-Run Mode

| Block Category | Dry-Run Behavior |
|----------------|------------------|
| `data` | Return **mock/static values** from config |
| `logic` | Execute **real logic** (conditions, transforms) |
| `action` | **Log intent only** — no side effects |

### Action Node Dry-Run Output
```typescript
{
  nodeId: string;
  type: string;           // e.g., "action.placeOrder"
  intent: {
    action: string;       // e.g., "PLACE_ORDER"
    params: NodeConfig;   // Order details
  };
  executed: false;        // Always false in dry-run
}
```

### Examples
| Action Type | Dry-Run Output |
|-------------|----------------|
| `action.placeOrder` | `{ action: "PLACE_ORDER", params: { pair: "BTC/USD", side: "buy", amount: 0.1 } }` |
| `action.cancelOrder` | `{ action: "CANCEL_ORDER", params: { orderId: "..." } }` |
| `action.notify` | `{ action: "NOTIFY", params: { message: "..." } }` |

---

## 6. Error Handling Rules

### Error Categories

| Code | Severity | Description |
|------|----------|-------------|
| `INVALID_SCHEMA_VERSION` | Fatal | Strategy version doesn't match engine |
| `NO_ENTRY_POINT` | Fatal | No nodes without incoming control edges |
| `CONTROL_CYCLE_DETECTED` | Fatal | Cycle in control flow graph |
| `NODE_NOT_FOUND` | Fatal | Edge references non-existent node |
| `PORT_NOT_FOUND` | Fatal | Edge references non-existent port |
| `MISSING_REQUIRED_INPUT` | Fatal | Required input port has no data |
| `AMBIGUOUS_DATA_SOURCE` | Fatal | Multiple edges to same input port |
| `UNKNOWN_BLOCK_TYPE` | Fatal | Node type not in block registry |
| `NODE_EXECUTION_ERROR` | Node | Error during node execution |
| `ORPHAN_NODE` | Warning | Node not connected to any control flow |
| `TYPE_MISMATCH` | Warning | Data type doesn't match port type |

### Error Response Structure
```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
  };
  partialResult?: ExecutionLog;  // If execution partially completed
}
```

### Execution Continues On
- Warnings (logged but not blocking)
- Non-fatal node errors if configured for `continueOnError`

### Execution Halts On
- Any fatal error (validation or runtime)
- Node error if `haltOnError: true` (default)

---

## 7. Execution Result Structure

```typescript
interface ExecutionResult {
  success: boolean;
  mode: 'dry-run' | 'live';
  startedAt: string;      // ISO 8601
  completedAt: string;    // ISO 8601
  nodesExecuted: number;
  log: NodeExecutionLog[];
  errors: ExecutionError[];
  warnings: ExecutionWarning[];
  actionIntents: ActionIntent[];  // All action nodes' dry-run output
  krakenValidations?: KrakenValidation[]; // validate-only Kraken checks
  liveActions?: LiveActionResult[]; // live order results (when enabled)
}

interface LiveActionResult {
  nodeId: string;
  action: string;
  status: 'ok' | 'error';
  detail?: string;
  response?: Record<string, unknown>;
}

interface NodeExecutionLog {
  nodeId: string;
  nodeType: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  durationMs: number;
  status: 'success' | 'error' | 'skipped';
}
```

---

## 9. Market data context

The backend builds execution context before calling `executeDryRun`. `apps/backend/src/routes/execute.ts` inspects the strategy for which pairs, OHLC intervals, spreads, and asset metadata are required, then calls `buildExecutionData`:
- Ticker data is fetched via both REST `fetchTicker`/`fetchDepth` and a one-shot WS (`fetchTickerWsOnce`) with 2.5s timeouts. Falling back to `MARKET_FALLBACKS` ensures the UI never stalls.
- OHLC and spread snapshots are chopped to at most the requested counts (`normalizeInterval` / `normalizeCount` keep Kraken’s limits intact).
- Asset pair metadata is normalized through `resolveAssetPairMetadata`, which reconciles display aliases, `wsname`, and Kraken IDs for tick size validation.
- Every fetch writes a warning (`ExecutionWarning`) when Kraken is unreachable, so the front-end can surface “backup snapshot” messaging.

The assembled context (`marketData`, `ohlcData`, `spreadData`, `assetPairData`) is stitched into `ExecutionContext` and passed into `executeDryRun`. This keeps environment data deterministic and localized to each request/strategy run.

## 10. Kraken validation & live actions

`executeRoute` drives validation and optional live execution:
- Dry-run mode always triggers the shared executor, then `applyKrakenValidation` calls `validateAddOrder`/`validateCancelOrder` for each `ActionIntent` (if credentials are configured). Validation responses (and errors when Kraken rejects a dry-run) are appended to `ExecutionResult.krakenValidations`.
- Live mode (`mode === 'live'`) first ensures credentials exist (`hasPrivateCreds`). If no creds are configured, the route fails fast with `LIVE_CREDENTIALS_MISSING`. Otherwise, `applyKrakenLive` reuses `resolveOrderParams` to guard limit orders, posts to `/0/private/AddOrder` or `/0/private/CancelOrder`, and pushes `LiveActionResult`s plus any runtime errors.
- The backend keeps credential toggles in memory via `packages/kraken-client` helpers (`setPrivateCreds`, `clearPrivateCreds`) so the UI never asks the browser to store secrets.

## 11. Summary

| Aspect | Rule |
|--------|------|
| Entry points | Nodes with no incoming control edges |
| Execution order | Topological sort on control edges |
| Data resolution | Lazy, resolved before each node executes |
| Action behavior | Log intent only, no side effects |
| Error handling | Fatal errors halt; warnings continue |
| Determinism | Same strategy + inputs = same result |
