# Kraken DaD (Hackathon Demo)

Low-code strategy builder using React Flow + Fastify + TypeScript. The backend runs a dry-run execution engine; the frontend composes strategies visually.

## Kraken API Usage

- **Public endpoints:** `/0/public/Ticker` for price data via `KrakenPublicRestAdapter`. No authentication required.
- **Private endpoints:** Mapped to actions but **stubbed**:
  - `action.placeOrder` → Kraken `/0/private/AddOrder` (stub throws “Live trading not enabled”)
  - `action.cancelOrder` → Kraken `/0/private/CancelOrder` (stub throws “Live trading not enabled”)
- **Execution mode:** Default is `dry-run` (safe, no real orders). `live` mode is part of the types/architecture but disabled in code.
- **No secrets stored:** No API key UI or storage is included; the demo never sends authenticated requests.

## Running (Dry-Run Only)

1. Backend: `cd apps/backend && npm install && npm run dev`
2. Frontend: `cd apps/frontend && npm install && npm run dev`
3. Open the frontend, build a graph, and run a dry-run. Action intents are logged; no orders are sent.

## Safety

This demo is intentionally **non-trading**. All live trading calls throw, and the UI highlights “Dry-run mode (safe, no real orders)” plus a warning banner.
