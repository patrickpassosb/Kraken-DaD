# Add a New Block Guide

When you need a new trading primitive or helper, update the core executor, the canvas UI, the palette metadata, and any tests/documentation so the entire stack (frontend + backend + shared packages) knows about the block. This guide walks through the full path.

## 1. Extend the strategy-core definition and handler

1. Add an entry to `packages/strategy-core/executor/dryRunExecutor.ts` inside `blockDefinitions` describing
   * `type`, `category`, `name`, `description`, `inputs`, `outputs` and required metadata
   * `dataType` and `required` flags so validation catches misconfigured graphs
2. Add a matching `blockHandlers.set('your.block.type', (node, inputs, ctx) => ...)` that:
   * Reads `node.config` and data inputs, applies defaults, validates required fields, and throws with meaningful errors when inputs are missing
   * Returns `{ outputs, actionIntent? }` so downstream nodes can read results and the UI can surface action intents
   * Uses shared helpers (`normalizePrice`, `resolveMarketPrice`, etc.) as needed
3. Document the new block in `docs/execution-lifecycle.md` if it introduces new errors or control semantics.

## 2. Build the React Flow node component

1. Create a new component under `apps/frontend/src/nodes/` (e.g., `MyNewNode.tsx`).
   * Wrap the render in `NodeActionToolbar`, `StatusPill`, `BlockIcon`, and `useNodeToolbarHover` to keep the UX consistent.
   * Place `Handle` connectors that match the port IDs defined in the block definition (`control:`, `data:` prefixes).
   * Keep state updates localized; use `setNodes` from `useReactFlow` to persist configuration changes to the node's `data`.
2. Provide a `Start`-like layout (header, body fields, footer, handles) so the new block feels native.

## 3. Register the node type and palette metadata

1. Wire the component into `apps/frontend/src/nodes/nodeTypes.ts` so React Flow knows which component to render.
2. Add a `NodeDefinition` entry in `apps/frontend/src/nodes/nodeRegistry.ts` describing:
   * Palette group, label, role, description, icon/text for the palette
   * A default position and sensible `defaultData` values (pair, amount, thresholds, etc.)
3. Update `BlockIcon` (`apps/frontend/src/components/BlockIcon.tsx` + `apps/frontend/src/icons/blockIcons.tsx`) if a new visual is needed.
4. If the node should appear when inserting into a control edge, add it to `CONTROL_INSERT_HANDLES` and ensure `FlowCanvas` populates implied edges via `IMPLIED_DATA_EDGES`.

## 4. Land implied data wiring and defaults

- `FlowCanvas` uses `findImpliedDataEdges` to auto-wire ticker prices or order IDs when you connect specific node pairs. Update those tables if your block has predictable data paths.
- Keep `FlowCanvas`'s `handleAddNode` logic aware of nodes that should inherit the active pair or disable the strategy start constraint.

## 5. Add tests and JSON samples

1. Extend `tests/strategy-core/strategy-core.test.ts` with a scenario that exercises the new block through the dry-run executor and asserts outputs/warnings/errors.
2. Update `docs/strategy-json-example.md` (or create a new example) showing the serialized JSON including your block.
3. Run `npm run test` and `npm run typecheck:shared` to verify the addition.

## 6. Document the block

- Update `docs/add-block-guide.md` (this file) to mention the new block, if necessary.
- Consider adding a section to `README.md` under the Strategy Blocks list so newcomers can discover the block's purpose.

### Checklist
- [ ] `blockDefinitions` + handler added in `strategy-core`
- [ ] UI component implemented under `apps/frontend/src/nodes`
- [ ] Node registered via `nodeTypes` and `nodeRegistry`
- [ ] Palette entry configured with icon + default data
- [ ] Implied edges/tidy layout rules updated if needed
- [ ] Tests cover handler outputs and validation errors
- [ ] Documentation updated (`README`, docs, JSON example)
