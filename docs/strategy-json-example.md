# Strategy JSON Example

This is a minimal strategy payload that runs a Kraken ticker → condition → place order flow.

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

Notes:
- `sourcePort`/`targetPort` values are port IDs without the `control:`/`data:` prefixes.
- Control edges drive execution order; data edges move values between nodes.
