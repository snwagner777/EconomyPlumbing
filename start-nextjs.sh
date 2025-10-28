#!/bin/bash
# Start Next.js Development Server (Port 3000)
# Production site stays on Express (Port 5000)

echo "🚀 Starting Next.js Migration Testing Server..."
echo ""
echo "📍 Next.js will run on: http://localhost:3000"
echo "✅ Production site unaffected (still on Express)"
echo ""
echo "Press Ctrl+C to stop Next.js and return to Express"
echo "---------------------------------------------------"
echo ""

NODE_ENV=development npx next dev -p 3000
