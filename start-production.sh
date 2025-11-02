#!/bin/bash
# Production start script (build happens during deployment build phase)

set -e

echo "🚀 Starting Economy Plumbing Services (Production)"
echo "=================================================="
echo ""

# Verify build was completed
if [ ! -d ".next" ]; then
    echo "❌ ERROR: .next directory not found!"
    echo "   Build should have completed during deployment."
    exit 1
fi

echo "✅ Build verified (.next directory found)"
echo "🔧 Starting Next.js and background worker..."
echo ""

# Start server immediately (no building)
npx concurrently \
  --names "NEXT,WORKER" \
  --prefix-colors "cyan,magenta" \
  "npx next start -p 5000" \
  "npx tsx server/worker.ts"
