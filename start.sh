#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Economy Plumbing Services (Next.js)"
echo "================================================"
echo ""

if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Production mode detected - building Next.js..."
    npx next build
    
    echo ""
    echo "🔧 Starting processes..."
    echo ""
    
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
