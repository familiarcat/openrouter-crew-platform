# OpenRouter Crew Platform - Integration Plan

## Overview

This plan outlines the concrete steps to integrate 4 existing projects into the unified platform:
- **DJ-Booking** (6 MCP agents, event management)
- **OpenRouter-AI-Milestone** (reference architecture)
- **Alex-AI-Universal** (12 crew members, extensive workflows)
- **RAG-Refresh-Product-Factory** (sprint planning, 54 workflows)

## Current Status: Phase 1 Complete ✅

**What's Working:**
- ✅ Monorepo build system (Next.js 15 + TypeScript)
- ✅ Supabase schema with 10 core tables
- ✅ 19 N8N workflow files (10 crew + 8 subflows + 1 project)
- ✅ Real-time cost tracking dashboard MVP
- ✅ Shared TypeScript packages (crew-core, cost-tracking, shared-schemas)

## Phase 2: Core Services Integration

### Step 1: N8N Setup (Priority: HIGH 🔴)

**Objective**: Get N8N running locally with all workflows imported

**Actions:**
1. Create `docker-compose.yml` for N8N
   ```yaml
   services:
     n8n:
       image: n8nio/n8n:latest
       ports:
         - "5678:5678"
       environment:
         - N8N_BASIC_AUTH_ACTIVE=true
         - N8N_BASIC_AUTH_USER=admin
         - N8N_BASIC_AUTH_PASSWORD=admin
       volumes:
         - ./n8n-data:/home/node/.n8n
         - ./packages/n8n-workflows:/workflows
   ```

2. Import existing workflows:
   ```bash
   # Copy workflows from all projects
   cp /Users/bradygeorgen/Documents/workspace/alex-ai-universal/n8n-workflows/*.json \
      packages/n8n-workflows/crew/

   cp /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/n8n-workflows/*.json \
      packages/n8n-workflows/projects/
   ```

3. Configure webhook URLs in `.env.local`:
   ```bash
   N8N_BASE_URL=http://localhost:5678
   N8N_CREW_CAPTAIN_PICARD_WEBHOOK=${N8N_BASE_URL}/webhook/crew-captain-picard
   # ... (repeat for all 10 crew members)
   ```

4. Test webhook connectivity:
   ```bash
   curl -X POST http://localhost:5678/webhook/crew-captain-picard \
     -H "Content-Type: application/json" \
     -d '{"message": "Test connection", "project_id": "test"}'
   ```

**Files to Create:**
- `docker-compose.n8n.yml`
- `scripts/n8n/import-workflows.sh`
- `scripts/n8n/test-webhooks.sh`

**Success Criteria:**
- N8N running on `localhost:5678`
- All 10 crew webhooks responding
- Test workflow executes successfully

---

### Step 2: Crew Service API (Priority: HIGH 🔴)

**Objective**: Create API endpoints for crew activation and coordination

**Actions:**
1. Create `apps/unified-dashboard/app/api/crew/route.ts`:
   ```typescript
   // GET /api/crew - List all crew members
   // POST /api/crew/activate - Activate crew member
   ```

2. Create `apps/unified-dashboard/app/api/crew/[name]/route.ts`:
   ```typescript
   // GET /api/crew/{name} - Get crew details
   // POST /api/crew/{name}/activate - Activate specific crew
   ```

3. Implement crew activation logic in `packages/crew-core`:
   ```typescript
   export async function activateCrew(params: {
     crewMember: string;
     task: string;
     context: Record<string, any>;
     projectId: string;
   }): Promise<CrewResponse>
   ```

4. Add cost logging:
   ```typescript
   await supabase.from('llm_usage_events').insert({
     project_id: params.projectId,
     crew_member: params.crewMember,
     provider: 'openrouter',
     model: selectedModel,
     input_tokens, output_tokens, total_tokens,
     estimated_cost_usd,
     routing_mode
   })
   ```

**Files to Create:**
- `apps/unified-dashboard/app/api/crew/route.ts`
- `apps/unified-dashboard/app/api/crew/[name]/route.ts`
- `apps/unified-dashboard/app/api/crew/activate/route.ts`
- `packages/crew-core/src/crew-activator.ts`

**Success Criteria:**
- Can list crew members from API
- Can activate crew via API
- Cost is logged to database
- Dashboard shows real-time cost updates

---

### Step 3: Supabase Migration & Seed (Priority: HIGH 🔴)

**Objective**: Apply unified schema and seed with 10 crew members

**Actions:**
1. Start local Supabase:
   ```bash
   supabase start
   supabase db reset  # Apply migrations
   ```

2. Verify migrations applied:
   ```bash
   supabase db ls
   # Should show 00001_unified_schema.sql applied
   ```

3. Seed crew members:
   ```sql
   -- supabase/seed.sql
   INSERT INTO crew_members (name, display_name, role, default_model, cost_tier, expertise, active) VALUES
   ('captain_picard', 'Captain Jean-Luc Picard', 'Strategic Leadership', 'anthropic/claude-sonnet-4-5', 'premium', '{strategy,decision-making,planning}', true),
   ('commander_data', 'Commander Data', 'Data Analytics', 'anthropic/claude-sonnet-3.5', 'standard', '{analytics,pattern-recognition,logic}', true),
   -- ... (repeat for all 10 crew members)
   ```

4. Apply seed:
   ```bash
   psql $DATABASE_URL < supabase/seed.sql
   ```

**Files to Create:**
- `supabase/seed.sql` (crew members seed data)
- `scripts/db/verify-schema.sh`

**Success Criteria:**
- All 10 tables exist in database
- 10 crew members seeded
- Dashboard can query and display crew

---

### Step 4: OpenRouter Integration (Priority: MEDIUM 🟡)

**Objective**: Integrate OpenRouter client for cost-optimized LLM calls

**Actions:**
1. Install OpenRouter SDK:
   ```bash
   pnpm add openai  # OpenRouter uses OpenAI SDK
   ```

2. Create OpenRouter client in `packages/crew-core`:
   ```typescript
   // packages/crew-core/src/openrouter-client.ts
   import OpenAI from 'openai';

   export const openrouterClient = new OpenAI({
     apiKey: process.env.OPENROUTER_API_KEY,
     baseURL: 'https://openrouter.ai/api/v1',
     defaultHeaders: {
       'HTTP-Referer': process.env.SITE_URL,
       'X-Title': 'OpenRouter Crew Platform'
     }
   });
   ```

3. Implement model selection logic:
   ```typescript
   function selectModel(
     routingMode: RoutingMode,
     task: string
   ): string {
     switch (routingMode) {
       case 'premium': return 'anthropic/claude-opus-4-5';
       case 'standard': return 'anthropic/claude-sonnet-3.5';
       case 'budget': return 'google/gemini-pro';
       case 'ultra_budget': return 'google/gemini-flash';
     }
   }
   ```

4. Implement cost calculation:
   ```typescript
   function calculateCost(
     model: string,
     inputTokens: number,
     outputTokens: number
   ): number {
     // Use OpenRouter pricing API or static pricing table
     const pricing = MODEL_PRICING[model];
     return (
       (inputTokens * pricing.input / 1_000_000) +
       (outputTokens * pricing.output / 1_000_000)
     );
   }
   ```

**Files to Create:**
- `packages/crew-core/src/openrouter-client.ts`
- `packages/crew-core/src/model-selector.ts`
- `packages/crew-core/src/cost-calculator.ts`
- `packages/crew-core/src/pricing-table.ts`

**Success Criteria:**
- Can make LLM calls via OpenRouter
- Model selection works based on routing mode
- Costs calculated accurately
- All calls logged to database

---

## Phase 3: Project Integration

### Step 5: DJ-Booking Integration (Priority: MEDIUM 🟡)

**Objective**: Migrate DJ-Booking event management to unified platform

**Actions:**
1. Update schema with DJ-specific tables (already in schema):
   - `dj_events` ✅
   - `dj_playlists` ✅

2. Create DJ-Booking API routes:
   ```typescript
   // apps/unified-dashboard/app/api/events/route.ts
   GET /api/events - List events
   POST /api/events - Create event
   GET /api/events/[id] - Get event details
   PUT /api/events/[id] - Update event
   ```

3. Migrate 6 MCP agents to crew activation:
   ```typescript
   // booking-agent → activate('commander_riker', task)
   // music-agent → activate('geordi_la_forge', task)
   // finance-agent → activate('quark', task)
   // marketing-agent → activate('counselor_troi', task)
   // venue-agent → activate('chief_obrien', task)
   ```

4. Create event creation workflow:
   ```
   User creates event
     → Insert into dj_events
     → Activate Booking Agent (confirm availability)
     → Activate Music Agent (generate playlist)
     → Activate Finance Agent (calculate pricing)
     → Return event with crew results
   ```

**Files to Create:**
- `apps/unified-dashboard/app/api/events/route.ts`
- `apps/unified-dashboard/app/api/playlists/route.ts`
- `apps/unified-dashboard/app/events/page.tsx` (UI)

**Migration Script:**
```bash
# scripts/migrate/dj-booking.sh
# Copy data from DJ-Booking database to unified Supabase
```

**Success Criteria:**
- Can create DJ events via Dashboard
- Crew members execute tasks
- Costs tracked per event
- Playlists generated and stored

---

### Step 6: Product Factory Integration (Priority: MEDIUM 🟡)

**Objective**: Migrate sprint planning and story management

**Actions:**
1. Update schema with Product Factory tables (already in schema):
   - `product_sprints` ✅
   - `product_stories` ✅

2. Create Sprint Planning API:
   ```typescript
   // apps/unified-dashboard/app/api/sprints/route.ts
   GET /api/sprints - List sprints
   POST /api/sprints - Create sprint
   POST /api/sprints/generate-sprint-zero - Auto-generate Sprint 0
   ```

3. Create Story Management API:
   ```typescript
   // apps/unified-dashboard/app/api/stories/route.ts
   GET /api/stories - List stories
   POST /api/stories - Create story
   PUT /api/stories/[id] - Update story
   ```

4. Implement Sprint 0 generation:
   ```typescript
   async function generateSprintZero(projectId: string) {
     // 1. Activate Commander Data (analyze requirements)
     const analysis = await activateCrew({
       crewMember: 'commander_data',
       task: 'Analyze project and generate Sprint 0 stories',
       projectId
     });

     // 2. Parse stories from LLM response
     const stories = parseStories(analysis.content);

     // 3. Insert stories into database
     await supabase.from('product_stories').insert(stories);

     return stories;
   }
   ```

**Files to Create:**
- `apps/unified-dashboard/app/api/sprints/route.ts`
- `apps/unified-dashboard/app/api/sprints/generate-sprint-zero/route.ts`
- `apps/unified-dashboard/app/api/stories/route.ts`
- `apps/unified-dashboard/app/sprints/page.tsx` (Sprint board UI)

**Success Criteria:**
- Can create sprints via Dashboard
- Sprint 0 auto-generation works
- Stories tracked and assigned to crew
- Costs logged per sprint

---

### Step 7: Alex-AI-Universal Integration (Priority: LOW 🟢)

**Objective**: Integrate CLI and VSCode extension

**Actions:**
1. Update CLI to use unified API:
   ```typescript
   // alex-ai-universal CLI
   import { UnifiedAPIClient } from '@openrouter-crew/api-client';

   const client = new UnifiedAPIClient({
     baseUrl: process.env.UNIFIED_API_URL
   });
   ```

2. Add authentication to API:
   ```typescript
   // apps/unified-dashboard/middleware.ts
   export function middleware(request: NextRequest) {
     const apiKey = request.headers.get('X-API-Key');
     if (!apiKey || !validateApiKey(apiKey)) {
       return NextResponse.json(
         { error: 'Unauthorized' },
         { status: 401 }
       );
     }
   }
   ```

3. Create API client package:
   ```typescript
   // packages/api-client/src/index.ts
   export class UnifiedAPIClient {
     async getProjects() { ... }
     async activateCrew() { ... }
     async getCostSummary() { ... }
   }
   ```

**Files to Create:**
- `packages/api-client/` (new package)
- `apps/unified-dashboard/middleware.ts`
- `apps/unified-dashboard/app/api/auth/api-keys/route.ts`

**Success Criteria:**
- CLI can authenticate with unified API
- Can execute crew commands from CLI
- VSCode extension connects to unified backend

---

## Phase 4: Dashboard UI Completion

### Step 8: Project Management UI (Priority: HIGH 🔴)

**Objective**: Complete CRUD operations for projects

**Actions:**
1. Create project list page:
   ```tsx
   // apps/unified-dashboard/app/projects/page.tsx
   - Display all projects in cards/table
   - Filter by type, status
   - Real-time updates via Supabase subscription
   ```

2. Create project detail page:
   ```tsx
   // apps/unified-dashboard/app/projects/[id]/page.tsx
   - Show project details
   - Display cost breakdown
   - Show crew assignments
   - Show recent activity
   ```

3. Create project creation form:
   ```tsx
   // apps/unified-dashboard/app/projects/new/page.tsx
   - Project type selection (dj-booking, product-factory, custom)
   - Budget input
   - Team member assignment
   - Create project → seed with default crew
   ```

**Files to Create:**
- `apps/unified-dashboard/app/projects/page.tsx`
- `apps/unified-dashboard/app/projects/[id]/page.tsx`
- `apps/unified-dashboard/app/projects/new/page.tsx`
- `apps/unified-dashboard/components/ProjectCard.tsx`
- `apps/unified-dashboard/components/ProjectForm.tsx`

**Success Criteria:**
- Can create, read, update, delete projects
- Dashboard updates in real-time
- Cost tracking visible per project
- Project types supported (dj-booking, product-factory, custom)

---

### Step 9: Crew Dashboard (Priority: MEDIUM 🟡)

**Objective**: Visualize crew workload and utilization

**Actions:**
1. Create crew overview page:
   ```tsx
   // apps/unified-dashboard/app/crew/page.tsx
   - Display all 10 crew members
   - Show workload (current/capacity)
   - Show total cost per crew
   - Color-code by utilization %
   ```

2. Create crew detail page:
   ```tsx
   // apps/unified-dashboard/app/crew/[name]/page.tsx
   - Crew member bio and expertise
   - Recent tasks and executions
   - Cost history chart
   - Memories and learnings
   ```

3. Add real-time workload updates:
   ```typescript
   const { data: workload } = await supabase
     .from('crew_workload_summary')
     .select('*')
     .subscribe();
   ```

**Files to Create:**
- `apps/unified-dashboard/app/crew/page.tsx`
- `apps/unified-dashboard/app/crew/[name]/page.tsx`
- `apps/unified-dashboard/components/CrewCard.tsx`
- `apps/unified-dashboard/components/WorkloadGauge.tsx`

**Success Criteria:**
- Can view all crew members
- Workload visualized clearly
- Real-time updates when crew activated
- Cost per crew visible

---

### Step 10: Cost Analytics Dashboard (Priority: HIGH 🔴)

**Objective**: Comprehensive cost reporting and analytics

**Actions:**
1. Enhance existing cost tracking page:
   ```tsx
   // apps/unified-dashboard/app/page.tsx (already exists)
   - Add time-series cost chart (Recharts)
   - Add cost by project breakdown
   - Add cost by crew breakdown
   - Add cost by provider breakdown
   - Add budget alerts section
   ```

2. Add cost filtering and drill-down:
   ```tsx
   // Filter by:
   - Date range
   - Project
   - Crew member
   - Provider (OpenRouter, Anthropic, etc.)
   - Routing mode (premium, standard, budget)
   ```

3. Add export functionality:
   ```typescript
   // Export to CSV, JSON
   function exportCostData(filters: CostFilters) {
     const data = await supabase
       .from('llm_usage_events')
       .select('*')
       .match(filters);

     return generateCSV(data);
   }
   ```

**Files to Create:**
- `apps/unified-dashboard/components/CostChart.tsx`
- `apps/unified-dashboard/components/CostFilters.tsx`
- `apps/unified-dashboard/components/BudgetAlerts.tsx`
- `apps/unified-dashboard/app/api/usage/export/route.ts`

**Success Criteria:**
- Visualize costs over time
- Drill down by multiple dimensions
- Export cost reports
- Budget alerts trigger at 80%, 90%, 100%

---

## Phase 5: Advanced Features (Future)

### Step 11: RAG Chat Interface (Priority: LOW 🟢)

**Objective**: Natural language interface for project management

**Actions:**
1. Implement pgvector for semantic search
2. Create chat interface UI
3. Integrate with crew activation
4. Store chat history in crew_memories

**Files to Create:**
- `apps/unified-dashboard/app/chat/page.tsx`
- `packages/crew-core/src/rag-client.ts`

---

### Step 12: Multi-Tenant RBAC (Priority: LOW 🟢)

**Objective**: Support multiple users and teams

**Actions:**
1. Enable Supabase Auth
2. Implement Row Level Security (RLS)
3. Add team management
4. Add permission system

**Files to Create:**
- `supabase/migrations/00002_auth_and_rbac.sql`
- `apps/unified-dashboard/app/api/auth/[...nextauth]/route.ts`

---

## Execution Timeline

### Week 1: Core Services
- ✅ Day 1-2: N8N setup and workflow import
- ✅ Day 3-4: Crew service API implementation
- ✅ Day 5: Supabase migration and seed
- ✅ Day 6-7: OpenRouter integration

### Week 2: Project Integration
- 📋 Day 8-9: DJ-Booking integration
- 📋 Day 10-11: Product Factory integration
- 📋 Day 12-14: Testing and bug fixes

### Week 3: Dashboard Completion
- 📋 Day 15-16: Project management UI
- 📋 Day 17: Crew dashboard
- 📋 Day 18-19: Cost analytics enhancements
- 📋 Day 20-21: Polish and testing

### Week 4: Deployment & Documentation
- 📋 Day 22-23: Deployment to staging
- 📋 Day 24-25: User documentation
- 📋 Day 26-27: Beta testing
- 📋 Day 28: Production deployment

---

## Quick Start Commands

### Setup
```bash
# Clone and install
cd openrouter-crew-platform
pnpm install

# Start Supabase
supabase start
supabase db reset

# Start N8N
docker-compose -f docker-compose.n8n.yml up -d

# Start dashboard
pnpm dev
```

### Development
```bash
# Run builds
pnpm build

# Run tests (when added)
pnpm test

# Type check
pnpm type-check

# Database migrations
supabase db push
```

### Deployment
```bash
# Build for production
pnpm build

# Deploy dashboard
vercel deploy --prod

# Deploy N8N
# (Use Railway, Render, or DigitalOcean)
```

---

## Risk Mitigation

### Risk 1: N8N Workflow Complexity
**Mitigation**: Start with 10 core crew workflows, add complexity incrementally

### Risk 2: Cost Tracking Accuracy
**Mitigation**: Implement comprehensive logging and reconciliation scripts

### Risk 3: Real-time Performance
**Mitigation**: Use Supabase subscriptions efficiently, add caching layer if needed

### Risk 4: Data Migration
**Mitigation**: Create comprehensive migration scripts with rollback capability

### Risk 5: User Adoption
**Mitigation**: Focus on intuitive UI, comprehensive documentation, and training

---

## Success Criteria

### Technical Success
- [ ] All 4 projects integrated successfully
- [ ] Build time < 10 seconds
- [ ] API response time < 200ms
- [ ] Real-time updates < 100ms latency
- [ ] Zero data loss during migration

### Business Success
- [ ] LLM cost reduction > 30%
- [ ] Crew utilization > 70%
- [ ] User satisfaction > 4/5
- [ ] Budget adherence > 95%
- [ ] Project completion rate > 90%

---

## Next Actions (Immediate)

1. **Create N8N docker-compose file** (`docker-compose.n8n.yml`)
2. **Seed crew members** (`supabase/seed.sql`)
3. **Implement crew activation API** (`app/api/crew/activate/route.ts`)
4. **Test end-to-end flow**: Create project → Activate crew → See cost update

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Status**: Ready for Phase 2 Execution
