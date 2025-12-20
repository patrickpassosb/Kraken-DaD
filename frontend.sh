#!/usr/bin/env bash
set -euo pipefail

cd apps/frontend

npm run build
npm run dev
