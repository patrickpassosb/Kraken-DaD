#!/usr/bin/env bash
set -euo pipefail

cd apps/backend

npm run build
npm run dev
