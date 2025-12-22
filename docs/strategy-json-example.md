# Strategy JSON Example

The Kraken DaD executor expects a strict schema defined in `packages/strategy-core/schema.ts` (see `SCHEMA_VERSION`). A payload includes a `version`, descriptive `metadata`, a node list, and the control/data `edges` that drive execution. The JSON below represents a simple flow: start → ticker → condition → place order.

```json
{
  "version": 1,
  "metadata": {
    "name": "Kraken Strategy Definition",
    "description": "Example strategy",
    "createdAt": "2024-12-20T00:00:00.000Z",
    "updatedAt": "2024-12-20T00:00:00.000Z"
  },
  "nodes": [
    {
      "id": "start-1",
      "type": "control.start",
      "config": {},
      "position": { "x": 320, "y": 220 }
    },
    {
      "id": "ticker-1",
      "type": "data.kraken.ticker",
      "config": { "pair": "BTC/USD" },
      "position": { "x": 520, "y": 220 }
    },
    {
      "id": "if-1",
      "type": "logic.if",
      "config": { "comparator": ">", "threshold": 90000 },
      "position": { "x": 760, "y": 220 }
    },
    {
      "id": "order-1",
      "type": "action.placeOrder",
      "config": { "pair": "BTC/USD", "side": "buy", "type": "market", "amount": 0.1 },
      "position": { "x": 1000, "y": 220 }
    }
  ],
  "edges": [
    {
      "id": "e-start-ticker",
      "type": "control",
      "source": "start-1",
      "sourcePort": "out",
      "target": "ticker-1",
      "targetPort": "in"
    },
    {
      "id": "e-ticker-if",
      "type": "control",
      "source": "ticker-1",
      "sourcePort": "out",
      "target": "if-1",
      "targetPort": "in"
    },
    {
      "id": "e-if-order",
      "type": "control",
      "source": "if-1",
      "sourcePort": "true",
      "target": "order-1",
      "targetPort": "trigger"
    },
    {
      "id": "e-ticker-if-price",
      "type": "data",
      "source": "ticker-1",
      "sourcePort": "price",
      "target": "if-1",
      "targetPort": "condition"
    },
    {
      "id": "e-ticker-order-price",
      "type": "data",
      "source": "ticker-1",
      "sourcePort": "price",
      "target": "order-1",
      "targetPort": "price"
    }
  ]
}
```

### Metadata
- `version` must match `SCHEMA_VERSION`. When `strategy-core` increments the schema, serializers like `toStrategyJSON` bump the value automatically.
- `metadata` captures a human-friendly name/description plus `createdAt`/`updatedAt` timestamps.

### Nodes
Each node entry contains
- `id`: unique identifier used by edges and logs
- `type`: block id (`control.*`, `data.*`, `logic.*`, `action.*`)
- `config`: node-specific settings (pair, thresholds, amount, etc.)
- `position`: React Flow coordinates for UI persistence

### Edges
- **Control edges** (type `control`) determine execution order. `sourcePort`/`targetPort` map to handle IDs like `control:out` and `control:in`.
- **Data edges** (type `data`) move values (price, spread, order IDs). `sourcePort`/`targetPort` drop the `data:` prefix in the schema; e.g., `price` in the example above.
- Each edge must reference existing node IDs and valid port names, otherwise the dry-run executor emits a `PORT_NOT_FOUND` error.

### Partial execution & validation
- `executeStrategy` can pass `targetNodeId` to only run the subgraph that leads into a specific node (via `collectDependencyNodes`).
- The backend honors `validate=true` by calling Kraken `validateAddOrder`/`validateCancelOrder` before the UI receives `krakenValidations`.

See `docs/execution-lifecycle.md` for a complete list of validation errors, warnings, and action intent structures associated with this JSON payload.
