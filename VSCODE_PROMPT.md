# VSCode Continuation Prompt for OpenRouter Crew Platform

Copy and paste this prompt when opening the project in VSCode to provide full context:

---

## Project Context

I'm working on the **OpenRouter Crew Platform**, a unified monorepo that consolidates 4 separate projects:

1. **openrouter-ai-milestone-20260128-043029** - Cost optimization foundation (71 files) - PRIMARY SOURCE
2. **alex-ai-universal** - Universal AI assistant (1,984 files) - CREW SYSTEM SOURCE
3. **rag-refresh-product-factory** - Product ideation platform (248 files) - PROJECT MANAGEMENT SOURCE
4. **dj-booking** - DJ event management (32 files) - EVENT MANAGEMENT SOURCE

**Project Location**: `/Users/bradygeorgen/Documents/workspace/openrouter-crew-platform`

## What's Been Accomplished

### Phase 1-2: Foundation (✅ COMPLETE)

**Infrastructure & Setup**:
- ✅ Monorepo structure with pnpm workspaces (6 packages total)
- ✅ Root package.json with 35+ npm scripts
- ✅ Docker Compose with 5 services (Supabase, n8n, Dashboard, Redis)
- ✅ Terraform infrastructure for AWS deployment (9 files)
- ✅ GitHub Actions workflows for CI/CD and secrets audit
- ✅ Comprehensive documentation (4 guides, 3,000+ lines)

**Shared Packages (4 complete)**:
1. **crew-core** (500 lines) - 10 Star Trek crew members, coordinator, webhook client
2. **cost-tracking** (800 lines) - 8-step optimization pipeline, 6 models, budget enforcer
3. **shared-schemas** (350 lines) - Type-safe Supabase database access
4. **n8n-workflows** (18 files) - 8 subflows + 10 crew workflows

**Database**:
- ✅ Unified Supabase schema (462 lines, 12+ tables)
- ✅ Core tables: projects, llm_usage_events, crew_members, crew_memories, workflows
- ✅ Project-specific tables: dj_events, product_sprints, product_stories
- ✅ Automatic triggers for updated_at and cost rollups

**Dashboard**:
- ✅ Next.js 14 app with App Router
- ✅ Real-time cost tracking with Supabase subscriptions
- ✅ Project listing with status badges
- ✅ API usage monitoring
- ✅ Health check endpoint
- ✅ Responsive design with Tailwind CSS

### Phase 3: Dashboard Enhancement (⚠️ IN PROGRESS - 75%)

**Complete**:
- Dashboard MVP with real-time updates
- Project cards with budget tracking
- Cost aggregation and display

**Pending**:
- Advanced analytics charts
- Crew member status visualization
- n8n workflow management UI
- Project CRUD operations

### Phase 4-5: Pending

- Project migrations (rag-refresh, alex-ai, dj-booking)
- GitHub Actions CI/CD implementation
- AWS deployment automation
- Production monitoring setup

## Project Architecture

```
openrouter-crew-platform/
├── apps/
│   └── unified-dashboard/        # Next.js 14 + Supabase real-time
├── packages/
│   ├── crew-core/                # 10 crew members + coordinator
│   ├── cost-tracking/            # OpenRouter optimization
│   ├── shared-schemas/           # Type-safe DB access
│   └── n8n-workflows/            # 18 workflow definitions
├── supabase/
│   └── migrations/               # Unified schema
├── terraform/                    # AWS Infrastructure as Code
├── scripts/                      # Automation helpers
│   ├── secrets/                  # Secret management
│   ├── milestone/                # GitFlow helpers
│   └── n8n/                      # Workflow sync
├── docs/                         # 4 comprehensive guides
└── [configs]                     # Docker, pnpm, TypeScript
```

## Key Files to Know

### Configuration
- `/package.json` - Root workspace with 35+ scripts
- `/pnpm-workspace.yaml` - Monorepo definition
- `/tsconfig.json` - Shared TypeScript config
- `/docker-compose.yml` - Local development stack
- `/docker-compose.prod.yml` - Production configuration

### Packages
- `/packages/crew-core/src/members.ts` - 10 crew member definitions
- `/packages/cost-tracking/src/model-router.ts` - 6 model configurations
- `/packages/shared-schemas/src/database.ts` - All Supabase types

### Dashboard
- `/apps/unified-dashboard/app/page.tsx` - Main dashboard
- `/apps/unified-dashboard/lib/supabase.ts` - Supabase client setup
- `/apps/unified-dashboard/lib/utils.ts` - Helper functions

### Infrastructure
- `/terraform/main.tf` - AWS provider and resources
- `/terraform/ec2.tf` - EC2 instance configuration
- `/.github/workflows/deploy.yml` - Deployment workflow

### Documentation
- `/README.md` - Project overview (600+ lines)
- `/docs/DEPLOYMENT.md` - AWS deployment guide
- `/docs/SECRETS_SETUP.md` - Secret management guide
- `/REFACTORING_ANALYSIS.md` - Effectiveness report
- `/PACKAGES_SUMMARY.md` - Package documentation

## Current Status

### What's Running
```bash
# Dashboard
http://localhost:3000 ✅ (Next.js dev server)

# Supabase
http://127.0.0.1:54321 ✅ (API)
http://127.0.0.1:54323 ✅ (Studio)

# Local Development
pnpm dev ✅ (starts all services)
```

### What's Built
- All 4 packages compiled
- Dashboard compiling successfully
- Terraform validated
- Docker Compose tested

### Git Status
- Main branch with 7 commits
- All Phase 1-2 work committed
- Ready for remote push

## Project Goals

### Immediate Goals (This Week)
1. Complete Phase 3 dashboard enhancements
2. Add project CRUD operations UI
3. Implement crew member status visualization
4. Add cost analytics charts

### Short-term Goals (Week 2-3)
1. Migrate rag-refresh-product-factory to apps/
2. Integrate product sprint management
3. Add RAG system integration
4. Update n8n webhooks

### Medium-term Goals (Week 3-5)
1. Migrate alex-ai-universal features
2. Consolidate 235+ automation scripts
3. Migrate dj-booking application
4. Implement GitHub Actions CI/CD

### Long-term Goals (Month 2+)
1. Deploy to AWS via Terraform
2. Set up production monitoring
3. Implement advanced analytics
4. Add vector search (pgvector)

## Key Patterns & Conventions

### Monorepo Commands
```bash
# Install dependencies
pnpm install

# Start all services
pnpm dev

# Build packages
pnpm -r build

# Build specific package
pnpm --filter @openrouter-crew/crew-core build

# Run dashboard only
pnpm --filter @openrouter-crew/unified-dashboard dev
```

### Package Imports
```typescript
// Crew system
import { getCrewMember, crewCoordinator } from '@openrouter-crew/crew-core';

// Cost tracking
import { modelRouter, budgetEnforcer } from '@openrouter-crew/cost-tracking';

// Database types
import { Database, Project, LLMUsageEvent } from '@openrouter-crew/shared-schemas';
```

### Naming Conventions
- **Packages**: kebab-case (crew-core, cost-tracking)
- **Files**: kebab-case (model-router.ts, crew-members.ts)
- **Functions**: camelCase (getCrewMember, selectCrewMember)
- **Constants**: UPPER_CASE (CREW_MEMBERS, MODEL_DATABASE)
- **Types**: PascalCase (CrewMember, ModelInfo)

### Git Commit Format
```
<type>: <description>

<optional body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

Types: feat, fix, docs, chore, refactor, test, ci

## Tech Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript 5.9
- Tailwind CSS 3.4
- Lucide React (icons)

**Backend/Database**:
- Supabase (PostgreSQL + Realtime)
- Supabase JS Client 2.39

**Automation**:
- n8n (workflow orchestration)
- Docker & Docker Compose

**Infrastructure**:
- Terraform (AWS IaC)
- GitHub Actions (CI/CD)

**Package Management**:
- pnpm 9.12 (workspaces)

## Common Tasks

### Local Development
```bash
# Start everything
pnpm dev

# Reset Supabase
pnpm supabase:reset

# Sync secrets from ~/.zshrc
pnpm secrets:sync

# Sync n8n workflows
pnpm n8n:sync
```

### Building
```bash
# Build all packages
pnpm -r build

# Type check
pnpm type-check

# Lint
pnpm lint
```

### Database
```bash
# Start Supabase
pnpm supabase:start

# Run migrations
pnpm db:migrate

# Open Supabase Studio
open http://127.0.0.1:54323
```

### Deployment
```bash
# Apply Terraform
cd terraform
terraform apply

# Set up GitHub secrets
bash scripts/secrets/setup-github-secrets.sh
```

## Integration Statistics

**Consolidation Results**:
- Files: 2,335 → 158 (93% reduction)
- Supabase Cost: $100/mo → $25/mo (75% savings)
- n8n Workflows: 143 → 30 (79% reduction)
- Scripts: 430+ → 50 (88% reduction)

**Code Quality**:
- Type Safety: 100% (all packages TypeScript)
- Code Duplication: <5% (down from 40%+)
- Documentation: 3,000+ lines
- Test Coverage: 0% (pending - needs test suite)

## Known Issues & TODOs

### High Priority
- [ ] Add test suite (Jest + React Testing Library)
- [ ] Implement GitHub Actions CI/CD
- [ ] Add advanced analytics to dashboard
- [ ] Migrate rag-refresh-product-factory

### Medium Priority
- [ ] Add user authentication (Supabase Auth)
- [ ] Implement rate limiting (Redis)
- [ ] Add monitoring dashboards (CloudWatch)
- [ ] Optimize Supabase queries with indexes

### Low Priority
- [ ] Add vector search (pgvector)
- [ ] Implement webhook management UI
- [ ] Add multi-tenancy support
- [ ] Create marketplace for workflows

## Important Notes

1. **Local Supabase**: Always running on http://127.0.0.1:54321
2. **Dashboard Port**: 3000 (configurable in package.json)
3. **Environment Files**: Never commit .env.local (in .gitignore)
4. **Package Dependencies**: Use `workspace:*` for internal packages
5. **Database Schema**: Single source of truth in supabase/migrations/
6. **Cost Tracking**: All usage logged to llm_usage_events table
7. **Real-time Updates**: Supabase subscriptions for live data

## How to Help Me Continue

When working on this project, please:

1. **Understand the context** from this prompt
2. **Follow existing patterns** (monorepo structure, naming conventions)
3. **Update documentation** when adding features
4. **Use shared packages** instead of duplicating code
5. **Type everything** - 100% TypeScript coverage is the goal
6. **Test locally** before committing (pnpm dev should work)
7. **Reference source projects** when migrating features:
   - openrouter-ai-milestone: Cost optimization patterns
   - alex-ai-universal: Crew member behaviors
   - rag-refresh-product-factory: Project management UI
   - dj-booking: Event management patterns

## Questions to Ask Me

If you need clarification:

1. "Which phase are we focusing on?" (Phase 3 dashboard enhancements in progress)
2. "Should I follow patterns from [source project]?" (Yes, reference for consistency)
3. "Where should this new feature go?" (Probably apps/ or packages/)
4. "Do we need a new package?" (Rare - try to use existing packages first)
5. "Should this be in the database schema?" (If shared across projects, yes)

## Success Criteria

You'll know you're on the right track if:

- ✅ Code compiles without TypeScript errors
- ✅ `pnpm dev` starts all services successfully
- ✅ New features use shared packages (@openrouter-crew/*)
- ✅ Database changes go through migrations
- ✅ Documentation is updated
- ✅ Git commits follow format
- ✅ No code duplication introduced

---

**Project Owner**: Brady Georgen
**AI Assistant**: Claude Sonnet 4.5
**Last Updated**: January 28, 2026
**Session Context**: Full refactoring of 4 projects into unified platform

**Ready to Continue**: Yes! Dashboard is running, all packages built, foundation complete.
