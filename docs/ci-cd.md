# CI/CD overview

This repo now uses two focused GitHub Actions workflows:

1. **`ci.yml`** – PR/main validation
   - Triggers on PRs, pushes to `main`/`master`, and manual `workflow_dispatch`.
   - Skips docs/assets-only changes for faster feedback.
   - Separate jobs for shared packages (TypeScript check via `tsconfig.shared.json`), backend build, and frontend build. All steps use Node 20 with npm caching keyed to the relevant `package-lock.json` files.
   - Frontend is built (tsc + Vite) but not deployed because Vercel already handles production deploys.

2. **`backend-cd.yml`** – optional backend packaging
   - Manual-only workflow so deploys stay opt-in and demo-safe.
   - Reuses the same install/build steps as CI.
   - Optional Docker image build (disabled by default) produces a tarball artifact for Cloud Run/App Runner or other registries when enabled.

## Deployment notes
- The frontend remains Vercel-managed; CI catches type/build issues before Vercel promotes a build.
- Backend Dockerfile (`apps/backend/Dockerfile`) runs the Fastify server via `tsx` for a minimal dev-friendly image. Replace the command with a compiled `dist` entrypoint if emit is added later.
