# Universal Memory - Quick Start

**Time to setup**: 5 minutes
**Result**: All local development connected to shared Supabase, shared memories across developer/agent/management tiers

---

## 🚀 Three-Step Setup

### Step 1: Get Supabase Credentials (1 min)

Go to: https://app.supabase.com/project/[your-project-id]/settings/api

Copy:
- **Project URL** (e.g., `https://abc123.supabase.co`)
- **Anon Public Key** (e.g., `eyJ...`)
- **Service Role Key** (optional, for server operations)

### Step 2: Run Setup Script (2 min)

```bash
bash scripts/system/setup-universal-memory.sh
```

The script will:
- Prompt you to enter Supabase credentials
- Test the connection
- Create `.env.local` files in all dashboard directories
- Configure VSCode extension for universal memory

**What it creates**:
- Root `.env.local` - Central credentials
- `apps/unified-dashboard/.env.local` - Dashboard config
- `domains/alex-ai-universal/dashboard/.env.local` - Alex AI config
- `domains/product-factory/project-templates/dj-booking/dashboard/.env.local` - DJ Booking config
- `domains/product-factory/projects/test-event-venue/dashboard/.env.local` - Factory config
- `domains/vscode-extension/.env.local` - VSCode config

### Step 3: Start Universal Development (2 min)

```bash
# Build first time (or after dependency changes)
pnpm build

# Start universal development
pnpm dev:universal
```

Opens:
- **Unified Dashboard** → http://localhost:3000
- **DJ Booking** → http://localhost:3002
- **Alex AI** → http://localhost:3003
- **Product Factory** → http://localhost:3004
- **VSCode Extension** → Debug mode (F5 in VSCode)

**All connect to**: Your remote Supabase instance

---

## 📊 What's Connected Now

### Developer Tier (You working locally)

```
Your VSCode
    ↓ (create memories via extension)
    ↓
Unified Supabase
    ↓ (visible to everyone)
    ├→ Your teammates (VSCode)
    ├→ Agents/n8n (workflow automation)
    └→ Management (web dashboard)
```

### Agent Tier (Autonomous workflows)

Agents running in n8n can:
- Read your developer memories
- Execute tasks
- Record outcomes
- See management directives

### Management Tier (Strategic oversight)

Executives can:
- See all developer decisions
- View agent execution results
- Make strategic decisions
- Guide team priorities

---

## ✅ Verify Setup Works

### Test 1: Create a Developer Memory (VSCode)

```bash
# 1. Open VSCode
code domains/vscode-extension

# 2. Press F5 to debug extension

# 3. Open Command Palette (Cmd+Shift+P)

# 4. Type: "Create Memory"

# 5. Enter test memory:
"Testing universal memory setup - shared across all tiers"

# 6. Check: Memory appears in sidebar "Memories" panel
```

### Test 2: See Memory in Dashboard

```bash
# 1. Open http://localhost:3000 (Unified Dashboard)

# 2. Look for "Crew Memories" or "Team Insights" section

# 3. Verify: Your memory appears there
```

### Test 3: Verify Supabase Connection

```bash
# 1. Go to https://app.supabase.com/project/[your-id]/sql

# 2. Run:
SELECT content, type, created_at
FROM memories
ORDER BY created_at DESC
LIMIT 5;

# 3. Verify: Your memories are stored there
```

---

## 📝 Typical Developer Workflow

### 1. Start Your Work Day

```bash
pnpm dev:universal
```

All dashboards open automatically, all connected to shared Supabase.

### 2. Work on a Feature

Open VSCode, work on your feature. When you hit a blocker:

```
Command Palette → Create Memory
"Blocked on JWT token rotation - Supabase RLS policies
need to be updated to allow token refresh. Waiting on
infrastructure team."
```

### 3. Memory is Shared Instantly

- **Your teammates** see it in their VSCode sidebar
- **Agents** see it and might attempt resolution
- **Management** sees it in analytics dashboard

### 4. Agent Takes Action

n8n workflow sees your blocker and attempts fix:

```
- Reads your memory about RLS policies
- Generates 3 candidate RLS rules
- Records outcome: "Generated policies, awaiting review"
```

### 5. Closing the Loop

- You review the agent's suggestions
- You create new memory: "Used Agent RLS option #2, works perfectly"
- Management sees resolution and can analyze the workflow
- Pattern strengthens for future similar blockers

---

## 🎯 Memory Types You'll Create

As a developer using VSCode, you create memories like:

| Type | Example | Tier Access |
|------|---------|---|
| **decision** | "Switched from REST to GraphQL for auth" | All |
| **blocker** | "Can't update Supabase RLS policies" | All |
| **insight** | "JWT rotation causes 2ms latency spike" | All |
| **lesson** | "Never mutate auth state directly" | All |
| **best_practice** | "Always validate tokens server-side" | All |

All memories are **automatically shared** with agents and management.

---

## 🔗 What's Different from Local Dev?

### Before (Local Supabase)
```
Your machine:
  - Unified Dashboard (localhost:3000)
  - DJ Booking (localhost:3002)
  - Alex AI (localhost:3003)
  - Product Factory (localhost:3004)
  - Local Supabase (localhost:54321)

Problem: Your memories only exist locally
         No one else can see them
         Agents can't access them
         Management has no visibility
```

### After (Universal Supabase)
```
Your machine:
  - Unified Dashboard (localhost:3000)  ┐
  - DJ Booking (localhost:3002)         │
  - Alex AI (localhost:3003)            ├→ All connect to
  - Product Factory (localhost:3004)    │  https://your-project.supabase.co
  - VSCode Extension (Debug mode)       ┘

Benefit: Memories shared with entire organization
         Agents access your context automatically
         Management sees real-time team insights
         Organizational knowledge unified
```

---

## 🆘 Quick Troubleshooting

### "Connection to Supabase failed"

```bash
# 1. Verify credentials in .env.local
cat .env.local | grep SUPABASE

# 2. Test connection manually
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/memories?limit=1"

# 3. If fails, check:
#    - Supabase project is still active
#    - API keys are valid (regenerate if needed)
#    - Network connectivity (VPN, firewall)
```

### "Memory not appearing in dashboard"

```bash
# 1. Check browser console (F12) for errors
# 2. Verify .env files have correct values:
grep SUPABASE apps/unified-dashboard/.env.local

# 3. Rebuild dashboards:
pnpm build
pnpm dev:unified
```

### "VSCode extension not connecting"

```bash
# 1. Check extension debug console (F5)
# 2. Verify VSCode .env file:
cat domains/vscode-extension/.env.local

# 3. Restart debug session (Ctrl+Shift+F5)
```

---

## 📚 Learn More

**Detailed Configuration**:
See `UNIVERSAL_MEMORY_SETUP.md` for:
- Three-tier architecture details
- Advanced retention policies
- Memory decay functions
- Integration with n8n

**Platform Overview**:
See `CLAUDE.md` for:
- Architecture and domains
- Team conventions
- Development commands
- Deployment procedures

---

## 🎓 Key Concept

This setup creates an **organizational knowledge graph** where:

- **Developer insights** → Stored in universal Supabase
- **Agent decisions** → Read those insights, record outcomes
- **Management guidance** → Informs agent behavior and dev priorities
- **Everyone accesses** → The same shared memory pool

Result: **Genuine organizational alignment** where development decisions inform strategy, and strategy guides task execution.

---

## ✅ You're Ready!

```bash
# One command to run everything:
pnpm dev:universal

# Then create a memory in VSCode to test:
# Command Palette → Create Memory → Enter text

# Verify it appears in dashboard:
# http://localhost:3000 → Look for your memory
```

All your development memories are now **shared across the entire organization**.

