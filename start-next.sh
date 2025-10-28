#!/bin/bash
# Start Next.js + Worker concurrently for development

echo "Starting Next.js development server..."
npx next dev &
NEXT_PID=$!

echo "Starting background worker..."
npx tsx server/worker.ts &
WORKER_PID=$!

# Cleanup on exit
trap "kill $NEXT_PID $WORKER_PID 2>/dev/null" EXIT

wait
