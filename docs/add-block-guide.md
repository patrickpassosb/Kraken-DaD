# Add a New Block Guide

This guide walks through adding a new block to Kraken DaD end-to-end (core schema, executor behavior, and UI).

## 1) Define the block in strategy-core

Edit `packages/strategy-core/executor/dryRunExecutor.ts`:

- Add a `blockDefinitions.set('your.block.type', { ... })` entry.
- Add a matching `blockHandlers.set('your.block.type', (node, inputs, ctx) => { ... })` handler.
- Define clear input/output ports (ids must match handle ids without `control:`/`data:`).

## 2) Create the node UI component

Add a node component in `apps/frontend/src/nodes/` (e.g., `MyNewNode.tsx`):

- Use `NodeProps` from `@xyflow/react`.
- Add `Handle` elements for control/data ports using ids like `control:in` and `data:value`.
- Store node config in `node.data` and update it via `useReactFlow().setNodes`.

## 3) Register the node type

Update `apps/frontend/src/nodes/nodeTypes.ts`:

- Import the new node component.
- Add it to the `nodeTypes` map with the same type id used in strategy-core.

## 4) Add the block to the palette

Update `apps/frontend/src/nodes/nodeRegistry.ts`:

- Add a `NodeDefinition` entry (label, role, description, icon, group, default position, defaults).
- If needed, update `PaletteGroupId` or group labels.

## 5) Wire implied edges (optional)

If the block should auto-wire data edges on control insert, update:

- `IMPLIED_DATA_EDGES` in `apps/frontend/src/canvas/FlowCanvas.tsx`
- `CONTROL_INSERT_HANDLES` in `apps/frontend/src/canvas/FlowCanvas.tsx`

## 6) Add tests

Add a unit test in `tests/strategy-core/` for:

- Validation: required ports are enforced.
- Execution: outputs match expected logic.

## Checklist

- [ ] Block definition and handler added
- [ ] Node UI component created
- [ ] Node registered in `nodeTypes`
- [ ] Palette entry added
- [ ] Optional implied edges updated
- [ ] Tests updated
