# VSCode Extension Setup & Testing Guide

**OpenRouter Crew Platform VSCode Extension**

---

## Prerequisites

- VSCode 1.85.0 or later
- Node.js 18+
- `crew` CLI installed and accessible from PATH
- Environment variables configured (see below)

---

## Environment Setup

Create or update your `.env.local` file in the project root:

```bash
# Required for extension
SUPABASE_URL=https://your-supabase.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
N8N_URL=https://n8n.yourdomain.com
N8N_API_KEY=your-n8n-api-key

# Optional
MCP_URL=http://localhost:3000/api/mcp
DEBUG=false
```

---

## Building the Extension

### Step 1: Install Dependencies

```bash
cd domains/alex-ai-universal/vscode-extension
npm install
```

### Step 2: Build TypeScript

```bash
npm run build
```

This compiles `src/**/*.ts` to `dist/` directory.

### Step 3: Package Extension

```bash
npm run package
```

This creates `openrouter-crew-0.1.0.vsix` package.

---

## Installation & Testing

### Option A: Install Locally (Development)

```bash
# Install in VSCode from package
code --install-extension openrouter-crew-0.1.0.vsix

# Or install directly from source
cd domains/alex-ai-universal/vscode-extension
npm run build

# Then open VSCode to the project root
code .

# Press Ctrl+F5 (or Cmd+F5 on Mac) to open Extension Development Host
# This opens a new VSCode window with the extension loaded
```

### Option B: Load as Extension

In VSCode, go to Extensions (Ctrl+Shift+X), click the `...` menu, and select "Install from VSIX".

---

## Testing the Extension

### Test 1: Verify Extension Activation

**Expected:** You should see "Crew Platform" in the Activity Bar (left sidebar).

```
✓ Activity Bar shows "Crew Platform" icon
✓ Sidebar opens with three panels:
  - Crew Status
  - Cost Breakdown
  - Projects
```

### Test 2: Check Status Bar

**Expected:** Cost meter appears in the status bar (bottom left).

```
Status Bar should show:
💰 $0.00 / $100.00 (0%)
```

Click on it to open the cost report.

### Test 3: Open Command Palette

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and search for "Crew":

```
Available commands:
- Crew: Show Crew Roster
- Crew: Consult Crew Member
- Project: Create Project
- Project: Create Feature
- Cost: Show Cost Report
- Cost: Optimize Costs
```

### Test 4: Run Crew Command

1. Open Command Palette (`Ctrl+Shift+P`)
2. Search for "Crew: Show Crew Roster"
3. Press Enter

**Expected Output:**
- Information message shows "Crew roster loaded"
- Crew Status tree view updates with crew members
- Shows member name, role, and status

### Test 5: Consult Crew Member

1. Open Command Palette
2. Search for "Crew: Consult Crew Member"
3. Enter crew member name: `picard`
4. Enter task: `What is the strategic priority?`

**Expected Output:**
- Shows information message with response
- Cost is calculated

### Test 6: View Cost Report

1. Click on status bar cost meter (bottom left)
2. Or use Command Palette → "Cost: Show Cost Report"

**Expected:**
- Webview opens with formatted cost report
- Shows total, daily average, and breakdown by crew member

### Test 7: Create Feature

1. Open Command Palette
2. Search for "Project: Create Feature"
3. Enter feature name: `Dark Mode`
4. Enter description (optional): `Add dark/light theme`
5. Enter budget (optional): `100`

**Expected:**
- Information message confirms creation
- Projects tree updates

---

## Debugging

### Enable Debug Logging

In VSCode Settings (`Ctrl+,`):

```json
{
  "openrouter-crew.refreshInterval": 5000,
  "[debug]": true
}
```

### View Extension Output

Open the Output panel:
1. View → Output (or Ctrl+Shift+U)
2. Select "Crew Platform" from dropdown

**Expected Output:**
```
✓ OpenRouter Crew Platform extension activated
$ crew crew roster --json
Response: [...]
```

### Check CLI Integration

Verify the `crew` CLI is accessible:

```bash
# In terminal
which crew
crew --version

# Should output: 1.0.0
```

If not found, configure in VSCode Settings:

```json
{
  "openrouter-crew.cliPath": "/path/to/crew"
}
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to MCP server"

**Solution:**
```bash
# Verify MCP server is running
curl http://localhost:3000/api/mcp/status

# If not running, start it
cd domains/alex-ai-universal/dashboard
pnpm dev
```

### Issue: "crew command not found"

**Solution:**
1. Build CLI: `pnpm --filter @openrouter-crew/cli build`
2. Link globally: `npm link apps/cli`
3. Or set path in settings: `"openrouter-crew.cliPath": "/full/path/to/crew"`

### Issue: Tree views not updating

**Solution:**
1. Check refresh interval in settings (default: 5000ms)
2. Try manually refreshing: Click the refresh icon in tree view header
3. Check Extension Output for errors

### Issue: Webview not loading

**Solution:**
1. Check browser console (F12 in webview)
2. Verify Supabase connection
3. Check Extension Output for errors

---

## Performance Tuning

### Adjust Refresh Rate

In VSCode Settings:

```json
{
  "openrouter-crew.refreshInterval": 10000  // 10 seconds instead of 5
}
```

Slower intervals use less CPU but may miss updates.

### Increase CLI Timeout

In VSCode Settings:

```json
{
  "openrouter-crew.cliTimeout": 60000  // 60 seconds
}
```

---

## Unit Tests

Run tests for the extension:

```bash
cd domains/alex-ai-universal/vscode-extension
npm test
```

---

## Packaging for Distribution

### Create Release Package

```bash
npm run build
npm run package
```

This creates `openrouter-crew-0.1.0.vsix`.

### Publish to VSCode Marketplace (Optional)

```bash
npm run publish
```

Requires VSCode Personal Access Token.

---

## Next Steps

1. **Test basic functionality** - Follow tests 1-7 above
2. **Configure settings** - Adjust refresh intervals and timeouts
3. **Enable debug logging** - Troubleshoot if needed
4. **Provide feedback** - File issues in GitHub

---

## Architecture Overview

```
VSCode Extension
├── extension.ts (entry point)
├── services/
│   └── cli-executor.ts (spawns crew CLI)
├── views/
│   └── cost-meter-status-bar.ts (budget display)
├── providers/
│   ├── crew-tree-provider.ts
│   ├── cost-tree-provider.ts
│   └── project-tree-provider.ts
└── commands/
    └── index.ts (command registration)
```

All commands spawn the `crew` CLI and parse JSON output.

---

**Status:** Ready for Testing
**Last Updated:** 2026-02-03
**Version:** 0.1.0
