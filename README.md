# Kraken DaD

Kraken DaD is a **Kraken-native drag-and-drop strategy builder**. The frontend uses React Flow to compose strategies, the backend runs a Fastify API that executes those strategies in **dry-run by default**, and the shared `strategy-core` package defines the schema and execution engine. Live trading is explicitly gated and requires backend-held credentials.

---

## Repository Map
- `apps/frontend` — Vite + React UI, React Flow canvas, block palette, market context, order preview.
- `apps/backend` — Fastify API for execute/dry-run, market snapshots/stream, and credential handling.
- `packages/strategy-core` — Strategy schema + dry-run executor (topological sort, validation, block handlers).
- `packages/kraken-client` — Thin Kraken REST/WS client (ticker, depth, OHLC, spreads, AddOrder/CancelOrder scaffolding).
- `docs/` — Reuse/JSON examples and lifecycle notes.
- `tasks/` — Agent task trackers (see `tasks/036-full-repo-documentation.md` for this effort).

---

## Architecture & Data Flow
1) **Canvas** (React Flow) → users drag blocks with typed handles (`control:*`, `data:*`).
2) **Serialization** → `toStrategyJSON` normalizes nodes/edges into the shared schema.
3) **Backend execution** → `/execute` builds market context (Kraken REST/WS with fallbacks), runs the dry-run engine, optionally validates/calls Kraken private endpoints when live mode is enabled.
4) **Results** → `ExecutionResult` returns node logs, warnings/errors, intents, and live/validation feedback for the UI to render status pills + previews.

Execution ordering is deterministic: control edges drive the topological sort; data edges only supply inputs. Partial execution is supported via `targetNodeId`.

---

## Strategy Blocks (current set)
- **control.start** — entry trigger.
- **control.timeWindow** — gate by UTC time/day.
- **data.kraken.ticker** — ticker snapshot (price/bid/ask/spread).
- **data.kraken.ohlc** — OHLC window with close series.
- **data.kraken.spread** — spread history + stats.
- **data.kraken.assetPairs** — precision/min-size metadata.
- **data.constant** — literal value (number/string/bool).
- **logic.if** — numeric comparator (true/false branches).
- **logic.movingAverage** — SMA/EMA of a series.
- **risk.guard** — spread guard.
- **action.placeOrder** — Kraken AddOrder intent (mock ID in dry-run).
- **action.cancelOrder** — Kraken CancelOrder intent.
- **action.logIntent** — audit/log-only intent.

---

## API Endpoints (backend)
- `GET /health` — readiness probe.
- `GET /market/context?pair=BTC/USD` — ticker + depth snapshot.
- `GET /market/stream?pair=BTC/USD` — SSE ticker stream (seeded by REST).
- `POST /execute` — body `{ strategy, mode?: 'dry-run' | 'live', validate?: boolean, targetNodeId?: string }`.
- `POST /execute/dry-run` — convenience dry-run alias.
- `GET /kraken/credentials/status` — whether private creds are configured.
- `POST /kraken/credentials` — in-memory runtime creds (key/secret).
- `DELETE /kraken/credentials` — clear runtime creds.

---

## Running Locally
Prereq: Node.js ≥ 18

```bash
npm install
npm run dev:backend   # http://127.0.0.1:3001
npm run dev:frontend  # http://127.0.0.1:3000
```

Environment:
```
# frontend
VITE_API_BASE=http://127.0.0.1:3001

# backend (required for live mode)
KRAKEN_API_KEY=...
KRAKEN_API_SECRET=...
```

Testing/typecheck:
```bash
npm test               # strategy-core tests
npm run typecheck:shared
```

Docker (backend dev image):
```bash
docker build -f apps/backend/Dockerfile -t kraken-dad-backend .
```

---

## Using the UI
1) Open the app; add **Strategy Start** or click **Start with template** (Start → Market Data → Condition → Execution).
2) Configure pairs/thresholds; palette search and keyboard shortcuts: **R** recenter, **T** tidy layout.
3) Click **Execute workflow** (dry-run). Status pills, warnings, and the order preview update from execution results.
4) Export the strategy as JSON (`kraken-strategy-definition.json`).
5) Live mode: open Settings → add API key/secret → toggle Live. Confirmation dialogs guard execution; credentials stay on the backend only.

Market data:
- `/market/context` for initial snapshot (fallback to mock with warning).
- `/market/stream` SSE for live updates (used by the Market Context dock + preview).

---

## Safety
- **Default**: dry-run only; no private Kraken calls without opt-in.
- **Live mode**: gated by credentials + explicit toggle + confirmation prompt; executor stops if validation errors exist.
- Credentials are never sent back to the client; stored in-memory unless provided via env.

---

## Development Notes
- Execution lifecycle and validation rules: `docs/execution-lifecycle.md`.
- Strategy JSON reference: `docs/strategy-json-example.md`.
- Adding blocks: `docs/add-block-guide.md`.
- Reuse guidance: `docs/strategy-builder-reuse.md`.

---

## License
MIT — see `LICENSE`.
