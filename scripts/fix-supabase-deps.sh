#!/bin/bash
# ==============================================================================
# Fix Supabase Dependencies
# ==============================================================================

# The root package.json contains 'supabase' (the CLI tool), but the dashboards
# require '@supabase/supabase-js' (the client library) to be installed directly
# in their respective workspaces to resolve imports correctly.

echo "📦 Installing @supabase/supabase-js client library..."

pnpm --filter @openrouter-crew/product-factory-dashboard add @supabase/supabase-js

echo "✅ Dependencies installed. Run 'pnpm build' to retry."