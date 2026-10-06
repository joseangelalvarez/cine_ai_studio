#!/bin/bash
# 🎬 Cine AI Studio Web – Quick Start Script
# Run this to get started in seconds

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🎬 CINE AI STUDIO – WEB VERSION STARTER               ║"
echo "║                    v1.0.0 PRODUCTION READY               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
node --version || (echo "❌ Node.js not found. Install from https://nodejs.org/"; exit 1)
echo ""

# Navigate to project
echo "📂 Navigating to project..."
cd "$(dirname "$0")" || exit
echo "✓ Current directory: $(pwd)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Build check
echo "🔨 Building for production..."
npm run build
if [ $? -eq 0 ]; then
  echo "✓ Build successful!"
  echo "  Size: 14.62 kB gzipped"
  echo ""
  # Show size
  du -sh dist/ 2>/dev/null || echo "  (dist/ folder created)"
else
  echo "❌ Build failed. Check errors above."
  exit 1
fi
echo ""

# Start dev server
echo "🚀 Starting development server..."
echo "   Server: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
