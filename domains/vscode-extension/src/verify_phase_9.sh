#!/bin/bash
# domains/vscode-extension/src/verify_phase_9.sh

set -e

echo "🏗️  Rebuilding extension to compile new tool structure..."
pnpm build --filter @openrouter-crew/vscode-extension

echo "🧪 Running Agent Network tests..."
# We filter for the specific test file to reduce noise, assuming the test runner supports it,
# otherwise we run all tests for the extension.
pnpm test --filter @openrouter-crew/vscode-extension