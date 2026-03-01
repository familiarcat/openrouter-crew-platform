#!/bin/bash
# domains/vscode-extension/src/fix_build.sh

set -e

echo "🔧 Fixing tsconfig.json..."
# Remove the invalid ignoreDeprecations line which causes TS5103
sed -i '' '/"ignoreDeprecations": "6.0"/d' domains/vscode-extension/tsconfig.json

echo "✅ Fixed tsconfig.json configuration"

# Re-run the verification script
./domains/vscode-extension/src/verify_phase_9.sh