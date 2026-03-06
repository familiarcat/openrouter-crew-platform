
# Domain-Driven Design (DDD) Analysis

**Repository**: openrouter-crew-platform
**Analysis Date**: 2026-02-09
**Architecture Pattern**: Domain-Driven Design with 4 Bounded Contexts

---

## Executive Summary

The repository implements DDD with **4 bounded contexts**:
1. **Product Factory** - Sprint planning and project management
2. **Alex-AI-Universal** - AI orchestration and cost optimization
3. **VSCode Extension** - IDE integration and developer experience
4. **Shared Kernel** - Cross-domain infrastructure and coordination

Each domain is independently deployable but shares infrastructure through the **Shared Kernel** bounded context.

---

## 1. PRODUCT FACTORY DOMAIN

**Purpose**: Sprint planning, project management, and story tracking
**Bounded Context**: Project, Sprint, Story, Team orchestration
**Location**: `domains/product-factory/`

### 1.1 Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Project** | A cohesive body of work (dj-booking, product-factory, ai-assistant) |
| **Sprint** | Time-boxed iteration for delivering project work |
| **Story** | Discrete unit of work with acceptance criteria |
| **Crew Member** | AI assistant assigned to story/sprint |
| **Observation Lounge** | Real-time monitoring dashboard for project execution |
| **Story Board** | Kanban-style visualization of story progress |
| **Project Timeline** | Gantt-style visualization of sprint and story durations |

### 1.2 Key Aggregates

#### **Aggregate: Project**
- **Root Entity**: `Project` (Supabase: `projects` table)
  - `id`: UUID
  - `name`: Project identifier
  - `type`: 'dj-booking' | 'product-factory' | 'ai-assistant' | 'custom'
  - `status`: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  - `budget_usd`: Budget limit
  - `total_cost_usd`: Accumulated cost
  - `config`: Project-specific configuration
  - `team_members`: UUID array of assigned users

**Child Entities**:
- ProjectMetadata (stored in JSONB)
- ProjectConfiguration (stored in JSONB)

**Location**:
- Type: [`domains/shared/schemas/src/database.ts`](domains/shared/schemas/src/database.ts)
- CRUD Logic: Implied in [`domains/product-factory/dashboard/lib/projects.ts`](domains/product-factory/dashboard/lib/projects.ts)

---

#### **Aggregate: Sprint**
- **Root Entity**: `Sprint`
  - Associated with Project
  - `duration`: Sprint length (typically 1-2 weeks)
  - `stories`: Child Story entities
  - `status`: Planning, Active, Review, Complete
  - `crewAssignment`: Map of story → crew member

**Child Entities**:
- Story (child of Sprint)
- SprintMetrics (duration, velocity, completion %)

**Location**:
- UI: [`domains/product-factory/dashboard/components/SprintBoard.tsx`](domains/product-factory/dashboard/components/SprintBoard.tsx)
- UI: [`domains/product-factory/dashboard/components/HorizontalSprintTimeline.tsx`](domains/product-factory/dashboard/components/HorizontalSprintTimeline.tsx)
- Logic: [`domains/product-factory/dashboard/lib/orchestration/`](domains/product-factory/dashboard/lib/orchestration/)

---

#### **Aggregate: Story**
- **Root Entity**: `Story`
  - `title`: Story description
  - `assignedCrewMember`: Crew member responsible
  - `estimatedDuration`: Time estimate
  - `status`: Todo, In Progress, Review, Done
  - `acceptanceCriteria`: JSONB list
  - `metadata`: Custom fields

**Child Entities**:
- Subtask
- StoryComment
- StoryAttachment

**Location**:
- UI: [`domains/product-factory/dashboard/components/StoryEditModal.tsx`](domains/product-factory/dashboard/components/StoryEditModal.tsx)
- UI: [`domains/product-factory/dashboard/components/SprintTimeline.tsx`](domains/product-factory/dashboard/components/SprintTimeline.tsx)
- Duration visualization: [`domains/product-factory/dashboard/components/StoryDurationBar.tsx`](domains/product-factory/dashboard/components/StoryDurationBar.tsx)

---

#### **Aggregate: CrewAssignment**
- **Root Entity**: `CrewAssignment`
  - Maps crew member to story/sprint
  - Tracks workload allocation
  - Coordinates with Shared Crew Coordination

**Location**:
- UI: [`domains/product-factory/dashboard/components/CrewCard.tsx`](domains/product-factory/dashboard/components/CrewCard.tsx)
- Reference: [`domains/shared/crew-coordination/src/coordinator.ts`](domains/shared/crew-coordination/src/coordinator.ts)

---

### 1.3 Domain Services

| Service | Responsibility | Location |
|---------|---------------|----------|
| **ProjectService** | CRUD operations for projects | `domains/product-factory/dashboard/lib/projects.ts` |
| **SprintService** | Sprint planning and tracking | `domains/product-factory/dashboard/lib/orchestration/` |
| **StoryService** | Story lifecycle management | `domains/product-factory/dashboard/components/` |
| **CrewSelectionService** | Assign crew members to stories | Integrates with Shared Crew Coordination |
| **ProjectVisualizationService** | Render timeline/board views | Various visualization components |
| **DeploymentMetricsService** | Track project deployment metrics | `domains/product-factory/dashboard/lib/deploy-metrics.ts` |

---

### 1.4 Infrastructure Layer

#### API Routes (`domains/product-factory/dashboard/app/api/`)

| Route | Operation | Bounded Context |
|-------|-----------|-----------------|
| `GET /api/health` | Service health check | Infrastructure |
| `POST /api/crew` | Get crew recommendations | Integrates Crew Coordination |
| `POST /api/ask` | Ask crew member question | Integrates with Alex-AI |
| `POST /api/auth` | Authentication | Security |
| `POST /api/deploy` | Trigger deployment | CI/CD |
| `POST /api/deploy-metrics` | Record metrics | Observability |
| `POST /api/n8n` | Webhook from n8n | Workflow Orchestration |
| `POST /api/feedback` | Record user feedback | Telemetry |
| `POST /api/notes` | Store project notes | Content |

**Location**: [`domains/product-factory/dashboard/app/api/`](domains/product-factory/dashboard/app/api/)

---

### 1.5 Subdomains (within Product Factory)

#### **Subdomain: Observation Lounge** (Real-time Monitoring)
- Tracks active sprints, story progress, crew workload
- Real-time cost tracking integrated from Shared kernel

**Location**: [`domains/product-factory/dashboard/components/ObservationLounge.tsx`](domains/product-factory/dashboard/components/ObservationLounge.tsx)

---

#### **Subdomain: Sprint Board** (Kanban Visualization)
- Visualizes stories in columns: Todo, In Progress, Review, Done
- Drag-and-drop story updates
- Real-time sync with database

**Location**: [`domains/product-factory/dashboard/components/SprintBoard.tsx`](domains/product-factory/dashboard/components/SprintBoard.tsx)

---

#### **Subdomain: Project Timeline** (Gantt Visualization)
- Shows sprint duration and story allocation
- Visualizes parallel story execution
- Resource utilization indicators

**Location**: [`domains/product-factory/dashboard/components/ProjectTimeline.tsx`](domains/product-factory/dashboard/components/ProjectTimeline.tsx)

---

### 1.6 Shared Database Tables (Owned by Product Factory)

```sql
-- Core project aggregates
projects                    -- Project root entity
sprints                     -- Sprint aggregates (if materialized)
stories                     -- Story entities
crew_assignments            -- CrewAssignment tracking
project_deployments         -- Deployment history
```

**Location**: [`supabase/migrations/00001_unified_schema.sql`](supabase/migrations/00001_unified_schema.sql)

---

### 1.7 Integration Points

| Integration | Direction | Service |
|------------|-----------|---------|
| **Crew Coordination** | Outbound | Select/assign crew to stories |
| **Cost Tracking** | Inbound | Track project costs |
| **N8N Workflows** | Bidirectional | Orchestrate sprint execution |
| **Unified Dashboard** | Inbound | Display project data globally |
| **VSCode Extension** | Inbound | Create/manage projects from IDE |

---

### 1.8 Project Templates & Instance Pattern

**Template Structure**:
```
domains/product-factory/project-templates/dj-booking/
├── dashboard/         # Customizable dashboard template
├── agents/           # Domain-specific agents (6 agents)
├── workflows/        # N8N workflows
└── schema/          # Database extensions
```

**Instance Structure**:
```
domains/product-factory/projects/test-event-venue/
├── dashboard/       # Deployed instance
├── agents/         # Specialized agents
└── workflows/      # Instance-specific workflows
```

**Location**:
- Template: [`domains/product-factory/project-templates/dj-booking/`](domains/product-factory/project-templates/dj-booking/)
- Instance: [`domains/product-factory/projects/test-event-venue/`](domains/product-factory/projects/test-event-venue/)

---

## 2. ALEX-AI-UNIVERSAL DOMAIN

**Purpose**: AI orchestration, cost optimization, and universal platform capabilities
**Bounded Context**: LLM routing, model selection, cost optimization, crew coordination
**Location**: `domains/alex-ai-universal/`

### 2.1 Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Model Router** | Component that selects optimal LLM based on task and cost |
| **Cost Tier** | Model classification: premium, standard, budget, ultra_budget |
| **LLM Request** | Query sent to language model with context |
| **Cost Optimization** | Process of selecting cheaper alternatives without quality loss |
| **Crew Consultation** | Asking a crew member (AI model) for assistance |
| **Knowledge Base** | RAG (Retrieval Augmented Generation) for project-specific context |

### 2.2 Key Aggregates

#### **Aggregate: LLMRequest**
- **Root Entity**: `LLMRequest`
  - `crewMember`: Assigned crew member (e.g., 'captain_picard')
  - `prompt`: User's question
  - `context`: Code/document context
  - `maxTokens`: Output token limit
  - `temperature`: Creativity parameter
  - `model`: Override model selection

**Child Entities**:
- RequestMetadata (timestamp, user, session)
- RequestContext (code snippets, file references)

**Location**:
- Type: [`domains/shared/crew-coordination/src/types.ts`](domains/shared/crew-coordination/src/types.ts)
- Processing: [`domains/alex-ai-universal/dashboard/lib/llm/`](domains/alex-ai-universal/dashboard/lib/llm/)

---

#### **Aggregate: ModelRouter**
- **Root Entity**: `ModelRouter` (Singleton)
  - `selectModel(request: LLMRequest)`: → Best model
  - `getModelsByTier(tier: CostTier)`: → Available models
  - `getModel(id: string)`: → Model details

**Responsibilities**:
1. Analyze request requirements (tool use, context window)
2. Score models by cost/quality trade-off
3. Route to optimal model
4. Estimate cost before execution

**Location**: [`domains/shared/cost-tracking/src/model-router.ts`](domains/shared/cost-tracking/src/model-router.ts)

---

#### **Aggregate: CostOptimizer**
- **Root Entity**: `CostOptimizer` (Singleton)
  - Analyzes historical usage patterns
  - Recommends cheaper alternatives
  - Tracks optimization opportunities

**Responsibilities**:
1. Group usage events by model
2. Calculate cost savings potential
3. Filter recommendations by quality threshold
4. Recommend only 20%+ savings

**Location**: [`domains/shared/cost-tracking/src/optimizer.ts`](domains/shared/cost-tracking/src/optimizer.ts)

---

#### **Aggregate: KnowledgeBase** (RAG)
- **Root Entity**: `KnowledgeBase`
  - Project-specific documents
  - Code patterns
  - Architectural decisions
  - Cached embeddings

**Location**:
- Content: [`domains/alex-ai-universal/knowledge/`](domains/alex-ai-universal/knowledge/)
- Integration: [`domains/alex-ai-universal/dashboard/app/api/codebase-changes/`](domains/alex-ai-universal/dashboard/app/api/codebase-changes/)

---

### 2.3 Domain Services

| Service | Responsibility | Location |
|---------|---------------|----------|
| **LLMRouter** | Select optimal model for task | `domains/shared/cost-tracking/src/model-router.ts` |
| **CostOptimizer** | Analyze and recommend optimizations | `domains/shared/cost-tracking/src/optimizer.ts` |
| **CrewCoordinator** | Assign crew members, manage workload | `domains/shared/crew-coordination/src/coordinator.ts` |
| **UniversalModelRouter** | Cross-domain model selection | `domains/shared/crew-coordination/src/universal-model-router.ts` |
| **CostCalculator** | Compute actual costs per model | `domains/shared/cost-tracking/src/cost-calculator.ts` |
| **BudgetEnforcer** | Prevent overspending | `domains/shared/cost-tracking/src/budget-enforcer.ts` |

---

### 2.4 Infrastructure Layer

#### API Routes (`domains/alex-ai-universal/dashboard/app/api/`)

| Route | Operation | Bounded Context |
|-------|-----------|-----------------|
| `POST /api/agent` | Route to best agent | LLM Routing |
| `POST /api/crew` | Consult crew member | Crew Coordination |
| `POST /api/content` | Generate content | LLM Usage |
| `POST /api/events` | Record usage event | Telemetry |
| `POST /api/codebase-changes` | Track codebase modifications | Observability |
| `POST /api/controller` | Orchestrate multi-step workflows | Orchestration |
| `POST /api/data` | Retrieve project data | Data Access |
| `POST /api/health` | Service health check | Infrastructure |

**Location**: [`domains/alex-ai-universal/dashboard/app/api/`](domains/alex-ai-universal/dashboard/app/api/)

---

### 2.5 Subdomains

#### **Subdomain: Model Selection**
- Routes requests to optimal model
- Considers cost, quality, capabilities
- Falls back gracefully on rate limits

---

#### **Subdomain: Cost Tracking & Optimization**
- Tracks every LLM call with cost
- Recommends alternatives
- Enforces budget limits

---

#### **Subdomain: Knowledge Base (RAG)**
- Stores project-specific context
- Enhances prompts with relevant documents
- Improves response quality

**Location**: [`domains/alex-ai-universal/knowledge/`](domains/alex-ai-universal/knowledge/)

---

### 2.6 Integration Points

| Integration | Direction | Service |
|------------|-----------|---------|
| **Product Factory** | Inbound | Project context for model selection |
| **Shared Cost Tracking** | Bidirectional | Cost estimation and tracking |
| **Shared Crew Coordination** | Bidirectional | Crew member assignment |
| **VSCode Extension** | Inbound | Provides AI services to IDE |
| **Unified Dashboard** | Inbound | Displays cost and optimization data |
| **N8N Workflows** | Bidirectional | Orchestrates multi-step AI tasks |

---

## 3. VSCODE EXTENSION DOMAIN

**Purpose**: IDE integration providing AI assistance hub for the platform
**Bounded Context**: Editor commands, real-time cost display, file manipulation, AI routing
**Location**: `domains/vscode-extension/`

### 3.1 Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Command** | VSCode command (e.g., `openrouter-crew.ask`) |
| **Intent** | User's purpose extracted from natural language |
| **Code Context** | Selected code/files + surrounding context |
| **Cost Meter** | Real-time budget display in status bar |
| **Tree View** | Side panel showing crew, projects, costs |
| **Webview** | Custom UI panel (chat, metrics) |

### 3.2 Key Aggregates

#### **Aggregate: ExtensionCommand**
- **Root Entity**: `ExtensionCommand`
  - `id`: Command identifier (e.g., 'ask', 'review', 'refactor')
  - `title`: User-facing title
  - `handler`: Command execution logic
  - `keybinding`: Keyboard shortcut

**Types of Commands**:
- **AI Assistance**: ask, review, explain, generate, refactor, document, debug, optimize
- **Project Management**: create-project, select-project
- **Cost Management**: show-cost-report, optimize-costs
- **Crew Management**: show-crew-roster, consult-member

**Location**:
- Command registration: [`domains/vscode-extension/src/commands/index.ts`](domains/vscode-extension/src/commands/index.ts)
- Executor: [`domains/vscode-extension/src/commands/command-executor.ts`](domains/vscode-extension/src/commands/command-executor.ts)
- Extension manifest: [`domains/vscode-extension/extension.json`](domains/vscode-extension/extension.json)

---

#### **Aggregate: LLMRouter** (VSCode-specific)
- **Root Entity**: `LLMRouter`
  - Adapts shared routing for IDE context
  - Considers selected code as primary context
  - Optimizes for quick response times

**Location**: [`domains/vscode-extension/src/services/llm-router.ts`](domains/vscode-extension/src/services/llm-router.ts)

---

#### **Aggregate: FileManager**
- **Root Entity**: `FileManager`
  - Reads current editor state
  - Extracts selected code
  - Applies code transformations
  - Manages diffs and previews

**Operations**:
- `getActiveCode()`: Get current file content
- `getSelectedCode()`: Get user selection
- `applyChanges(newCode)`: Apply transformations
- `showDiff()`: Display before/after comparison

**Location**: [`domains/vscode-extension/src/services/file-manager.ts`](domains/vscode-extension/src/services/file-manager.ts)

---

#### **Aggregate: CostTracker** (VSCode-specific)
- **Root Entity**: `CostTracker`
  - Syncs with Shared Cost Tracking
  - Updates status bar meter
  - Enforces budget limits

**Child Entities**:
- CostMeter (UI component in status bar)
- BudgetAlert (warning system)

**Location**: [`domains/vscode-extension/src/services/cost-tracker.ts`](domains/vscode-extension/src/services/cost-tracker.ts)

---

#### **Aggregate: NLPProcessor**
- **Root Entity**: `NLPProcessor`
  - Extracts user intent from command
  - Detects task type (review, generation, refactoring)
  - Identifies relevant code context

**Location**: [`domains/vscode-extension/src/services/nlp-processor.ts`](domains/vscode-extension/src/services/nlp-processor.ts)

---

### 3.3 Domain Services

| Service | Responsibility | Location |
|---------|---------------|----------|
| **CommandExecutor** | Routes commands to handlers | `src/commands/command-executor.ts` |
| **LLMRouter** | Select model based on IDE context | `src/services/llm-router.ts` |
| **FileManager** | Read/write code in editor | `src/services/file-manager.ts` |
| **CostTracker** | Real-time cost display | `src/services/cost-tracker.ts` |
| **CostEstimator** | Estimate cost before execution | `src/services/cost-estimator.ts` |
| **OCREngine** | Extract code from images | `src/services/ocr-engine.ts` |
| **NLPProcessor** | Intent detection | `src/services/nlp-processor.ts` |
| **CLIExecutor** | Execute crew CLI commands | `src/services/cli-executor.ts` |

---

### 3.4 Infrastructure Layer

#### VSCode Providers (`domains/vscode-extension/src/providers/`)

| Provider | Purpose |
|----------|---------|
| **TreeView** | Display crew, projects, costs in sidebar |
| **HoverProvider** | Show cost estimation on hover |
| **CompletionProvider** | Suggest commands and crew members |
| **DiagnosticsProvider** | Show cost warnings |

**Location**: [`domains/vscode-extension/src/providers/`](domains/vscode-extension/src/providers/)

#### UI Components (`domains/vscode-extension/src/ui/`)

| Component | Purpose |
|-----------|---------|
| **ChatPanel** | Chat interface with crew members |
| **CostMeter** | Real-time budget display |
| **TreeViews** | Crew roster, project list, cost breakdown |

**Location**: [`domains/vscode-extension/src/ui/`](domains/vscode-extension/src/ui/)

---

### 3.5 Webviews (`domains/vscode-extension/src/webview/`)

Custom HTML/CSS/JS UIs displayed in VSCode panels:
- `chat.html`: Chat interface
- `chat.css`: Chat styling
- `chat.js`: Chat interactions

**Location**: [`domains/vscode-extension/src/webview/`](domains/vscode-extension/src/webview/)

---

### 3.6 Integration Points

| Integration | Direction | Service |
|------------|-----------|---------|
| **Shared LLM Routing** | Inbound | Model selection via shared services |
| **Shared Cost Tracking** | Inbound | Real-time cost data |
| **Shared Crew Coordination** | Inbound | Crew member roster |
| **Alex-AI-Universal** | Inbound | AI assistance capabilities |
| **Product Factory** | Inbound | Project management from IDE |
| **CLI** | Outbound | Execute crew commands locally |

---

## 4. SHARED KERNEL DOMAIN

**Purpose**: Cross-cutting infrastructure shared by all domains
**Bounded Context**: Crew coordination, cost tracking, database schemas, UI components, workflows
**Location**: `domains/shared/`

### 4.1 Subdomain: Crew Coordination

**Purpose**: Unified crew member definitions and coordination across all projects

#### **Aggregate: CrewMember**
- **Root Entity**: `CrewMember`
  - `id`: Crew member ID (e.g., 'captain_picard')
  - `name`: Internal identifier
  - `displayName`: Human-readable name
  - `role`: CrewMemberRole (9 defined roles)
  - `defaultModel`: Default LLM for crew member
  - `costTier`: Cost classification
  - `expertise`: Array of specializations
  - `personality`: Description of persona
  - `active`: Currently available
  - `workloadCurrent`: Current task count
  - `workloadCapacity`: Maximum tasks
  - `bio`: Description

**Crew Members** (10 defined Star Trek personas):
| Member | Role | Default Model | Tier | Expertise |
|--------|------|---------------|------|-----------|
| captain_picard | Strategic Leadership | claude-sonnet-4 | premium | Strategy, diplomacy, leadership, ethics |
| commander_data | Data Analytics | claude-sonnet-3.5 | standard | Analytics, logic, pattern recognition |
| commander_riker | Tactical Execution | claude-sonnet-3.5 | standard | Tactics, execution, improvisation |
| counselor_troi | User Experience | claude-sonnet-3.5 | standard | UX, empathy, psychology, communication |
| lt_worf | Security Compliance | claude-sonnet-3.5 | standard | Security, compliance, threat assessment |
| dr_crusher | System Health | claude-sonnet-3.5 | standard | Diagnostics, health, monitoring |
| geordi_la_forge | Infrastructure | claude-sonnet-3.5 | standard | Infrastructure, engineering, DevOps |
| lt_uhura | Communications | claude-sonnet-3.5 | standard | Integration, APIs, coordination |
| chief_obrien | Pragmatic Solutions | gemini-flash-1.5 | budget | Pragmatism, efficiency, quick fixes |
| quark | Business Intelligence | gemini-flash-1.5 | budget | Business, ROI, cost optimization |

**Location**: [`domains/shared/crew-coordination/src/members.ts`](domains/shared/crew-coordination/src/members.ts)

---

#### **Aggregate: CrewCoordinator**
- **Root Entity**: `CrewCoordinator` (Singleton)
  - `selectCrewMember(taskType, expertise, tier?)`: Select best crew for task
  - `getWorkloadStatus()`: Get all crew utilization
  - `updateWorkload(member, delta)`: Adjust workload
  - `recommendForProjectType(type)`: Get recommended crew

**Selection Algorithm**:
1. Score by expertise match (0-10)
2. Score by workload (0-5, favor less utilized)
3. Score by cost tier preference (0-3)
4. Return highest scoring member

**Location**: [`domains/shared/crew-coordination/src/coordinator.ts`](domains/shared/crew-coordination/src/coordinator.ts)

---

#### **Aggregate: CrewRequest/CrewResponse**
- **Root Entity**: `CrewRequest`
  - `projectId`: Project context
  - `crewMember`: Assigned crew member
  - `message`: User prompt
  - `context`: Code/document context
  - `maxTokens`: Output limit
  - `temperature`: Creativity parameter

- **Root Entity**: `CrewResponse`
  - `crewMember`: Responding crew member
  - `content`: Generated response
  - `model`: Model used
  - `tokensUsed`: Token consumption
  - `estimatedCost`: Cost of request
  - `executionTime`: Response latency

**Location**: [`domains/shared/crew-coordination/src/types.ts`](domains/shared/crew-coordination/src/types.ts)

---

#### **Services**:
- `WebhookClient`: Send requests to n8n workflows
- `AsyncWebhookClient`: Async wrapper for webhook calls
- `PollingService`: Poll webhook response results
- `UniversalModelRouter`: Cross-domain model selection

**Location**: [`domains/shared/crew-coordination/src/`](domains/shared/crew-coordination/src/)

---

### 4.2 Subdomain: Cost Tracking

**Purpose**: Unified cost tracking and optimization across all domains

#### **Aggregate: UsageEvent**
- **Root Entity**: `UsageEvent` (Supabase table: `llm_usage_events`)
  - `projectId`: Project context
  - `workflowId`: N8N workflow ID or 'direct-api'
  - `crewMember`: Assigned crew member
  - `provider`: 'openrouter', 'anthropic', 'openai', 'gemini'
  - `model`: Model used
  - `inputTokens`: Prompt tokens
  - `outputTokens`: Completion tokens
  - `estimatedCost`: Cost estimation
  - `actualCost`: Actual cost from provider
  - `routingMode`: Cost tier used
  - `requestType`: Task classification
  - `timestamp`: Event timestamp

**Location**: [`supabase/migrations/00001_unified_schema.sql`](supabase/migrations/00001_unified_schema.sql)

---

#### **Aggregate: UsageTracker**
- **Root Entity**: `UsageTracker`
  - In-memory cache of recent events
  - Persists to Supabase
  - `track(event)`: Record usage
  - `getRecentEvents(limit)`: Get recent events
  - `getProjectEvents(projectId)`: Filter by project
  - `clearCache()`: Clear in-memory cache

**Location**: [`domains/shared/cost-tracking/src/tracker.ts`](domains/shared/cost-tracking/src/tracker.ts)

---

#### **Aggregate: CostOptimizer**
- **Root Entity**: `CostOptimizer`
  - Analyzes usage patterns
  - Recommends cheaper alternatives
  - `analyzeUsage(events)`: Generate recommendations

**Optimization Strategy**:
1. Group events by model
2. Calculate average tokens
3. Try cheaper tiers with same capabilities
4. Only recommend 20%+ savings
5. Validate context window and tool use compatibility

**Location**: [`domains/shared/cost-tracking/src/optimizer.ts`](domains/shared/cost-tracking/src/optimizer.ts)

---

#### **Aggregate: ModelRouter**
- **Root Entity**: `ModelRouter` (Singleton)
  - Registry of all available models
  - Scoring system for selection
  - `getModel(id)`: Retrieve model definition
  - `getModelsByTier(tier)`: Filter by cost tier
  - `selectBestModel(requirements)`: Optimal model

**Model Tiers**:
- **Premium**: claude-sonnet-4 (highest quality, highest cost)
- **Standard**: claude-sonnet-3.5, gpt-4 (balanced)
- **Budget**: gemini-flash-1.5, claude-haiku (low cost)
- **Ultra Budget**: Local models (if available)

**Location**: [`domains/shared/cost-tracking/src/model-router.ts`](domains/shared/cost-tracking/src/model-router.ts)

---

#### **Aggregate: CostCalculator**
- **Root Entity**: `CostCalculator`
  - Pricing lookup for each model
  - `calculateEstimatedCost(model, inputTokens, outputTokens)`: Estimate
  - `calculateActualCost(model, inputTokens, outputTokens)`: Actual

**Location**: [`domains/shared/cost-tracking/src/cost-calculator.ts`](domains/shared/cost-tracking/src/cost-calculator.ts)

---

#### **Aggregate: BudgetEnforcer**
- **Root Entity**: `BudgetEnforcer`
  - Prevents overspending
  - Enforces project-level budgets
  - `canAfford(model, tokens)`: Check budget
  - `enforceLimit(projectId, budget)`: Set limit

**Location**: [`domains/shared/cost-tracking/src/budget-enforcer.ts`](domains/shared/cost-tracking/src/budget-enforcer.ts)

---

### 4.3 Subdomain: Database Schemas

**Purpose**: Unified TypeScript types generated from Supabase schema

#### **Key Tables** (Aggregates):
```sql
-- Projects
projects                    -- Project root entity

-- Crew & Coordination
crew_members               -- Crew member definitions
crew_assignments           -- Task-to-crew mappings

-- Cost Tracking
llm_usage_events          -- Usage event records

-- Workflows
n8n_workflow_executions   -- Workflow execution history

-- User/Session
user_sessions             -- User session tracking
```

**Location**:
- Schema: [`supabase/migrations/00001_unified_schema.sql`](supabase/migrations/00001_unified_schema.sql)
- TypeScript Types: [`domains/shared/schemas/src/database.ts`](domains/shared/schemas/src/database.ts)
- Helpers: [`domains/shared/schemas/src/helpers.ts`](domains/shared/schemas/src/helpers.ts)

---

### 4.4 Subdomain: UI Components

**Purpose**: Shared React components used across all domains

**Location**: [`domains/shared/ui-components/src/`](domains/shared/ui-components/src/)

Provides:
- Common UI patterns
- Design system components
- Theme configuration

---

### 4.5 Subdomain: N8N Workflows

**Purpose**: Shared workflow definitions used across domains

**Organization**:
- `domains/shared/workflows/` - Shared workflows
- `domains/product-factory/workflows/` - Domain-specific workflows (54+)
- `domains/alex-ai-universal/workflows/` - Domain-specific workflows (36+)
- `domains/product-factory/project-templates/dj-booking/workflows/` - Template workflows
- Individual project instances have their own workflows

**Location**:
- Shared: [`domains/shared/workflows/`](domains/shared/workflows/)
- Product Factory: [`domains/product-factory/workflows/`](domains/product-factory/workflows/)
- Alex-AI: [`domains/alex-ai-universal/workflows/`](domains/alex-ai-universal/workflows/)

---

### 4.6 Subdomain: OpenRouter API Client

**Purpose**: HTTP client for OpenRouter API

**Location**: [`domains/shared/openrouter-client/src/index.ts`](domains/shared/openrouter-client/src/index.ts)

---

## 5. ANTI-CORRUPTION LAYERS

Interfaces between bounded contexts that translate between domain languages:

### Product Factory ↔ Shared Crew Coordination
**Location**:
- Product Factory: [`domains/product-factory/dashboard/lib/crew/`](domains/product-factory/dashboard/lib/crew/)
- Translates between Story assignment and CrewMember concepts

---

### All Domains ↔ Shared Cost Tracking
**Location**:
- Each domain integrates via `UsageTracker` in [`domains/shared/cost-tracking/src/tracker.ts`](domains/shared/cost-tracking/src/tracker.ts)
- Standardizes cost tracking format across domains

---

### VSCode Extension ↔ Shared Services
**Location**:
- [`domains/vscode-extension/src/services/`](domains/vscode-extension/src/services/)
- Adapts shared services (crew, cost, llm) to IDE context

---

## 6. INFRASTRUCTURE LAYERS

### Persistence (Supabase PostgreSQL)
- **Location**: [`supabase/migrations/`](supabase/migrations/)
- Tables: projects, crew_members, llm_usage_events, etc.
- Real-time subscriptions enabled
- Row-level security policies (when auth enabled)

---

### Workflow Orchestration (N8N)
- **Location**: Multiple workflow definitions across domains
- Webhook-based triggers
- Polling-based result collection
- Async execution tracking

---

### API Gateway (Next.js API Routes)
- **Location**: Each domain: `app/api/`
- RESTful endpoints per domain
- Request validation
- Error handling
- Authentication integration

---

### CLI Tool (Node.js)
- **Location**: [`apps/cli/src/`](apps/cli/src/)
- Direct crew member interaction
- Local cost tracking
- Project management
- Secrets management

---

### VSCode Extension (TypeScript + VSCode API)
- **Location**: [`domains/vscode-extension/`](domains/vscode-extension/)
- Commands, providers, webviews
- Status bar integration
- Editor context access
- File manipulation

---

## 7. DOMAIN INTERACTIONS DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Dashboard                             │
│              (apps/unified-dashboard)                            │
└─────────────────────────────────────────────────────────────────┘
        │                        │                        │
        ↓                        ↓                        ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Product Factory  │  │ Alex-AI-Universal│  │ VSCode Extension │
│    Domain        │  │     Domain       │  │     Domain       │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • Projects       │  │ • LLM Routing    │  │ • Commands       │
│ • Sprints        │  │ • Cost Tracking  │  │ • Services       │
│ • Stories        │  │ • Optimization   │  │ • Providers      │
│ • CrewAssignment │  │ • Knowledge Base │  │ • Cost Display   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 ↓
                   ┌─────────────────────────────────┐
                   │     SHARED KERNEL               │
                   ├─────────────────────────────────┤
                   │ • Crew Coordination             │
                   │   - CrewMember definitions      │
                   │   - CrewCoordinator             │
                   │   - Webhook clients             │
                   │                                 │
                   │ • Cost Tracking                 │
                   │   - UsageTracker                │
                   │   - CostOptimizer               │
                   │   - ModelRouter                 │
                   │                                 │
                   │ • Database Schemas              │
                   │   - TypeScript types            │
                   │   - Helpers                     │
                   │                                 │
                   │ • UI Components                 │
                   │   - Shared React components     │
                   │                                 │
                   │ • N8N Workflows                 │
                   │   - Shared workflow definitions │
                   └─────────────────────────────────┘
                                 ↓
                   ┌─────────────────────────────────┐
                   │  EXTERNAL INTEGRATIONS          │
                   ├─────────────────────────────────┤
                   │ • Supabase (PostgreSQL)         │
                   │ • N8N (Workflow Orchestration)  │
                   │ • OpenRouter API                │
                   │ • GitHub Actions (CI/CD)        │
                   │ • AWS (Deployment)              │
                   └─────────────────────────────────┘
```

---

## 8. DATA FLOW EXAMPLES

### Example 1: Create Story & Assign Crew

```
VSCode Extension          Product Factory        Shared Kernel
    │                          │                       │
    ├─ Create Story ──────────>│                       │
    │                          ├─ Select Crew ────────>│
    │                          │<─ Best Member────────┤
    │                          ├─ Assign & Update ────>│
    │<─ Project Updated───────┤                       │
    │                          │                       │
```

### Example 2: Ask Crew Member

```
VSCode Extension      Alex-AI-Universal      Shared Kernel
    │                        │                    │
    ├─ Ask Crew ────────────>│                    │
    │                        ├─ Route LLM ───────>│
    │                        │<─ Best Model───────┤
    │                        ├─ Execute & Track ──>│
    │<─ Response────────────┤<─ Cost Recorded────┤
    │  (+ cost estimate)    │                    │
```

### Example 3: Cost Optimization Report

```
Product Factory      Shared Cost Tracking    Supabase
    │                       │                   │
    ├─ Analyze Usage ──────>│                   │
    │                       ├─ Query Events ───>│
    │                       │<─ Historical Data─┤
    │<─ Recommendations────┤                   │
```

---

## 9. BOUNDED CONTEXT BOUNDARIES

### Product Factory ↔ Alex-AI-Universal
**Explicit Dependency**: Product Factory uses Alex-AI for crew consultation
**Anti-Corruption Layer**: API route `/api/ask` adapts to domain language
**Coupling**: Moderate (imports CrewCoordinator)

---

### All Domains ↔ Shared Kernel
**Explicit Dependency**: All domains depend on Shared Kernel
**Anti-Corruption Layer**: Each domain adapts shared types to local context
**Coupling**: Tight but intentional (Shared Kernel is foundational)

---

### All Domains ↔ VSCode Extension
**Explicit Dependency**: VSCode Extension imports all domain services
**Anti-Corruption Layer**: Services translate domain APIs to VSCode APIs
**Coupling**: Moderate (VSCode Extension is client, not core)

---

## 10. SUMMARY TABLE

| Domain | Type | Aggregates | Key Services | Status |
|--------|------|-----------|--------------|--------|
| **Product Factory** | Core | Project, Sprint, Story, CrewAssignment | ProjectService, SprintService, CrewSelectionService | Production |
| **Alex-AI-Universal** | Core | LLMRequest, ModelRouter, CostOptimizer, KnowledgeBase | LLMRouter, CostOptimizer, UniversalModelRouter | Production |
| **VSCode Extension** | Client | ExtensionCommand, FileManager, CostTracker, NLPProcessor | CommandExecutor, LLMRouter, FileManager, CostTracker | Phase 8A+ |
| **Shared Kernel** | Foundation | CrewMember, UsageEvent, ModelTier, Database Schema | CrewCoordinator, UsageTracker, CostOptimizer, ModelRouter | Production |

---

## 11. ARCHITECTURAL PATTERNS IDENTIFIED

1. **Aggregate Pattern**: Each domain has well-defined aggregates (Project, CrewMember, UsageEvent)
2. **Repository Pattern**: Database access via Supabase client
3. **Anti-Corruption Layer**: Services translate between domains
4. **Shared Kernel**: Cost tracking, crew coordination, database schemas
5. **Bounded Context**: Clear separation between Product Factory, Alex-AI, and VSCode Extension
6. **Feature Federation**: Components promoted from domain → shared → global
7. **Webhook Pattern**: N8N integration via webhooks + polling

---

**Generated**: 2026-02-09
**Analysis Scope**: Domains and aggregates only (no re-architecture)
**No Recommendations**: This is a descriptive analysis only

📋 All 6 Cost-Optimized Prompts (Copy-Paste Ready)
PHASE 1: @openrouter-crew/project-management Shared Package
Model: claude-haiku-4-5 | Cost: $0.0053 | Time: 5 min | Crew: commander_data


Create the @openrouter-crew/project-management shared package.

Reuse existing patterns:
- package.json: copy structure from domains/shared/cost-tracking/package.json, change name to @openrouter-crew/project-management
- tsconfig.json: copy from domains/shared/crew-coordination/tsconfig.json
- src/types/sprint.ts: canonical union of BOTH existing files (use apps/unified-dashboard/types/sprint.ts as primary)
- src/services/ProjectService.ts: class with static create(supabase), getProject(id), getSprintsForProject(projectId), getCostAnalytics(projectId)
- src/services/SprintService.ts: createSprint, updateSprintStatus, getActiveSprint
- src/services/StoryService.ts: createStory, updateStoryStatus, moveStoryToSprint, assignCrewMember
- src/index.ts: export all from types and services

Output each file with its full path as a line 1 comment. Format: "// File: domains/shared/project-management/src/types/sprint.ts"

Context to reference:
- domains/shared/cost-tracking/package.json for structure
- apps/unified-dashboard/types/sprint.ts (canonical types)
- domains/product-factory/dashboard/types/sprint.ts (merge features)
- Tables<"projects"> from database.ts
PHASE 2: API Routes + UI Components
Model: claude-sonnet-4-6 | Cost: $0.0336 | Time: 15 min | Crew: commander_riker


Create 4 Next.js 14 API route handlers for sprint management PLUS 3 missing UI components.

STRICT RULES:
- Use @supabase/supabase-js createClient with env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Import Tables type from @openrouter-crew/shared-schemas
- Follow EXACTLY the error handling pattern in apps/unified-dashboard/app/api/health/route.ts
- No filesystem operations (no fs.readFile)
- All responses: NextResponse.json({ data, error })

FILES TO CREATE:

1. apps/unified-dashboard/app/api/sprints/route.ts
   GET: select * from sprints where project_id = searchParams.get('projectId') order by sprint_number
   POST: insert into sprints, return created row with 201 status

2. apps/unified-dashboard/app/api/sprints/[id]/stories/route.ts
   GET: select * from stories where sprint_id = params.id order by priority
   POST: insert into stories with sprint_id = params.id, return created row

3. apps/unified-dashboard/app/api/sprints/[id]/stories/[storyId]/route.ts
   PATCH: update stories set status=body.status, updated_at=now() where id=params.storyId, return updated row

4. apps/unified-dashboard/app/api/sprints/plan/route.ts
   POST: accepts {projectId, sprintId, goals: string[]}
   Return a MOCK PlanningSession object with this exact shape:
   {
     summary: string,
     crewAnalysis: Array<{crewMember: string, perspective: string, storiesSuggested: number}>,
     deliberation: {consensus: string, adjustmentsMade: string[]},
     totalStories: number,
     totalPoints: number,
     totalBudget: number,
     crewInvolved: string[],
     estimatedROI: number
   }

UI COMPONENTS (minimal, functional):

5. apps/unified-dashboard/components/projects/ProjectHeader.tsx
   Props: { project: Tables<'projects'> }
   Display: project name, status badge, domain color, budget bar
   Reuse existing patterns from DomainHealthChart

6. apps/unified-dashboard/components/analytics/CostAnalytics.tsx
   Props: { data: CostSummary, budget: number }
   Display: cost breakdown, budget utilization
   Wraps existing CostOptimizationMonitor.tsx

7. apps/unified-dashboard/components/crew/CrewAssignments.tsx
   Props: { assignments: CrewWorkload[] }
   Display: crew member cards with workload
   Wraps existing CrewCard.tsx

Output each file with full path comment on line 1.
PHASE 3: Server Actions + Real-time Subscriptions
Model: claude-haiku-4-5 | Cost: $0.0044 | Time: 5 min | Crew: counselor_troi


Create React hooks and Server Actions for project management.

FILE 1: apps/unified-dashboard/lib/hooks/useSprintRealtime.ts
- Import supabase from lib/supabase.ts
- Hook signature: useSprintRealtime(sprintId: string, onStoryChange: (payload: any) => void): { isConnected: boolean }
- Use supabase.channel(`stories-${sprintId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'stories', filter: `sprint_id=eq.${sprintId}` }, onStoryChange)
  .subscribe()
- Cleanup subscription on unmount
- Return { isConnected: boolean }

FILE 2: apps/unified-dashboard/app/actions/project-actions.ts
- Start with 'use server' directive at top
- createProject(formData: FormData) function:
  • Extract name, description, type from formData
  • Validate: name required, type must be in ['dj-booking','product-factory','ai-assistant','custom']
  • Import ProjectService from @openrouter-crew/project-management
  • Call supabase insert on projects table via ProjectService.createProject(data)
  • On success: redirect('/projects/' + data.id)
  • On error: return { error: message }

FILE 3: apps/unified-dashboard/app/actions/sprint-actions.ts
- Start with 'use server' directive at top
- createSprint(projectId: string, data: CreateSprintRequest) → calls SprintService.createSprint()
- updateStoryStatus(storyId: string, status: StoryStatus) → calls StoryService.updateStoryStatus()
- moveStoryToSprint(storyId: string, sprintId: string | null) → calls StoryService.moveStoryToSprint()

Output each file with full path comment on line 1.

Reference:
- apps/unified-dashboard/lib/supabase.ts for client usage
- @openrouter-crew/project-management package from Phase 1
PHASE 4: Sprint Planning Agent Integration (9-step Dark Forest)
Model: claude-sonnet-4-6 | Cost: $0.0420 | Time: 10 min | Crew: captain_picard


Implement lib/sprint-planner.ts with 9-step Dark Forest Protocol compliance.

The planning MUST follow this EXACT sequence with no deviation:

1. budgetEnforcer.checkBudget(projectId, 0.05) → block if exceeded
2. memoryService.getProjectMemories(projectId, 'sprint-planning') → retrieve past retros/context
3. new PromptBuilder().build(memories) → memory context string
4. crewCoordinator.selectCrewMember('sprint-planning', ['tactics','execution'], 'standard') → commander_riker
5. modelRouter.route({ taskComplexity: 'medium', estimatedInputTokens: 800, estimatedOutputTokens: 1200 }) → anthropic/claude-sonnet-3.5
6. fetch OpenRouter API with system prompt + memory context + sprint goals → returns JSON
7. auditService.logOperation(authContext, { action: 'sprint-plan' }, 'sprint-plan', 'success', { cost, duration_ms })
8. budgetEnforcer.recordSpending(projectId, actualCost)
9. Return PlanningSession matching SprintBoard.tsx interface EXACTLY

PLANNINGSESSION INTERFACE (EXACT MATCH REQUIRED):
{
  summary: string,
  crewAnalysis: Array<{
    crewMember: string,
    perspective: string,
    storiesSuggested: number
  }>,
  deliberation: {
    consensus: string,
    adjustmentsMade: string[]
  },
  totalStories: number,
  totalPoints: number,
  totalBudget: number,
  crewInvolved: string[],
  estimatedROI: number
}

FILE 1: apps/unified-dashboard/lib/sprint-planner.ts
- Export class SprintPlanner
- Constructor: (projectId: string, sprintId: string, goals: string[], supabase: SupabaseClient<Database>)
- async plan(): Promise<PlanningSession>
- Implement all 9 steps above with proper error handling

FILE 2: Update apps/unified-dashboard/app/api/sprints/plan/route.ts
- Replace the mock response with:
  const planner = new SprintPlanner(projectId, sprintId, goals, supabase)
  const result = await planner.plan()
  return NextResponse.json({ data: result })
- Wrap in try/catch:
  • If BudgetExceededError: return NextResponse.json({ error: 'Budget exceeded' }, { status: 402 })
  • If other error: return 500 with error message

Imports required:
- import { BudgetEnforcer } from '@openrouter-crew/shared-cost-tracking'
- import { MemoryService } from '@openrouter-crew/crew-api-client'
- import { PromptBuilder } from '@openrouter-crew/agent-memory'
- import { CrewCoordinator } from '@openrouter-crew/shared-crew-coordination'
- import { ModelRouter } from '@openrouter-crew/shared-cost-tracking'
- import { AuditService } from '@openrouter-crew/crew-api-client'

Output files with full path comments on line 1.
PHASE 5: Integration Tests + CI Pipeline
Model: claude-haiku-4-5 | Cost: $0.0065 | Time: 5 min | Crew: lt_worf


Write Jest integration tests for sprint API routes + GitHub Actions CI workflow.

FILE 1: apps/unified-dashboard/tests/sprint-api.test.ts

Mock @supabase/supabase-js:
jest.mock('@supabase/supabase-js')

Test cases (5 minimum):
1. Test GET /api/sprints?projectId=test123
   Expect: 200 response with array of sprints

2. Test POST /api/sprints with valid body {name, sprint_number, start_date, end_date}
   Expect: 201 response with created sprint data

3. Test POST /api/sprints with missing name field
   Expect: 400 response with error message

4. Test PATCH /api/sprints/[id]/stories/[storyId] with valid status='completed'
   Expect: 200 response with updated story

5. Test PATCH /api/sprints/[id]/stories/[storyId] with invalid status='invalid_status'
   Expect: 400 response with error message

Pattern: Import route handlers directly:
import { GET, POST } from '@/app/api/sprints/route'
Assert response.status and response.json() shape

FILE 2: .github/workflows/pm-integration.yml

Trigger: on: [pull_request]

Jobs:
1. type-check:
   - pnpm --filter @openrouter-crew/project-management type-check
   - pnpm --filter @openrouter-crew/unified-dashboard type-check

2. build:
   - pnpm --filter @openrouter-crew/unified-dashboard build

3. tests:
   - pnpm test --testPathPattern=sprint-api

Output files with full path comments on line 1.

Valid statuses: backlog, planned, in_progress, in_review, completed, blocked, todo, review, done
🚀

Q1: What pnpm script for local testing?

pnpm dev:universal
This one command does everything:

✅ Starts all 4 dashboards (unified, dj-booking, alex-ai, product-factory)
✅ Starts Supabase local database
✅ Watches VSCode extension for changes
✅ Opens all dashboards in browser with separate tabs automatically
✅ Time to ready: 60-90 seconds
Q2: VSCode Extension Installation

pnpm vscode:install
Then:

Reload VSCode: Cmd+Shift+P → "Developer: Reload Window"
Look for new icon in left sidebar (activity bar)
Click to access:
🎯 Projects panel
👥 Crew roster
💰 Cost meter (real-time budget)
🧠 Memory browser
For development (if modifying extension):


pnpm --filter openrouter-crew-vscode watch
# Then reload VSCode after changes
Q3: CLI Usage

# Build first
pnpm --filter @openrouter-crew/cli build

# Then use
crew --help                    # All commands
crew cost status               # Today's spending
crew project list              # All projects
crew crew list                 # Available agents
crew memory search "keyword"   # Find memories
crew budget get                # Budget status
Q4: Browser with Auto-Opened Tabs
Automatic (included in pnpm dev:universal):

When you run pnpm dev:universal, the script:

Waits for each service to be ready
Automatically opens your browser
Creates tabs for each dashboard:
Tab 1: http://localhost:3000 (Unified Dashboard - PM System)
Tab 2: http://localhost:3002 (DJ Booking)
Tab 3: http://localhost:3003 (Alex AI)
Tab 4: http://localhost:3004 (Product Factory)
Manual fallback (if auto-open didn't work):


bash scripts/system/open-all-tabs.sh
📚 4 New Documentation Files Created
File	Purpose	Read Time
START_HERE_LOCAL_TESTING.md	3-step quick start + learning paths	5 min
PNPM_SCRIPTS_REFERENCE.md	Complete command reference	10 min
LOCAL_TESTING_GUIDE.md	Comprehensive setup + troubleshooting	30 min
PM_SYSTEM_LAUNCH_CHECKLIST.md	What you built + features	15 min
scripts/system/open-all-tabs.sh	Browser auto-opener (executable)	N/A
🚀 Ready to Start?

cd /Users/bradygeorgen/Dev/openrouter-crew-platform
pnpm dev:universal
Then:

Wait 60-90 seconds
Browser opens with all 4 dashboards in tabs
Explore http://localhost:3000 (Unified Dashboard - NEW PM System)
Create a project, plan a sprint, see real-time Kanban board
✨ What You Can Test Right Now
✅ Sprint Planning: 9-step AI pipeline with crew analysis
✅ Real-time Kanban: Drag cards → instant sync across windows
✅ Server Actions: Create projects/sprints/stories via forms
✅ Integration Tests: pnpm test
✅ VSCode Extension: Cost meter, crew status, memory browser
✅ CLI Tools: Manage projects, check budget, view crew