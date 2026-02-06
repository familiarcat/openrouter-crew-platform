#!/bin/bash
# ==============================================================================
# Fix missing dependencies for Alex AI Universal Dashboard
# ==============================================================================

echo "📦 Installing missing dependencies..."

pnpm --filter @openrouter-crew/alex-ai-universal-dashboard add \
  next-auth \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  reactflow \
  mermaid \
  @tailwindcss/postcss \
  postcss \
  @supabase/supabase-js \
  zod \
  socket.io \
  socket.io-client \
  @sentry/nextjs

echo "✅ Dependencies installed. Run 'pnpm build' to retry."