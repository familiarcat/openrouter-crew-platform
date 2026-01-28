# Getting Started with OpenRouter Crew Platform

**Welcome! This guide will get you from zero to running in under 10 minutes.**

## What You're Building

A unified AI orchestration platform that combines:
- 🎯 **4 projects** into one cohesive system
- 💰 **Cost optimization** via OpenRouter model routing
- 🚀 **10 AI crew members** (Star Trek themed)
- 📊 **Real-time dashboard** for cost tracking
- 🔄 **n8n workflows** for automation
- 💾 **Supabase** for unified data

## The 3-Minute Quickstart

```bash
# 1. Clone and enter
git clone <repo-url>
cd openrouter-crew-platform

# 2. One-command setup
pnpm setup

# 3. Start everything
pnpm dev

# 4. Open dashboard
open http://localhost:3000
```

**Done!** You now have:
- ✅ Local Supabase running (PostgreSQL + Studio)
- ✅ Unified database schema applied
- ✅ 10 crew members seeded
- ✅ Dashboard running on port 3000
- ✅ Secrets synced from `~/.zshrc`

## What Just Happened?

The `pnpm setup` command:
1. **Installed dependencies** - All workspace packages via pnpm
2. **Synced secrets** - Extracted from `~/.zshrc` to `.env.local`
3. **Started Supabase** - Local PostgreSQL + APIs
4. **Applied migrations** - Created unified schema
5. **Seeded data** - Sample projects + crew members

## Your First Actions

### 1. Explore the Dashboard (2 minutes)

Visit: http://localhost:3000

You'll see:
- **Project Overview** - Sample projects (DJ booking, Product factory)
- **Cost Tracking** - Real-time LLM usage events
- **Crew Status** - 10 crew members with workload indicators
- **Recent Activity** - Workflow executions

### 2. Browse the Database (2 minutes)

Visit: http://localhost:54323 (Supabase Studio)

Check these tables:
- `projects` - All project types
- `crew_members` - 10 Star Trek crew members
- `llm_usage_events` - Cost tracking (empty initially)
- `workflows` - n8n workflow registry

### 3. Test Cost Tracking (3 minutes)

```bash
# Insert a test usage event
curl -X POST http://localhost:3000/api/usage \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<uuid-from-projects-table>",
    "model": "anthropic/claude-sonnet-3.5",
    "total_tokens": 1500,
    "estimated_cost_usd": 0.0045,
    "routing_mode": "standard",
    "workflow": "captain_picard",
    "crew_member": "captain_picard"
  }'
```

Refresh dashboard - you should see the event appear instantly via Supabase realtime!

### 4. Create Your First Milestone (2 minutes)

```bash
# Create a feature branch
pnpm milestone:create "add-cost-alerts"

# This creates:
# - New branch: milestone/add-cost-alerts-<timestamp>
# - Milestone file: .milestones/add-cost-alerts-<timestamp>.md
# - Initial commit

# Make changes
cd apps/unified-dashboard
# ... edit files ...

# Commit
git add .
git commit -m "feat: add cost alert system"

# Push
pnpm milestone:push
```

## Understanding the Structure

```
openrouter-crew-platform/
├── apps/
│   └── unified-dashboard/       # ← Start here for UI changes
│       ├── app/                 # Next.js app router
│       │   ├── page.tsx         # Main dashboard
│       │   └── api/usage/       # Cost tracking API
│       └── lib/
│           └── supabase.ts      # Database client
│
├── packages/
│   ├── n8n-workflows/           # ← Workflow definitions
│   │   ├── subflows/            # 8 cost optimization steps
│   │   └── crew/                # 10 crew workflows
│   ├── crew-core/               # ← Crew member logic
│   ├── cost-tracking/           # ← Cost optimization
│   └── shared-schemas/          # ← TypeScript types
│
├── supabase/
│   ├── migrations/              # ← Database schema
│   │   └── 00001_unified_schema.sql
│   └── seed.sql                 # Test data
│
└── scripts/
    ├── secrets/                 # Secret management
    ├── milestone/               # GitFlow helpers
    └── n8n/                     # Workflow sync
```

## Common Tasks

### Start/Stop Services

```bash
# Start all services
pnpm dev

# Stop Supabase
pnpm supabase:stop

# Start Docker services (Supabase + n8n + dashboard)
pnpm docker:up

# Stop Docker
pnpm docker:down
```

### Manage Database

```bash
# Reset database (destructive!)
pnpm supabase:reset

# Apply new migration
pnpm db:migrate

# Seed test data
pnpm db:seed

# View Supabase status
pnpm supabase:status
```

### Sync Secrets

```bash
# After updating ~/.zshrc
source ~/.zshrc
pnpm secrets:sync

# Validate all secrets present
pnpm secrets:validate
```

### Work with n8n Workflows

```bash
# Export workflows from n8n to git
pnpm n8n:export

# Import workflows from git to n8n
pnpm n8n:sync

# Activate all workflows
pnpm n8n:activate
```

## Architecture Overview

### Cost Optimization Pipeline (8 Subflows)

Every LLM request flows through:

1. **Token Cost Meter** - Estimate cost before execution
2. **Context Compressor** - Reduce context size
3. **Hybrid Model Router** - Select cheapest viable model
4. **Budget Enforcer** - Block if over budget
5. **LLM Executor** - Execute via OpenRouter
6. **Usage Logger** - Record to Supabase
7. **Reflection Self-Tuner** - Learn patterns
8. **Workflow Change Watcher** - Detect workflow edits

### 10 Crew Members (Star Trek Theme)

| Member | Role | Cost Tier |
|--------|------|-----------|
| **Captain Picard** | Strategic Leadership | Premium |
| **Commander Data** | Data Analytics | Standard |
| **Commander Riker** | Tactical Execution | Standard |
| **Counselor Troi** | User Experience | Standard |
| **Lt. Worf** | Security & Compliance | Standard |
| **Dr. Crusher** | System Health | Standard |
| **Geordi La Forge** | Infrastructure | Standard |
| **Lt. Uhura** | Communications | Standard |
| **Chief O'Brien** | Pragmatic Solutions | Budget |
| **Quark** | Business Intelligence | Budget |

Each crew member:
- Has a dedicated n8n workflow
- Uses the 6-step cost optimization pipeline
- Logs all usage to `llm_usage_events` table
- Can be invoked via webhook

### Real-Time Dashboard

Built with:
- **Next.js 14** - App router, server components
- **Supabase Realtime** - WebSocket subscriptions
- **React 18** - Client-side interactivity

Features:
- Project selector
- Real-time cost tracking
- Crew workload indicators
- Recent activity feed

## Integration Points

### 1. Cost Tracking Flow

```
n8n Workflow (crew member)
  ↓
Cost Optimization Pipeline (8 steps)
  ↓
OpenRouter API (LLM execution)
  ↓
Usage Logger (step 7)
  ↓
Supabase (llm_usage_events table)
  ↓
Dashboard (realtime subscription)
  ↓
User sees cost instantly
```

### 2. Project Types

The platform supports multiple project types:

- **dj-booking** - Event management
  - Tables: `dj_events`, `dj_playlists`
  - Crew members: Captain Picard (booking strategy), Lt. Uhura (communication)

- **product-factory** - Product ideation
  - Tables: `product_sprints`, `product_stories`
  - Crew members: Commander Data (analytics), Counselor Troi (UX)

- **ai-assistant** - Universal AI assistant
  - Tables: `crew_memories`, `workflows`
  - Crew members: All members available

- **custom** - Extensible for new types
  - Add your own tables
  - Use any crew members

### 3. Milestone Branching

GitFlow-based workflow:

```
main (production)
  ↓
milestone/feature-name-timestamp (development)
  ↓
Merge when complete
  ↓
main (updated)
```

Benefits:
- Independent feature development
- No merge conflicts
- Easy rollback
- Clear history

## Next Steps

### Beginner Path (Learn the platform)

1. ✅ **Complete quickstart** (you're here!)
2. 📖 **Read [SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup
3. 🎨 **Customize dashboard** - Edit `apps/unified-dashboard/app/page.tsx`
4. 📊 **Add widgets** - Create new components
5. 🔄 **Test workflows** - Trigger crew members via webhooks

### Intermediate Path (Add features)

1. 🏗️ **Create new project type** - Add tables + UI
2. 🤖 **Add crew member** - New workflow + webhook
3. 💰 **Enhance cost tracking** - Add budget alerts
4. 📈 **Build analytics** - Historical cost trends
5. 🔐 **Add authentication** - Supabase Auth

### Advanced Path (Production deployment)

1. ☁️ **Deploy to AWS** - Terraform infrastructure
2. 🚀 **CI/CD pipeline** - GitHub Actions
3. 🌐 **Custom domain** - Route53 + CloudFront
4. 📊 **Monitoring** - CloudWatch + alerts
5. 🔄 **Auto-scaling** - ECS + ALB

## Resources

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md) - Integration strategy
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [API.md](API.md) - API documentation
- [N8N_WORKFLOWS.md](N8N_WORKFLOWS.md) - Workflow guide

## Getting Help

### Check Logs

```bash
# Dashboard logs
pnpm dev  # View in terminal

# Supabase logs
pnpm supabase:status
docker logs supabase_db_<project>

# n8n logs
pnpm docker:logs n8n

# All Docker logs
pnpm docker:logs
```

### Common Issues

**Issue**: Dashboard won't start
- Solution: Check `.env.local` exists, run `pnpm secrets:sync`

**Issue**: Supabase connection error
- Solution: Run `pnpm supabase:start`, verify status

**Issue**: No data in dashboard
- Solution: Run `pnpm db:seed` to create test data

**Issue**: TypeScript errors
- Solution: Run `pnpm type-check`, regenerate types

### Support Channels

- 📖 **Documentation**: [docs/](../docs/) directory
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions

---

**Ready to dive deeper?** Continue to [SETUP_GUIDE.md](SETUP_GUIDE.md)
