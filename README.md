# Kraken DaD

Drag-and-drop strategy builder for Kraken (hackathon demo). React Flow front end, Fastify API, and a shared TypeScript strategy core that runs strategies in **dry-run** mode only.

## Highlights
- Visual editor: React Flow canvas with prebuilt nodes (`control.start`, `data.kraken.ticker`, `logic.if`, `action.placeOrder`, `action.cancelOrder`, `action.logIntent`).
- Deterministic dry-run executor: validates graphs, topologically orders control flow, logs execution, and emits action intents instead of trading.
- Kraken-first adapters: public REST ticker adapter; private orders are stubbed to keep live trading disabled.
- Monorepo layout with clearly separated frontend, backend, and shared `strategy-core`.

## Repository Layout
- `apps/frontend/` – Vite + React Flow UI, dark theme (`src/canvas`, `src/nodes`, `src/api`, `src/utils`, `src/styles`).
- `apps/backend/` – Fastify server exposing `/execute/dry-run` and `/health`.
- `packages/strategy-core/` – Strategy schema, dry-run executor, Kraken adapters (public ticker + private stub).
- `docs/` – Design notes (e.g., `execution-lifecycle.md`).
- `tasks/` – Task documents capturing decisions/implementation details.

## Architecture at a Glance
- **Strategy core (`packages/strategy-core`)**
  - `schema.ts`: Source of truth for strategy graph types (`Strategy`, nodes/edges, ports, `ExecutionContext`).
  - `executor/dryRunExecutor.ts`: Validates schema version, checks ports/edges, topological sort on control edges, resolves data inputs, executes block handlers, and returns a structured `ExecutionResult`.
  - `kraken/krakenAdapter.ts`: Public/Private adapter interfaces; private adapter stub throws to block live orders.
  - `kraken/krakenRestAdapter.ts`: Public REST adapter for `/0/public/Ticker` using global `fetch` (Node >= 18).
- **Backend (`apps/backend`)**
  - `src/server.ts`: Fastify entry with CORS hook, `/health`, and registration of execute routes.
  - `src/routes/execute.ts`: POST `/execute/dry-run` accepts `Strategy` JSON, runs `executeDryRun`, returns `ExecutionResult`.
- **Frontend (`apps/frontend`)**
  - `src/App.tsx`: Wires demo strategy, run/export buttons, result panel, and safety messaging.
  - `src/canvas/FlowCanvas.tsx`: React Flow canvas, palette, connection validation (control↔control, data↔data, single data source), delete handlers, orphan highlighting, one-start-node guard.
  - `src/nodes/*`: Node renderers with explicit handles (`control:*` vs `data:*`) and config inputs.
  - `src/utils/toStrategyJSON.ts`: Serializes React Flow graph to `Strategy` JSON (handle prefixes determine edge type/port ids).
  - `src/api/executeDryRun.ts`: Simple client targeting `http://127.0.0.1:3001/execute/dry-run`.

## Kraken API Usage & Safety
- **Public endpoint**: `/0/public/Ticker` via `KrakenPublicRestAdapter` (no auth).
- **Private endpoints**: Mapped conceptually (`AddOrder`, `CancelOrder`) but implemented as a stub that always throws. Live trading is intentionally **disabled**.
- **Execution mode**: Only `dry-run` is executed. `ExecutionMode` includes `live` for typing/architecture but is not used.
- **No secrets/UI for keys**: No API key storage or live calls.

## Blocks Available in Dry-Run Executor
| Block type | Category | Purpose | Key inputs → outputs |
|------------|----------|---------|----------------------|
| `control.start` | control | Entry point | outputs: `out` (trigger) |
| `data.constant` | data | Emit configured value | outputs: `value` |
| `data.kraken.ticker` | data | Return mock ticker price (42000) + pair | outputs: `price`, `pair` |
| `logic.equals` | logic | Compare equality | inputs: `a`, `b` → `result` |
| `logic.if` | logic | Route control flow | inputs: `condition` → outputs: `true`, `false` (triggers) |
| `action.logIntent` | action | Log intent only | inputs: trigger/data, no outputs |
| `action.placeOrder` | action | Log order intent, mock `orderId` | inputs: `trigger`, `price` → outputs: `orderId` |
| `action.cancelOrder` | action | Log cancel intent | inputs: `trigger`, `orderId` |

## Execution Lifecycle (dry-run)
- Validate schema version, unique node/edge ids, port existence, required inputs, single data source per target port, entry points, and cycles in control graph.
- Topologically sort by control edges (data edges do not affect order).
- Resolve inputs from cached outputs; emit `TYPE_MISMATCH` warnings if needed.
- Execute block handlers; store outputs; collect action intents; stop on fatal errors.
- Return `ExecutionResult` with timestamps, node logs, errors, warnings, and action intents.
See `docs/execution-lifecycle.md` for the detailed step-by-step design.

## Strategy JSON Shape (simplified)
```json
{
  "version": 1,
  "metadata": { "name": "Strategy", "createdAt": "...", "updatedAt": "..." },
  "nodes": [
    { "id": "start-1", "type": "control.start", "config": {}, "position": { "x": 50, "y": 200 } }
  ],
  "edges": [
    { "id": "e1", "type": "control", "source": "start-1", "sourcePort": "out", "target": "n2", "targetPort": "in" }
  ]
}
```

## Running Locally (dry-run only)
Prereq: Node.js >= 18 (for `fetch` in Kraken REST adapter).

1) Backend  
```bash
cd apps/backend
npm install
npm run dev   # Fastify on http://127.0.0.1:3001
```

2) Frontend  
```bash
cd apps/frontend
npm install
npm run dev   # Vite on http://127.0.0.1:3000
```

3) Use the UI  
- Open the frontend, adjust the demo graph, click **Run (Dry-Run)**.  
- Results show success/failure, logs, warnings, and action intents.  
- **Export JSON** downloads the current strategy.

## API Reference
- `GET /health` → `{ status: "ok", timestamp: "..." }`
- `POST /execute/dry-run`
  - Body: `{ "strategy": Strategy }`
  - Response: `ExecutionResult` (see `packages/strategy-core/executor/dryRunExecutor.ts`)
Example:
```bash
curl -X POST http://127.0.0.1:3001/execute/dry-run \
  -H "Content-Type: application/json" \
  -d @strategy.json
```

## Frontend Notes
- Handles are namespaced (`control:*`, `data:*`); connections must match types. Duplicate data targets are blocked.
- Palette prevents multiple Start nodes and highlights control-flow orphans.
- Demo strategy wires: Start → Kraken Ticker → If (true) → Place Order, with data edges feeding price.

## Development & Validation
- No automated tests yet; validate by running both dev servers and executing the demo flow.
- Strategy types and execution behavior are documented in `docs/execution-lifecycle.md` and `tasks/` files.
- Keep `packages/strategy-core` as the source of truth for shared types; update docs/tasks if behavior changes.

## Limitations / Next Steps
- Live trading is disabled; private adapter is a stub.
- No persistence, auth, or scheduling.
- No automated test suite; add co-located specs if extending the engine.
