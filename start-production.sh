#!/bin/bash
# Production build and start script

set -e

echo "🏗️  Building Next.js for production..."
npx next build

echo "🚀 Starting production server..."
npx concurrently \
  --names "NEXT,WORKER" \
  --prefix-colors "blue,green" \
  --kill-others \
  "npx next start -p 5000" \
  "npx tsx server/worker.ts"
