# OpenRouter Crew Platform - Integration Architecture

## Executive Summary

This document outlines the integration architecture for unifying 4 existing projects into a single cohesive platform:
1. **DJ-Booking** - Event management with 6 MCP agents
2. **OpenRouter-AI-Milestone** - Reference architecture for cost optimization
3. **Alex-AI-Universal** - Universal AI platform with 12+ crew members
4. **RAG-Refresh-Product-Factory** - Product development with sprint planning

## Current Status

### ✅ Completed
- **Build System**: Next.js 15.5.10 build working perfectly
- **TypeScript**: All packages compile without errors
- **Supabase Schema**: Unified schema with 10 core tables
- **N8N Workflows**: 19 workflow files structured and ready
- **Dashboard MVP**: Real-time cost tracking UI built
- **Package Structure**: Monorepo with crew-core, cost-tracking, shared-schemas

### 🔨 Integration Components Ready

**Database (Supabase)**
```
✓ projects - Central registry for all project types
✓ llm_usage_events - Unified cost tracking
✓ crew_members - Shared crew definitions (10 members)
✓ crew_memories - Persistent knowledge store
✓ workflows - N8N workflow registry
✓ workflow_executions - Execution history
✓ dj_events, dj_playlists - DJ-Booking integration
✓ product_sprints, product_stories - Product Factory integration
```

**Frontend (Next.js 15)**
```
✓ apps/unified-dashboard - Real-time dashboard
✓ Client Components - React 18 with TypeScript
✓ Supabase Integration - Real-time subscriptions
✓ Type Safety - ClientTypes for optimized imports
✓ Build Optimization - Fast builds (< 5 seconds)
```

**Packages**
```
✓ @openrouter-crew/crew-core - Crew coordination logic
✓ @openrouter-crew/cost-tracking - Cost analysis & optimization
✓ @openrouter-crew/shared-schemas - Unified database types
✓ @openrouter-crew/n8n-workflows - 19 workflow definitions
```

## Integration Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                                 │
├─────────────────────────────────────────────────────────────────────┤
│  VSCode Extension  │  Unified Dashboard  │  CLI Tool  │  Chat UI    │
│  (alex-ai-universal) │  (Next.js)        │  (alex-ai) │  (WebSocket)│
└────────────┬────────────────┬────────────────┬─────────────┬────────┘
             │                │                │             │
             v                v                v             v
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  /api/projects/*   │  /api/crew/*    │  /api/usage/*   │  /api/workflows/*│
│  /api/sprints/*    │  /api/events/*  │  /api/rag/*     │  /api/auth/*    │
└────────────┬────────────────┬────────────────┬─────────────┬────────┘
             │                │                │             │
             v                v                v             v
┌─────────────────────────────────────────────────────────────────────┐
│                   ORCHESTRATION LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│              N8N Workflow Engine (90+ Workflows)                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Crew Coordination  │  Cost Optimization  │  Anti-Hallucination│  │
│  │  Observation Lounge │  Model Selection    │  Task Automation   │  │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────┬────────────────┬────────────────┬─────────────┬────────┘
             │                │                │             │
             v                v                v             v
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVICES LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Crew Service    │  Cost Service   │  RAG Service    │  Workflow Service│
│  (crew-core)     │ (cost-tracking) │ (pgvector)     │  (n8n-client)   │
└────────────┬────────────────┬────────────────┬─────────────┬────────┘
             │                │                │             │
             v                v                v             v
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────┤
│                    Supabase (PostgreSQL + pgvector)                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Unified Schema (10 core tables + project-specific extensions)│  │
│  │  Real-time Subscriptions │  RBAC │  Vector Search             │  │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────┬────────────────┬────────────────┬─────────────┬────────┘
             │                │                │             │
             v                v                v             v
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────┤
│  OpenRouter     │  Anthropic      │  OpenAI        │  Gemini         │
│  (Primary LLM)  │  (Claude)       │  (GPT-4)       │  (Gemini Pro)   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

#### 1. Project Creation Flow
```
User creates project in Dashboard
  → POST /api/projects
  → Insert into projects table
  → Assign crew members based on expertise
  → Create project_members associations
  → Initialize budget tracking
  → Subscribe to real-time cost updates
  → Dashboard updates with new project
```

#### 2. Crew Activation Flow
```
Project needs crew assistance
  → Identify required expertise (e.g., "infrastructure")
  → Call N8N webhook: N8N_CREW_GEORDI_WEBHOOK
  → N8N workflow:
      - Analyze request context
      - Select optimal LLM (via Quark optimization)
      - Choose routing mode (budget/standard/premium)
      - Execute LLM call via OpenRouter
  → Log to llm_usage_events (cost tracking)
  → Store result in crew_memories
  → Update project total_cost_usd (trigger)
  → Dashboard updates cost in real-time
  → Return result to requesting project
```

#### 3. Cost Tracking Flow
```
Any LLM call from any project
  → Log to llm_usage_events:
      - project_id
      - crew_member
      - provider, model
      - tokens (input/output/total)
      - estimated_cost_usd
      - routing_mode
  → Database trigger updates:
      - projects.total_cost_usd (aggregate)
      - crew_members.workload_current (increment)
  → Real-time subscription pushes to Dashboard
  → Cost alerts if budget exceeded
  → Analytics update for crew utilization
```

#### 4. Sprint Planning Flow (Product Factory)
```
User creates sprint in Dashboard
  → POST /api/sprints
  → Insert into product_sprints
  → Generate Sprint 0 stories (if first sprint):
      - Activate Commander Data (Analytics)
      - Analyze project requirements
      - Generate user stories via OpenRouter
      - Log cost to llm_usage_events
  → Assign stories to crew members by expertise
  → Update sprint velocity calculations
  → Dashboard displays sprint board
```

#### 5. DJ Event Flow (DJ-Booking)
```
User creates DJ event
  → POST /api/events
  → Insert into dj_events
  → Trigger crew activation:
      - Booking Agent: Confirm availability
      - Music Agent: Generate playlist recommendations
      - Finance Agent: Calculate pricing
      - Marketing Agent: Create promotion campaign
      - Venue Agent: Coordinate logistics
  → Each agent logs to llm_usage_events
  → Aggregate costs updated in projects table
  → Dashboard shows event cost breakdown
```

## Unified Crew System

### Shared Crew Members (10 Core)

| Crew Member | Role | Cost Tier | Expertise | Default Model |
|-------------|------|-----------|-----------|---------------|
| Captain Picard | Strategic Leadership | Premium | Strategy, decision-making, planning | claude-sonnet-4-5 |
| Commander Data | Data Analytics | Standard | Data analysis, pattern recognition | claude-sonnet-3.5 |
| Commander Riker | Tactical Execution | Standard | Task execution, coordination | claude-sonnet-3.5 |
| Counselor Troi | User Experience | Standard | UX, empathy, user research | claude-haiku-3.5 |
| Lt. Worf | Security & Compliance | Standard | Security, compliance, testing | claude-sonnet-3.5 |
| Dr. Crusher | Health & Diagnostics | Standard | System health, debugging | claude-haiku-3.5 |
| Geordi La Forge | Infrastructure | Standard | DevOps, infrastructure, deployment | claude-sonnet-3.5 |
| Lt. Uhura | Communications | Standard | API integration, messaging | claude-haiku-3.5 |
| Quark | Business Intelligence | Budget | Cost optimization, ROI analysis | gemini-pro |
| Chief O'Brien | Pragmatic Solutions | Budget | Quick fixes, maintenance | claude-haiku-3.5 |

### Cost Tiers & Routing Modes

**Premium Tier** ($$$)
- Models: Claude Opus 4.5, GPT-4 Turbo
- Use: Strategic decisions, complex analysis, critical features
- Routing Mode: `premium`

**Standard Tier** ($$)
- Models: Claude Sonnet 3.5/4.5, GPT-4o
- Use: General development, feature implementation
- Routing Mode: `standard`

**Budget Tier** ($)
- Models: Claude Haiku 3.5, Gemini Pro, GPT-3.5
- Use: Simple tasks, repetitive work, cost optimization
- Routing Mode: `budget`

**Ultra Budget Tier** (¢)
- Models: Gemini Flash, Claude Instant
- Use: Testing, validation, high-volume operations
- Routing Mode: `ultra_budget`

## Integration Phases

### Phase 1: Foundation (COMPLETED ✅)
- [x] Monorepo structure with pnpm workspaces
- [x] Next.js 15 unified-dashboard
- [x] Supabase unified schema
- [x] TypeScript packages (crew-core, cost-tracking, shared-schemas)
- [x] Build system working
- [x] Real-time cost tracking MVP

### Phase 2: Core Services (IN PROGRESS 🔨)
- [ ] Implement crew service API endpoints
- [ ] Set up N8N instance with webhook integration
- [ ] Import 90+ workflows from all projects
- [ ] Configure crew webhooks (environment variables)
- [ ] Implement cost aggregation triggers
- [ ] Add OpenRouter client integration

### Phase 3: Project Integration (NEXT 📋)
- [ ] DJ-Booking integration:
  - [ ] Migrate 6 MCP agents to crew webhooks
  - [ ] Import event/playlist schemas
  - [ ] Connect booking workflows
- [ ] Product Factory integration:
  - [ ] Import sprint/story schemas
  - [ ] Connect sprint planning workflows
  - [ ] Add story graph visualization
- [ ] Alex-AI-Universal integration:
  - [ ] Import RAG system (pgvector)
  - [ ] Connect CLI tool to unified API
  - [ ] Integrate VSCode extension

### Phase 4: Dashboard Completion (PLANNED 📅)
- [ ] Project management UI (CRUD operations)
- [ ] Sprint board visualization
- [ ] Event calendar for DJ-Booking
- [ ] Crew workload dashboard
- [ ] Cost analytics and reporting
- [ ] RAG chat interface
- [ ] Real-time activity feed

### Phase 5: Advanced Features (FUTURE 🔮)
- [ ] Multi-tenant RBAC
- [ ] Advanced cost optimization (ML-based routing)
- [ ] Crew learning from memories
- [ ] Automated sprint planning
- [ ] Voice interface integration
- [ ] Mobile app (React Native)

## Technical Stack Summary

### Frontend
- **Framework**: Next.js 15.5.10 (App Router)
- **UI**: React 18, TypeScript, TailwindCSS
- **State**: React hooks, Supabase real-time subscriptions
- **Visualizations**: Recharts, React Flow (future)

### Backend
- **Database**: Supabase (PostgreSQL 16 + pgvector)
- **API**: Next.js API routes, RESTful design
- **Real-time**: Supabase subscriptions (WebSocket)
- **Orchestration**: N8N (90+ workflows)
- **Caching**: Redis (future)

### AI/LLM
- **Primary**: OpenRouter (multi-provider aggregation)
- **Providers**: Anthropic, OpenAI, Google, OpenRouter
- **Cost Optimization**: Quark agent + routing modes
- **Vector Search**: pgvector for RAG

### DevOps
- **Monorepo**: pnpm workspaces
- **Containerization**: Docker, Docker Compose
- **IaC**: Terraform (future)
- **CI/CD**: GitHub Actions (future)
- **Monitoring**: Supabase dashboard, N8N monitoring

## Environment Configuration

### Required Environment Variables

```bash
# Supabase (Shared)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter (Cost-Optimized LLM)
OPENROUTER_API_KEY=sk-or-v1-your-key

# N8N Crew Webhooks (10 Core Crew Members)
N8N_CREW_CAPTAIN_PICARD_WEBHOOK=https://n8n.local/webhook/crew-captain-picard
N8N_CREW_COMMANDER_DATA_WEBHOOK=https://n8n.local/webhook/crew-commander-data
N8N_CREW_COMMANDER_RIKER_WEBHOOK=https://n8n.local/webhook/crew-commander-riker
N8N_CREW_COUNSELOR_TROI_WEBHOOK=https://n8n.local/webhook/crew-counselor-troi
N8N_CREW_LT_WORF_WEBHOOK=https://n8n.local/webhook/crew-lt-worf
N8N_CREW_DR_CRUSHER_WEBHOOK=https://n8n.local/webhook/crew-dr-crusher
N8N_CREW_GEORDI_WEBHOOK=https://n8n.local/webhook/crew-geordi-la-forge
N8N_CREW_UHURA_WEBHOOK=https://n8n.local/webhook/crew-uhura
N8N_CREW_QUARK_WEBHOOK=https://n8n.local/webhook/crew-quark
N8N_CREW_OBRIEN_WEBHOOK=https://n8n.local/webhook/crew-chief-obrien

# N8N Instance
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key

# Optional: External Provider Keys (Direct Access)
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key
GOOGLE_API_KEY=your-gemini-key
```

## API Endpoints Reference

### Projects API
```
GET    /api/projects              # List all projects
GET    /api/projects?id={uuid}    # Get single project
GET    /api/projects?type={type}  # Filter by type (dj-booking, product-factory, etc.)
POST   /api/projects              # Create new project
PUT    /api/projects              # Update project
DELETE /api/projects?id={uuid}    # Archive project
```

### Crew API
```
GET    /api/crew                  # List all crew members
GET    /api/crew/{name}           # Get crew member details
POST   /api/crew/activate         # Activate crew member for task
GET    /api/crew/workload         # Get crew workload summary
POST   /api/crew/memories         # Store crew memory
GET    /api/crew/memories?member={name} # Get crew memories
```

### Cost Tracking API
```
GET    /api/usage                 # Get usage events (with filters)
GET    /api/usage/summary         # Cost summary by project/crew/provider
GET    /api/usage/realtime        # Subscribe to real-time updates (WebSocket)
POST   /api/usage                 # Log usage event (internal)
```

### Workflows API
```
GET    /api/workflows             # List all N8N workflows
GET    /api/workflows/{id}        # Get workflow details
POST   /api/workflows/execute     # Execute workflow
GET    /api/workflows/executions  # Get execution history
```

### DJ-Booking API
```
GET    /api/events                # List DJ events
POST   /api/events                # Create DJ event
GET    /api/playlists             # List playlists
POST   /api/playlists/generate    # Generate playlist (crew activation)
```

### Product Factory API
```
GET    /api/sprints               # List sprints
POST   /api/sprints               # Create sprint
POST   /api/sprints/generate-sprint-zero # Auto-generate Sprint 0
GET    /api/stories               # List stories
POST   /api/stories               # Create story
GET    /api/projects/{id}/graph   # Project dependency graph
```

## Database Schema Summary

**Core Tables** (10):
1. `projects` - Central project registry
2. `llm_usage_events` - Unified cost tracking
3. `crew_members` - Shared crew definitions
4. `crew_memories` - Knowledge persistence
5. `workflows` - N8N workflow registry
6. `workflow_executions` - Execution history
7. `dj_events` - DJ-Booking events
8. `dj_playlists` - DJ-Booking playlists
9. `product_sprints` - Product Factory sprints
10. `product_stories` - Product Factory user stories

**Views** (3):
1. `project_cost_summary` - Cost by project with budget %
2. `crew_workload_summary` - Crew utilization metrics
3. `recent_workflow_activity` - Real-time activity feed

**Triggers** (5):
- Auto-update `updated_at` timestamps
- Aggregate costs to `projects.total_cost_usd`
- Update crew workload counters
- Cascade deletes for related entities
- Budget alert triggers

## Next Steps

### Immediate Actions (This Week)
1. Set up local N8N instance via Docker
2. Import crew workflows from all 4 projects
3. Configure crew webhook environment variables
4. Implement crew service API endpoints
5. Test crew activation flow end-to-end
6. Seed crew members table with 10 core members

### Short Term (This Month)
1. Complete dashboard UI for project management
2. Integrate DJ-Booking event creation
3. Integrate Product Factory sprint planning
4. Add real-time activity feed
5. Implement cost alerts and budgets
6. Deploy to staging environment

### Medium Term (Next Quarter)
1. Migrate all 4 projects to unified platform
2. Implement advanced cost optimization
3. Add crew learning from memories
4. Build RAG chat interface
5. Create comprehensive documentation
6. Launch beta to internal users

## Success Metrics

### Technical Metrics
- Build time < 10 seconds ✅
- API response time < 200ms
- Real-time update latency < 100ms
- Test coverage > 80%
- Zero downtime deployments

### Business Metrics
- LLM cost reduction > 30% (via routing optimization)
- Crew utilization > 70%
- User productivity increase > 50%
- Project completion rate > 90%
- Budget adherence > 95%

## Conclusion

The OpenRouter Crew Platform integration architecture provides a solid foundation for unifying 4 diverse projects into a cohesive system. With the core infrastructure complete and working builds, the focus now shifts to integrating crew services, N8N workflows, and completing the dashboard UI.

The shared crew system, unified cost tracking, and real-time dashboard position this platform to deliver significant cost savings while improving developer productivity through intelligent AI orchestration.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Status**: Foundation Complete, Integration In Progress
