# 🚀 OpenRouter Crew Platform - Local Testing Guide

Complete setup guide for testing the entire platform locally with VSCode extension, CLI tools, and all web dashboards.

---

## Quick Start (30 seconds)

```bash
# One command to start everything:
pnpm dev:universal

# This starts:
# ✅ All 4 Next.js dashboards (unified, dj-booking, alex-ai, product-factory)
# ✅ Supabase local instance
# ✅ VSCode extension in watch mode
# ✅ Opens all dashboards in browser with tabs
```

---

## Detailed Local Testing Setup

### Prerequisites

```bash
# Check you have required tools
node --version      # Should be v20.0.0 or higher
pnpm --version      # Should be v9.0.0 or higher
supabase --version  # Supabase CLI

# If missing, install:
# Node: https://nodejs.org/
# pnpm: npm install -g pnpm@9.12.3
# Supabase: brew install supabase/tap/supabase
# Docker: https://www.docker.com/products/docker-desktop (for Supabase)
```

### Environment Setup

```bash
cd /Users/bradygeorgen/Dev/openrouter-crew-platform

# 1. Install dependencies
pnpm install

# 2. Load secrets and environment variables
pnpm secrets:load

# 3. Verify setup
pnpm secrets:validate
```

---

## Option 1: Full System (Recommended for Complete Testing)

### Start Everything with One Command

```bash
pnpm dev:universal
```

This command:
- Cleans up any stuck ports
- Starts all 4 Next.js dashboards (ports 3000, 3002, 3003, 3004)
- Starts Supabase local instance (port 54321)
- Watches VSCode extension for changes
- Opens all web interfaces in browser with tabs

**Output:**
```
✅ Unified Dashboard:     http://localhost:3000
✅ DJ Booking:           http://localhost:3002
✅ Alex AI Universal:    http://localhost:3003
✅ Product Factory:      http://localhost:3004
✅ VSCode Extension:     Ready in watch mode
```

**Expected startup time:** 60-90 seconds

---

## Option 2: Individual Services (For Targeted Testing)

### Start Specific Dashboards

```bash
# Just the unified dashboard (project management)
pnpm dev:unified

# Just product factory (business generator)
pnpm dev:factory

# Just DJ booking
pnpm dev:dj

# Just Alex AI universal
pnpm dev:alex

# All dashboards but no extension/supabase
pnpm dev:dashboards

# Just Supabase
pnpm supabase:start
```

### Open Browser Manually

```bash
# If services started but browser didn't open automatically:
bash scripts/system/open-all-tabs.sh

# Or open individually:
open http://localhost:3000   # macOS
xdg-open http://localhost:3000  # Linux
```

---

## VSCode Extension Installation & Testing

### Install Locally

```bash
# Build and install extension into VSCode
pnpm vscode:install

# Or manually:
bash scripts/vscode/install-local.sh
```

**What happens:**
1. Packages the extension as `.vsix` file
2. Installs into your local VSCode
3. Prompts you to reload VSCode
4. Extension appears in sidebar after reload

### First Time Setup (After Installation)

1. **Open VSCode** with this project folder
   ```bash
   code /Users/bradygeorgen/Dev/openrouter-crew-platform
   ```

2. **Reload Window** (Cmd+Shift+P → "Developer: Reload Window")

3. **Enable Extension**
   - Go to Extensions sidebar
   - Search "OpenRouter Crew"
   - Click Enable (if grayed out)

4. **Verify Installation**
   - Check VSCode sidebar - you should see a new panel icon
   - Click it to see: Projects, Crew, Cost, Memory sections

### Extension Features

| Feature | How to Use |
|---------|-----------|
| **Crew Roster** | View all available agents and their current workload |
| **Cost Meter** | Real-time daily budget tracking |
| **Memory Browser** | Search and view conversation history |
| **Project List** | Quick navigation to all projects |
| **Commands** | Command Palette (Cmd+Shift+P) > "Crew Platform..." |

### Watch Mode During Development

While developing extension changes:

```bash
# In a terminal, keep this running:
pnpm --filter openrouter-crew-vscode watch

# In VSCode, reload with:
# Cmd+Shift+P → "Developer: Reload Window"
# (changes appear instantly)
```

---

## CLI Usage

### Build the CLI

```bash
pnpm --filter @openrouter-crew/cli build

# Or start in dev mode:
pnpm --filter @openrouter-crew/cli dev
```

### Available CLI Commands

```bash
# Help
crew --help
crew <command> --help

# Cost management
crew cost status                    # Current daily spend
crew cost forecast --days 30        # 30-day projection
crew budget get                     # Current budget
crew budget set --limit 100         # Set daily limit ($100)

# Project management
crew project list                   # All projects
crew project create --name "foo"    # New project
crew project info <id>              # Project details

# Crew management
crew crew list                      # All crew members
crew crew status                    # Current assignments
crew crew assign <member> <task>    # Assign work

# Analytics
crew analytics summary              # Budget & usage overview
crew analytics detailed             # Detailed metrics
crew analytics export               # CSV export

# Memory system
crew memory list                    # All memories
crew memory search "keyword"        # Find memories
crew memory show <id>               # View specific memory
crew memory delete <id>             # Remove memory

# History
crew history list                   # Past operations
crew history show <operation-id>    # Operation details
crew history export                 # Export history
```

### CLI Examples

```bash
# Check today's spending
crew cost status

# See who's available
crew crew list

# List all projects with status
crew project list

# Get budget status
crew budget get

# Search conversation memory
crew memory search "sprint planning"

# View recent operations
crew history list --limit 10
```

---

## Testing the New PM System (Phase 5 Complete)

### Test Sprint Planning

```bash
# 1. Navigate to unified dashboard
open http://localhost:3000/projects/[project-id]/board

# 2. Click "Plan Sprint" button
# Expected: Opens planning modal with:
# - Project name and budget
# - Sprint goals input
# - Cost estimate

# 3. Click "Generate Plan"
# Expected after 10-20 seconds:
# - 9-step pipeline executes (if OPENROUTER_API_KEY set)
# - Shows crew analysis
# - Displays consensus and adjustments
# - Updates cost tracking

# Or test via API:
curl -X POST http://localhost:3000/api/sprints/plan \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "sprintId": "sprint-1",
    "goals": ["Build auth", "Add dashboard"]
  }'
```

### Test Real-time Kanban

```bash
# 1. Open sprint board: http://localhost:3000/projects/[id]/board
# 2. Open same board in second browser window
# 3. Drag a story card to "In Progress" in Window 1
# Expected: Card moves in Window 2 within 1-2 seconds (real-time!)
```

### Test Server Actions

```bash
# Create new project via form
# 1. Go to http://localhost:3000/projects/new
# 2. Fill form and submit
# Expected: Redirects to new project page

# Or test via direct API call:
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "type": "product-factory",
    "budget_usd": 500
  }'
```

### Run Integration Tests

```bash
# Sprint API tests
pnpm --filter @openrouter-crew/unified-dashboard test -- sprint-api.test.ts

# Project service tests
pnpm --filter @openrouter-crew/unified-dashboard test -- project-service.test.ts

# Sprint planner tests
pnpm --filter @openrouter-crew/unified-dashboard test -- sprint-planner.test.ts

# All tests
pnpm test
```

---

## Database Management

### View Supabase

```bash
# Access Supabase dashboard (after `pnpm dev` or `pnpm supabase:start`)
open http://localhost:54321

# Login credentials set in .env.local
```

### Database Migrations

```bash
# Create database tables from migration
pnpm db:migrate

# View migration status
supabase migration list

# Reset database (WARNING: deletes all data)
pnpm supabase:reset

# Seed with test data (if seed.sql exists)
pnpm db:seed
```

### View Tables in Supabase

1. Open http://localhost:54321 in browser
2. Navigate to "SQL Editor"
3. Query the tables:
   ```sql
   SELECT * FROM projects LIMIT 10;
   SELECT * FROM sprints LIMIT 10;
   SELECT * FROM stories LIMIT 10;
   ```

---

## Troubleshooting

### Port Already in Use

```bash
# Cleanup stuck processes
bash scripts/system/cleanup-ports.sh

# Or manually kill:
lsof -i :3000  # Find process on port 3000
kill -9 <PID>
```

### Supabase Won't Start

```bash
# Check Docker
docker ps

# If Docker isn't running, start it (Docker Desktop)

# Or reset Supabase:
pnpm supabase:stop
pnpm supabase:start

# Check logs:
supabase status
```

### Extension Not Showing

1. Check it's installed:
   ```bash
   code --list-extensions | grep openrouter
   ```

2. Reload VSCode:
   - Cmd+Shift+P → "Developer: Reload Window"

3. Check extension logs:
   - Cmd+Shift+P → "Developer: Toggle Developer Tools"
   - Go to Console tab

### Dashboard Won't Load

```bash
# Check if port is responding
curl http://localhost:3000

# If not, check logs:
tail -f .logs/web-portal.log    # Unified dashboard
tail -f .logs/dj-booking.log    # DJ booking
tail -f .logs/api-server.log    # API server
```

### OpenRouter API Failing

```bash
# Add your key to .env.local:
OPENROUTER_API_KEY=sk-your-key-here

# Restart dashboard:
pnpm dev:unified
```

---

## Performance Testing

### Monitor Resource Usage

```bash
# Watch memory/CPU during dev
watch -n 1 'ps aux | grep node'

# Or use Activity Monitor (macOS)
open -a "Activity Monitor"

# Check dashboard lighthouse score:
# DevTools → Lighthouse → Generate report
```

### Load Testing the API

```bash
# Simple load test (requires artillery)
npm install -g artillery

artillery quick --count 100 --num 10 http://localhost:3000/api/sprints
```

---

## Development Workflow

### Making Changes

```bash
# 1. All servers running (pnpm dev:universal)
# 2. Edit files in your editor
# 3. Changes auto-reload:
#    - Next.js pages: Refresh browser (hot reload)
#    - Shared packages: May need restart
#    - VSCode extension: Reload window (Cmd+Shift+P)

# 4. Verify with:
pnpm type-check      # TypeScript errors
pnpm lint            # Code style
pnpm test            # Unit tests
```

### Commit Workflow

```bash
pnpm test            # Run tests
git add .
git commit -m "feat: add sprint planning"
git push

# GitHub Actions will run:
# ✅ Type check
# ✅ Build
# ✅ All tests
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start everything | `pnpm dev:universal` |
| Start just dashboards | `pnpm dev:dashboards` |
| Start Supabase only | `pnpm supabase:start` |
| Install VSCode extension | `pnpm vscode:install` |
| Build full system | `pnpm build` |
| Run all tests | `pnpm test` |
| Type check | `pnpm type-check` |
| Open browser tabs | `bash scripts/system/open-all-tabs.sh` |
| View Supabase | `open http://localhost:54321` |
| CLI help | `crew --help` |
| Stop all services | `Ctrl+C` (in dev terminal) |

---

## What's Running on Each Port

| Port | Service | Purpose | URL |
|------|---------|---------|-----|
| **3000** | Unified Dashboard | Project management & sprints | http://localhost:3000 |
| **3001** | API Server | REST API endpoints | http://localhost:3001 |
| **3002** | DJ Booking | Event booking system | http://localhost:3002 |
| **3003** | Alex AI | AI orchestration | http://localhost:3003 |
| **3004** | Product Factory | Business generation | http://localhost:3004 |
| **5678** | n8n | Workflow automation | http://localhost:5678 |
| **54321** | Supabase | PostgreSQL + Auth | http://localhost:54321 |

---

## Next Steps

### After Initial Setup
1. ✅ Run `pnpm dev:universal`
2. ✅ Install VSCode extension: `pnpm vscode:install`
3. ✅ Open `http://localhost:3000` in browser
4. ✅ Navigate to a project and test sprint board

### Testing Features
- **Unified Dashboard**: Create projects, plan sprints, drag stories
- **Real-time**: Open board in 2 windows, drag card to see sync
- **CLI**: Run `crew project list` to see projects
- **VSCode**: Check cost meter and crew status in sidebar
- **API**: Test endpoints with curl/Postman

### Production Testing
```bash
# Build for production
pnpm build

# Test production build
NODE_ENV=production pnpm preview
```

---

## Getting Help

- **TypeScript errors**: Check `.logs/*.log` files
- **Port conflicts**: Run `bash scripts/system/cleanup-ports.sh`
- **Supabase issues**: Check `supabase status` and Docker status
- **VSCode extension**: Check DevTools console (Cmd+Shift+P → Toggle Developer Tools)
- **API errors**: Check `curl http://localhost:3001/api/health`

---

**Last Updated:** 2026-03-02
**Tested On:** Node 20.x, macOS 14+, Linux, Windows (WSL2)
**Status:** ✅ All systems operational
