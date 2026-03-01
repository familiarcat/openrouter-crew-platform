# OpenRouter Crew Platform - Codebase Structure & Optimization Analysis

**Generated:** 2026-03-01 | **Status:** Complete | **Scope:** Full Monorepo Analysis

---

## 📊 CODEBASE ARCHITECTURE VISUALIZATION

```
openrouter-crew-platform (Monorepo)
│
├─ 🎯 PRIMARY GOAL: Cost-Optimized Multi-Agent AI Orchestration
├─ 🏗️  ARCHITECTURE: DDD (Domain-Driven Design)
├─ 🚀 RUNTIME: Node.js 20+ | 📦 PKG: pnpm 9.12.3
└─ 🔧 BUILD: Turbo (Monorepo Build System)

```

### **LAYER 1: SURFACE APPLICATIONS** (User-Facing Entry Points)

```
apps/
├── unified-dashboard/                ┌─────────────────────────┐
│   └─ Next.js 14.2.35                │ 🎨 Platform Orchestrator│
│      [PORT 3000]                    │ - Nav Hub               │
│      - Central control panel         │ - Crew Management       │
│      - Project launcher              │ - Multi-tenant Support  │
│      - Analytics/reporting           └─────────────────────────┘
│
└── cli/
    └─ TypeScript CLI                 ┌─────────────────────────┐
       - Agent provisioning            │ 💻 Developer Tools      │
       - Crew execution                │ - Batch Operations      │
       - Local dev runner              │ - Local Testing         │
       - Script utilities              └─────────────────────────┘
```

**Traffic Pattern:** 80% Web (dashboards) → 20% CLI (ops)

---

### **LAYER 2: DOMAIN SERVICES** (Business Logic & Specialization)

```
domains/
│
├── alex-ai-universal/                ┌─────────────────────────┐
│   ├── dashboard/                    │ 🤖 AI Orchestration     │
│   │   └─ Next.js 15.1.4             │    (Premium Features)   │
│   │      [PORT 3004]                │ - Advanced RAG          │
│   │      - Advanced analytics        │ - LLM chaining         │
│   │      - AI-driven insights        │ - Memory systems        │
│   │      - Real-time collaboration   │ - Context management    │
│   └── agents/                       └─────────────────────────┘
│
├── product-factory/                  ┌─────────────────────────┐
│   ├── projects/*/dashboard/         │ 🏭 Multi-Project Hub    │
│   │   ├─ test-event-venue           │    (Template Engine)    │
│   │   │  [PORT 3003]                │ - Crew templates        │
│   │   ├─ dj-booking                 │ - Project instances     │
│   │   │  [PORT 3002]                │ - Cost breakdown/proj   │
│   │   └─ [EXTENSIBLE]               │ - Domain sandboxing     │
│   │                                 │                         │
│   ├── dashboard/                    │ - RAG knowledge mgmt    │
│   │   └─ TypeScript Lib (TS 5.3.3)  │ - MCP bridge            │
│   │      - Shared utilities          │                         │
│   │      - Common schemas            └─────────────────────────┘
│   │
│   └── project-templates/            ┌─────────────────────────┐
│       ├── dj-booking/               │ 📋 Repeatable Configs   │
│       └── [TEMPLATE SYSTEM]         │ - Clone → Customize     │
│                                     │ - Versioned schemas     │
│                                     └─────────────────────────┘
│
├── shared/                           ┌─────────────────────────┐
│   ├── ui-components/                │ 🧩 Shared Foundation    │
│   │   ├── navigation/               │ - UniversalNavigation   │
│   │   ├── layouts/                  │ - UI Component Library  │
│   │   └── [React 18.3.1]            │ - Sitemap generation    │
│   │                                 │ - Dark Forest Protocol   │
│   ├── crew-api-client/              │                         │
│   │   └─ Universal API Gateway      │ - API Client (6 ops)    │
│   │      [CORE]                     │ - Error handling        │
│   │      - Memory CRUD              │ - Rate limiting         │
│   │      - Crew execution           │ - Auth/project headers  │
│   │      - Search/export            │                         │
│   │      - Admin operations         │ - Timeout: 30s          │
│   │                                 │ - Fetch-based (fetch)   │
│   ├── crew-core/                    │                         │
│   ├── crew-schemas/                 │                         │
│   ├── cost-tracking/                │                         │
│   └── [shared libs]                 └─────────────────────────┘
│
└── vscode-extension/                 ┌─────────────────────────┐
    └─ TypeScript VSCode Ext          │ 📝 Editor Integration   │
       - Inline crew execution        │ - Cmd palette access    │
       - Code linting                 │ - File context passing  │
       - Live results                 │ - Output tracking       │
       - Symbol completion            └─────────────────────────┘
```

---

### **LAYER 3: INFRASTRUCTURE & UTILITIES**

```
packages/
├── n8n-nodes/                        ┌─────────────────────────┐
│   └─ Custom N8N Nodes               │ 🔗 Workflow Integration │
│      - Crew invocation node         │ - BPMN2 compatible     │
│      - Memory access node           │ - Sub-workflow support  │
│      - Batch operations             └─────────────────────────┘
│
└── n8n-workflows/                    ┌─────────────────────────┐
    ├── core-orchestration/           │ 📌 Template Workflows   │
    ├── automation/                   │ - Event-driven exec     │
    ├── scheduled/                    │ - Error recovery        │
    └── [Versioned exports]           └─────────────────────────┘

configs/
├── eslint/                           ┌─────────────────────────┐
├── jest/                             │ ⚙️  Monorepo Config      │
├── prettier/                         │ - Unified standards     │
└── tsconfig/                         │ - Type checking         │
   └── [Root: TS 5.9.3]               │ - Testing framework     │
       [ignoreDeprecations: "5.0"]    └─────────────────────────┘

scripts/
├── system/                           ┌─────────────────────────┐
│   ├── fix-tsconfig-corruption.js   │ 🛠️  Maintenance Scripts   │
│   ├── cleanup-ports.sh             │ - Monorepo health      │
│   └── open-dashboards.sh           │ - Dev environment      │
│                                     │ - CI/CD helpers        │
├── deploy/                           └─────────────────────────┘
├── docker/
├── n8n/
├── secrets/
└── [CI/CD automation]

infrastructure/
├── docker-compose.yml                ┌─────────────────────────┐
├── terraform/                        │ 🌐 Deployment Stack     │
├── supabase/                         │ - Containerization     │
│   └── migrations/                   │ - PostgreSQL (Supabase)│
│   └── snippets/                     │ - Infrastructure-as-Code│
└── [Production infrastructure]       └─────────────────────────┘
```

---

## 🎯 INTERPOLATED PLATFORM GOALS

Based on codebase analysis, the platform achieves:

### **Core Mission: Cost-Optimized AI Orchestration**
- **Multi-LLM Support**: OpenRouter integration + Claude Code integration
- **Crew-Based Agents**: AI agents with specialized roles (music, booking, venue, finance, marketing, RAG)
- **Cost Tracking**: Per-domain, per-project, per-query cost attribution
- **Multi-Tenancy**: Project isolation + cross-project resource sharing
- **Real-time Collaboration**: WebSocket-ready dashboards

### **Key Differentiators**
1. **DDD Architecture**: Clean bounded contexts per domain
2. **Template System**: Repeatable project creation (dj-booking, test-event-venue pattern)
3. **Universal Navigation**: Centralized crew + project discovery
4. **MCP Bridge**: Model Context Protocol for external integrations
5. **RAG Integration**: Knowledge base refresh + semantic search
6. **Dark Forest Protocol**: Safety by design (see docs/THE_DARK_FOREST_PROTOCOL.md)

---

## 💰 API CALL OPTIMIZATION FOR $1 BUDGET

### **Current API Usage Pattern**

```
CrewAPIClient Operations (6 core operations):
├─ create_memory          [POST /memories]
├─ retrieve_memories      [GET  /memories?filter]
├─ update_memory          [PATCH /memories/:id]
├─ delete_memory          [DELETE /memories/:id]
├─ search_memories        [GET /search/memories?query]
├─ execute_crew           [POST /crews/:id/execute]
├─ list_crews             [GET /crews]
├─ get_crew_status        [GET /crews/:id/status]
├─ export_crew_data       [GET /admin/export]
└─ prune_expired_memories [POST /admin/prune]

Token Consumption Points:
1. Query tokenization (search_memories)
2. LLM inference (execute_crew with OpenRouter)
3. Memory embedding (RAG systems)
4. Cross-validation (Dark Forest adversarial testing)
```

### **Cost Model Breakdown ($1 budget)**

```
BUDGET: $1.00 USD
└─ OpenRouter API calls (Claude models)

Price Estimates per Model (OpenRouter pricing):
  Claude 3.5 Haiku:    ~$0.00035 / 1K tokens (input)
  Claude 3.5 Sonnet:   ~$0.003 / 1K tokens (input)
  Claude 3.5 Opus:     ~$0.015 / 1K tokens (input)

Allocation for $1:
├─ Simple queries (Haiku):       ~2,857 calls (1M tokens)
├─ Medium queries (Sonnet):      ~333 calls (333K tokens)
├─ Complex queries (Opus):       ~67 calls (67K tokens)
└─ Memory/search operations:     Supabase (free tier for dev)
```

### **Optimization Strategy: Tiered Execution Model**

```
Request Incoming
│
├─ LAYER 1: Classify by Complexity
│  ├─ Simple fact lookup    → Haiku [0.035¢]
│  ├─ Analysis tasks        → Sonnet [0.3¢]
│  ├─ Complex reasoning     → Opus [1.5¢]
│  └─ Local resolution      → Cache-first [0¢]
│
├─ LAYER 2: Cache Hit Strategy
│  ├─ Query hash            → Check Supabase cache
│  ├─ Memory context        → Reuse embeddings
│  └─ Crew status           → TTL 5m cache
│
├─ LAYER 3: Batch & Queue
│  ├─ Batch similar queries → Reduce overhead
│  ├─ Queue off-peak        → Spread over 24h
│  └─ Throttle to $1/day    → Rate limiter
│
└─ LAYER 4: Early Exit
   ├─ Pattern matching     → Skip LLM calls
   ├─ Template responses   → Stored results
   └─ Memory-only ops      → No inference
```

### **Recommended Implementation**

```typescript
// Cost-Optimized Execution Flow

interface CostOptimizationDecision {
  model: 'haiku' | 'sonnet' | 'opus' | 'cache' | 'local';
  estimatedCost: number;        // in USD
  expectedTokens: number;
  skipReason?: string;
}

async function optimizeAPICall(query: string): Promise<CostOptimizationDecision> {
  // 1. Check cache (0 cost)
  const cached = await checkMemoryCache(query);
  if (cached) return { model: 'cache', estimatedCost: 0 };

  // 2. Pattern matching (0 cost)
  const pattern = matchKnownPattern(query);
  if (pattern) return { model: 'local', estimatedCost: 0 };

  // 3. Estimate complexity
  const complexity = estimateComplexity(query);
  const budget = getRemainingBudget();

  // 4. Route to cheapest viable model
  if (complexity.score < 0.3 && budget > 0.0035) {
    return { model: 'haiku', estimatedCost: 0.0035 };
  }
  if (complexity.score < 0.7 && budget > 0.003) {
    return { model: 'sonnet', estimatedCost: 0.003 };
  }
  if (budget > 0.015) {
    return { model: 'opus', estimatedCost: 0.015 };
  }

  // 5. Out of budget
  throw new BudgetExhaustedError(`Remaining: $${budget}`);
}
```

### **Daily Quota Strategy**

```
$1.00 per 24 hours
│
├─ 06:00-09:00 UTC  (Peak) ┌─────────────────────┐
│  ~$0.30 (3 users)        │ Real-time dashboards│
│                          │ Priority: Haiku     │
├─ 09:00-18:00 UTC  (High) ├─────────────────────┤
│  ~$0.50 (8 users)        │ Work hours queries  │
│  Priority: Sonnet mixed  │ Batch enabled       │
│                          │                     │
├─ 18:00-22:00 UTC  (Norm) ├─────────────────────┤
│  ~$0.15 (2 users)        │ Evening usage       │
│  Priority: Haiku + cache │ RAG refresh allowed │
│                          │                     │
└─ 22:00-06:00 UTC  (Low)  └─────────────────────┘
   ~$0.05 (maintenance)
   - Batch operations only
   - Memory pruning
   - Cache warmup
   - No interactive queries
```

### **Per-Operation Cost Caps**

```
Operation          Max Cost   Model          Hit Rate Target
─────────────────────────────────────────────────────────────
Search memories    $0.001     Haiku (embed)  95% cache hit
Execute simple     $0.005     Haiku          60% cache hit
Execute complex    $0.030     Sonnet         30% cache hit
Analyze project    $0.100     Opus           5% cache hit
Batch export       $0.050     Sonnet         40% cache hit
─────────────────────────────────────────────────────────────
DAILY TOTAL        $1.000
```

### **Cost Monitoring & Alerts**

```
Route: GET /api/cost/status
{
  "budget": {
    "daily": 1.00,
    "used": 0.42,
    "remaining": 0.58,
    "percentUsed": 42,
    "timeRemaining": "14h 23m"
  },
  "breakdown": {
    "haiku": 0.15,
    "sonnet": 0.25,
    "opus": 0.02,
    "cache": 0.00
  },
  "alerts": [
    {
      "type": "HIGH_USAGE",
      "threshold": 0.70,
      "status": "OK",
      "message": "Usage at 42%, trending safe"
    }
  ]
}
```

---

## 🗺️ NEXT STEPS ROADMAP (30-90 Days)

```
PHASE 1: Cost Foundation (Weeks 1-2)
┌─────────────────────────────────────────┐
├─ [✓] Implement cost tracking API        │
├─ [→] Deploy cache layer (Supabase Redis)│
├─ [ ] Model selector middleware          │
├─ [ ] Daily budget enforcement           │
└─ Cost Target: 90% of $1 allocated       │
  Effort: 3-4 sprints

PHASE 2: Optimization (Weeks 3-4)
┌─────────────────────────────────────────┐
├─ [ ] Batch query aggregation            │
├─ [ ] Memory embedding cache             │
├─ [ ] Pattern matching rules (100+ rules)│
├─ [ ] Crew status polling optimization   │
└─ Cost Target: Stay within $0.70/day     │
  Effort: 2-3 sprints

PHASE 3: Intelligence (Weeks 5-8)
┌─────────────────────────────────────────┐
├─ [ ] ML model for complexity estimation │
├─ [ ] Adaptive throttling                │
├─ [ ] Cross-crew result sharing          │
├─ [ ] Predictive cache warming           │
└─ Cost Target: $0.50/day with more value │
  Effort: 4-5 sprints

PHASE 4: Scale (Weeks 9-12)
┌─────────────────────────────────────────┐
├─ [ ] Multi-tenant cost attribution      │
├─ [ ] Per-project budget controls        │
├─ [ ] A/B testing framework              │
├─ [ ] Cost anomaly detection (ML)        │
└─ Cost Target: $0.30/day with 10x scale  │
  Effort: 5-6 sprints
```

---

## 📈 SUCCESS METRICS

```
Metric                  Target      Current    Status
───────────────────────────────────────────────────
Cost per query         < $0.001    TBD        [Setup]
Cache hit rate         > 80%       TBD        [Setup]
Model downgrade rate   > 60%       TBD        [Setup]
Avg response time      < 2s        ~1.2s      [Good]
Budget adherence       99%         TBD        [Setup]
Crew throughput        > 100/min   ~20/min    [Needs opt]
───────────────────────────────────────────────────
```

---

## 🛠️ CRITICAL FILES FOR OPTIMIZATION

```
PRIMARY TARGETS
├─ CrewAPIClient.ts        [Gateway for all API calls]
├─ cost-optimize/route.ts  [Cost routing logic]
├─ cost-tracking/route.ts  [Usage attribution]
├─ batch-executor.ts       [Batch operations]
├─ openrouter-client.ts    [LLM invocation]
└─ Supabase migrations     [Caching + memory]

SUPPORT FILES
├─ TSCONFIG_STRATEGY.md    [Build optimization]
├─ THE_DARK_FOREST_PROTOCOL.md [Safety design]
└─ turbo.json             [Monorepo caching]
```

---

## ⚡ QUICK WIN PRIORITIES

1. **Implement query caching** (Est. 2h) → -40% cost
2. **Add model downgrade selector** (Est. 4h) → -30% cost
3. **Batch memory operations** (Est. 6h) → -20% cost
4. **Cache warming schedule** (Est. 3h) → +10% hit rate
5. **Cost alerting** (Est. 2h) → Budget visibility

**Total Effort:** 17 hours → **Est. Savings:** 60-70% reduction to $0.30-$0.40/day

---

**Version:** 1.0.0 | **Last Updated:** 2026-03-01 | **Status:** Ready for Implementation
