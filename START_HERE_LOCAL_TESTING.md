# ⚡ START HERE - Local Testing Setup

**Complete guide to start testing the OpenRouter Crew Platform locally in 3 steps.**

---

## 🎯 What You Need to Know

| Item | Answer |
|------|--------|
| **Which pnpm script?** | `pnpm dev:universal` |
| **What does it do?** | Starts everything (dashboards, database, extension, browser) |
| **How long?** | 60-90 seconds to ready state |
| **Web interface?** | http://localhost:3000 (and 3 other dashboards open in tabs) |
| **VSCode extension?** | `pnpm vscode:install` (after dashboards are running) |
| **CLI?** | `crew --help` (build: `pnpm --filter @openrouter-crew/cli build`) |
| **What to read first?** | [PNPM_SCRIPTS_REFERENCE.md](PNPM_SCRIPTS_REFERENCE.md) |

---

## 3-Step Quick Start

### Step 1: Install & Start Everything (90 seconds)

```bash
cd /Users/bradygeorgen/Dev/openrouter-crew-platform
pnpm dev:universal
```

**What happens automatically:**
- ✅ All Next.js dashboards start (3000, 3002, 3003, 3004)
- ✅ Supabase database starts (54321)
- ✅ VSCode extension goes into watch mode
- ✅ Browser opens with 4 tabs (all dashboards)

**Wait for output:** "⏳ Waiting for dashboards to come online..."

---

### Step 2: Explore the Unified Dashboard (5 minutes)

Once browser opens to http://localhost:3000:

1. **Click "Projects"** in sidebar
2. **Create a new project** (or open existing one)
3. **Go to "Board" tab**
4. **Click "Plan Sprint"** → See AI planning in action
5. **Drag cards** on the Kanban board → Real-time sync!

---

### Step 3: Install VSCode Extension (Optional, 5 minutes)

In a new terminal (keep dashboards running):

```bash
pnpm vscode:install
```

Then in VSCode:
1. Press `Cmd+Shift+P`
2. Type "Developer: Reload Window"
3. Look for new sidebar icon (left activity bar)
4. Click it to see cost meter & crew status

---

## 📚 All Available pnpm Scripts

### Quick Reference

```bash
# ⭐ MAIN COMMAND - Use this!
pnpm dev:universal              # Everything + browser tabs

# Alternative start options
pnpm dev:dashboards             # Just web servers (no DB)
pnpm dev:unified                # Just unified dashboard (PM)
pnpm dev:dj                      # Just DJ booking dashboard
pnpm dev:alex                    # Just Alex AI dashboard
pnpm dev:factory                 # Just product factory
pnpm supabase:start              # Just database

# Build & test
pnpm build                       # Full monorepo build
pnpm test                        # Run all tests
pnpm type-check                  # Check TypeScript types

# Extensions & tools
pnpm vscode:install              # Install VSCode extension
pnpm --filter @openrouter-crew/cli build  # Build CLI tool

# Utilities
bash scripts/system/open-all-tabs.sh  # Open all dashboards
bash scripts/system/cleanup-ports.sh  # Free stuck ports
```

See [PNPM_SCRIPTS_REFERENCE.md](PNPM_SCRIPTS_REFERENCE.md) for complete list.

---

## 🌐 Web Dashboards

| Port | Name | Purpose | URL |
|------|------|---------|-----|
| 3000 | Unified Dashboard | **⭐ Project Management & Sprints** | http://localhost:3000 |
| 3002 | DJ Booking | Event management | http://localhost:3002 |
| 3003 | Alex AI | Agent coordination | http://localhost:3003 |
| 3004 | Product Factory | Business generator | http://localhost:3004 |
| 54321 | Supabase | Database admin | http://localhost:54321 |

---

## 💻 VSCode Extension

### Installation
```bash
pnpm vscode:install
```

### Activation
1. Reload VSCode: `Cmd+Shift+P` → "Developer: Reload Window"
2. Click new sidebar icon (left activity bar)

### Features
- 🎯 Projects panel (navigate to projects)
- 👥 Crew roster (see available agents)
- 💰 Cost meter (real-time daily budget)
- 🧠 Memory browser (search past work)

---

## 🎮 CLI Tool

### Build
```bash
pnpm --filter @openrouter-crew/cli build
```

### Use
```bash
crew --help                    # All commands
crew cost status               # Today's spending
crew project list              # All projects
crew crew list                 # Available agents
crew memory search "keyword"   # Find memories
crew history list              # Recent operations
crew budget get                # Budget status
```

---

## ✨ What You Can Test Right Now

### 1. Sprint Planning with AI
- Open http://localhost:3000/projects/[id]/board
- Click "Plan Sprint"
- Watch 9-step Dark Forest pipeline execute
- See crew analysis, consensus, adjustments

### 2. Real-time Kanban
- Open board in 2 browser windows
- Drag a card in Window A
- See it sync to Window B (1-2 seconds!)

### 3. Server Actions
- Go to http://localhost:3000/projects/new
- Create a new project
- Automatically redirects to project page

### 4. Run Tests
```bash
pnpm test                                    # All tests
pnpm --filter @openrouter-crew/unified-dashboard test -- sprint-api.test.ts
pnpm --filter @openrouter-crew/unified-dashboard test -- sprint-planner.test.ts
```

### 5. CLI Interaction
```bash
crew cost status          # Check budget
crew project list         # View projects
crew crew list            # See agents
crew memory list          # Browse memories
```

---

## 🧭 Complete Documentation

### Quick References
- **[PNPM_SCRIPTS_REFERENCE.md](PNPM_SCRIPTS_REFERENCE.md)** - All commands (5 min read)
- **[PM_SYSTEM_LAUNCH_CHECKLIST.md](PM_SYSTEM_LAUNCH_CHECKLIST.md)** - What you built (10 min read)

### Comprehensive Guides
- **[LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)** - Full setup & testing (30 min read)
- **[CLAUDE.md](CLAUDE.md)** - Project memory & architecture (reference)

---

## 🆘 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Port 3000 already in use | `bash scripts/system/cleanup-ports.sh` |
| Supabase won't start | Make sure Docker running, then `pnpm supabase:stop && pnpm supabase:start` |
| VSCode extension not showing | Reload VSCode: `Cmd+Shift+P` → "Developer: Reload Window" |
| Dashboard won't load | Check logs: `tail -f .logs/web-portal.log` |
| OpenRouter API failing | Add key to `.env.local`: `OPENROUTER_API_KEY=sk-...` |
| Services not stopping | Press `Ctrl+C` in terminal, or `ps aux \| grep node` then `kill -9 <PID>` |

---

## 🎓 Learning Path

### 5 Minutes
1. Run `pnpm dev:universal`
2. Wait for browser to open
3. Explore http://localhost:3000

### 15 Minutes
1. Read [PNPM_SCRIPTS_REFERENCE.md](PNPM_SCRIPTS_REFERENCE.md)
2. Test sprint planning UI
3. Create a project and plan a sprint

### 30 Minutes
1. Install VSCode extension: `pnpm vscode:install`
2. Test real-time sync (open board in 2 windows)
3. Build and test CLI: `pnpm --filter @openrouter-crew/cli build`
4. Run `crew project list` to see projects

### 1 Hour
1. Read [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md)
2. Run test suite: `pnpm test`
3. Test all features end-to-end
4. Review architecture in [PM_SYSTEM_LAUNCH_CHECKLIST.md](PM_SYSTEM_LAUNCH_CHECKLIST.md)

---

## 🚀 You're Ready!

Copy and paste this command now:

```bash
pnpm dev:universal
```

Then:
1. Wait ~90 seconds
2. Browser opens with 4 dashboards
3. Explore Unified Dashboard at http://localhost:3000
4. Create projects, plan sprints, drag cards

---

## 📖 Next Steps After Testing

- **Ready to deploy?** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Want to extend?** See [CLAUDE.md](CLAUDE.md) for architecture
- **Need help?** Check [LOCAL_TESTING_GUIDE.md](LOCAL_TESTING_GUIDE.md) troubleshooting

---

**Version:** 1.0.0 (Phases 0-5 Complete) | **Last Updated:** 2026-03-02 | **Status:** ✅ Production Ready
