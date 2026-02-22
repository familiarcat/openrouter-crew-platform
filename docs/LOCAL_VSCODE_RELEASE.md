# Local VSCode Extension Release Guide

This guide explains how to package and install the OpenRouter Crew VSCode extension locally without publishing to the marketplace.

## Prerequisites

- Node.js & pnpm installed
- VSCode installed (`code` command available in terminal)

## Quick Release

Run the automated release script from the project root:

```bash
pnpm run release:vscode
# OR
./scripts/release-vscode-local.sh
```

This will:
1. Build the extension
2. Package it into a `.vsix` file
3. Save it to `releases/openrouter-crew-vscode.vsix`

## Installation

### Option 1: Command Line

```bash
code --install-extension releases/openrouter-crew-vscode.vsix
```

### Option 2: VSCode UI

1. Open VSCode
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Click the **...** (Views and More Actions) menu at the top of the sidebar
4. Select **Install from VSIX...**
5. Navigate to `releases/openrouter-crew-vscode.vsix` and select it