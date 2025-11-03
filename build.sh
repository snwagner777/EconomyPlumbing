#!/bin/bash
set -e

echo "🏗️  Building Economy Plumbing (Production)"
echo "=========================================="

# Clean previous build
rm -rf .next

# Run production build with Webpack (not Turbopack)
NODE_ENV=production npx next build

echo ""
echo "✅ Production build complete!"
echo "   JavaScript minified, compressed, and optimized"
