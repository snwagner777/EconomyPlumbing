#!/bin/bash
# Production startup script for Next.js + Background Worker
# This replaces the old Express/Vite setup

set -e

echo "🚀 Starting Economy Plumbing Services (Next.js)"
echo "================================================"

# Start Next.js on port 5000 and worker in parallel
npx concurrently \
  --names "NEXT,WORKER" \
  --prefix-colors "blue,green" \
  --kill-others \
  "npx next start -p 5000" \
  "npx tsx server/worker.ts"
