# Local Testing Execution Guide

## ✅ Pre-Requisites Complete

All 4 environment files are now configured with live credentials:
- ✅ `apps/unified-dashboard/.env.local`
- ✅ `domains/alex-ai-universal/dashboard/.env.local`
- ✅ `domains/product-factory/project-templates/dj-booking/dashboard/.env.local`
- ✅ `domains/product-factory/projects/test-event-venue/dashboard/.env.local`

**Cost Controls Active**: Mock data mode default, $0.50 VSCode daily budget, Haiku-first routing

---

## Step-by-Step Execution (Run in Terminal)

### Step 1: Build All Packages
```bash
cd /Users/bradygeorgen/Dev/openrouter-crew-platform
pnpm build
```
**Expected**: All 13 packages compile successfully. Turbo caches outputs for future rebuilds.
**Time**: ~2-3 minutes first run

### Step 2: Start All Services
```bash
pnpm dev:full
```
**Expected Output**:
```
✅ ALL SERVICES RUNNING

Service URLs:
  • Web Portal:   http://localhost:3000
  • API Server:   http://localhost:3001
  • DJ Booking:   http://localhost:3002
  • Prod Factory: http://localhost:3003
  • Alex AI:      http://localhost:3004
  • n8n:          http://localhost:5194
  • Supabase:     https://rpkkkbufdwxmjaerbhbn.supabase.co

Press Ctrl+C to stop all services
```

**Time to Ready**: ~30-45 seconds. Script auto-opens browser tabs.

---

## Step 3: Verify Each Dashboard

| URL | Expected | Status Check |
|---|---|---|
| **http://localhost:3000/api/health** | `{"status":"healthy","timestamp":"..."}` | ✅ Unified Dashboard health |
| **http://localhost:3000** | Platform overview + domain metrics grid | ✅ Home page renders |
| **http://localhost:3002** | DJ Booking agent cards (6 static cards) | ✅ Template dashboard |
| **http://localhost:3003** | Minimal placeholder event venue page | ✅ Test event venue |
| **http://localhost:3004** | Alex AI Star Trek landing page | ✅ Alex AI landing |
| **http://localhost:3004/dashboard** | Full dashboard (auth bypassed via mock user) | ✅ Alex AI main UI |

---

## Step 4: Test OpenRouter Connectivity

### Option A: Zero-Cost Mock Data Browse (Recommended First)
1. Navigate to http://localhost:3004/dashboard
2. `NEXT_PUBLIC_USE_MOCK_DATA=true` is active
3. Browse dashboard features without incurring API cost
4. Verify routes, layouts, and Supabase connection work
5. **Cost**: $0

### Option B: Direct OpenRouter Health Check ($0.00001 cost)
```bash
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3-haiku-20240307",
    "messages": [{"role": "user", "content": "Say only: OpenRouter connected"}],
    "max_tokens": 10
  }'
```
**Expected Response**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "OpenRouter connected"
    }
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 3
  }
}
```
**Cost**: ~$0.00001 (3 output tokens on Haiku)

### Option C: Alex AI Real LLM Test ($0.001-0.005 cost)
1. Edit `domains/alex-ai-universal/dashboard/.env.local`
2. Change `NEXT_PUBLIC_USE_MOCK_DATA=false`
3. Restart that app: `pnpm --filter @openrouter-crew/alex-ai-universal-dashboard dev`
4. Navigate to http://localhost:3004/dashboard
5. Trigger an agent interaction (e.g., click "Consult Crew Member")
6. Verify LLM response appears
7. Check VSCode status bar shows cost: `💰 $X.XX / $Y.YY`

### Option D: Product Factory /api/ask (No Cost - Local TF-IDF)
```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the platform architecture?"}'
```
**Expected**: JSON with `answer`, `citations`, `trace` (no LLM call)
**Cost**: $0

---

## Step 5: Build & Install VSCode Extension

### Compile Extension
```bash
pnpm --filter @openrouter-crew/vscode-extension compile
```

### Package for Installation
```bash
pnpm vscode:package
```
Creates `.vsix` file in extension dist folder.

### Install to VSCode
```bash
pnpm vscode:install
```
Launches VSCode and installs the extension locally.

### Configure Extension Settings
**Open VSCode Settings** (`Cmd+,` on Mac, `Ctrl+,` on Linux/Windows):

Search for `openrouterCrew` and set:
```
openrouterCrew.apiKey = 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
openrouterCrew.budget.daily = 0.50
openrouterCrew.model.simple = anthropic/claude-3-haiku-20240307
```

### Test Extension LLM Connectivity
1. **Open Crew Chat**: `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
2. **Type message**: "Hello, confirm you are connected through OpenRouter"
3. **Verify response** appears in chat panel
4. **Check status bar** (bottom right): Should show `💰 $X.XX / $0.50`
5. **Verify model used**: Should be Haiku (cheapest)

### Export Cost Report
1. **Open Command Palette**: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P`
2. **Search**: "OpenRouter Crew: Export Cost Report"
3. **Inspect JSON** to verify:
   - `model` = `anthropic/claude-3-haiku-20240307`
   - `estimatedCostUsd` < $0.001 per request
   - `dailyTotal` < $0.50 (budget respected)

---

## Cost Tracking & Validation

After all tests, verify cost controls:

```bash
# Check VSCode extension cost tracking
open ~/.config/Code/User/globalState.json  # Mac/Linux
# or: %APPDATA%\Code\User\globalState.json  # Windows

# Look for keys containing "openrouter" + "cost"
# Expected: dailyTotal < $0.50
```

**Platform Goals Validated**:
- ✅ Model routing selects Haiku (cheapest viable)
- ✅ Budget enforcer blocks requests over limit
- ✅ Real OpenRouter connectivity confirmed
- ✅ Total test cost < $0.01

---

## Troubleshooting

### Issue: Port Already in Use
```bash
bash scripts/system/cleanup-ports.sh
# Kills processes on ports 3000-3004, 5194
# Then retry: pnpm dev:full
```

### Issue: TypeScript Build Errors
```bash
# Regenerate TypeScript configs (known issue)
pnpm fix:tsconfig

# Rebuild
pnpm build
```

### Issue: Supabase Connection Fails
The script detects `NEXT_PUBLIC_SUPABASE_URL` is remote → skips local Supabase.
If remote connection fails, check:
- Supabase project is active at `https://app.supabase.com`
- VPN/firewall not blocking `rpkkkbufdwxmjaerbhbn.supabase.co`

### Issue: n8n Startup Warning
The `docker-compose.yml` file is missing from the repo (non-blocking).
n8n is optional for this test. Script continues without it.
To fix: Create `docker-compose.yml` with n8n service or skip (`Ctrl+C` to stop, doesn't affect dashboards).

---

## Next: Predictive Forecasting

Once all dashboards are running and OpenRouter connectivity is verified, use the **comprehensive LLM forecasting prompt** (see `LLM_PLATFORM_FORECAST_PROMPT.md`) to generate predictive analysis about the platform's viability as a functional AI business model.

The prompt works with both Claude and Gemini and provides:
- Full codebase context (architecture, cost model, feature completeness)
- 26 specific analytical questions
- Structured output for executive decisions
- Risk/opportunity assessment
- Go/no-go recommendations for scaling
