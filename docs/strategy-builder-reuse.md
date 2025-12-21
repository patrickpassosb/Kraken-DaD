# Strategy Builder Reuse Guide

This project exposes reusable building blocks so you can embed the Kraken DaD strategy builder in another React app without pulling the whole UI shell.

## Key pieces

- **Canvas UI**: `apps/frontend/src/canvas/FlowCanvas.tsx` (`FlowCanvas` named export)
- **Node registry + palette metadata**: `apps/frontend/src/nodes/nodeRegistry.ts`
- **Node components**: `apps/frontend/src/nodes/*.tsx`
- **Strategy serialization**: `apps/frontend/src/utils/toStrategyJSON.ts`
- **Execution API client**: `apps/frontend/src/api/executeStrategy.ts`
- **Shared schema**: `packages/strategy-core/schema.ts`

## Minimal integration example

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
        <>
            <ReactFlowProvider>
                <FlowCanvas
                    initialNodes={nodes}
                    initialEdges={edges}
                    onNodesChange={setNodes}
                    onEdgesChange={setEdges}
                />
            </ReactFlowProvider>
            <button onClick={handleRun}>Execute</button>
        </>
    );
}
```

## `FlowCanvas` API (props/events)

- `initialNodes: Node[]` — initial node array (React Flow nodes)
- `initialEdges: Edge[]` — initial edge array (React Flow edges)
- `onNodesChange(nodes)` — called when nodes change
- `onEdgesChange(edges)` — called when edges change
- `nodeStatuses?: Record<string, NodeStatus>` — status map from execution log
- `activePair?: string` — active market pair for defaults
- `onRunNode?: (nodeId: string) => void` — run a single node

## Data model

The canonical schema lives in `packages/strategy-core/schema.ts` and is serialized by `toStrategyJSON`.
Use `apps/frontend/src/api/executeStrategy.ts` for executing strategies against the backend.

See `docs/strategy-json-example.md` for a full JSON payload example.

## Customization points

- Add new blocks via the guide in `docs/add-block-guide.md`.
- Update palette ordering, labels, and icons in `apps/frontend/src/nodes/nodeRegistry.ts`.
- Replace `demoNodes`/`demoEdges` with your own defaults for a custom template.
