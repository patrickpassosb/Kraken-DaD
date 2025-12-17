# Kraken DaD

Kraken DaD is a **Kraken-native, drag-and-drop strategy builder** that runs in **dry-run / validate-only** mode. It pairs a React Flow UI with a Fastify backend and a shared TypeScript strategy core. The UI, blocks, and copy are aligned to Kraken Pro, and market data comes from Kraken’s public APIs.

## What’s Included (quick tour)
- **Visual Strategy Canvas**: React Flow nodes/edges with type-safe handles (`control:*`, `data:*`), delete/selection support, one-start-node guard, and lane layout.
- **Strategy Core**: Shared schema + dry-run executor that validates the graph, orders control flow, executes block handlers, and returns structured execution results.
- **Kraken API integration**:
  - Public: `/0/public/Ticker` and `/0/public/Depth` fetched server-side, injected into strategy execution, and exposed via `GET /market/context`.
  - Private (validate-only scaffold): HMAC signing for `AddOrder`/`CancelOrder` with `validate=true` only; live trading stays disabled unless explicitly wired.
- **Execution Feedback**: Preview with est. price/notional/fees, node status highlighting, and result summary.
- **Safety-first**: Dry-run enforced by default; private calls are validate-only; no credentials stored client-side.
- **Open source (MIT License)**: See `LICENSE`.

## Demo walkthrough (what judges should see)
1) Open the app (blank canvas).
2) Use the empty-state CTA: **Add Strategy Start** or **Start with template** (drops Start → Market Data → Condition → Execution).
3) Optionally open **Strategy Blocks** and drag blocks to tweak.
4) Click **Execute workflow** (dry-run); see Order Preview and summary update.
5) Pan/zoom then press **Recenter** or **R** to fit the flow.
6) Export **Kraken Strategy Definition** (JSON).

## Features
- Blank-start canvas with empty-state CTA and one-click template.
- Kraken-themed palette with icons, search, tooltips, and scrollable groups.
- Mode pill: Dry-run (no live orders) always visible.
- Recenter control + keyboard shortcut (**R**) to refit the canvas.
- Live Market Context + Order Preview using Kraken data (fallback to mock with warning).
- Export strategy JSON; validate-only private scaffold in backend package.

## Architecture snapshot
- **apps/frontend**: React + React Flow, Kraken Pro styling, controls/rails/palette.
- **apps/backend**: Fastify API (`/execute/dry-run`, `/market/context`, `/health`); optional Kraken private validate-only signing.
- **packages/strategy-core**: Strategy schema + dry-run executor shared across UI/backend.
- **packages/kraken-client**: Typed Kraken REST helpers (public + validate-only private).

Data flow: UI builds graph → serialize to strategy JSON → backend dry-run injects Kraken market data → returns `ExecutionResult` → UI shows statuses/preview.

```mermaid
flowchart LR
    subgraph Frontend["apps/frontend - React + React Flow"]
        Canvas[Strategy Canvas\nBlocks/Edges -> Strategy JSON]
        ContextDock[Market Context]
        Preview[Order Preview]
    end

    subgraph Backend["apps/backend - Fastify"]
        DryRun[/POST \/execute\/dry-run/]
        Market[/GET \/market\/context/]
    end

    subgraph Core["packages/strategy-core"]
        Schema[Strategy Schema & Validation]
        Exec[Dry-run Executor]
    end

    subgraph KrakenAPI["Kraken API"]
        Public[Public REST (Ticker/Depth)]
        Private[Private REST (validate=true scaffold)]
    end

    Canvas -->|serialize| DryRun
    DryRun -->|inject market data| Exec
    Exec -->|ExecutionResult| Canvas
    ContextDock -->|fetch| Market
    Market --> Public
    Exec --> Public
    Exec -. optional validate=true .-> Private
    DryRun --> Schema
```

## Strategy blocks (current set)
- **Strategy Start** (Control): Kick off control lane.
- **Market Data** (Data): Live Kraken ticker snapshot.
- **Condition (IF)** (Logic): Branch on price rule (true/false).
- **Orderbook Guard** (Risk): Block on wide spreads.
- **Execution** (Action): Prepare Kraken order intent.
- **Order Control** (Action): Cancel intent by ID.
- **Audit Log** (Audit): Record audit trail.

## Controls & shortcuts
- **Recenter** button or press **R**.
- **Show/Hide Strategy Blocks** toggle; palette search + tooltips.
- **Show/Hide Context & Preview** toggle for more canvas space.

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

## Running Locally
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

Frontend API base URL
```bash
# defaults to http://127.0.0.1:3001 when unset
export VITE_API_BASE="http://localhost:3001"
```

Use the UI
- Start blank or load the template (empty-state CTA), or open Strategy Blocks to add nodes.
- Drag nodes (Strategy Start → Market Data → Condition → Risk → Execution), connect handles, and click **Execute workflow** (dry-run).
- Market Context + Order Preview use live Kraken data from the backend. If the API is unreachable, the UI falls back to a mock and shows a warning chip.
- Export the graph as **Kraken Strategy Definition** (JSON).

Mode & Safety
- Mode: Dry-run (no live orders). Private API calls are validate-only and opt-in.
- Recenter: Use the **Recenter** button or press **R** to fit the canvas if you pan/zoom away.

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

## Known limitations / future work
- Backend dry-run may use mock data if Kraken public API is unreachable.
- Validate-only private calls scaffolded; live trading intentionally disabled.
- Block catalog is minimal; more Kraken-native blocks (OHLC signals, spread guards) can be added in `strategy-core`.
- No persistence of user-created strategies across sessions (out of scope for hackathon).

## Submission & Licensing
- License: **MIT** (see `LICENSE`).
- Deliverables: GitHub repo, working prototype, demo video, README (this file) explaining architecture and Kraken integration.
- Demo video: include a short walkthrough (empty state → add blocks/template → execute dry-run → recenter).

## Submission checklist (hackathon)
- [ ] README updated (this file) with Quickstart, architecture, safety, and usage.
- [ ] MIT license present.
- [ ] Demo video link added.
- [ ] Prototype runs locally (frontend + backend) with dry-run flow.
- [ ] Strategy JSON export works.

## Next Steps (if extending)
- Wire optional validate-only order intents into execution logs for deeper Kraken transparency.
- Add WS market streams for lower-latency updates to the Market Data node.
- Add more Kraken-native blocks (orderbook guard, OHLC-derived signals, spread guards) using the shared `kraken-client`.
