# Local Development & Testing Guide

**Complete Setup for Running All Services Locally**

Date: February 10, 2026
Status: Ready for Local Development Testing

---

## 🎯 Quick Start Overview

This guide shows you how to run all 5 surfaces locally and test them together:
1. ✅ CLI Interface
2. ✅ Web Portal (Next.js)
3. ✅ VSCode Extension
4. ✅ n8n Workflows
5. ✅ Supabase (Database)

---

## 📋 Prerequisites

### Required Software
```bash
# Verify installations
node --version      # v18+ required
npm --version       # v9+ required
pnpm --version      # Package manager
git --version       # Version control
```

### Install if missing:
```bash
# macOS
brew install node pnpm

# Linux
sudo apt install nodejs npm
npm install -g pnpm

# Windows
# Download from https://nodejs.org and https://pnpm.io
```

---

## 🏗️ Architecture for Local Development

```
┌─────────────────────────────────────────────────┐
│         Local Development Environment            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Your Machine                                   │
│  ├─ Localhost:3000 → Web Portal                 │
│  ├─ Localhost:5173 → Vite Dev Server            │
│  ├─ Localhost:5194 → n8n                        │
│  ├─ Localhost:5432 → Supabase (PostgreSQL)      │
│  ├─ CLI Binary → Terminal                       │
│  └─ VSCode Extension → VSCode Editor            │
│                                                  │
│  All Services Share: Local SQLite/PostgreSQL    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 📦 Part 1: Core Infrastructure Setup

### Step 1: Clone & Navigate to Project
```bash
cd /Users/bradygeorgen/Dev/openrouter-crew-platform

# Verify git status
git status

# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

### Step 2: Create Local Environment Files

#### `.env.local` - Root Configuration
```bash
# Create the file
cat > .env.local << 'EOF'
# Environment
NODE_ENV=development
ENVIRONMENT=local

# API Configuration
API_PORT=3000
API_HOST=localhost

# Database - Supabase Local
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/openrouter_crew

# n8n Configuration
N8N_URL=http://localhost:5194
N8N_API_KEY=your_n8n_api_key_here

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ARCHIVAL=true
ENABLE_COST_TRACKING=true

# Logging
LOG_LEVEL=debug
EOF
```

#### `apps/cli/.env.local` - CLI Configuration
```bash
cat > apps/cli/.env.local << 'EOF'
API_URL=http://localhost:3000/api
LOG_LEVEL=debug
EOF
```

#### `apps/unified-dashboard/.env.local` - Web Portal
```bash
cat > apps/unified-dashboard/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_LOG_LEVEL=debug
EOF
```

---

## 🗄️ Part 2: Database Setup (Supabase Local)

### Option A: Use Supabase CLI (Recommended)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start Supabase local development environment
supabase start

# Expected output:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:5432/openrouter_crew
# GraphQL URL: http://localhost:54321/graphql/v1
```

### Option B: Use Docker Compose

```bash
# Start PostgreSQL in Docker
docker-compose up -d supabase

# Verify connection
psql -h localhost -U postgres -d openrouter_crew -c "SELECT 1;"

# Expected: returns (1)
```

### Step 3: Initialize Database Schema

```bash
# Run migrations
pnpm run db:migrate

# Seed initial data
pnpm run db:seed

# Verify tables created
psql -h localhost -U postgres -d openrouter_crew -c "\dt"
```

---

## 🖥️ Part 3: Run Each Service Locally

### Service 1: Core API Server

```bash
# Terminal 1: Start API Server
cd apps/api
pnpm dev

# Expected output:
# ✓ Server running on http://localhost:3000
# ✓ API ready at http://localhost:3000/api
# ✓ Health check available at http://localhost:3000/health
```

**Test the API:**
```bash
# In another terminal
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

---

### Service 2: Web Portal (Next.js)

```bash
# Terminal 2: Start Web Portal
cd apps/unified-dashboard
pnpm dev

# Expected output:
# ✓ Web portal running on http://localhost:3000
# ✓ Open http://localhost:3000 in browser
```

**Access in browser:**
- http://localhost:3000 → Dashboard
- http://localhost:3000/cost → Cost Analytics
- http://localhost:3000/budget → Budget Management
- http://localhost:3000/analytics → Analytics Dashboard
- http://localhost:3000/archive → Archive Management

---

### Service 3: CLI Interface

```bash
# Terminal 3: Build and test CLI locally
cd apps/cli

# Option A: Run directly
pnpm run build
pnpm run cli budget set --crew crew_1 --amount 1000 --period monthly

# Option B: Create symlink for global access
npm link

# Then use anywhere:
openrouter-crew budget status --crew crew_1
openrouter-crew analytics summary --crew crew_1
openrouter-crew analytics recommendations --crew crew_1 --limit 10
```

**Test CLI Commands:**
```bash
# Budget commands
openrouter-crew budget set --crew test_crew --amount 500 --period monthly
openrouter-crew budget status --crew test_crew
openrouter-crew budget alert --crew test_crew --threshold 80

# Analytics commands
openrouter-crew analytics summary --crew test_crew --format table
openrouter-crew analytics recommendations --crew test_crew --format json

# Archive commands
openrouter-crew memory archive --crew test_crew --strategy automatic
openrouter-crew archive list --crew test_crew --format table
```

---

### Service 4: n8n Workflows

```bash
# Terminal 4: Start n8n
docker run -it --rm \
  --name n8n \
  -p 5194:5678 \
  -e DB_TYPE=sqlite \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:latest

# Expected output:
# ✓ n8n running on http://localhost:5194
# ✓ Create initial account
# ✓ Import workflows from domains/shared/n8n-integration/workflows
```

**Access n8n:**
- http://localhost:5194 → n8n UI
- Create account
- Go to Workflows
- Import workflow JSON files from `domains/shared/n8n-integration/workflows/`

**Import Workflows:**
1. Open n8n UI
2. Click "+ New Workflow"
3. Click "Import"
4. Select each workflow:
   - `cost-management.workflow.json`
   - `analytics-trigger.workflow.json`
   - `memory-archival.workflow.json`
   - `budget-alert.workflow.json`

**Test Workflows:**
```bash
# Trigger cost check workflow via API
curl -X POST http://localhost:5194/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "cost-management",
    "crewId": "test_crew",
    "checkInterval": 60,
    "alertThreshold": 80
  }'

# Expected: Workflow executes and returns results
```

---

### Service 5: VSCode Extension (Local Testing)

```bash
# Terminal 5: Develop VSCode Extension
cd domains/vscode-extension

# Install dependencies
pnpm install

# Start in watch mode
pnpm run watch

# Run extension in debug mode
# Press F5 in VSCode → "Extension Development Host" opens

# In the new VSCode window:
# - Install the extension
# - Open the Activity Bar
# - Look for "OpenRouter Crew" icon
# - Explore the sidebar panels
```

**Manual Test in VSCode:**
1. File → Open Folder → Select project root
2. Press `Ctrl+Shift+D` → Run and Debug
3. Select "Extension" → Press F5
4. In new VSCode window:
   - Open Command Palette (`Cmd+Shift+P`)
   - Type "OpenRouter"
   - See available commands
   - Click "OpenRouter Crew" in Activity Bar
   - View Cost Manager, Analytics, Memory Browser, Archive Tree

---

## 🧪 Part 4: Complete Integration Testing

### Test Scenario 1: Budget Management Flow

```bash
# Step 1: Set budget via CLI
openrouter-crew budget set --crew integration_test --amount 1000 --period monthly

# Step 2: Check in Web Portal
# Open http://localhost:3000/budget
# Verify budget appears in "Budget Management" page

# Step 3: View in VSCode
# Open VSCode Activity Bar → Cost Manager
# Should see crew_integration_test with $1000 limit

# Step 4: Update via CLI
openrouter-crew budget update --crew integration_test --spent 300

# Step 5: Verify in Web Portal
# Refresh http://localhost:3000/budget
# Should show 300 spent, 700 remaining

# Step 6: Check via n8n
# In n8n, manually trigger cost-management workflow
# Should report 30% usage
```

### Test Scenario 2: Analytics Flow

```bash
# Step 1: Record access via CLI (simulate)
openrouter-crew analytics record-access --crew integration_test --memory mem_1

# Step 2: Get summary
openrouter-crew analytics summary --crew integration_test --format json

# Step 3: View in Web Portal
# Open http://localhost:3000/analytics
# Check insights and recommendations

# Step 4: View in VSCode
# Open VSCode → Analytics provider in sidebar
# Expand "Top Topics" and "Insights"

# Step 5: Check n8n
# Trigger analytics-trigger workflow
# Should generate insights report
```

### Test Scenario 3: Archive Flow

```bash
# Step 1: Archive memory via CLI
openrouter-crew memory archive --crew integration_test --ids mem_1,mem_2 --dry-run

# Step 2: Execute archival
openrouter-crew memory archive --crew integration_test --strategy automatic

# Step 3: List archives
openrouter-crew archive list --crew integration_test --format table

# Step 4: View in Web Portal
# Open http://localhost:3000/archive
# See archived memories with compression stats

# Step 5: View in VSCode
# Open VSCode → Archive Tree Provider
# Browse archives by date

# Step 6: Restore via CLI
openrouter-crew memory restore --crew integration_test --id arch_1

# Step 7: Verify in all surfaces
# Check CLI, Web Portal, and VSCode for restored memory
```

---

## 📊 Part 5: Testing All Surfaces Together

### Multi-Surface Test Suite

Create a test script:

```bash
#!/bin/bash
# test-all-surfaces.sh

echo "🧪 Testing All Surfaces Simultaneously"
echo ""

# Test 1: CLI
echo "1️⃣  Testing CLI..."
openrouter-crew budget status --crew multi_test --format json > cli_result.json
if [ $? -eq 0 ]; then
  echo "✅ CLI: PASS"
else
  echo "❌ CLI: FAIL"
fi

# Test 2: Web Portal API
echo "2️⃣  Testing Web Portal API..."
curl -s http://localhost:3000/api/budget/multi_test > web_result.json
if grep -q "crewId" web_result.json; then
  echo "✅ Web Portal API: PASS"
else
  echo "❌ Web Portal API: FAIL"
fi

# Test 3: VSCode Extension
echo "3️⃣  Testing VSCode Extension..."
# Manual: Check Activity Bar for data
echo "⚠️  VSCode Extension: Check Activity Bar manually"

# Test 4: n8n Workflow
echo "4️⃣  Testing n8n Workflow..."
curl -X POST http://localhost:5194/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"workflow":"cost-management","crewId":"multi_test"}' > n8n_result.json
if grep -q "execution" n8n_result.json; then
  echo "✅ n8n Workflow: PASS"
else
  echo "❌ n8n Workflow: FAIL"
fi

# Test 5: Database Consistency
echo "5️⃣  Testing Database..."
psql -h localhost -U postgres -d openrouter_crew \
  -c "SELECT COUNT(*) FROM budgets WHERE crew_id = 'multi_test';" > db_result.txt
if [ $(cat db_result.txt | tail -1) -gt 0 ]; then
  echo "✅ Database: PASS"
else
  echo "❌ Database: FAIL"
fi

echo ""
echo "✨ All Surface Testing Complete!"
```

Run it:
```bash
chmod +x test-all-surfaces.sh
./test-all-surfaces.sh
```

---

## 🔍 Part 6: Manual Testing Procedures

### Test Checklist for Each Surface

#### CLI Testing
```bash
# ✓ Budget Commands
□ Set budget: openrouter-crew budget set --crew test --amount 1000
□ Get status: openrouter-crew budget status --crew test
□ Set alert: openrouter-crew budget alert --crew test --threshold 80
□ List formats: test with --format json, table, simple

# ✓ Analytics Commands
□ Summary: openrouter-crew analytics summary --crew test
□ Recommendations: openrouter-crew analytics recommendations --crew test
□ Different limits: --limit 5, --limit 20

# ✓ Archive Commands
□ Archive: openrouter-crew memory archive --crew test
□ List: openrouter-crew archive list --crew test
□ Delete: openrouter-crew archive delete --crew test --id arch_1
□ Test dry-run: --dry-run flag

# ✓ Error Handling
□ Missing crew: openrouter-crew budget status --crew nonexistent
□ Invalid amount: openrouter-crew budget set --crew test --amount -100
□ Missing parameters: openrouter-crew budget set (should error)
```

#### Web Portal Testing
```bash
# ✓ Budget Page (http://localhost:3000/budget)
□ Load page and see metrics
□ Click allocation chart
□ Switch to history tab
□ Configure alert thresholds
□ Save changes

# ✓ Cost Page (http://localhost:3000/cost)
□ View real-time cost
□ Check trend chart
□ View breakdown by operation
□ See budget gauge

# ✓ Analytics Page (http://localhost:3000/analytics)
□ View insights
□ Check topic trends
□ Read recommendations
□ Filter by priority

# ✓ Archive Page (http://localhost:3000/archive)
□ Browse archives
□ View statistics
□ Filter by date
□ Restore archive
□ Delete archive

# ✓ Responsive Design
□ Test on desktop (1920x1080)
□ Test on tablet (768x1024)
□ Test on mobile (375x812)
□ Check touch interactions
```

#### VSCode Extension Testing
```bash
# ✓ Activation
□ Open project in VSCode
□ Check "OpenRouter Crew" in Activity Bar
□ Verify no errors in console

# ✓ Cost Manager
□ View in sidebar
□ Check cost status
□ Verify budget limits display

# ✓ Analytics Panel
□ Expand "Top Topics"
□ Expand "Insights"
□ Expand "Recommendations"
□ Click actions

# ✓ Memory Browser
□ Expand "Recent Memories"
□ Expand "By Type"
□ Expand "By Confidence"
□ Click to view memory

# ✓ Archive Tree
□ Expand "All Archives"
□ Expand "By Age"
□ View statistics
□ Right-click for context menu
```

#### n8n Workflow Testing
```bash
# ✓ Cost Management Workflow
□ Import workflow
□ Execute manually
□ Check execution log
□ Verify output

# ✓ Analytics Trigger
□ Set up schedule (every hour)
□ Check generated insights
□ Verify report generation

# ✓ Archival Workflow
□ Set up daily schedule
□ Check archived memories
□ Verify compression

# ✓ Budget Alerts
□ Set alert threshold
□ Trigger alert condition
□ Verify notification channels
```

---

## 🔧 Part 7: Debugging & Troubleshooting

### Common Issues & Solutions

#### API Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Try different port
PORT=3001 pnpm dev
```

#### Database Connection Failed
```bash
# Check Supabase is running
supabase status

# Restart if needed
supabase stop
supabase start

# Verify connection
psql -h localhost -U postgres -d openrouter_crew -c "SELECT 1;"
```

#### CLI Command Not Found
```bash
# Make sure you're in the CLI directory
cd apps/cli

# Link the package
npm link

# Test it
openrouter-crew --version

# If still not working, use full path
./dist/cli.js budget status
```

#### VSCode Extension Not Loading
```bash
# Check for errors in Debug Console (Ctrl+Shift+U)
# Look for red errors

# If issues, reinstall:
cd domains/vscode-extension
pnpm install
pnpm run compile
# Then F5 again
```

#### n8n Workflows Not Syncing
```bash
# Check n8n is running
curl http://localhost:5194/api/health

# Check logs
docker logs -f n8n

# Export/Import workflows manually:
# 1. n8n UI → Workflows → Export
# 2. Save as JSON
# 3. Import on other instance
```

---

## 📈 Part 8: Performance Monitoring Locally

### Monitor All Services

```bash
# Terminal: Watch API performance
watch -n 1 'curl -s http://localhost:3000/health | jq'

# Terminal: Watch database
watch -n 1 'psql -h localhost -U postgres -d openrouter_crew -c "SELECT COUNT(*) FROM budgets;"'

# Terminal: Watch n8n executions
watch -n 1 'curl -s http://localhost:5194/api/workflows | jq ".executions | length"'

# Terminal: VSCode Extension logs
# In Debug Console (Ctrl+Shift+U)
```

### Generate Load Test Results

```bash
# Install Apache Bench (if not installed)
brew install httpd

# Test API performance
ab -n 1000 -c 10 http://localhost:3000/api/health

# Expected: 50+ requests/second for local dev
```

---

## 🚀 Part 9: Next Steps - Deploy to Cloud

Once testing locally is complete:

### Option 1: Deploy to Vercel (Web Portal)
```bash
cd apps/unified-dashboard
vercel deploy
```

### Option 2: Deploy API to Heroku/Railway
```bash
# Using Railway (easier)
railway up

# Using Heroku
heroku create openrouter-crew-api
git push heroku main
```

### Option 3: Deploy n8n to Cloud
```bash
# Use n8n Cloud: https://app.n8n.cloud
# Or self-host on Digital Ocean / AWS
```

### Option 4: Deploy VSCode Extension to Marketplace
```bash
# Build and publish
pnpm run package
vsce publish
```

---

## 📚 Reference: Port Mappings

| Service | Port | URL | Command |
|---------|------|-----|---------|
| Web Portal | 3000 | http://localhost:3000 | `pnpm dev` (unified-dashboard) |
| API Server | 3000 | http://localhost:3000/api | `pnpm dev` (apps/api) |
| n8n | 5194 | http://localhost:5194 | docker run n8nio/n8n |
| Supabase | 54321 | http://localhost:54321 | `supabase start` |
| PostgreSQL | 5432 | localhost:5432 | Docker/Supabase |

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All dependencies installed (`pnpm install`)
- [ ] Environment files created (`.env.local` in 3 locations)
- [ ] Database running and seeded
- [ ] API server accessible (`curl http://localhost:3000/health`)
- [ ] Web portal loads (`http://localhost:3000`)
- [ ] CLI commands work (`openrouter-crew --version`)
- [ ] n8n accessible (`http://localhost:5194`)
- [ ] VSCode extension loads (no errors in debug console)
- [ ] All 575+ tests pass (`pnpm test`)
- [ ] Performance metrics acceptable

---

## 📞 Support

If you encounter issues:

1. Check logs: `cat deployment_*.log`
2. Review this guide's troubleshooting section
3. Check individual service logs
4. Verify all prerequisites installed
5. Restart services in order: DB → API → Web → n8n → VSCode

---

**Status**: Ready for Local Development Testing
**Last Updated**: February 10, 2026
**Next**: Begin local testing following the procedures above
