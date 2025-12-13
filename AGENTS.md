# Repository Guidelines

## Project Structure & Module Organization
- `apps/frontend`: Vite + React Flow UI (`src/` holds `canvas/`, `nodes/`, `api/`, `utils/`, `styles/`). `App.tsx` wires the demo strategy and result panel.
- `apps/backend`: Fastify server exposing `/execute/dry-run` and `/health` (`src/server.ts`, `src/routes/execute.ts`).
- `packages/strategy-core`: Shared schema, dry-run executor, and Kraken adapters (public ticker + private stub); treat this as the source of truth for types.
- `docs/` and `tasks/`: Design/implementation notes (execution lifecycle, Kraken API mode). Keep these aligned when behavior changes.

## Build, Test, and Development Commands
- Backend dev: `cd apps/backend && npm install && npm run dev` (Fastify + tsx watch on port 3001).
- Backend build/start: `npm run build && npm start` from `apps/backend` (outputs to `dist/`).
- Frontend dev: `cd apps/frontend && npm install && npm run dev` (Vite dev server).
- Frontend build/preview: `npm run build && npm run preview` from `apps/frontend`.
- There is no monorepo root install; run commands within each package. Network calls are limited to Kraken public `/0/public/Ticker`; private actions are stubbed.

## Coding Style & Naming Conventions
- TypeScript everywhere; prefer explicit types and narrow unions (`ExecutionMode`, node handle identifiers). Avoid `any`.
- Indent with 4 spaces; keep imports ordered (libraries, then local) and favor small, pure helpers.
- React components are PascalCase; hooks start with `use`. Node components live in `apps/frontend/src/nodes/` and are registered in `nodeTypes.ts`.
- Strategy nodes/edges follow names like `control.start`, `data.kraken.ticker`, `action.placeOrder`; keep handles `control:*` vs `data:*` to match Flow validation.

## Testing Guidelines
- No automated test suite yet; validate changes by running both dev servers and executing the demo flow. Watch the result grid and browser console for warnings/errors.
- For backend/core changes, add small TypeScript checks or harnesses that call `executeDryRun` with a minimal `Strategy` object before shipping.
- If you add tests, co-locate them near the code (e.g., `*.spec.ts`) and keep them deterministic—no live Kraken calls.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative summaries (`Clarify Kraken API usage and enforce dry-run mode`). Group related edits per commit.
- PRs should include: brief description, paths touched, manual verification steps (commands run + outputs), and screenshots/GIFs for UI changes.
- Call out any schema changes in `packages/strategy-core`, and update `docs/` or `tasks/` if behavior shifts.

## Safety & Configuration
- The project is a dry-run demo: live trading is intentionally disabled. Do not add API key handling or enable private Kraken calls.
- Keep CORS/simple deployments intact (Fastify hook in `server.ts`); avoid introducing stateful services or databases without discussion.
