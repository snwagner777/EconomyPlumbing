#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Economy Plumbing Services (Next.js)"
echo "================================================"
echo ""

if [ "$NODE_ENV" = "production" ]; then
    echo "🔧 Starting production processes..."
    echo "   (Build should have happened during deployment build phase)"
    echo ""
    
    # Check if .next directory exists
    if [ ! -d ".next" ]; then
        echo "⚠️  WARNING: .next directory not found!"
        echo "   Building now (this should happen during build phase)..."
        npx next build
    fi
    
    # Start Next.js and worker immediately (build already done)
    npx concurrently \
        --names "NEXT,WORKER" \
        --prefix-colors "cyan,magenta" \
        "npx next start -p 5000" \
        "npx tsx server/worker.ts"
else
    echo "🛠️  Development mode - using Next.js dev server..."
    echo ""
    
    npx concurrently \
        --names "NEXT,WORKER" \
        --prefix-colors "cyan,magenta" \
        "npx next dev -p 5000" \
        "npx tsx server/worker.ts"
fi
