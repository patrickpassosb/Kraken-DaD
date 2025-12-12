# Task: Implement React Flow Frontend

## 1. Task Overview

**Title:** Implement React Flow Frontend

**Goal:** Build a drag-and-drop strategy builder UI using React Flow.

---

## 2. Success Criteria

- [x] Create `apps/frontend/` with Vite + React + TypeScript
- [x] Implement 3 node types: StartNode, KrakenTickerNode, LogIntentNode
- [x] Implement port connection validation (data vs control)
- [x] Serialize graph to Strategy JSON
- [x] POST to `/execute/dry-run` and display results
- [x] Dark theme styling

---

## 3. Files Created

| File | Purpose |
|------|---------|
| `apps/frontend/package.json` | React + React Flow deps |
| `apps/frontend/vite.config.ts` | Vite config |
| `apps/frontend/src/main.tsx` | Entry point |
| `apps/frontend/src/App.tsx` | Main app component |
| `apps/frontend/src/canvas/FlowCanvas.tsx` | React Flow canvas |
| `apps/frontend/src/nodes/StartNode.tsx` | Control start node |
| `apps/frontend/src/nodes/KrakenTickerNode.tsx` | Ticker data node |
| `apps/frontend/src/nodes/LogIntentNode.tsx` | Action node |
| `apps/frontend/src/nodes/nodeTypes.ts` | Node type registry |
| `apps/frontend/src/api/executeDryRun.ts` | API client |
| `apps/frontend/src/utils/toStrategyJSON.ts` | Graph serializer |
| `apps/frontend/src/styles/theme.css` | Dark theme |

---

## 4. Task Status

✅ Complete
