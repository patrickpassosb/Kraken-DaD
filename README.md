# Kraken DaD

**Kraken Drag-and-Drop Strategy Builder** — *Build the tools beneath the surface.*

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-red)](https://www.youtube.com/watch?v=PLACEHOLDER) *(Click to watch the walkthrough)*

Kraken DaD is a **Kraken-native low-code strategy builder** designed for Track #3. It allows traders to visually compose strategies using a "Node-RED for Trading" interface, execute them safely in a dry-run environment, and (optionally) deploy them for live trading.

---

## 🚀 Key Features
- **Visual Strategy Composition**: React Flow-powered canvas with drag-and-drop blocks.
- **Real-Time Market Context**: Integrated Kraken WebSocket streams for live ticker/price updates.
- **Safety First Architecture**: Strategies run in **Dry-Run Mode** by default. Live execution is gated, opt-in, and securely handled by the backend.
- **Professional UX**: Dark mode, dense information layout, and "Kraken Pro" aesthetic.
- **Production Ready**: Monorepo architecture (Fastify + Vite), strictly typed (TypeScript), and Docker-ready.

---

## 🏆 Hackathon Alignment (Track #3)
- **Innovation**: Moves beyond simple charts to **visual programming** for trading logic.
- **Technical Execution**: Built as a robust **monorepo** with a shared `strategy-core` package, separation of concerns, and a custom `kraken-client`.
- **Reusability**: The `strategy-core` and visual builder components are decoupled and [documented for reuse](./docs/strategy-builder-reuse.md).

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

```mermaid
graph TD
    subgraph "Kraken DaD Monorepo"
        FE[Frontend (Vite + React Flow)]
        BE[Backend (Fastify + Node.js)]
        Shared[Shared Pkg: strategy-core]
    end

    User((Trader)) <-->|Drag & Drop| FE
    FE -- "Submit Strategy (JSON)" --> BE
    BE -- "Server-Sent Events (Live Context)" --> FE
    
    BE -- "Execute / Dry-Run" --> Shared
    BE -- "Credentials (Private)" --> BE
    
    BE <-->|Public Data (REST/WS)| Kraken[Kraken Exchange API]
    BE <-->|Private Orders (REST)| Kraken

    style FE fill:#2a2a2a,stroke:#666,color:#fff
    style BE fill:#2a2a2a,stroke:#666,color:#fff
    style Shared fill:#1a1a1a,stroke:#888,stroke-dasharray: 5 5,color:#ccc
    style Kraken fill:#5841d8,stroke:#fff,color:#fff
```

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
# From the project root:
npm install

# Start both frontend and backend (in separate terminals):
npm run dev:backend   # API: http://127.0.0.1:3001
npm run dev:frontend  # UI:  http://127.0.0.1:3000
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
