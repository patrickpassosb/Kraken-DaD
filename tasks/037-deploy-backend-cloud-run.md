# Task: Deploy Backend to Google Cloud Run [COMPLETED]

## 1. Task Overview

### Task Title
**Title:** Deploy Backend Service to Google Cloud Run

### Goal Statement
**Goal:** Configure the backend service (`apps/backend`) for production deployment on Google Cloud Run. This includes updating the build process, Docker configuration, and providing a convenient deployment script.

---

## 2. Project Analysis & Current State

### Technology & Architecture
- **Runtime:** Node.js (v18/v20)
- **Framework:** Fastify (implied by `apps/backend` structure)
- **Language:** TypeScript
- **Infrastructure:** Docker, Google Cloud Run

### Current State
- `apps/backend/Dockerfile` uses `tsx` for running the app, which is not optimized for production.
- `apps/backend/tsconfig.json` has `"noEmit": true`, preventing compilation to JS.
- CI/CD workflow exists but is incomplete for Cloud Run.
- No direct deployment script exists for manual/easy deployment.

## 3. Context & Problem Definition

### Problem Statement
The current backend setup is optimized for local development (hot reload, direct TS execution). For Cloud Run, we need a lightweight, production-ready container that runs compiled JavaScript, respects container constraints (ports, memory), and is easy to deploy.

### Success Criteria
- [x] `apps/backend/Dockerfile` is updated to a multi-stage build (build TS -> run JS).
- [x] `apps/backend/tsconfig.json` is updated to allow emitting files to `dist/`.
- [x] `apps/backend/package.json` includes correct `build` and `start` scripts.
- [x] A `scripts/deploy-backend.sh` script is created to automate `gcloud` deployment commands.
- [x] Documentation provided on how to use the deployment script.

---

## 5. Technical Requirements

### Functional Requirements
- The Docker image must be as small as possible (using `node:slim` or `alpine`).
- The application must listen on the port defined by `PORT` env var (default 8080 for Cloud Run).
- Deployment script should handle image building and pushing to GCR/Artifact Registry and deploying to Cloud Run.

### Non-Functional Requirements
- **Security:** Do not commit service account keys. Use `gcloud` CLI authentication.
- **Performance:** Optimized startup time (avoid `tsx` in prod).

---

## 9. Implementation Plan

### Phase 1: Configuration Updates
1.  **Update `apps/backend/tsconfig.json`**: Set `noEmit: false`, `outDir: "dist"`.
2.  **Update `apps/backend/package.json`**: Ensure `build` runs `tsc` and `start` runs `node dist/server.js`.
3.  **Update `apps/backend/Dockerfile`**: Convert to multi-stage build.

### Phase 2: Deployment Script
1.  **Create `scripts/deploy-backend.sh`**:
    - Check for `gcloud` installation.
    - Build Docker image.
    - Push to Google Container Registry (gcr.io) or Artifact Registry.
    - Run `gcloud run deploy`.

### Phase 3: Documentation
1.  **Update `docs/deployment.md`**: Add instructions for backend deployment.

---

## 11. File Structure & Organization

- Modify: `apps/backend/tsconfig.json`
- Modify: `apps/backend/package.json`
- Modify: `apps/backend/Dockerfile`
- Create: `scripts/deploy-backend.sh`
- Create/Modify: `docs/deployment.md`
