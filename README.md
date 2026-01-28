# OpenRouter Crew Platform

> Unified platform for cost-optimized AI development with intelligent crew orchestration

## 🚀 Quick Start

```bash
# 1. Sync secrets from your dotfiles to all projects
./scripts/secrets/sync-all-projects.sh

# 2. Install dependencies
pnpm install

# 3. Start local Supabase
supabase start

# 4. Start N8N workflows
docker-compose -f docker-compose.n8n.yml up -d

# 5. Start the dashboard
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your unified dashboard.

## ✅ System Status

**Current Status**: DDD Architecture Implemented ✅

- ✅ Next.js 15.5.10 compiling in < 5 seconds
- ✅ TypeScript packages building without errors
- ✅ Domain-Driven Design architecture with 3 bounded contexts
- ✅ 103+ N8N workflows organized by domain
- ✅ Feature federation system (domain → shared → global)
- ✅ Real-time cost tracking dashboard
- ✅ Unified secrets management across all projects

## 🏗️ Domain-Driven Architecture

### 3 Bounded Contexts

```
domains/
├── dj-booking/              # Event Management Domain
│   ├── dashboard/           # Next.js UI (port 3001)
│   ├── workflows/           # N8N workflows (12+)
│   ├── schema/              # Database migrations
│   └── agents/              # 6 MCP agents
│
├── product-factory/         # Sprint Planning Domain
│   ├── dashboard/           # Next.js UI (port 3002)
│   ├── workflows/           # N8N workflows (54+)
│   ├── schema/              # Database migrations
│   └── crew-members/        # Crew configurations
│
├── alex-ai-universal/       # Universal Platform Domain
│   ├── dashboard/           # Next.js UI (port 3003)
│   ├── workflows/           # N8N workflows (36+)
│   ├── schema/              # Database migrations
│   └── vscode-extension/    # VSCode integration
│
└── shared/                  # Shared Infrastructure
    ├── crew-coordination/   # Crew orchestration
    ├── cost-tracking/       # Cost analysis
    ├── schemas/             # TypeScript types
    └── workflows/           # Shared workflows
```

### Start Individual Domains

```bash
# DJ-Booking (Event Management)
cd domains/dj-booking/dashboard && pnpm dev  # → localhost:3001

# Product Factory (Sprint Planning)
cd domains/product-factory/dashboard && pnpm dev  # → localhost:3002

# Alex-AI-Universal (CLI & VSCode)
cd domains/alex-ai-universal/dashboard && pnpm dev  # → localhost:3003

# Unified Dashboard (Entry Point)
cd apps/unified-dashboard && pnpm dev  # → localhost:3000
```

### Feature Federation

Promote successful features from domain → shared → global:

```bash
# Promote component from Product Factory to Shared
./scripts/domain/federate-feature.sh product-factory \
  dashboard/components/SprintPlanner.tsx shared

# Promote shared feature to Global (unified dashboard)
./scripts/domain/federate-feature.sh shared \
  ui-components/src/Button.tsx global
```

### Domain-Specific Branches

```bash
# DJ-Booking features
git checkout -b domain/dj-booking/add-venue-calendar

# Product Factory features
git checkout -b domain/product-factory/improve-sprint-planning

# Alex-AI-Universal features
git checkout -b domain/alex-ai-universal/vscode-extension
```

## 🔐 Unified Secrets Management

### One Command to Sync All Projects

```bash
# Sync secrets from dotfiles to ALL projects:
# - openrouter-crew-platform (this project)
# - dj-booking
# - openrouter-ai-milestone
# - alex-ai-universal
# - rag-refresh-product-factory

./scripts/secrets/sync-all-projects.sh
```

This script:
- ✅ Loads from ~/.zshrc, ~/.alexai-keys, ~/.alexai-secrets
- ✅ Parses ~/.alexai-n8n-config.json for crew webhooks
- ✅ Syncs to .env files in all 5 projects
- ✅ Adds convenient aliases to ~/.zshrc

### New Aliases (after sync)

```bash
crew-sync      # Run unified sync across all projects
crew-load      # Load secrets for current session
crew-dashboard # Start unified dashboard
crew-n8n       # Start N8N workflows
```

## 📦 What This Unifies

### 4 Existing Projects + 1 New Platform

1. **OpenRouter Crew Platform** (NEW) - This unified platform
2. **DJ-Booking** - Event management with 6 MCP agents
3. **OpenRouter-AI-Milestone** - Reference architecture
4. **Alex-AI-Universal** - 12 crew members, 36+ workflows
5. **RAG-Refresh-Product-Factory** - Sprint planning, 54 workflows

### Shared Infrastructure

- **10 Core Crew Members** - Unified across all projects
- **Supabase Database** - Single source of truth
- **N8N Workflows** - 90+ workflows from all projects
- **Cost Tracking** - Unified LLM usage logging
- **OpenRouter Integration** - Cost-optimized model selection

## 🤖 Crew Members

| Name | Role | Cost Tier | Default Model |
|------|------|-----------|---------------|
| Captain Picard | Strategic Leadership | Premium | claude-sonnet-4-5 |
| Commander Data | Data Analytics | Standard | claude-sonnet-3.5 |
| Commander Riker | Tactical Execution | Standard | claude-sonnet-3.5 |
| Counselor Troi | User Experience | Standard | claude-haiku-3.5 |
| Lt. Worf | Security & Compliance | Standard | claude-sonnet-3.5 |
| Dr. Crusher | System Health | Standard | claude-haiku-3.5 |
| Geordi La Forge | Infrastructure | Standard | claude-sonnet-3.5 |
| Lt. Uhura | Communications | Standard | claude-haiku-3.5 |
| Quark | Business Intelligence | Budget | gemini-pro |
| Chief O'Brien | Pragmatic Solutions | Budget | claude-haiku-3.5 |

## 📚 Documentation

- **[INTEGRATION_ARCHITECTURE.md](INTEGRATION_ARCHITECTURE.md)** - Complete system design
- **[INTEGRATION_PLAN.md](INTEGRATION_PLAN.md)** - Implementation roadmap
- **[SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md)** - Secrets guide

## 🛠️ Development

```bash
# Build all packages
pnpm build

# Type check
pnpm type-check

# Start dev server
pnpm dev
```

## 🚀 Deployment

### Automatic (via GitHub Actions)

```bash
git push origin main
# Automatically deploys to Vercel, syncs Supabase, imports N8N workflows
```

### Manual

```bash
# Sync secrets to GitHub (one-time setup)
./scripts/secrets/sync-to-github.sh

# Deploy manually
vercel deploy --prod
```

## 📂 Project Structure

```
openrouter-crew-platform/
├── apps/unified-dashboard/    # Next.js dashboard (Next.js 15)
├── packages/
│   ├── crew-core/             # Crew coordination
│   ├── cost-tracking/         # Cost analysis
│   ├── shared-schemas/        # TypeScript types
│   └── n8n-workflows/         # 19 workflows
├── supabase/migrations/       # Database schema
├── scripts/secrets/           # Secrets management
│   ├── sync-all-projects.sh   # Sync to 5 projects
│   ├── load-local-secrets.sh  # Load from dotfiles
│   └── sync-to-github.sh      # Sync to CI/CD
├── .github/workflows/         # CI/CD
└── docker-compose.n8n.yml     # N8N setup
```

## 🎯 Roadmap

- [x] **Phase 1**: Foundation (COMPLETE)
- [ ] **Phase 2**: Core Services (IN PROGRESS)
- [ ] **Phase 3**: Project Integration (NEXT)
- [ ] **Phase 4**: Dashboard Completion (PLANNED)

## 📄 License

MIT © 2026 OpenRouter Crew Platform
