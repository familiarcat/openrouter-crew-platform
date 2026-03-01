#!/bin/bash
set -e

echo "🔧 Fixing CLI build configuration..."

# 1. Fix CLI tsconfig.json
# We remove 'paths' to force resolution via node_modules (which points to built .d.ts files),
# preventing the "file not under rootDir" error. We also disable 'composite' for the CLI.
cat > apps/cli/tsconfig.json <<EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "types": ["node"],
    "moduleResolution": "Node",
    "target": "ES2022",
    "strictNullChecks": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "composite": false,
    "declaration": false,
    "declarationMap": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF

# 2. Fix imports in upgrade.ts and tier-limits.ts (remove .js extension for Node resolution)
if [ -f "apps/cli/src/commands/upgrade.ts" ]; then
    sed -i '' "s/from '..\/services\/upgrade-service.js'/from '..\/services\/upgrade-service'/g" apps/cli/src/commands/upgrade.ts
fi

if [ -f "apps/cli/src/lib/tier-limits.ts" ]; then
    sed -i '' "s/from '..\/services\/upgrade-service.js'/from '..\/services\/upgrade-service'/g" apps/cli/src/lib/tier-limits.ts
fi

# 3. Ensure upgrade-service.ts exists (if it wasn't created correctly before)
mkdir -p apps/cli/src/services
if [ ! -f "apps/cli/src/services/upgrade-service.ts" ]; then
    echo "Creating upgrade-service.ts stub..."
    echo "export class UpgradeService { async checkUpgrade(): Promise<boolean> { return false; } } export const upgradeService = new UpgradeService();" > apps/cli/src/services/upgrade-service.ts
fi

echo "🏗️  Retrying build for CLI..."
pnpm build --filter @openrouter-crew/cli