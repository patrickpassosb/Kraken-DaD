# Minimal dev-friendly image for the Fastify backend.
FROM node:20-slim

WORKDIR /app

# Install dependencies for the shared Kraken client (file dependency).
COPY packages/kraken-client/package*.json packages/kraken-client/
RUN npm ci --prefix packages/kraken-client --omit=dev

# Install backend deps (dev deps kept for tsx loader runtime).
COPY apps/backend/package*.json apps/backend/
RUN npm ci --prefix apps/backend

# Copy source after installs to leverage Docker layer cache.
COPY apps/backend apps/backend
COPY packages/kraken-client packages/kraken-client
COPY packages/strategy-core packages/strategy-core

ENV NODE_ENV=production
EXPOSE 3000

# Run the TypeScript source directly via tsx loader; swap to dist entrypoint if emit is added later.
CMD ["node", "--loader", "tsx", "apps/backend/src/server.ts"]
