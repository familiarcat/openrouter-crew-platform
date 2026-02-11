#!/bin/bash

# Fix missing lucide-react dependencies across all UI workspaces
# Usage: bash scripts/system/fix-lucide-deps.sh

echo "Installing lucide-react in shared-ui-components..."
pnpm --filter "./domains/shared/ui-components" add lucide-react

echo "Installing lucide-react in unified-dashboard..."
pnpm --filter "unified-dashboard" add lucide-react

echo "Installing lucide-react in product-factory dashboard..."
pnpm --filter "./domains/product-factory/dashboard" add lucide-react

echo "Installing lucide-react in dj-booking dashboard..."
pnpm --filter "./domains/dj-booking/dashboard" add lucide-react

echo "Installing lucide-react in alex-ai-universal dashboard..."
pnpm --filter "./domains/alex-ai-universal/dashboard" add lucide-react

echo "✅ lucide-react installed across all UI domains."