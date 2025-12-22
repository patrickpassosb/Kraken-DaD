# Production Dockerfile for Kraken DaD Backend
# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json ./

# Copy workspace component manifests
COPY apps/backend/package.json apps/backend/
COPY packages/kraken-client/package.json packages/kraken-client/
COPY packages/strategy-core/package.json packages/strategy-core/

# Install dependencies (links the workspaces)
RUN npm ci

# Copy sources for backend and packages
COPY apps/backend apps/backend
COPY packages/kraken-client packages/kraken-client
COPY packages/strategy-core packages/strategy-core

# Build the backend and packages
RUN npm run build

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Copy root manifests
COPY package.json package-lock.json ./

# Copy workspace component manifests for production install
COPY apps/backend/package.json apps/backend/
COPY packages/kraken-client/package.json packages/kraken-client/
COPY packages/strategy-core/package.json packages/strategy-core/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Also copy the package sources because our packages are "index.ts" based
# and we are running them via NodeNext resolution which might need the .ts files 
# if they are not compiled to JS in their own folders.
# Actually, since we want production, we should ideally compile the packages too.
# For now, copying them is a safe bet for a demo.
COPY --from=builder /app/packages /app/packages

# Set environment
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run the app
# Use -w to set workspace if running from root, or just point to server.js
CMD ["node", "apps/backend/dist/server.js"]
