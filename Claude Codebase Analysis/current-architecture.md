# Current State ASCII Architecture

**Repository**: openrouter-crew-platform
**Date**: 2026-02-09
**Architecture Type**: Monorepo with Domain-Driven Design

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                        OPENROUTER CREW PLATFORM                          ║
║                    (Domain-Driven Multi-Domain System)                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────┐
│                          USER ENTRY POINTS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────┐ │
│  │   Web Browser    │      │   VSCode IDE     │      │  CLI Tools   │ │
│  │  (localhost:3000)│      │  (Extension)     │      │  (Terminal)  │ │
│  └────────┬─────────┘      └────────┬─────────┘      └────────┬─────┘ │
│           │                         │                        │        │
│           └─────────────────────────┼────────────────────────┘        │
│                                     │                                 │
│                                     ▼                                 │
│                    ┌─────────────────────────────┐                   │
│                    │  HTTP/WebSocket/IPC         │                   │
│                    │  (API Communication Layer)  │                   │
│                    └──────────────┬──────────────┘                   │
└────────────────────────────────────┼──────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────────┐
              │                      │                          │
              ▼                      ▼                          ▼
      ┌────────────────┐     ┌────────────────┐      ┌─────────────────┐
      │  Unified App   │     │    Domain      │      │   VSCode        │
      │  (Port 3000)   │     │   Dashboards   │      │   Extension     │
      │                │     │ (3001, 3002+)  │      │   (Native IPC)  │
      └────────────────┘     └────────────────┘      └─────────────────┘
```

---

## 2. APPLICATIONS LAYER

```
╔════════════════════════════════════════════════════════════════════════╗
║                        APPLICATIONS (apps/)                             ║
╚════════════════════════════════════════════════════════════════════════╝


UNIFIED DASHBOARD (Entry Point)                       CLI TOOL
┌────────────────────────────┐                    ┌──────────────────┐
│  apps/unified-dashboard    │                    │   apps/cli       │
├────────────────────────────┤                    ├──────────────────┤
│  • Next.js 14.2.35         │                    │  • Node.js CLI   │
│  • React 18 + TypeScript   │                    │  • Commander.js  │
│  • Tailwind CSS            │                    │  • Chalk colors  │
│  • Supabase client         │                    │  • Table output  │
│  • Port: 3000              │                    │                  │
├────────────────────────────┤                    ├──────────────────┤
│  app/                      │                    │  src/            │
│  ├── dashboard/page.tsx    │                    │  ├── commands/   │
│  ├── projects/page.tsx     │                    │  ├── services/   │
│  ├── projects/new/page.tsx │                    │  └── utils/      │
│  ├── design-system/        │                    │                  │
│  └── api/                  │                    │  dist/           │
│      ├── ask                │                    │  (Compiled JS)   │
│      ├── crew               │                    │                  │
│      └── health             │                    │  Bin: crew       │
│                             │                    │  (Executable)    │
│  components/               │                    │                  │
│  ├── ProjectGrid.tsx       │                    │  package.json    │
│  ├── MCPDashboardSection   │                    │  tsconfig.json   │
│  ├── UniversalProgressBar  │                    │  Jest config     │
│  └── ...12 more            │                    │                  │
│                             │                    │  Dependencies:   │
│  lib/                       │                    │  • axios         │
│  ├── hydration-service.ts  │                    │  • dotenv        │
│  ├── unified-mock-data.ts  │                    │  • commander     │
│  └── ...                   │                    │                  │
│                             │                    │  Shared Libs:    │
│  Dependencies:              │                    │  • crew-coord    │
│  • next                     │                    │  • cost-tracking │
│  • react                    │                    │  • schemas       │
│  • tailwindcss              │                    │                  │
│  • supabase-js              │                    │                  │
│  • lucide-react             │                    │                  │
│                             │                    │                  │
│  Shared Libs:               │                    │                  │
│  • shared-schemas           │                    │                  │
│  • shared-cost-tracking     │                    │                  │
│  • shared-crew-coordination │                    │                  │
└────────────────────────────┘                    └──────────────────┘
```

---

## 3. DOMAIN DASHBOARDS ARCHITECTURE

```
╔════════════════════════════════════════════════════════════════════════╗
║              DOMAIN-SPECIFIC DASHBOARDS (domains/*/dashboard)           ║
╚════════════════════════════════════════════════════════════════════════╝


PRODUCT FACTORY DOMAIN              ALEX-AI-UNIVERSAL DOMAIN
Port 3002                           Port 3003
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ domains/product-factory/     │   │ domains/alex-ai-universal/   │
│ dashboard/                   │   │ dashboard/                   │
├──────────────────────────────┤   ├──────────────────────────────┤
│ Next.js App Router           │   │ Next.js App Router           │
│ + Domain-specific logic      │   │ + Cost optimization logic    │
├──────────────────────────────┤   ├──────────────────────────────┤
│ components/                  │   │ components/                  │
│ ├── SprintBoard.tsx          │   │ ├── CostOptimizer.tsx        │
│ ├── ProjectTimeline.tsx      │   │ ├── CrewRoster.tsx           │
│ ├── StoryEditModal.tsx       │   │ ├── ModelRouter.tsx          │
│ ├── CrewCard.tsx             │   │ ├── KnowledgeBase.tsx        │
│ ├── ObservationLounge.tsx    │   │ └── ...                      │
│ ├── ProjectSitemap.tsx       │   │                              │
│ ├── HorizontalSprintTimeline │   │ app/api/                     │
│ └── ...more                  │   │ ├── agent                    │
│                              │   │ ├── crew                     │
│ lib/                         │   │ ├── content                  │
│ ├── projects.ts              │   │ ├── events                   │
│ ├── deploy-metrics.ts        │   │ ├── data                     │
│ ├── crew/                    │   │ ├── controller               │
│ ├── llm/                     │   │ ├── codebase-changes         │
│ ├── orchestration/           │   │ └── health                   │
│ ├── auth/                    │   │                              │
│ └── rag/                     │   │ lib/                         │
│                              │   │ ├── alex-ai/                 │
│ app/api/                     │   │ ├── llm/                     │
│ ├── health                   │   │ ├── crew/                    │
│ ├── crew                     │   │ ├── orchestration/           │
│ ├── ask                      │   │ ├── encoding/                │
│ ├── deploy                   │   │ └── rag/                     │
│ ├── deploy-metrics           │   │                              │
│ ├── feedback                 │   │ Shared Libs:                 │
│ ├── n8n                      │   │ • crew-coordination          │
│ └── notes                    │   │ • cost-tracking              │
│                              │   │ • schemas                    │
│ Shared Libs:                 │   │ • ui-components              │
│ • crew-coordination          │   │ • openrouter-client          │
│ • cost-tracking              │   │                              │
│ • schemas                    │   │ TypeScript:                  │
│ • ui-components              │   │ • tsconfig.json              │
│ • openrouter-client          │   │ • next.config.js             │
│                              │   │ • tailwind.config.js         │
│ TypeScript:                  │   │ • postcss.config.js          │
│ • tsconfig.json              │   │                              │
│ • next.config.js             │   │ Dockerfile (for deployment)  │
│ • tailwind.config.js         │   │                              │
│ • postcss.config.js          │   │ Dependencies: React, Next.js,│
│                              │   │ TypeScript, Supabase, etc.   │
│ Dockerfile (for deployment)  │   │                              │
│                              │   │                              │
│ Dependencies: React, Next.js,│   │                              │
│ TypeScript, Supabase, etc.   │   │                              │
└──────────────────────────────┘   └──────────────────────────────┘


PROJECT TEMPLATES                      PROJECT INSTANCES
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ domains/product-factory/     │   │ domains/product-factory/     │
│ project-templates/           │   │ projects/                    │
├──────────────────────────────┤   ├──────────────────────────────┤
│ dj-booking/ (template)       │   │ test-event-venue/ (instance) │
│ ├── dashboard/               │   │ ├── dashboard/               │
│ ├── agents/                  │   │ ├── agents/                  │
│ │  ├── booking-agent/        │   │ │  ├── booking-agent/        │
│ │  ├── finance-agent/        │   │ │  ├── finance-agent/        │
│ │  ├── marketing-agent/      │   │ │  ├── marketing-agent/      │
│ │  ├── music-agent/          │   │ │  ├── music-agent/          │
│ │  ├── venue-agent/          │   │ │  ├── venue-agent/          │
│ │  ├── gateway/              │   │ │  ├── gateway/              │
│ │  └── rag-refresh/          │   │ │  └── rag-refresh/          │
│ │                            │   │ │                            │
│ └── workflows/               │   │ └── workflows/               │
│    (Template workflows)      │   │    (Instance workflows)      │
│                              │   │                              │
└──────────────────────────────┘   └──────────────────────────────┘
```

---

## 4. SHARED KERNEL ARCHITECTURE

```
╔════════════════════════════════════════════════════════════════════════╗
║                 SHARED KERNEL (domains/shared/)                         ║
║              (Cross-Domain Infrastructure & Coordination)               ║
╚════════════════════════════════════════════════════════════════════════╝


┌──────────────────────────────────────────────────────────────────────┐
│                    CREW COORDINATION LAYER                            │
│             (domains/shared/crew-coordination/)                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Crew Member Definitions (10 Star Trek personas)          │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  ├─ captain_picard          → Premium Claude Sonnet 4     │    │
│  │  ├─ commander_data          → Standard Claude Sonnet 3.5  │    │
│  │  ├─ commander_riker         → Standard Claude Sonnet 3.5  │    │
│  │  ├─ counselor_troi          → Standard Claude Sonnet 3.5  │    │
│  │  ├─ lt_worf                 → Standard Claude Sonnet 3.5  │    │
│  │  ├─ dr_crusher              → Standard Claude Sonnet 3.5  │    │
│  │  ├─ geordi_la_forge         → Standard Claude Sonnet 3.5  │    │
│  │  ├─ lt_uhura                → Standard Claude Sonnet 3.5  │    │
│  │  ├─ chief_obrien            → Budget Gemini Flash 1.5     │    │
│  │  └─ quark                   → Budget Gemini Flash 1.5     │    │
│  │                                                            │    │
│  │  Attributes:                                              │    │
│  │  • Role, Expertise, Personality, Bio                      │    │
│  │  • Cost Tier (premium/standard/budget/ultra_budget)       │    │
│  │  • Workload (current/capacity)                            │    │
│  │  • Active status                                          │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Crew Coordinator (Singleton Service)                     │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  selectCrewMember(taskType, expertise, tier)              │    │
│  │    → Scores by: expertise match, workload, cost tier      │    │
│  │                                                            │    │
│  │  getWorkloadStatus()                                      │    │
│  │    → Returns all crew member utilization                  │    │
│  │                                                            │    │
│  │  updateWorkload(member, delta)                            │    │
│  │    → Adjust crew member workload                          │    │
│  │                                                            │    │
│  │  recommendForProjectType(type)                            │    │
│  │    → Get recommended crew for project                     │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Crew Communication Clients                               │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  WebhookClient                                            │    │
│  │    → Send requests to n8n webhooks                        │    │
│  │    → Synchronous execution                               │    │
│  │                                                            │    │
│  │  AsyncWebhookClient                                       │    │
│  │    → Async wrapper for webhook calls                      │    │
│  │    → Non-blocking execution                              │    │
│  │                                                            │    │
│  │  PollingService                                           │    │
│  │    → Poll webhook results                                 │    │
│  │    → Wait for async responses                             │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                   COST TRACKING LAYER                                │
│             (domains/shared/cost-tracking/)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Model Router (Singleton Service)                         │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  Registry of all available models:                        │    │
│  │                                                            │    │
│  │  PREMIUM TIER:                                            │    │
│  │  └─ anthropic/claude-sonnet-4                             │    │
│  │                                                            │    │
│  │  STANDARD TIER:                                           │    │
│  │  ├─ anthropic/claude-sonnet-3.5                           │    │
│  │  ├─ anthropic/claude-opus-4-5                             │    │
│  │  └─ openai/gpt-4-turbo                                    │    │
│  │                                                            │    │
│  │  BUDGET TIER:                                             │    │
│  │  ├─ google/gemini-flash-1.5                               │    │
│  │  └─ anthropic/claude-haiku                                │    │
│  │                                                            │    │
│  │  Services:                                                │    │
│  │  • getModel(id) → Model details                           │    │
│  │  • getModelsByTier(tier) → Filter by cost tier            │    │
│  │  • selectBestModel(requirements) → Optimal choice         │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Cost Calculator (Singleton Service)                      │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  calculateEstimatedCost(model, inputTokens, outputTokens) │    │
│  │    → Pre-execution cost estimate                          │    │
│  │                                                            │    │
│  │  calculateActualCost(model, inputTokens, outputTokens)    │    │
│  │    → Post-execution actual cost                           │    │
│  │                                                            │    │
│  │  Pricing lookup for all providers:                        │    │
│  │  • OpenRouter models                                      │    │
│  │  • Anthropic (direct)                                     │    │
│  │  • OpenAI (direct)                                        │    │
│  │  • Google Gemini                                          │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Usage Tracker (Singleton Service)                        │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  track(event)                                             │    │
│  │    → Record LLM usage event                               │    │
│  │    → In-memory cache + Supabase persistence              │    │
│  │                                                            │    │
│  │  getRecentEvents(limit=100)                               │    │
│  │    → Get recent cached events                             │    │
│  │                                                            │    │
│  │  getProjectEvents(projectId)                              │    │
│  │    → Filter events by project                             │    │
│  │                                                            │    │
│  │  clearCache()                                             │    │
│  │    → Clear in-memory cache                                │    │
│  │                                                            │    │
│  │  Event Structure:                                         │    │
│  │  • projectId, workflowId, crewMember                      │    │
│  │  • provider, model, inputTokens, outputTokens             │    │
│  │  • estimatedCost, actualCost                              │    │
│  │  • routingMode, requestType, timestamp                    │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Cost Optimizer (Singleton Service)                       │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  analyzeUsage(events) → [OptimizationRecommendations]     │    │
│  │                                                            │    │
│  │  Algorithm:                                               │    │
│  │  1. Group events by model                                 │    │
│  │  2. Calculate average tokens                              │    │
│  │  3. Try cheaper tiers with same capabilities              │    │
│  │  4. Only recommend 20%+ savings                           │    │
│  │  5. Validate context window & tool use compatibility      │    │
│  │                                                            │    │
│  │  Output:                                                  │    │
│  │  • originalModel, recommendedModel                        │    │
│  │  • savings, savingsPercent, reasoning                     │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Budget Enforcer (Singleton Service)                      │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                            │    │
│  │  canAfford(model, tokens) → boolean                       │    │
│  │    → Check if request fits in project budget              │    │
│  │                                                            │    │
│  │  enforceLimit(projectId, budget)                          │    │
│  │    → Set spending limit for project                       │    │
│  │                                                            │    │
│  │  Prevents overspending at execution time                  │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMAS LAYER                            │
│             (domains/shared/schemas/)                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TypeScript Types Generated from Supabase                           │
│                                                                      │
│  Core Tables:                                                       │
│  ├─ projects (Project aggregate root)                               │
│  ├─ crew_members (Crew member definitions)                          │
│  ├─ llm_usage_events (Cost tracking events)                         │
│  ├─ n8n_workflow_executions (Workflow history)                      │
│  └─ user_sessions (User tracking)                                   │
│                                                                      │
│  Exports:                                                           │
│  • database.ts (Generated from supabase schema)                      │
│  • client-types.ts (Custom TypeScript extensions)                   │
│  • helpers.ts (Type utilities and converters)                       │
│  • index.ts (Aggregated exports)                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                  SHARED UI COMPONENTS LAYER                          │
│             (domains/shared/ui-components/)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Reusable React Components:                                         │
│  • Design system components                                         │
│  • Common UI patterns                                               │
│  • Theme configuration                                              │
│  • Tailwind CSS utilities                                           │
│                                                                      │
│  Used by: All domain dashboards & unified-dashboard                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│              N8N WORKFLOWS & ORCHESTRATION LAYER                      │
│             (domains/shared/workflows/)                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Shared Workflow Definitions (N8N JSON)                             │
│  • Cross-domain orchestration patterns                              │
│  • Reusable workflow nodes                                          │
│  • Webhook triggers and responses                                   │
│                                                                      │
│  Total Workflows: 100+                                              │
│  • Product Factory: 54+ workflows                                   │
│  • Alex-AI-Universal: 36+ workflows                                 │
│  • Shared: Common patterns                                          │
│                                                                      │
│  Orchestration Features:                                            │
│  • Webhook-based triggers                                           │
│  • Async polling for results                                        │
│  • Multi-step crew coordination                                     │
│  • Cost tracking integration                                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│               OPENROUTER API CLIENT LAYER                            │
│             (domains/shared/openrouter-client/)                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  HTTP Client for OpenRouter API                                     │
│  • Model availability                                               │
│  • LLM request routing                                              │
│  • Response handling                                                │
│  • Error recovery                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. VSCODE EXTENSION ARCHITECTURE

```
╔════════════════════════════════════════════════════════════════════════╗
║               VSCODE EXTENSION DOMAIN                                   ║
║                (domains/vscode-extension/)                              ║
╚════════════════════════════════════════════════════════════════════════╝


┌────────────────────────────────────────────────────────────────────┐
│                      EXTENSION ENTRY POINT                        │
│              src/extension.ts (VSCode Activation)                 │
└────────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   COMMANDS       │ │   PROVIDERS      │ │   SERVICES       │
│  (Handlers)      │ │  (VSCode API)    │ │  (Business Logic)│
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│                  │ │                  │ │                  │
│ • ask            │ │ • TreeView       │ │ • LLMRouter      │
│ • review         │ │ • HoverProvider  │ │ • FileManager    │
│ • explain        │ │ • CompletionProv │ │ • CostTracker    │
│ • generate       │ │ • DiagnosticsEng │ │ • CostEstimator  │
│ • refactor       │ │                  │ │ • NLPProcessor   │
│ • test           │ │ Widgets:         │ │ • OCREngine      │
│ • document       │ │ • ChatPanel      │ │ • CLIExecutor    │
│ • debug          │ │ • CostMeter      │ │                  │
│ • optimize       │ │ • TreeViews      │ │ Integrations:    │
│ • crew.roster    │ │                  │ │ • Shared Crew    │
│ • crew.consult   │ │                  │ │ • Shared Cost    │
│ • project.create │ │                  │ │ • Shared Schemas │
│ • cost.report    │ │                  │ │ • OpenRouter API │
│ • cost.optimize  │ │                  │ │                  │
│                  │ │                  │ │                  │
│ Handler:         │ │                  │ │                  │
│ CommandExecutor  │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │   SHARED KERNEL    │
                  │ (Crew, Cost, etc.) │
                  └────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │  SUPABASE + N8N    │
                  │  (Remote Services) │
                  └────────────────────┘


Webviews (Custom UI):
┌────────────────────────────────────────────────────────────────┐
│  src/webview/                                                  │
│  ├── chat.html         (Chat panel interface)                  │
│  ├── chat.css          (Chat styling)                          │
│  └── chat.js           (Chat interactions)                     │
└────────────────────────────────────────────────────────────────┘

Storage (Local Persistence):
┌────────────────────────────────────────────────────────────────┐
│  src/storage/                                                  │
│  ├── history.ts        (Command history)                       │
│  ├── cache.ts          (Response caching)                      │
│  └── settings.ts       (User settings)                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. DATA FLOW: REQUEST TO RESPONSE

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER ACTION IN IDE / WEB UI                                        │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. COMMAND / HTTP REQUEST                                          │
│                                                                     │
│  VSCode Extension:                                                 │
│  └─ Command triggered (e.g., "crew.consult")                       │
│                                                                     │
│  Web Browser:                                                      │
│  └─ API route called (e.g., POST /api/crew)                        │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. REQUEST PROCESSING                                              │
│                                                                     │
│  VSCode:                                                           │
│  └─ CommandExecutor → Service → SharedKernel                       │
│                                                                     │
│  Web:                                                              │
│  └─ API Route → Domain Service → SharedKernel                      │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. CREW COORDINATION                                               │
│                                                                     │
│  CrewCoordinator.selectCrewMember()                                │
│  ├─ Score crew by expertise, workload, cost tier                   │
│  └─ Return best match                                              │
│                                                                     │
│  Selected crew member → Default model assignment                   │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. COST ESTIMATION                                                 │
│                                                                     │
│  CostCalculator.calculateEstimatedCost()                           │
│  ├─ Lookup model pricing                                           │
│  ├─ Estimate input/output tokens                                   │
│  └─ Return estimated cost                                          │
│                                                                     │
│  BudgetEnforcer.canAfford()                                        │
│  └─ Check project budget limit                                     │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. LLM ROUTING & EXECUTION                                         │
│                                                                     │
│  ModelRouter.selectBestModel()                                     │
│  ├─ Consider: capabilities, cost, availability                     │
│  └─ Return optimal model ID                                        │
│                                                                     │
│  Send request to:                                                  │
│  ├─ OpenRouter API (primary), or                                   │
│  ├─ Direct provider (Anthropic, OpenAI, Google)                    │
│  └─ Await response                                                 │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. COST TRACKING                                                   │
│                                                                     │
│  UsageTracker.track()                                              │
│  ├─ Create UsageEvent with actual tokens & cost                    │
│  ├─ Store in-memory cache                                          │
│  └─ Persist to Supabase (async)                                    │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. RESPONSE DELIVERY                                               │
│                                                                     │
│  Return to caller:                                                 │
│  ├─ LLM response content                                           │
│  ├─ Model used                                                     │
│  ├─ Tokens consumed                                                │
│  ├─ Actual cost                                                    │
│  └─ Execution time                                                 │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│  RESULT DISPLAYED TO USER                                           │
│                                                                     │
│  VSCode: Show in editor/webview with cost estimate                 │
│  Web: Display in dashboard with usage metrics                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. SCRIPTS & AUTOMATION LAYER

```
╔════════════════════════════════════════════════════════════════════════╗
║                    SCRIPTS DIRECTORY (scripts/)                         ║
║                  (Automation & Operational Tools)                       ║
╚════════════════════════════════════════════════════════════════════════╝


DEPLOYMENT SCRIPTS                    DOMAIN MANAGEMENT
┌──────────────────────────────────┐ ┌──────────────────────────────┐
│ deploy/                          │ │ domain/                      │
├──────────────────────────────────┤ ├──────────────────────────────┤
│                                  │ │                              │
│ • deploy-aws.sh                  │ │ • create-domain.sh           │
│   AWS EC2 deployment via SSM      │ │   Create new bounded context │
│                                  │ │                              │
│ • deploy-domain.sh               │ │ • federate-feature.sh        │
│   Domain-specific deployment     │ │   Promote feature across     │
│                                  │ │   domain → shared → global   │
│ • deploy-project.sh              │ │                              │
│   Project-specific deployment    │ │ • migrate-to-ddd.sh          │
│                                  │ │   DDD migration scripts      │
│ • docker-compose setup           │ │                              │
│                                  │ │ • sync-all.sh                │
│                                  │ │   Sync all projects          │
│                                  │ │                              │
│                                  │ │ • import-existing-projects.sh│
│                                  │ │   Import external projects   │
│                                  │ │                              │
└──────────────────────────────────┘ └──────────────────────────────┘


SECRETS MANAGEMENT                   GIT UTILITIES
┌──────────────────────────────────┐ ┌──────────────────────────────┐
│ secrets/                         │ │ git/                         │
├──────────────────────────────────┤ ├──────────────────────────────┤
│                                  │ │                              │
│ • sync-from-zshrc.sh             │ │ • setup-remote.js            │
│   Load secrets from shell env    │ │   Configure GitHub remote    │
│                                  │ │                              │
│ • setup-github-secrets.sh        │ │ • verify-git-status.sh       │
│   Push secrets to GitHub Actions │ │   Check Git state            │
│                                  │ │                              │
│ • sync-all-projects.sh           │ │                              │
│   Distribute secrets to projects │ │                              │
│                                  │ │                              │
│ • validate-env.js                │ │                              │
│   Verify all required secrets    │ │                              │
│                                  │ │                              │
└──────────────────────────────────┘ └──────────────────────────────┘


AGILE WORKFLOW                       N8N INTEGRATION
┌──────────────────────────────────┐ ┌──────────────────────────────┐
│ agile/                           │ │ n8n/                         │
├──────────────────────────────────┤ ├──────────────────────────────┤
│                                  │ │                              │
│ • create-feature.sh              │ │ • sync-workflows.js          │
│   Create feature branch          │ │   Sync workflows to N8N      │
│                                  │ │                              │
│ • push-feature.sh                │ │ • backup-workflows-cli.sh    │
│   Push feature to remote         │ │   Backup workflows locally   │
│                                  │ │                              │
│ • create-story.sh                │ │ • upload-backup-to-rag.js    │
│   Create sprint story            │ │   Upload backups to RAG      │
│                                  │ │                              │
│ • push-story.sh                  │ │ • verify-webhooks.js         │
│   Integrate story to sprint      │ │   Verify webhook connectivity│
│                                  │ │                              │
│ • generate-content.js            │ │                              │
│   Generate story/feature content │ │                              │
│                                  │ │                              │
└──────────────────────────────────┘ └──────────────────────────────┘


SYSTEM UTILITIES                     BUILD & INIT
┌──────────────────────────────────┐ ┌──────────────────────────────┐
│ system/                          │ │ root/                        │
├──────────────────────────────────┤ ├──────────────────────────────┤
│                                  │ │                              │
│ • fix-ts-references.js           │ │ • build.sh                   │
│   Fix TypeScript project refs    │ │   Build all packages via Turbo│
│                                  │ │                              │
│ • sync-all.sh                    │ │ • reset-build.sh             │
│   Sync all domains               │ │   Clean all build artifacts  │
│                                  │ │                              │
│ • story-estimation.ts            │ │ • local-dev.sh               │
│   Estimate sprint velocity       │ │   Start local development    │
│                                  │ │                              │
│ • sprint.ts                      │ │ • setup-project.sh           │
│   Sprint management utilities    │ │   Initial project setup      │
│                                  │ │                              │
│ • milestone/                     │ │ • organize-workspace.sh      │
│   ├── create-milestone.sh        │ │   Workspace organization     │
│   ├── push-milestone.sh          │ │                              │
│   └── generate-milestone-content │ │ • enhance-unified-dashboard  │
│                                  │ │ • init-unified-dashboard.sh  │
│                                  │ │                              │
│                                  │ • docker/                     │
│                                  │ │ └── (Docker utilities)       │
│                                  │ │                              │
└──────────────────────────────────┘ └──────────────────────────────┘
```

---

## 8. CI/CD PIPELINE ARCHITECTURE

```
╔════════════════════════════════════════════════════════════════════════╗
║                       CI/CD PIPELINE                                    ║
║              (GitHub Actions → AWS Infrastructure)                      ║
╚════════════════════════════════════════════════════════════════════════╝


GITHUB ACTIONS TRIGGERS
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. MANUAL TRIGGER (Cost Protection Pattern)                       │
│     ┌─────────────────────────────────────────────┐               │
│     │ workflow_dispatch inputs:                   │               │
│     │ • reason: Deployment reason (audit trail)  │               │
│     │ • environment: staging | production        │               │
│     └─────────────────────────────────────────────┘               │
│                                                                     │
│  2. SECRETS AUDIT (Scheduled)                                      │
│     ┌─────────────────────────────────────────────┐               │
│     │ Periodic security scanning                 │               │
│     └─────────────────────────────────────────────┘               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


DEPLOYMENT PIPELINE: deploy.yml
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  STAGE 1: PRE-DEPLOYMENT CHECKS                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Job: pre-deployment (ubuntu-latest)                          │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Steps:                                                        │ │
│  │ 1. Checkout code                                             │ │
│  │ 2. Setup Node.js 20 + pnpm cache                             │ │
│  │ 3. Install dependencies (pnpm install --frozen-lockfile)    │ │
│  │ 4. Type checking (pnpm type-check)                           │ │
│  │ 5. Linting (pnpm lint)                                       │ │
│  │ 6. Validate AWS credentials (sts get-caller-identity)       │ │
│  │ 7. Generate image tag (SHA + timestamp)                      │ │
│  │ 8. Set deploy_decision output                                │ │
│  │                                                               │ │
│  │ Outputs:                                                     │ │
│  │ • deploy_decision: true/false                                │ │
│  │ • image_tag: v1a2b3c4-1707123456                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  STAGE 2: BUILD & PUSH TO ECR                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Job: build (ubuntu-latest)                                   │ │
│  │ Needs: pre-deployment (conditional on deploy_decision)      │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Steps:                                                        │ │
│  │ 1. Checkout code                                             │ │
│  │ 2. Configure AWS credentials                                 │ │
│  │ 3. Login to Amazon ECR                                       │ │
│  │ 4. Create ECR repository if not exists                       │ │
│  │ 5. Build Docker image (multi-platform linux/amd64)           │ │
│  │    • Dockerfile: apps/unified-dashboard/Dockerfile           │ │
│  │    • Build args: NEXT_PUBLIC_SUPABASE_URL, etc.              │ │
│  │ 6. Push image to ECR (tag + latest)                          │ │
│  │ 7. Start async image scan                                    │ │
│  │                                                               │ │
│  │ Outputs:                                                     │ │
│  │ • image_uri: {registry}/openrouter-crew-platform:{tag}       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  STAGE 3: DEPLOY TO EC2                                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Job: deploy (ubuntu-latest)                                  │ │
│  │ Needs: [pre-deployment, build]                               │ │
│  │ Environment: staging | production                            │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Steps:                                                        │ │
│  │ 1. Configure AWS credentials                                 │ │
│  │ 2. Deploy via AWS Systems Manager (SSM)                      │ │
│  │    • Command: AWS-RunShellScript                             │ │
│  │    • Target: EC2 instance                                    │ │
│  │    • Actions:                                                │ │
│  │      - Stop old containers (openrouter-*)                    │ │
│  │      - ECR login                                             │ │
│  │      - Pull latest image                                     │ │
│  │      - Create .env.production                                │ │
│  │      - Start services via docker-compose.prod.yml            │ │
│  │      - Verify containers running                             │ │
│  │ 3. Wait for completion (30s)                                 │ │
│  │ 4. Check command status                                      │ │
│  │ 5. Return deployment output/errors                           │ │
│  │                                                               │ │
│  │ Outputs:                                                     │ │
│  │ • command_id: SSM command identifier                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  STAGE 4: POST-DEPLOYMENT VERIFICATION                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Job: verify (ubuntu-latest)                                  │ │
│  │ Needs: deploy                                                │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Health Checks:                                               │ │
│  │ 1. Dashboard health                                          │ │
│  │    curl https://domain/api/health                            │ │
│  │                                                               │ │
│  │ 2. N8N service health                                        │ │
│  │    curl http://{EC2_IP}:5678/healthz                         │ │
│  │                                                               │ │
│  │ 3. Supabase connectivity                                     │ │
│  │    curl {SUPABASE_URL}/rest/v1/ -H "apikey: ..."            │ │
│  │                                                               │ │
│  │ 4. Generate deployment summary                               │ │
│  │    Environment, Reason, Image Tag, Actor, Timestamp          │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  STAGE 5: NOTIFICATIONS                                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Job: notify (ubuntu-latest)                                  │ │
│  │ Needs: [deploy, verify]                                      │ │
│  │ Condition: always() - run even if previous jobs fail         │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Actions:                                                      │ │
│  │ 1. Determine deployment status (success/failure)             │ │
│  │ 2. Send notifications (placeholder)                          │ │
│  │    - Optional: Slack webhook                                 │ │
│  │    - Optional: Email notification                            │ │
│  │    - Placeholder for custom integrations                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


ENVIRONMENT VARIABLES & SECRETS (GitHub Actions)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│ AWS Credentials:                                                  │
│ • AWS_ACCESS_KEY_ID                                               │
│ • AWS_SECRET_ACCESS_KEY                                           │
│ • AWS_REGION: us-east-2                                           │
│                                                                     │
│ EC2 Instance:                                                     │
│ • EC2_INSTANCE_ID                                                 │
│ • EC2_PUBLIC_IP                                                   │
│                                                                     │
│ Supabase:                                                         │
│ • SUPABASE_URL                                                    │
│ • SUPABASE_ANON_KEY                                               │
│ • SUPABASE_SERVICE_ROLE_KEY                                       │
│                                                                     │
│ N8N:                                                              │
│ • N8N_BASE_URL                                                    │
│ • N8N_API_KEY                                                     │
│                                                                     │
│ OpenRouter:                                                       │
│ • OPENROUTER_API_KEY                                              │
│                                                                     │
│ Optional:                                                         │
│ • SLACK_WEBHOOK (for notifications)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. INFRASTRUCTURE STACK

```
╔════════════════════════════════════════════════════════════════════════╗
║                    INFRASTRUCTURE LAYER                                 ║
║              (Supabase, N8N, AWS, Docker)                               ║
╚════════════════════════════════════════════════════════════════════════╝


SUPABASE (PostgreSQL + Auth + Realtime)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Core Tables:                                                      │
│  • projects                    (Project aggregate root)            │
│  • crew_members                (Crew definitions)                  │
│  • llm_usage_events            (Cost tracking)                     │
│  • n8n_workflow_executions     (Workflow tracking)                 │
│  • user_sessions               (User tracking)                     │
│                                                                     │
│  Features:                                                         │
│  • PostgreSQL database                                             │
│  • Row-level security (when auth enabled)                          │
│  • Real-time subscriptions                                         │
│  • RESTful API (auto-generated)                                    │
│  • Auth integration                                                │
│                                                                     │
│  Config: supabase/config.toml                                     │
│  Migrations: supabase/migrations/                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


N8N (Workflow Orchestration)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Services:                                                         │
│  • Workflow execution engine                                       │
│  • Webhook trigger/receiver                                        │
│  • API polling                                                     │
│  • Data transformation                                             │
│  • Error handling & retries                                        │
│                                                                     │
│  Integration Points:                                               │
│  • Receives crew requests via webhooks                             │
│  • Executes workflow steps                                         │
│  • Returns results to dashboard                                    │
│  • Logs execution to database                                      │
│                                                                     │
│  Workflows:                                                        │
│  • 100+ total workflows                                            │
│  • 54+ Product Factory domain workflows                            │
│  • 36+ Alex-AI-Universal domain workflows                          │
│  • Shared workflow patterns                                        │
│                                                                     │
│  Docker:                                                           │
│  • Port: 5678 (UI)                                                 │
│  • Config: docker-compose.n8n.yml                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


AWS INFRASTRUCTURE (Production Deployment)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  REGION: us-east-2                                                │
│                                                                     │
│  EC2 Instance:                                                     │
│  • Primary compute node                                            │
│  • Runs docker-compose (dashboard, n8n, supabase)                  │
│  • Terraform-managed                                               │
│                                                                     │
│  ECR (Elastic Container Registry):                                 │
│  • Repository: openrouter-crew-platform                            │
│  • Stores Docker images                                            │
│  • Image scanning enabled                                          │
│  • Lifecycle policies for cleanup                                  │
│                                                                     │
│  VPC (Virtual Private Cloud):                                      │
│  • Isolates networking                                             │
│  • Configures subnets                                              │
│  • Internet gateway                                                │
│  • Terraform-managed                                               │
│                                                                     │
│  Security Groups:                                                  │
│  • Inbound: 3000 (dashboard), 5678 (n8n), SSH (admin)             │
│  • Outbound: All traffic                                           │
│  • Terraform-managed                                               │
│                                                                     │
│  IAM Roles & Policies:                                             │
│  • EC2 instance role                                               │
│  • ECR push/pull permissions                                       │
│  • Systems Manager permissions                                     │
│  • Terraform-managed                                               │
│                                                                     │
│  Systems Manager Session Manager:                                  │
│  • Secure, audit-logged command execution                          │
│  • No SSH keys needed                                              │
│  • Used by GitHub Actions for deployment                           │
│                                                                     │
│  IaC Tool: Terraform                                               │
│  • Files: terraform/*.tf                                           │
│  • Definitions:                                                    │
│    - main.tf (provider, general config)                            │
│    - ec2.tf (instance definition)                                  │
│    - vpc.tf (networking)                                           │
│    - security-groups.tf (firewall)                                 │
│    - iam.tf (access control)                                       │
│    - variables.tf (inputs)                                         │
│    - outputs.tf (results)                                          │
│    - userdata.sh (EC2 initialization)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


DOCKER COMPOSE (Local + Production)
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Development: docker-compose.yml                                  │
│  ├─ dashboard (Next.js app, port 3000)                             │
│  ├─ supabase (PostgreSQL + API, port 54321)                        │
│  ├─ n8n (Workflow engine, port 5678)                               │
│  └─ redis (optional, cache)                                        │
│                                                                     │
│  Production: docker-compose.prod.yml                              │
│  ├─ dashboard (Dockerized Next.js build)                           │
│  ├─ n8n (Managed instance)                                         │
│  ├─ supabase (Managed via cloud)                                   │
│  └─ Health checks & auto-restart policies                          │
│                                                                     │
│  N8N Specific: docker-compose.n8n.yml                             │
│  └─ Standalone n8n instance for testing                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


EXTERNAL APIS
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  OpenRouter API:                                                   │
│  • LLM model routing and execution                                  │
│  • Cost tracking per request                                       │
│  • Model availability checking                                     │
│                                                                     │
│  Anthropic API (Direct):                                           │
│  • Direct Claude model access (if using direct keys)               │
│                                                                     │
│  OpenAI API (Direct):                                              │
│  • Direct GPT model access (if using direct keys)                  │
│                                                                     │
│  Google Gemini API:                                                │
│  • Direct Gemini model access                                      │
│  • Budget tier models                                              │
│                                                                     │
│  GitHub API:                                                       │
│  • Webhook events (if configured)                                  │
│  • Repository management                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. LLM INTEGRATION ARCHITECTURE

```
╔════════════════════════════════════════════════════════════════════════╗
║              LLM INTEGRATION & COST OPTIMIZATION                         ║
║                 (Model Selection & Routing)                             ║
╚════════════════════════════════════════════════════════════════════════╝


REQUEST FLOW: From User to LLM
┌─────────────────────────────────────────────────────────────────────┐
│  1. USER SUBMITS PROMPT                                             │
│     (VSCode command, Web form, CLI argument)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. CREW SELECTION                                                  │
│                                                                     │
│  If crew member not specified:                                     │
│  CrewCoordinator.selectCrewMember(taskType, expertise)              │
│                                                                     │
│  Selection algorithm:                                              │
│  • Expertise matching (0-10 points)                                 │
│  • Workload balancing (0-5 points, favor less utilized)             │
│  • Cost tier preference (0-3 points)                                │
│                                                                     │
│  Output: CrewMember with assigned defaultModel                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. COST ESTIMATION                                                 │
│                                                                     │
│  CostCalculator.calculateEstimatedCost(model, inputTokens)          │
│                                                                     │
│  • Lookup model pricing from registry                               │
│  • Estimate input tokens (~1.3x prompt length)                      │
│  • Estimate output tokens (based on maxTokens)                      │
│  • Calculate total cost                                             │
│                                                                     │
│  BudgetEnforcer.canAfford(projectId, estimatedCost)                │
│  • Check project remaining budget                                   │
│  • If insufficient, may suggest cheaper model                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. MODEL ROUTING                                                   │
│                                                                     │
│  ModelRouter.selectBestModel(LLMRequest):                           │
│                                                                     │
│  Input Criteria:                                                    │
│  • crewMember.defaultModel (preferred model)                        │
│  • Task requirements (tool use, context window)                     │
│  • Budget constraints                                               │
│  • Cost tier preference (premium/standard/budget)                   │
│  • Model availability                                               │
│                                                                     │
│  Selection Process:                                                 │
│  1. Start with crew member's default model                          │
│  2. Check if model meets requirements:                              │
│     - Context window >= total input + output tokens                 │
│     - Tool use capability (if needed)                               │
│     - Model available (not rate-limited)                            │
│  3. If requirements met: USE THAT MODEL                             │
│  4. If not met: Try alternatives by cost tier                       │
│     - Premium tier (highest quality)                                │
│     - Standard tier (balanced)                                      │
│     - Budget tier (lowest cost)                                     │
│  5. Return selected model                                           │
│                                                                     │
│  Cost Tier Models:                                                  │
│                                                                     │
│  PREMIUM:                                                           │
│  └─ anthropic/claude-sonnet-4 ($15/$60 per 1M tokens)              │
│     (highest quality, used by captain_picard)                       │
│                                                                     │
│  STANDARD:                                                          │
│  ├─ anthropic/claude-sonnet-3.5 ($3/$15 per 1M tokens)             │
│  │  (best quality/cost ratio, default for most crew)                │
│  ├─ anthropic/claude-opus-4-5 ($15/$60 per 1M tokens)              │
│  └─ openai/gpt-4-turbo ($10/$30 per 1M tokens)                     │
│                                                                     │
│  BUDGET:                                                            │
│  ├─ google/gemini-flash-1.5 ($0.075/$0.30 per 1M tokens)           │
│  │  (fast, cheap, good for basic tasks)                             │
│  └─ anthropic/claude-haiku ($0.80/$4 per 1M tokens)                │
│     (ultra-fast, minimal cost)                                      │
│                                                                     │
│  ULTRA_BUDGET:                                                      │
│  └─ (local models, if available)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. SEND REQUEST TO LLM PROVIDER                                    │
│                                                                     │
│  Provider Selection:                                               │
│  ├─ OpenRouter API (recommended)                                    │
│  │  └─ Route request to best provider                               │
│  │     (Anthropic, OpenAI, Google, etc.)                            │
│  │                                                                  │
│  ├─ Direct Anthropic API                                            │
│  │  └─ If using Anthropic direct key                               │
│  │                                                                  │
│  ├─ Direct OpenAI API                                               │
│  │  └─ If using OpenAI direct key                                  │
│  │                                                                  │
│  └─ Direct Google Gemini API                                        │
│     └─ If using Google direct key                                  │
│                                                                     │
│  Request Headers:                                                   │
│  ├─ Authorization: Bearer {API_KEY}                                 │
│  ├─ Content-Type: application/json                                  │
│  ├─ User-Agent: openrouter-crew-platform                            │
│  └─ (OpenRouter specific headers if using OpenRouter)               │
│                                                                     │
│  Request Body:                                                      │
│  ├─ model: selected model ID                                        │
│  ├─ messages: [{ role: "user", content: prompt }]                   │
│  ├─ max_tokens: output limit                                        │
│  ├─ temperature: creativity (0-2)                                   │
│  ├─ tools: (if task requires tool use)                              │
│  └─ metadata: { crew_member, project_id, request_type }             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. RECEIVE RESPONSE FROM LLM                                       │
│                                                                     │
│  Response Data:                                                     │
│  ├─ content: Generated text response                                │
│  ├─ usage: { input_tokens, output_tokens }                          │
│  ├─ model: Model actually used (may differ from requested)          │
│  ├─ finish_reason: "stop" | "length" | "tool_use"                  │
│  └─ (tool_calls if model used tools)                                │
│                                                                     │
│  Error Handling:                                                    │
│  ├─ Timeout: Retry with fallback model                              │
│  ├─ Rate limit: Queue & retry with backoff                          │
│  ├─ Invalid request: Return error to user                           │
│  └─ Provider outage: Try alternative provider                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. COST TRACKING                                                   │
│                                                                     │
│  Create UsageEvent:                                                 │
│  ├─ projectId: Context                                              │
│  ├─ workflowId: 'direct-api' or n8n workflow ID                     │
│  ├─ crewMember: crew member name                                    │
│  ├─ provider: 'openrouter' | 'anthropic' | etc.                     │
│  ├─ model: actual model used                                        │
│  ├─ inputTokens: actual input tokens                                │
│  ├─ outputTokens: actual output tokens                              │
│  ├─ estimatedCost: pre-execution estimate                           │
│  ├─ actualCost: computed from actual tokens                         │
│  ├─ routingMode: cost tier used                                     │
│  ├─ requestType: 'code-generation' | 'review' | etc.                │
│  └─ timestamp: request timestamp                                    │
│                                                                     │
│  Persist:                                                           │
│  ├─ In-memory cache (UsageTracker.events)                           │
│  └─ Supabase llm_usage_events table (async)                         │
│                                                                     │
│  Update Crew Workload:                                              │
│  └─ CrewCoordinator.updateWorkload(crewMember, +1)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  8. RETURN RESPONSE TO USER                                         │
│                                                                     │
│  Result Structure:                                                  │
│  ├─ content: Generated response text                                │
│  ├─ model: Model used                                               │
│  ├─ tokens: {input, output, total}                                  │
│  ├─ cost: {estimated, actual, currency}                             │
│  ├─ crewMember: Assigned crew member                                │
│  ├─ executionTime: Response latency (ms)                            │
│  └─ metadata: Additional context                                    │
│                                                                     │
│  Display Location:                                                  │
│  ├─ VSCode: Show in webview/editor with cost meter update           │
│  ├─ Web: Display in dashboard with usage chart                      │
│  └─ CLI: Print to terminal with metrics                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. MONOREPO PACKAGE DEPENDENCY GRAPH

```
╔════════════════════════════════════════════════════════════════════════╗
║              PACKAGE DEPENDENCIES (pnpm workspace)                      ║
╚════════════════════════════════════════════════════════════════════════╝


UNIFIED DASHBOARD (Entry Point)
────────────────────────────────
@openrouter-crew/unified-dashboard
├── next@14.2.35
├── react@18
├── typescript@5
├── tailwindcss@3.4.1
├── @supabase/supabase-js
├── lucide-react
├── clsx
├── tailwind-merge
│
└─── Shared Libs (workspace:*)
    ├── @openrouter-crew/shared-schemas
    ├── @openrouter-crew/shared-cost-tracking
    └── @openrouter-crew/shared-crew-coordination


CLI TOOL
────────
@openrouter-crew/cli
├── commander@11
├── chalk@4
├── axios@1.6
├── table@6.8
├── dotenv@16
├── typescript@5
├── tsx@4 (ts executor)
│
└─── Shared Libs (workspace:*)
    ├── @openrouter-crew/shared-schemas
    ├── @openrouter-crew/shared-cost-tracking
    └── @openrouter-crew/shared-crew-coordination


PRODUCT FACTORY DASHBOARD
──────────────────────────
@openrouter-crew/product-factory-dashboard
├── next@14.2.35
├── react@18
├── typescript@5
│
└─── Shared Libs (workspace:*)
    ├── @openrouter-crew/shared-schemas
    ├── @openrouter-crew/shared-cost-tracking
    ├── @openrouter-crew/shared-crew-coordination
    └── @openrouter-crew/shared-ui-components


ALEX-AI-UNIVERSAL DASHBOARD
────────────────────────────
@openrouter-crew/alex-ai-universal-dashboard
├── next@14.2.35
├── react@18
├── typescript@5
│
└─── Shared Libs (workspace:*)
    ├── @openrouter-crew/shared-schemas
    ├── @openrouter-crew/shared-cost-tracking
    ├── @openrouter-crew/shared-crew-coordination
    └── @openrouter-crew/shared-ui-components


VSCODE EXTENSION
────────────────
@openrouter-crew/vscode-extension
├── vscode@1.85+
├── @types/vscode
├── typescript@5
├── jest@29 (testing)
│
└─── Shared Libs (workspace:*)
    ├── @openrouter-crew/shared-schemas
    ├── @openrouter-crew/shared-cost-tracking
    ├── @openrouter-crew/shared-crew-coordination
    └── @openrouter-crew/shared-openrouter-client


SHARED: Crew Coordination
─────────────────────────
@openrouter-crew/shared-crew-coordination
├── typescript@5
└── (zero external dependencies - pure TS)


SHARED: Cost Tracking
──────────────────────
@openrouter-crew/shared-cost-tracking
├── typescript@5
└── (zero external dependencies - pure TS)


SHARED: Schemas
────────────────
@openrouter-crew/shared-schemas
├── typescript@5
└── (auto-generated from Supabase)


SHARED: UI Components
──────────────────────
@openrouter-crew/shared-ui-components
├── react@18
├── tailwindcss@3
└── typescript@5


SHARED: OpenRouter Client
──────────────────────────
@openrouter-crew/shared-openrouter-client
├── typescript@5
├── axios (for HTTP)
└── (pure TS wrapper)


SHARED: Workflows
──────────────────
@openrouter-crew/shared-workflows
└── (N8N JSON definitions - no npm deps)


ROOT WORKSPACE
───────────────
openrouter-crew-platform
├── turbo@2.0.0 (build orchestration)
├── typescript@5.9.3 (type checking)
├── tailwindcss@3.4.1 (shared styling)
├── concurrently@8.2.2 (concurrent task running)
├── @types/node@20 (Node.js types)
└── supabase@2.72.9 (CLI)


BUILD & DEV TOOLS
──────────────────
configs/
├── eslint/base.js (ESLint rules)
├── eslint/next.js (Next.js ESLint config)
├── jest/base.config.js (Jest configuration)
├── prettier/base.json (Code formatting)
└── tsconfig/
    ├── base.json (Base TS config)
    └── node.json (Node.js TS config)
```

---

## 12. DEPLOYMENT TOPOLOGY

```
╔════════════════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT TOPOLOGY                                  ║
║            (Local Development → Production AWS)                          ║
╚════════════════════════════════════════════════════════════════════════╝


LOCAL DEVELOPMENT ENVIRONMENT
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Developer Laptop                                                   │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Source Code (Git)                                            │ │
│  │ ├── pnpm install (node_modules)                              │ │
│  │ └── pnpm dev (Turbo + concurrently)                           │ │
│  │                                                               │ │
│  │ Running Services (Docker Compose):                           │ │
│  │ ├── Dashboard (localhost:3000) [Next.js dev server]          │ │
│  │ ├── Supabase (localhost:54321) [PostgreSQL + API]            │ │
│  │ ├── N8N (localhost:5678) [Workflow engine]                   │ │
│  │ ├── Redis (localhost:6379) [optional cache]                  │ │
│  │ └── [Domain dashboards at localhost:3001-3003]               │ │
│  │                                                               │ │
│  │ API Routes [Auto-reloading Next.js dev server]:              │ │
│  │ ├── /api/crew                                                │ │
│  │ ├── /api/ask                                                 │ │
│  │ ├── /api/health                                              │ │
│  │ └── ...more                                                  │ │
│  │                                                               │ │
│  │ CLI Available [tsx]:                                         │ │
│  │ └── crew <command>                                           │ │
│  │                                                               │ │
│  │ VSCode Extension [Debug mode]:                               │ │
│  │ └── F5 to launch VSCode with extension                       │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│           │                      │                    │           │
│           ▼                      ▼                    ▼           │
│      localhost:3000         localhost:5678       CLI Tool       │
│      (Dashboard)            (N8N)               (Dev Testing)   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


STAGING/PRODUCTION DEPLOYMENT
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  AWS Deployment (Terraform-managed)                                │
│                                                                     │
│  EC2 Instance (us-east-2)                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Security Group:                                              │ │
│  │ ├─ Inbound: 3000 (dashboard), 5678 (n8n), SSH (admin)       │ │
│  │ └─ Outbound: All (for API calls)                             │ │
│  │                                                               │ │
│  │ Docker Services (via docker-compose.prod.yml):               │ │
│  │                                                               │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Dashboard Container                                     │ │ │
│  │ │ ├── Image: {ECR}/openrouter-crew-platform:{tag}         │ │ │
│  │ │ ├── Port: 3000                                          │ │ │
│  │ │ ├── Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY   │ │ │
│  │ │ ├── Restart: unless-stopped                             │ │ │
│  │ │ └── Health: /api/health                                 │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ N8N Container                                           │ │ │
│  │ │ ├── Image: n8nio/n8n:latest                             │ │ │
│  │ │ ├── Port: 5678                                          │ │ │
│  │ │ ├── Env: DB_TYPE, DB_SQLITE_PATH, N8N_SECURE_COOKIE    │ │ │
│  │ │ ├── Restart: unless-stopped                             │ │ │
│  │ │ └── Health: /healthz                                    │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Supabase Container (or managed service)                 │ │ │
│  │ │ ├── Image: supabase/postgres:latest                     │ │ │
│  │ │ ├── Env: Database credentials                           │ │ │
│  │ │ └── Data: Persisted volume                              │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │ Environment Variables (.env.production):                     │ │
│  │ ├── SUPABASE_URL                                             │ │
│  │ ├── SUPABASE_SERVICE_ROLE_KEY                                │ │
│  │ ├── NEXT_PUBLIC_SUPABASE_URL                                 │ │
│  │ ├── NEXT_PUBLIC_SUPABASE_ANON_KEY                            │ │
│  │ ├── OPENROUTER_API_KEY                                       │ │
│  │ ├── N8N_BASE_URL                                             │ │
│  │ ├── N8N_API_KEY                                              │ │
│  │ └── NODE_ENV=production                                      │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│           │              │              │                         │
│           ▼              ▼              ▼                         │
│      Port 3000       Port 5678      Supabase API               │
│    (Dashboard)       (Workflows)    (Database)                 │
│                                                                     │
│                     ↓                                               │
│              External Services                                     │
│              ├── OpenRouter API (LLM routing)                      │
│              ├── GitHub Actions (CI/CD triggers)                   │
│              └── Email/Slack (Notifications)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


ECR (Elastic Container Registry) - us-east-2
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Repository: openrouter-crew-platform                              │
│                                                                     │
│  Images:                                                           │
│  ├── openrouter-crew-platform:v1a2b3c4-1707123456 (specific tag)  │
│  └── openrouter-crew-platform:latest (always latest build)         │
│                                                                     │
│  Features:                                                         │
│  ├── Image scanning enabled (security)                             │
│  ├── Lifecycle policies (auto-cleanup old images)                  │
│  └── Multi-region replication (optional)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Generated**: 2026-02-09
**Architecture Type**: Domain-Driven Design Monorepo
**No Recommendations**: Current state analysis only
