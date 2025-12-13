# Kraken DaD

Kraken DaD is a **Kraken-native, drag-and-drop strategy builder** that runs in **dry-run / validate-only** mode. It pairs a React Flow UI with a Fastify backend and a shared TypeScript strategy core. The UI, blocks, and copy are aligned to Kraken Pro, and market data comes from Kraken’s public APIs.

## What’s Included
- **Visual Strategy Canvas**: React Flow nodes/edges with type-safe handles (`control:*`, `data:*`), delete/selection support, one-start-node guard, and lane layout.
- **Strategy Core**: Shared schema + dry-run executor that validates the graph, orders control flow, executes block handlers, and returns structured execution results.
- **Kraken API integration**:
  - Public: `/0/public/Ticker` and `/0/public/Depth` fetched server-side, injected into strategy execution, and exposed via `GET /market/context`.
  - Private (validate-only scaffold): HMAC signing for `AddOrder`/`CancelOrder` with `validate=true` only; live trading stays disabled unless explicitly wired.
- **Execution Feedback**: Timeline of steps, node status highlighting, and an order preview using live Kraken prices/spread.
- **Safety-first**: Dry-run enforced by default; private endpoints are stubbed/validate-only; no credentials stored client-side.
- **Open source (MIT License)**: See `LICENSE`.

## Repository Layout
- `apps/frontend/` — Vite + React Flow UI (dark Kraken Pro styling), nodes, canvas, API clients, formatting utils.
- `apps/backend/` — Fastify server with `/execute/dry-run`, `/market/context`, and `/health`.
- `packages/strategy-core/` — Strategy schema, dry-run executor, block definitions (Kraken ticker + order blocks).
- `packages/kraken-client/` — Typed Kraken REST helpers (public Ticker/Depth; validate-only AddOrder/Cancel scaffolding).
- `docs/`, `tasks/` — Design notes and task trackers; `tasks/010-kraken-pro-ux.md` documents the current UX direction.

## Kraken API Usage
- **Public market data**: Backend fetches `/0/public/Ticker` and `/0/public/Depth` for strategy pairs, injects snapshots into `ExecutionContext.marketData`, and serves `GET /market/context` for the UI (Market Context dock + order preview). Dry-run execution now uses real Kraken prices where available (fallback to mock if unreachable).
- **Private endpoints (safe by default)**: `packages/kraken-client` includes HMAC signing for `AddOrder`/`CancelOrder` with `validate=true` enforced. Credentials are optional and read from env (`KRAKEN_API_KEY`, `KRAKEN_API_SECRET`); no live trading is performed unless explicitly wired and opted-in.
- **UI transparency**: Banner and panels indicate that public data is Kraken-sourced and private calls are stubbed/validate-only.

## Running Locally (Dry-Run)
Prereq: Node.js >= 18 (for native `fetch`).

Backend
```bash
cd apps/backend
npm install
npm run dev  # http://127.0.0.1:3001
```

Frontend
```bash
cd apps/frontend
npm install
npm run dev  # http://127.0.0.1:3000
```

Use the UI
- Drag nodes (Strategy Start → Market Data → Condition → Risk → Execution), connect handles, and click **Run Dry-Run**.
- Market Context + Order Preview use live Kraken data from the backend. If the API is unreachable, the UI falls back to a mock and shows a warning chip.
- Export the graph as **Kraken Strategy Definition** (JSON).

## API Endpoints
- `GET /health` — simple health check.
- `GET /market/context?pair=BTC/USD` — Kraken Ticker + Depth snapshot (pair, lastPrice, bid/ask, spread, change24h).
- `POST /execute/dry-run` — body `{ strategy: Strategy }`; returns `ExecutionResult` after injecting Kraken market data into execution.

## Configuration (Optional Validate-Only Private Calls)
Set env vars in `apps/backend` if you want to hit Kraken private endpoints with `validate=true` (no live trading):
```
KRAKEN_API_KEY=...
KRAKEN_API_SECRET=...
```
Private calls are scaffolded in `packages/kraken-client` but are not invoked by default; dry-run remains the default behavior.

## Safety & Constraints
- Live trading is **disabled**; dry-run is enforced.
- Private API usage is validate-only and opt-in; credentials are never sent to the frontend.
- CORS is open for local demo; lock down in production.

## Submission & Licensing
- License: **MIT** (see `LICENSE`).
- Deliverables: GitHub repo, working prototype, demo video, README (this file) explaining architecture and Kraken integration.

## Next Steps (if extending)
- Wire optional validate-only order intents into execution logs for deeper Kraken transparency.
- Add WS market streams for lower-latency updates to the Market Data node.
- Add more Kraken-native blocks (orderbook guard, OHLC-derived signals, spread guards) using the shared `kraken-client`.
