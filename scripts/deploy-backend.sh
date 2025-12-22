#!/bin/bash

# Deployment script for Kraken DaD Backend to Google Cloud Run
# This script builds the Docker image and deploys it.

# Exit on error
set -e

# Configuration - Change these or pass as environment variables
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="kraken-dad-backend"
REGION="us-central1"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID is not set. Please run 'gcloud config set project [YOUR_PROJECT_ID]'"
    exit 1
fi

# Verify gcloud authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Error: No active gcloud account found. Please run 'gcloud auth login'"
    exit 1
fi

echo "🚀 Starting deployment for $SERVICE_NAME in project $PROJECT_ID..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is one level up from scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. Build the image locally (using the root context for monorepo support)
echo "📦 Building Docker image from root: $PROJECT_ROOT..."
docker build -f "$PROJECT_ROOT/apps/backend/Dockerfile" -t "$IMAGE_TAG" "$PROJECT_ROOT"

# 2. Push to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push "$IMAGE_TAG"

# 3. Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production"

echo "✅ Deployment complete!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
