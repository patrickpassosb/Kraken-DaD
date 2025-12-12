# Task: Implement Fastify API Layer

## 1. Task Overview

**Title:** Implement Fastify HTTP API Layer

**Goal:** Create a minimal Fastify API exposing the dry-run execution engine via POST /execute/dry-run.

---

## 2. Success Criteria

- [x] Create `apps/backend/` directory structure
- [x] Implement Fastify server with single endpoint
- [x] POST /execute/dry-run accepts Strategy JSON, returns ExecutionResult
- [x] No auth, no database, no WebSockets
- [x] TypeScript only

---

## 3. Files Created

| File | Purpose |
|------|---------|
| `apps/backend/package.json` | Dependencies (fastify, tsx, typescript) |
| `apps/backend/tsconfig.json` | TypeScript config |
| `apps/backend/src/server.ts` | Fastify server entry point |
| `apps/backend/src/routes/execute.ts` | POST /execute/dry-run route |

---

## 4. Endpoints

### GET /health
Returns `{ status: "ok", timestamp: "..." }`

### POST /execute/dry-run
- **Request:** `{ strategy: Strategy }`
- **Response:** `ExecutionResult`

---

## 5. Task Status

✅ Complete
