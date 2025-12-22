# Strategy Builder Reuse Guide

This project exposes reusable building blocks so you can embed the Kraken DaD strategy builder in another React app without pulling the entire shell. Consume the canvas, palette, serialization, and API helpers, then layer your own shell, theming, or embedding UI.

## Key pieces

- **Canvas UI (`apps/frontend/src/canvas/FlowCanvas.tsx`)**: Hosts the React Flow layout, palette toggle, keyboard shortcuts (`R` to recenter, `T` to tidy), implied data wiring, and toolbar actions. It feeds palette nodes into React Flow via `useNodesState`/`useEdgesState` and keeps event handlers lean.
- **Block metadata**: `nodeRegistry.ts` declares palette groups, default positions, and descriptions, while `nodeTypes.ts` maps each `NodeTypeId` to a React component (e.g., `PlaceOrderNode`). Block icons live in `apps/frontend/src/icons/blockIcons.tsx` and are rendered by `BlockIcon` so the palette stays consistent.
- **Node components (`apps/frontend/src/nodes/*.tsx`)**: Each block wraps `NodeActionToolbar`, `StatusPill`, and `BlockIcon`, exposes handles for control/data ports, and persists configuration to the node’s `data`. Use `useNodeToolbarHover` to avoid flickering when showing toolbar buttons.
- **Serialization (`apps/frontend/src/utils/toStrategyJSON.ts`)**: Combines nodes and edges into the schema-compatible `Strategy` payload (`SCHEMA_VERSION`), applying defaults for missing configs so the executor’s validation passes.
- **Execution client (`apps/frontend/src/api/executeStrategy.ts`)**: Submits the JSON to `/execute`, optionally toggling `validate` and `targetNodeId`. On the backend, `executeRoute` builds market context, runs `executeDryRun`, and appends Kraken validation/live actions.

## Integration example

```tsx
import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from './canvas/FlowCanvas';
import { executeStrategy } from './api/executeStrategy';
import { toStrategyJSON } from './utils/toStrategyJSON';
import { buildTemplateEdges, buildTemplateNodes } from './nodes/nodeRegistry';

export function StrategyBuilderEmbed() {
  const [nodes, setNodes] = useState(buildTemplateNodes());
  const [edges, setEdges] = useState(buildTemplateEdges());

  const handleRun = async () => {
    const strategy = toStrategyJSON(nodes, edges);
    const result = await executeStrategy(strategy, { mode: 'dry-run', validate: true });
    console.log(result);
  };

  return (
    <ReactFlowProvider>
      <FlowCanvas
        initialNodes={nodes}
        initialEdges={edges}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
      />
      <button onClick={handleRun}>Execute</button>
    </ReactFlowProvider>
  );
}
```

This pattern demonstrates a minimal integration: keep strategy state in React Hooks, render the canvas via `FlowCanvas`, serialize using `toStrategyJSON`, and post to the backend using `executeStrategy`.

## FlowCanvas API details

| Prop | Purpose |
|---|---|
| `initialNodes`, `initialEdges` | Seed the canvas layout or templates (`buildTemplateNodes`, `buildTemplateEdges`).
| `onNodesChange`, `onEdgesChange` | Persist the canvas to your host state.
| `nodeStatuses` | Map node IDs to `NodeStatus`s so you can replay execution history or color nodes after running a strategy.
| `activePair` | Sets defaults (e.g., ticker/order pair) when new nodes are created.
| `onRunNode` | Callback fired when a node's toolbar Run button is pressed.

`FlowCanvas` also handles layout helpers (`handleFitView`, `handleTidyLayout`), palette search, multi-edge offsets, and keyboard shortcuts.

## Data flow

1. The canvas emits nodes/edges -> `toStrategyJSON` produces a `Strategy` payload with metadata, nodes, and control/data edges.
2. `executeStrategy` posts to `/execute`, optionally passing `mode`, `validate`, and `targetNodeId` for partial execution.
3. The backend builds market context (ticker, OHLC, spread, asset metadata), runs `executeDryRun`, and returns `ExecutionResult` with logs, warnings, `actionIntents`, and optional `krakenValidations`/`liveActions`.
4. The UI subscribes to `/market/stream` via `useMarketStream` to keep the right rail in sync.

Refer to `docs/strategy-json-example.md` for the full payload structure and `docs/execution-lifecycle.md` for the execution ordering and error handling semantics.

## Customization points

- Add new nodes using `docs/add-block-guide.md` (core handler, UI component, palette metadata, tests).
- Swap palette defaults via `nodeRegistry.ts` or provide your own `buildTemplateNodes`/`buildTemplateEdges` for different strategy templates.
- Hook `nodeStatuses` to your execution log if you want to color nodes externally.
- Replace `executeStrategy` with another execution client if you need custom telemetry or live deployment targets.
