#!/bin/bash
# ==============================================================================
# Fix missing dependencies for Alex AI Universal Dashboard
# ==============================================================================

echo "📦 Installing missing dependencies..."

pnpm --filter domains/alex-ai-universal/dashboard add \
  next-auth \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  reactflow

echo "✅ Dependencies installed. Run 'pnpm build' to retry."