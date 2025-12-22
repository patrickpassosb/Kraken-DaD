# CI/CD overview

The repository uses two GitHub Actions workflows:

## `ci.yml` — validation for every push/PR

This workflow runs automatically on pushes and pull requests, but it skips docs/assets-only commits to keep feedback fast. Each job uses Node.js 20 and reuses `package-lock.json` caching.

1. **Shared package type checks** (`npm exec --prefix apps/backend -- tsc -p tsconfig.shared.json`)
   - Verifies the shared workspace typings without rebuilding the backend.
   - Runs in its own job so changes to `packages/strategy-core` or `packages/kraken-client` fail fast.
2. **Backend build** (`apps/backend`) and **Frontend build** (`apps/frontend`)
   - Each job checks out the repo, installs dependencies via `npm ci`, and runs `npm run build` inside the respective package.
   - The frontend build is a Vite build that also type-checks the UI, keeping production assets “build ready.”

## `backend-cd.yml` — optional backend packaging

This workflow is manual (`workflow_dispatch`) and can also run on push events.
- It shares the same Node.js setup and install steps as `ci.yml`.
- Runs `npm run build` inside `apps/backend` (TypeScript no-emit plus sanity checks).
- When `build_image` is true, it builds `apps/backend/Dockerfile` locally, tags the image, and exports it to a tarball artifact for manual deployment (Cloud Run, App Runner, etc.). This keeps deployments opt-in while still providing a reproducible artifact.

### Key principles

- **Caching**: All jobs cache npm dependencies via `actions/setup-node@v4` using `package-lock.json`.
- **Separation**: Shared workspace validation runs separately from frontend/backend builds, so cross-package issues surface early.
- **Manual deploys**: Docker packaging is optional to keep everyday PRs fast while still supporting controlled releases.
