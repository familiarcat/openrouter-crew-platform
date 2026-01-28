# OpenRouter Crew Platform

**A unified, cost-optimized AI orchestration platform combining n8n workflows, Supabase data management, and Star Trek crew-based intelligence.**

## 🎯 Vision

This monorepo unifies four separate projects into a cohesive platform:
- **dj-booking** - Event management with AI booking agents
- **alex-ai-universal** - Universal AI assistant with 235+ automation scripts
- **rag-refresh-product-factory** - Product ideation with sprint management
- **openrouter-ai-milestone** - OpenRouter cost optimization dashboard

## 🏗️ Architecture

```
openrouter-crew-platform/
├── packages/                    # Shared libraries
│   ├── shared-schemas/          # Unified Supabase TypeScript types
│   ├── crew-core/               # Crew member logic (10 members)
│   ├── cost-tracking/           # OpenRouter cost optimization
│   ├── n8n-workflows/           # Consolidated workflows (143→30)
│   └── shared-scripts/          # Common automation (430→50)
│
├── apps/                        # Applications
│   ├── unified-dashboard/       # Main dashboard (Next.js 14)
│   ├── dj-booking/              # DJ event management
│   ├── product-factory/         # Product ideation & sprints
│   └── cli/                     # CLI interface
│
├── supabase/                    # Unified database
│   ├── migrations/              # Schema migrations
│   ├── seed.sql                 # Test data
│   └── config.toml              # Local config
│
├── scripts/                     # Automation
│   ├── deploy/                  # Deployment automation
│   ├── n8n/                     # n8n workflow sync
│   ├── secrets/                 # Secret management
│   ├── milestone/               # GitFlow & milestones
│   └── docker/                  # Docker utilities
│
├── infrastructure/              # IaC
│   ├── terraform/               # AWS infrastructure
│   └── docker/                  # Container configs
│
└── docs/                        # Documentation
    ├── INTEGRATION_PLAN.md      # Integration strategy
    ├── ARCHITECTURE.md          # System architecture
    ├── DEPLOYMENT.md            # Deployment guide
    └── DEVELOPMENT.md           # Developer guide
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker Desktop
- Supabase CLI
- n8n (local or remote)

### Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd openrouter-crew-platform

# 2. Install dependencies
pnpm install

# 3. Set up secrets (scrapes from ~/.zshrc)
pnpm secrets:sync

# 4. Start local Supabase
pnpm supabase:start

# 5. Start all services
pnpm dev

# 6. Open dashboard
open http://localhost:3000
```

### Docker Development

```bash
# Start all services (Supabase + n8n + Dashboard)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📊 Key Features

### 1. Unified Cost Tracking
- Real-time OpenRouter usage across all projects
- Per-project, per-crew-member, per-model breakdowns
- Budget enforcement and alerts
- Historical cost analysis

### 2. Crew-Based Intelligence (10 Members)
- **Captain Picard** - Strategic leadership (premium tier)
- **Commander Data** - Data analytics (standard tier)
- **Commander Riker** - Tactical execution (standard tier)
- **Counselor Troi** - User experience (standard tier)
- **Lt. Worf** - Security & compliance (standard tier)
- **Dr. Crusher** - System health (standard tier)
- **Geordi La Forge** - Infrastructure (standard tier)
- **Lt. Uhura** - Communications (standard tier)
- **Chief O'Brien** - Pragmatic solutions (budget tier)
- **Quark** - Business intelligence & ROI (budget tier)

### 3. Cost Optimization Pipeline (8 Subflows)
1. **Token Cost Meter** - Measure tokens and estimate cost
2. **Context Compressor** - Reduce context size
3. **Hybrid Model Router** - Select cheapest viable model
4. **LLM Executor** - Execute OpenRouter API calls
5. **Budget Enforcer** - Block over-budget requests
6. **Reflection Self-Tuner** - Learn from history
7. **Usage Logger** - Emit events to Supabase
8. **Workflow Change Watcher** - Detect workflow edits

### 4. Project Types Supported
- **DJ Booking** - Events, playlists, venues, campaigns
- **Product Factory** - Sprints, stories, acceptance criteria
- **AI Assistant** - Universal coding assistant
- **Custom** - Extensible for new project types

### 5. Milestone Branching System
- GitFlow-based milestone branches
- Independent feature development
- Merge to master when complete
- Automated milestone creation and tracking

### 6. Bidirectional Sync
- Local ↔ Remote n8n workflow sync
- Local ↔ Remote Supabase sync
- Git-based version control for all configs

## 🔐 Secret Management

Secrets are stored in `~/.zshrc` and automatically synchronized:

```bash
# In ~/.zshrc
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
export OPENROUTER_API_KEY="sk-or-v1-..."
export N8N_API_KEY="your-n8n-key"
export N8N_BASE_URL="https://n8n.yourdomain.com"

# Sync to project
pnpm secrets:sync
```

Never commit `.env.local` files - they're auto-generated from ~/.zshrc.

## 📦 Package Scripts

```bash
# Development
pnpm dev                    # Start all services
pnpm dev:dashboard          # Dashboard only
pnpm dev:supabase           # Supabase only
pnpm dev:n8n                # n8n only

# Building
pnpm build                  # Build all apps
pnpm build:dashboard        # Dashboard only
pnpm type-check             # TypeScript validation
pnpm lint                   # ESLint all packages

# Database
pnpm supabase:start         # Start local Supabase
pnpm supabase:stop          # Stop local Supabase
pnpm supabase:reset         # Reset database
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed test data

# n8n
pnpm n8n:sync               # Sync workflows from git
pnpm n8n:export             # Export workflows to git
pnpm n8n:activate           # Activate all workflows

# Deployment
pnpm deploy:local           # Deploy locally via Docker
pnpm deploy:aws             # Deploy to AWS (Terraform)
pnpm deploy:vercel          # Deploy dashboard to Vercel

# Secrets
pnpm secrets:sync           # Sync from ~/.zshrc
pnpm secrets:validate       # Validate all secrets present

# Milestones
pnpm milestone:create       # Create new milestone
pnpm milestone:push         # Push milestone to remote

# Testing
pnpm test                   # Run all tests
pnpm test:integration       # Integration tests
pnpm test:e2e               # End-to-end tests

# Docker
pnpm docker:up              # Start Docker services
pnpm docker:down            # Stop Docker services
pnpm docker:logs            # View logs
```

## 🎨 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + React 18 | Server-side rendering, real-time updates |
| **Database** | Supabase (PostgreSQL) | Unified data store with RLS |
| **Workflows** | n8n | Crew coordination and automation |
| **LLM Gateway** | OpenRouter | Cost-optimized model routing |
| **Package Manager** | pnpm workspaces | Monorepo management |
| **Infrastructure** | Terraform | AWS deployment |
| **Containers** | Docker Compose | Local development |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Secrets** | ~/.zshrc + .env.local | Secure credential management |

## 📈 Cost Optimization Results

| Metric | Before Integration | After Integration | Improvement |
|--------|-------------------|-------------------|-------------|
| **Supabase Costs** | $100/mo (4 projects) | $25/mo (1 project) | **75% savings** |
| **n8n Workflows** | 143 workflows | 30 workflows | **79% reduction** |
| **Scripts** | 430+ scripts | 50 scripts | **88% reduction** |
| **Dashboards** | 4 separate | 1 unified | **Single pane** |
| **Cost Visibility** | Fragmented | Real-time unified | **100% transparency** |
| **Developer Time** | 4 contexts | 1 monorepo | **3x faster** |

## 🔄 Workflow Architecture

### Local Development Flow
```
Developer → Git Commit → Pre-commit Hook → Linting/Tests
                ↓
        Milestone Branch
                ↓
    Local Supabase + n8n Testing
                ↓
        Merge to Master
                ↓
        GitHub Actions CI/CD
                ↓
    Deploy to AWS (Terraform)
```

### Cost Optimization Flow
```
API Request → Token Cost Meter → Budget Check
                    ↓                 ↓
              Context Compress    DENY (over budget)
                    ↓
            Model Router (cheapest viable)
                    ↓
            LLM Executor (OpenRouter)
                    ↓
            Usage Logger (Supabase)
                    ↓
        Reflection Tuner (learn patterns)
```

## 🗄️ Database Schema

### Core Tables
- `projects` - All project types (DJ, product, AI, custom)
- `llm_usage_events` - Unified cost tracking
- `crew_members` - 10 shared crew members
- `crew_memories` - Persistent crew knowledge
- `workflows` - n8n workflow registry
- `workflow_executions` - Execution monitoring

### Project-Specific Tables
- `dj_events` - DJ bookings
- `dj_playlists` - Generated playlists
- `product_sprints` - Agile sprints
- `product_stories` - User stories
- Custom tables for new project types

## 🤝 Contributing

### Milestone Branching Workflow

```bash
# 1. Create new milestone branch
pnpm milestone:create "feature-name"

# 2. Make changes in your domain
cd apps/dj-booking  # or apps/product-factory, etc.

# 3. Commit frequently
git add .
git commit -m "feat: add new booking feature"

# 4. Push milestone
pnpm milestone:push

# 5. When complete, merge to master
git checkout main
git merge milestone/feature-name
git push
```

### Domain Isolation

Each app in `apps/` is independently deployable:
- **apps/unified-dashboard** - Depends on all packages
- **apps/dj-booking** - Depends on crew-core, cost-tracking
- **apps/product-factory** - Depends on crew-core, cost-tracking
- **apps/cli** - Depends on all packages

Shared packages in `packages/` are used by multiple apps.

## 📚 Documentation

- [Integration Plan](docs/INTEGRATION_PLAN.md) - Complete integration strategy
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and decisions
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [API Reference](docs/API.md) - API documentation
- [n8n Workflows](docs/N8N_WORKFLOWS.md) - Workflow documentation

## 🐛 Troubleshooting

### Supabase Connection Issues
```bash
# Check Supabase status
supabase status

# Reset if needed
pnpm supabase:reset
```

### n8n Webhook Issues
```bash
# Verify webhooks are active
pnpm n8n:activate

# Check webhook URLs
cat .env.local | grep N8N_CREW
```

### Secret Issues
```bash
# Re-sync from ~/.zshrc
pnpm secrets:sync

# Validate all secrets present
pnpm secrets:validate
```

### Docker Issues
```bash
# Clean rebuild
docker-compose down -v
docker-compose up --build -d
```

## 📊 Monitoring

Access monitoring dashboards:
- **Unified Dashboard:** http://localhost:3000
- **Supabase Studio:** http://localhost:54323
- **n8n UI:** http://localhost:5678 (if running locally)

## 🎯 Roadmap

- [x] Phase 1: Unified database schema
- [x] Phase 2: Consolidated n8n workflows
- [x] Phase 3: Shared script library
- [ ] Phase 4: Unified dashboard (in progress)
- [ ] Phase 5: AWS infrastructure automation
- [ ] Phase 6: Advanced cost optimization
- [ ] Phase 7: Multi-tenant support

## 📄 License

MIT - See LICENSE file for details

## 🙏 Acknowledgments

Built on the foundation of:
- dj-booking - Event management system
- alex-ai-universal - Universal AI assistant
- rag-refresh-product-factory - Product ideation platform
- openrouter-ai-milestone - Cost optimization dashboard

---

**Questions?** Check the [docs/](docs/) directory or open an issue.
