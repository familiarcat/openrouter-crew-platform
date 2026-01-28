# Domain-Driven Design Architecture

## Overview

The OpenRouter Crew Platform uses Domain-Driven Design (DDD) to organize code by business domain rather than technical layers. This allows:

- **Independent Development** - Each domain can be developed and deployed separately
- **Clear Boundaries** - Domain-specific logic is isolated
- **Feature Federation** - Successful features can be promoted from domain → shared → global
- **Project-Specific Milestones** - Each domain has its own roadmap
- **Domain-Specific Branching** - Feature branches scoped to domains (e.g., `domain/dj-booking/add-venue-calendar`)

## Bounded Contexts

### Core Domain Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                      UNIFIED DASHBOARD                               │
│  (Main Entry Point - Federates all domains)                         │
└────────────┬────────────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┬───────────
             │              │              │              │
             v              v              v              v
    ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ DJ-BOOKING │  │  PRODUCT   │  │  ALEX-AI   │  │   SHARED   │
    │   DOMAIN   │  │  FACTORY   │  │ UNIVERSAL  │  │   DOMAIN   │
    │            │  │   DOMAIN   │  │   DOMAIN   │  │  (CORE)    │
    └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

## New Project Structure

```
openrouter-crew-platform/
│
├── domains/                           # Domain-Driven organization
│   │
│   ├── dj-booking/                    # 🎵 Event Management Domain
│   │   ├── dashboard/                 # DJ-specific UI
│   │   │   ├── app/                   # Next.js app routes
│   │   │   ├── components/            # DJ-specific components
│   │   │   └── lib/                   # DJ-specific utilities
│   │   ├── workflows/                 # DJ-specific N8N workflows
│   │   │   ├── booking-agent.json
│   │   │   ├── music-agent.json
│   │   │   ├── finance-agent.json
│   │   │   ├── marketing-agent.json
│   │   │   ├── venue-agent.json
│   │   │   └── rag-refresh-agent.json
│   │   ├── agents/                    # MCP agent implementations
│   │   │   ├── booking/
│   │   │   ├── music/
│   │   │   ├── finance/
│   │   │   ├── marketing/
│   │   │   ├── venue/
│   │   │   └── rag-refresh/
│   │   ├── schema/                    # Domain-specific DB schema
│   │   │   └── migrations/
│   │   │       ├── 001_dj_events.sql
│   │   │       └── 002_dj_playlists.sql
│   │   ├── api/                       # Domain API
│   │   │   ├── events/
│   │   │   └── playlists/
│   │   ├── types/                     # Domain types
│   │   ├── README.md                  # Domain documentation
│   │   └── package.json
│   │
│   ├── product-factory/               # 🏭 Product Development Domain
│   │   ├── dashboard/                 # Sprint board UI
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── SprintBoard/
│   │   │   │   ├── StoryCard/
│   │   │   │   └── DependencyGraph/
│   │   │   └── lib/
│   │   ├── workflows/                 # Sprint planning workflows
│   │   │   ├── generate-sprint-zero.json
│   │   │   ├── story-refinement.json
│   │   │   └── dependency-analysis.json
│   │   ├── schema/
│   │   │   └── migrations/
│   │   │       ├── 001_product_sprints.sql
│   │   │       └── 002_product_stories.sql
│   │   ├── api/
│   │   │   ├── sprints/
│   │   │   └── stories/
│   │   ├── rag/                       # Domain-specific RAG
│   │   │   ├── knowledge-base/
│   │   │   └── embeddings/
│   │   ├── types/
│   │   ├── README.md
│   │   └── package.json
│   │
│   ├── alex-ai-universal/             # 🤖 Universal AI Platform Domain
│   │   ├── dashboard/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── ThemeGallery/
│   │   │   │   ├── CrewWizard/
│   │   │   │   └── MemoryViewer/
│   │   │   └── lib/
│   │   ├── workflows/                 # Universal workflows
│   │   │   ├── crew-coordination.json
│   │   │   ├── observation-lounge.json
│   │   │   └── hallucination-prevention.json
│   │   ├── cli/                       # alex-ai CLI
│   │   │   ├── src/
│   │   │   └── bin/
│   │   ├── vscode-extension/          # VSCode integration
│   │   ├── schema/
│   │   │   └── migrations/
│   │   │       └── 001_crew_coordination.sql
│   │   ├── rag/                       # Advanced RAG system
│   │   ├── api/
│   │   ├── types/
│   │   ├── README.md
│   │   └── package.json
│   │
│   └── shared/                        # 🌐 Shared Domain (Core)
│       ├── crew-coordination/         # Unified crew system
│       │   ├── src/
│       │   │   ├── crew-activator.ts
│       │   │   ├── crew-selector.ts
│       │   │   └── workload-balancer.ts
│       │   ├── types/
│       │   └── package.json
│       ├── cost-tracking/             # Unified cost tracking
│       │   ├── src/
│       │   │   ├── usage-logger.ts
│       │   │   ├── cost-calculator.ts
│       │   │   └── budget-enforcer.ts
│       │   └── package.json
│       ├── schemas/                   # Shared TypeScript types
│       │   ├── src/
│       │   │   ├── database.ts
│       │   │   ├── client-types.ts
│       │   │   └── helpers.ts
│       │   └── package.json
│       ├── workflows/                 # Core N8N workflows
│       │   ├── crew/                  # 10 core crew workflows
│       │   └── subflows/              # Reusable subflows
│       ├── ui-components/             # Shared React components
│       │   ├── src/
│       │   │   ├── CrewCard/
│       │   │   ├── CostChart/
│       │   │   ├── ProjectCard/
│       │   │   └── WorkloadGauge/
│       │   └── package.json
│       ├── openrouter-client/         # OpenRouter integration
│       │   ├── src/
│       │   │   ├── client.ts
│       │   │   ├── model-selector.ts
│       │   │   └── pricing-table.ts
│       │   └── package.json
│       └── supabase-client/           # Supabase utilities
│           ├── src/
│           │   ├── client.ts
│           │   └── realtime.ts
│           └── package.json
│
├── apps/
│   └── unified-dashboard/             # Main dashboard (federates domains)
│       ├── app/
│       │   ├── page.tsx               # Home (cost overview)
│       │   ├── dj-booking/            # DJ domain routes
│       │   │   └── [...all]/page.tsx  # Proxy to domain dashboard
│       │   ├── product-factory/       # Product domain routes
│       │   │   └── [...all]/page.tsx
│       │   ├── alex-ai/               # Alex AI domain routes
│       │   │   └── [...all]/page.tsx
│       │   └── crew/                  # Shared crew management
│       ├── components/                # Unified components only
│       └── package.json
│
├── infrastructure/                    # Infrastructure as Code
│   ├── supabase/
│   │   ├── migrations/                # Core migrations
│   │   │   ├── 000_core_tables.sql   # projects, crew_members, etc.
│   │   │   └── 999_views_and_functions.sql
│   │   └── seed.sql
│   ├── n8n/
│   │   └── docker-compose.yml
│   └── terraform/                     # AWS infrastructure
│
├── scripts/                           # Automation scripts
│   ├── domain/                        # Domain-specific scripts
│   │   ├── create-domain.sh           # Scaffold new domain
│   │   └── federate-feature.sh        # Promote feature to shared
│   ├── secrets/
│   │   ├── sync-all-projects.sh
│   │   └── load-local-secrets.sh
│   └── migrations/
│       └── generate-domain-migration.sh
│
├── .github/
│   └── workflows/
│       ├── deploy-unified.yml         # Deploy main dashboard
│       ├── deploy-dj-booking.yml      # Deploy DJ domain
│       ├── deploy-product-factory.yml # Deploy Product domain
│       └── deploy-alex-ai.yml         # Deploy Alex AI domain
│
├── docs/
│   ├── domains/                       # Domain-specific docs
│   │   ├── dj-booking.md
│   │   ├── product-factory.md
│   │   └── alex-ai-universal.md
│   └── architecture/
│       ├── DDD_ARCHITECTURE.md        # This file
│       └── DOMAIN_BOUNDARIES.md
│
├── pnpm-workspace.yaml                # Workspace config
├── turbo.json                         # Turborepo config
└── README.md
```

## Domain Definitions

### 1. DJ-Booking Domain 🎵

**Ubiquitous Language:**
- **Event** - A DJ booking with date, venue, type (wedding, club, etc.)
- **Playlist** - Generated music set for an event
- **Campaign** - Marketing effort for an event
- **Venue** - Location where event takes place
- **Agent** - Specialized MCP server (booking, music, finance, etc.)

**Bounded Context:**
- Manages DJ events from booking to execution
- Coordinates 6 MCP agents for different aspects
- Generates playlists based on event vibes
- Tracks event-specific costs and payments

**Key Aggregates:**
- Event (root) → Playlist, Campaign, Venue
- Budget → Payments, Costs

**Domain Services:**
- `EventCoordinator` - Orchestrates agent actions
- `PlaylistGenerator` - Creates music recommendations
- `CampaignScheduler` - Plans marketing

**Integration Points:**
- Shared Crew (via N8N webhooks)
- Shared Cost Tracking (LLM usage events)
- Shared Database (Supabase)

---

### 2. Product Factory Domain 🏭

**Ubiquitous Language:**
- **Sprint** - Time-boxed development iteration
- **Story** - User story or task
- **Epic** - Large feature spanning multiple sprints
- **Velocity** - Sprint completion rate
- **Backlog** - Prioritized list of stories

**Bounded Context:**
- Manages product development lifecycle
- Sprint planning and story management
- Dependency tracking and visualization
- RAG-powered sprint generation

**Key Aggregates:**
- Sprint (root) → Stories, Goals
- Story → Tasks, Acceptance Criteria, Dependencies
- Project → Sprints, Backlog

**Domain Services:**
- `SprintPlanner` - Generates Sprint 0
- `StoryRefinement` - Improves story quality
- `DependencyAnalyzer` - Identifies blockers

**Integration Points:**
- Shared Crew (Commander Data for analysis)
- Shared Cost Tracking
- RAG Knowledge Base (shared/rag)

---

### 3. Alex-AI-Universal Domain 🤖

**Ubiquitous Language:**
- **Theme** - Visual/behavioral configuration
- **Memory** - Crew learning and observations
- **Engagement** - CLI/VSCode interaction
- **Coordination** - Crew orchestration patterns

**Bounded Context:**
- Universal AI platform capabilities
- CLI and VSCode extension
- Advanced crew coordination
- Theme system and customization
- Crew memory and learning

**Key Aggregates:**
- Theme → Configuration, Assets
- Memory (root) → Observations, Learnings, Context
- Engagement → Commands, History

**Domain Services:**
- `ThemeManager` - Manages theme gallery
- `MemoryService` - Stores/retrieves crew memories
- `CoordinationOrchestrator` - Complex crew workflows

**Integration Points:**
- Extends Shared Crew with advanced coordination
- Provides CLI for all domains
- VSCode extension for unified experience

---

### 4. Shared Domain 🌐

**Ubiquitous Language:**
- **Crew Member** - AI agent with role and expertise
- **Usage Event** - LLM API call with cost
- **Routing Mode** - Cost tier (premium/standard/budget)
- **Webhook** - N8N workflow endpoint

**Bounded Context:**
- Core crew coordination logic
- Unified cost tracking across all domains
- Shared database schemas and types
- Reusable UI components
- OpenRouter client

**Key Services:**
- `CrewActivator` - Activates crew for tasks
- `CostCalculator` - Computes LLM costs
- `WorkloadBalancer` - Distributes crew work
- `ModelSelector` - Chooses optimal LLM

**Provides to All Domains:**
- 10 core crew members
- Cost tracking infrastructure
- Database types (TypeScript)
- UI component library
- OpenRouter integration

---

## Domain Boundaries

### Clear Separation

```
Domain-Specific Code:
✅ Dashboard UI for domain
✅ Domain workflows (N8N)
✅ Domain-specific agents/services
✅ Domain database migrations
✅ Domain API routes
✅ Domain types

Shared Code (Anti-Corruption Layer):
✅ Crew coordination
✅ Cost tracking
✅ Database types
✅ UI components
✅ OpenRouter client

Unified Dashboard:
✅ Domain route proxies
✅ Cost overview (aggregates domains)
✅ Crew management (shared)
✅ Navigation between domains
```

### Anti-Corruption Layer

Each domain interacts with shared services through well-defined interfaces:

```typescript
// domains/dj-booking/services/crew-adapter.ts
import { CrewActivator } from '@openrouter-crew/shared/crew-coordination';

export class DJCrewAdapter {
  async requestMusicAgent(event: Event): Promise<Playlist> {
    // Domain-specific logic
    const result = await CrewActivator.activate({
      crewMember: 'geordi_la_forge', // Music expertise
      task: `Generate playlist for ${event.type} event`,
      context: {
        domain: 'dj-booking',
        eventId: event.id,
        vibes: event.vibes
      }
    });

    // Transform shared response to domain model
    return this.toPlaylist(result);
  }
}
```

## Git Workflow

### Branch Naming Convention

```bash
# Domain-specific feature
domain/dj-booking/add-venue-calendar
domain/product-factory/sprint-velocity-chart
domain/alex-ai/theme-import-export

# Shared feature
shared/crew-coordination/workload-balancer
shared/ui-components/cost-chart-v2

# Unified dashboard
unified/navigation-improvements
unified/cost-overview-redesign

# Infrastructure
infra/supabase/add-pgvector
infra/n8n/upgrade-to-1.0
```

### Milestone Structure

**Domain-Specific Milestones:**
```
DJ-Booking v1.0 - Event Management MVP
├── Feature: Venue Calendar Integration
├── Feature: Playlist Auto-Generation
└── Feature: Marketing Campaign Automation

Product Factory v1.0 - Sprint Planning MVP
├── Feature: Sprint Board Visualization
├── Feature: Story Dependency Graph
└── Feature: Automated Sprint 0 Generation

Alex-AI v1.0 - Universal Platform Core
├── Feature: CLI Integration
├── Feature: VSCode Extension
└── Feature: Theme Gallery
```

**Global Milestones:**
```
Platform v1.0 - Unified Foundation
├── Shared Crew System (10 members)
├── Unified Cost Tracking
├── Supabase Schema Complete
└── All Domain Dashboards Integrated
```

## Feature Federation

### Promoting Features from Domain → Shared → Global

**Example: Sprint Board Component (Product Factory → Shared)**

1. **Develop in Domain:**
   ```
   domains/product-factory/dashboard/components/SprintBoard/
   ```

2. **Extract to Shared:**
   ```bash
   ./scripts/domain/federate-feature.sh \
     --source domains/product-factory/dashboard/components/SprintBoard \
     --target domains/shared/ui-components/SprintBoard \
     --abstract-for reuse
   ```

3. **Generalize Interface:**
   ```typescript
   // Before (domain-specific)
   interface SprintBoardProps {
     sprint: ProductSprint;  // Domain type
   }

   // After (generalized)
   interface SprintBoardProps {
     sprint: {
       id: string;
       name: string;
       items: Array<{ id: string; title: string; status: string; }>;
     };
   }
   ```

4. **Use in Multiple Domains:**
   ```typescript
   // domains/dj-booking can now use it for event planning
   import { SprintBoard } from '@openrouter-crew/shared/ui-components';

   <SprintBoard
     sprint={{
       id: event.id,
       name: event.name,
       items: event.tasks.map(task => ({
         id: task.id,
         title: task.description,
         status: task.status
       }))
     }}
   />
   ```

## Package Naming Convention

```
@openrouter-crew/dj-booking-dashboard
@openrouter-crew/dj-booking-workflows
@openrouter-crew/dj-booking-agents

@openrouter-crew/product-factory-dashboard
@openrouter-crew/product-factory-workflows

@openrouter-crew/alex-ai-dashboard
@openrouter-crew/alex-ai-cli
@openrouter-crew/alex-ai-vscode

@openrouter-crew/shared-crew-coordination
@openrouter-crew/shared-cost-tracking
@openrouter-crew/shared-schemas
@openrouter-crew/shared-ui-components
@openrouter-crew/shared-openrouter-client
```

## Development Workflow

### Working on a Domain

```bash
# 1. Create feature branch for domain
git checkout -b domain/dj-booking/add-venue-calendar

# 2. Navigate to domain
cd domains/dj-booking

# 3. Install dependencies
pnpm install

# 4. Start domain dashboard in isolation
pnpm dev

# 5. Test domain features
pnpm test

# 6. Build domain
pnpm build

# 7. Commit and push (domain-scoped)
git add domains/dj-booking
git commit -m "feat(dj-booking): add venue calendar integration"
git push origin domain/dj-booking/add-venue-calendar
```

### Cross-Domain Development

```bash
# Work on shared feature affecting multiple domains
git checkout -b shared/crew-coordination/improve-workload-balance

# Changes affect:
cd domains/shared/crew-coordination  # Core logic
cd domains/dj-booking                 # Update DJ usage
cd domains/product-factory            # Update Product usage

# Test across domains
pnpm test --filter "@openrouter-crew/dj-booking-*"
pnpm test --filter "@openrouter-crew/product-factory-*"
```

## Deployment Strategy

### Independent Domain Deployment

Each domain can be deployed independently:

```yaml
# .github/workflows/deploy-dj-booking.yml
name: Deploy DJ-Booking Domain

on:
  push:
    branches: [main]
    paths:
      - 'domains/dj-booking/**'
      - 'domains/shared/**'

jobs:
  deploy-dj-booking:
    runs-on: ubuntu-latest
    steps:
      - name: Build DJ-Booking Dashboard
        run: pnpm --filter @openrouter-crew/dj-booking-dashboard build

      - name: Deploy to Vercel
        run: vercel deploy --prod
        working-directory: domains/dj-booking/dashboard
```

### Unified Dashboard Deployment

```yaml
# .github/workflows/deploy-unified.yml
name: Deploy Unified Dashboard

on:
  push:
    branches: [main]
    paths:
      - 'apps/unified-dashboard/**'
      - 'domains/shared/**'

# Deploys main entry point that federates all domains
```

## Benefits of DDD Architecture

### 1. Independent Development ✅
- Teams can work on different domains without conflicts
- Domain experts own their bounded context
- Faster feature development within domains

### 2. Clear Boundaries ✅
- Domain logic isolated from shared infrastructure
- Anti-corruption layers prevent leaky abstractions
- Easy to understand what belongs where

### 3. Scalability ✅
- Domains can be deployed independently
- Horizontal scaling per domain
- Separate CI/CD pipelines reduce deployment risk

### 4. Feature Reusability ✅
- Successful patterns can be federated
- Shared components benefit all domains
- Avoid reinventing the wheel

### 5. Maintainability ✅
- Easier to onboard new developers (focus on one domain)
- Reduced cognitive load (domain-specific knowledge)
- Refactoring scoped to domain boundaries

## Migration Plan

### Phase 1: Restructure (Week 1)
- [ ] Create `domains/` directory structure
- [ ] Move existing packages to appropriate domains
- [ ] Set up domain-specific package.json files
- [ ] Update pnpm-workspace.yaml

### Phase 2: Extract Dashboards (Week 2)
- [ ] Extract DJ-Booking dashboard to `domains/dj-booking/dashboard`
- [ ] Extract Product Factory dashboard to `domains/product-factory/dashboard`
- [ ] Extract Alex-AI dashboard to `domains/alex-ai-universal/dashboard`
- [ ] Update unified dashboard to proxy to domains

### Phase 3: Organize Workflows (Week 3)
- [ ] Move DJ-specific workflows to `domains/dj-booking/workflows`
- [ ] Move Product-specific workflows to `domains/product-factory/workflows`
- [ ] Move Universal workflows to `domains/alex-ai-universal/workflows`
- [ ] Keep core workflows in `domains/shared/workflows`

### Phase 4: Domain APIs (Week 4)
- [ ] Create domain-specific API routes
- [ ] Implement anti-corruption layers
- [ ] Set up domain-to-shared communication patterns
- [ ] Test cross-domain integration

---

**Version**: 1.0
**Status**: Architecture Designed, Ready for Implementation
**Last Updated**: 2026-01-28
