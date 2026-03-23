#!/bin/bash

# ==============================================================================
# N8N Workflow Generator
# 
# Scans TypeScript MCP server definitions for N8nBridge usage and
# generates corresponding n8n workflow JSON files.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

echo "🚀 Starting N8N Workflow Generator..."

# Run the Node.js generator script
node "$SCRIPT_DIR/n8n/generate-workflows.js"