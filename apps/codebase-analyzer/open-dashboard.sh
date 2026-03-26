#!/bin/bash

# Open Dashboard Script - Opens the codebase analyzer dashboard in the default browser

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_PATH="$SCRIPT_DIR/output/index.html"

if [ ! -f "$DASHBOARD_PATH" ]; then
    echo "Error: Dashboard not found at $DASHBOARD_PATH"
    echo "Run 'pnpm generate' first to create the dashboard."
    exit 1
fi

# Get absolute path
ABSOLUTE_PATH="file://$(cd "$SCRIPT_DIR" && pwd)/output/index.html"

echo "Opening dashboard..."
echo "URL: $ABSOLUTE_PATH"

# Open in default browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$ABSOLUTE_PATH"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "$ABSOLUTE_PATH"
    else
        echo "Could not determine how to open browser on Linux"
        echo "Please open the dashboard manually: $ABSOLUTE_PATH"
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "$ABSOLUTE_PATH"
else
    echo "Unsupported OS: $OSTYPE"
    echo "Please open the dashboard manually: $ABSOLUTE_PATH"
fi
