#!/bin/bash
# Build script for deployments
# This runs BEFORE the app starts

set -e

echo "📦 Building Next.js for production..."
npx next build

echo "✅ Build complete! .next directory ready"
