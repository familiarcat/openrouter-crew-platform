#!/bin/bash
# Master Entry Command: Phased execution of all monorepo stabilization steps
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

echo "🚀 PHASE 1: Structural Repair (apply-cascading-fixes.sh)"
bash "$SCRIPT_DIR/apply-cascading-fixes.sh"

echo "🚀 PHASE 2: Refreshing AI Context (orient)"
cd "$ROOT_DIR"
pnpm orient

echo "🚀 PHASE 3: Generating Agent Registry"
pnpm generate:registry

echo "🚀 PHASE 4: Building VSCode Extension"
pnpm build:vscode

echo "🚀 PHASE 5: Build Verification"
pnpm turbo run build --filter="@openrouter-crew/shared-*"

echo "✅ ALL PHASES COMPLETE."
echo "--------------------------------------------------"
echo "ARCHITECTURE VISUALIZATION:"
cat "$SCRIPT_DIR/monorepo-map.md" | grep -A 20 "Structural Architecture"
echo "--------------------------------------------------"
echo "TO START LOCAL DEVELOPMENT:"
echo "run: pnpm dev:universal"
echo ""
echo "TO RUN AUTONOMOUS REFACTOR:"
echo "run: ./scripts/orchestrator.sh \"Your task description\""

# Final Check: Verify .d.ts emission
SCHEMA_DTS="$ROOT_DIR/domains/shared/schemas/dist/index.d.ts"
if [ -f "$SCHEMA_DTS" ]; then
    echo "📊 Integrity Verified: Shared types generated at $SCHEMA_DTS"
else
    echo "❌ Integrity Failure: Shared types missing. Check maintenance logs."
    exit 1
fi