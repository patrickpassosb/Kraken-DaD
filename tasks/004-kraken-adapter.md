# Task: Implement Kraken API Adapter

## 1. Task Overview

**Title:** Implement Kraken API Adapter

**Goal:** Create a minimal Kraken API adapter interface and REST implementation for public market data.

---

## 2. Success Criteria

- [x] Create `krakenAdapter.ts` with interface
- [x] Create `krakenRestAdapter.ts` with REST implementation
- [x] Use Kraken public `/0/public/Ticker` endpoint
- [x] Return normalized `KrakenTicker` object
- [x] No side effects beyond HTTP calls

---

## 3. Constraints

- TypeScript only
- No UI, Fastify, database, auth
- No order execution
- Public API only
- Dry-run compatible

---

## 4. Files Created

| File | Purpose |
|------|---------|
| `packages/strategy-core/kraken/krakenAdapter.ts` | Interface + `KrakenTicker` type |
| `packages/strategy-core/kraken/krakenRestAdapter.ts` | REST implementation |

---

## 5. Task Status

✅ Complete
