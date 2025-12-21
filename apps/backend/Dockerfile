# Minimal dev-friendly image for the Fastify backend.
FROM node:20-slim

WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json ./

# Copy workspace component manifests (to allow npm ci to link them)
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/kraken-client/package.json packages/kraken-client/
COPY packages/strategy-core/package.json packages/strategy-core/

# Install dependencies from root (hoist strategy)
RUN npm ci

# Copy source after installs to leverage Docker layer cache.
COPY apps/backend apps/backend
COPY packages/kraken-client packages/kraken-client
COPY packages/strategy-core packages/strategy-core

ENV NODE_ENV=production
EXPOSE 3000

# Run the TypeScript source directly via tsx loader; swap to dist entrypoint if emit is added later.
CMD ["node", "--loader", "tsx", "apps/backend/src/server.ts"]
