# LLM Integration Mapping

**Repository**: openrouter-crew-platform
**Date**: 2026-02-09
**Primary Integration**: OpenRouter API + Direct Provider APIs

---

## EXECUTIVE SUMMARY

The system integrates **4 LLM providers** through **OpenRouter gateway** plus **direct APIs**:

**Provider Distribution**:
- **Anthropic Claude** (primary, multiple versions)
- **OpenAI GPT** (secondary)
- **Google Gemini** (cost-optimized)
- **Meta Llama** (budget alternative)

**Integration Points**: 100+ N8N workflows + 2 TypeScript routers + 6 SDKs

**Cost Strategy**: Intelligent model routing with 90%+ cost reduction vs Copilot

---

## 1. LLM PROVIDERS & MODELS

### 1.1 Provider Configuration

#### **OpenRouter API** (Primary Gateway)
- **Endpoint**: `https://api.openrouter.ai/api/v1/chat/completions`
- **Authentication**: Bearer token (`OPENROUTER_API_KEY`)
- **Purpose**: Cost-optimized routing through multiple providers
- **Advantage**: Single API for 50+ models, automatic cost optimization

**Location**: Used throughout workflows and SDKs

---

#### **Anthropic Direct API** (Premium)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Authentication**: Bearer token (`ANTHROPIC_API_KEY`)
- **Purpose**: Direct Claude access, higher rate limits
- **Usage**: When quality/reasoning is critical

**Location**:
- `domains/product-factory/workflows/coordination-democratic-collaboration-openrouter-production.json` (uses anthropic endpoint)
- Agent projects: `@anthropic-ai/sdk` ^0.27.0

---

#### **OpenAI API** (Direct)
- **Purpose**: GPT-4 access, when needed for specific tasks
- **Status**: Available but typically routed through OpenRouter for cost optimization

---

#### **Google Gemini API** (Direct)
- **Purpose**: Budget-tier, fast inference
- **Via**: Mostly accessed through OpenRouter (`google/gemini-flash-1.5`)

---

### 1.2 Model Catalog

#### **Premium Tier** (Best Quality, High Cost)

| Model | ID | Provider | Input Cost | Output Cost | Context | Use Case |
|-------|----|-----------|----|---|----|------------|
| Claude Opus 4.5 | `anthropic/claude-opus-4.5` | Anthropic | ~$15/1M | ~$75/1M | 200K | Strategic analysis, complex reasoning |
| Claude Opus 4 | `anthropic/claude-opus-4` | Anthropic | ~$15/1M | ~$75/1M | 200K | Complex decision-making |
| Claude 4 Sonnet | `anthropic/claude-sonnet-4` | Anthropic | ~$3/1M | ~$15/1M | 200K | Balanced quality & cost |
| GPT-4 Turbo | `openai/gpt-4-turbo` | OpenAI | ~$10/1M | ~$30/1M | 128K | Code review, analysis |
| GPT-4o | `openai/gpt-4o` | OpenAI | ~$2.5/1M | ~$10/1M | 128K | General purpose, multimodal |

**Assigned Crew**: captain_picard (Claude Sonnet 4)

---

#### **Standard Tier** (Balanced Quality & Cost)

| Model | ID | Provider | Input Cost | Output Cost | Context | Use Case |
|-------|----|-----------|----|---|----|------------|
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | Anthropic | ~$3/1M | ~$15/1M | 200K | General coding, refactoring |
| Claude 3 Sonnet | `anthropic/claude-3-sonnet` | Anthropic | ~$3/1M | ~$15/1M | 200K | Balanced tasks |
| Claude Haiku | `anthropic/claude-haiku` | Anthropic | ~$0.80/1M | ~$4/1M | 75K | Quick tasks |
| Mistral 7B | `mistralai/mistral-7b-instruct` | Mistral | ~$0.14/1M | ~$0.42/1M | 32K | Budget coding |
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct` | Meta | ~$0.59/1M | ~$0.79/1M | 128K | Open-source quality |

**Assigned Crew**: commander_data, commander_riker, counselor_troi, lt_worf, dr_crusher, geordi_la_forge, lt_uhura

---

#### **Budget Tier** (Low Cost, Fast)

| Model | ID | Provider | Input Cost | Output Cost | Context | Use Case |
|-------|----|-----------|----|---|----|------------|
| Gemini Flash 1.5 | `google/gemini-flash-1.5` | Google | ~$0.075/1M | ~$0.30/1M | 1M | Quick answers, formatting |
| Gemini Pro | `google/gemini-pro-1.5` | Google | ~$1.25/1M | ~$2.50/1M | 1M | Optimization tasks |

**Assigned Crew**: chief_obrien, quark (budget models)

---

#### **Ultra-Budget Tier** (Minimum Cost)

| Model | ID | Provider | Cost | Context | Use Case |
|-------|----|----|---|----|------------|
| OpenRouter Auto | `openrouter/auto` | OpenRouter | Variable | Dynamic | Let OpenRouter decide |

**Used in**: Workflows without specific model requirements

---

### 1.3 Model Tiers & Crew Assignments

```
┌─────────────────────────────────────────────────────────┐
│ CREW MEMBER → MODEL MAPPING                             │
├─────────────────────────────────────────────────────────┤
│ Premium Tier (1 member):                                │
│ • captain_picard → claude-sonnet-4                      │
│                                                          │
│ Standard Tier (7 members):                              │
│ • commander_data → claude-sonnet-3.5                    │
│ • commander_riker → claude-sonnet-3.5                   │
│ • counselor_troi → claude-sonnet-3.5                    │
│ • lt_worf → claude-sonnet-3.5                           │
│ • dr_crusher → claude-sonnet-3.5                        │
│ • geordi_la_forge → claude-sonnet-3.5                   │
│ • lt_uhura → claude-sonnet-3.5                          │
│                                                          │
│ Budget Tier (2 members):                                │
│ • chief_obrien → gemini-flash-1.5                       │
│ • quark → gemini-flash-1.5                              │
└─────────────────────────────────────────────────────────┘
```

---

## 2. SDK & WRAPPER IMPLEMENTATIONS

### 2.1 Node.js / TypeScript SDKs

#### **@anthropic-ai/sdk** (^0.27.0)
**Location**: Agent projects (`booking-agent`, `finance-agent`, `music-agent`, `venue-agent`, `marketing-agent`)

**Usage**:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const response = await client.messages.create({
  model: 'claude-3.5-sonnet',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }]
});
```

**Purpose**: Direct Claude API access for MCP servers

---

#### **@modelcontextprotocol/sdk** (^0.5.0)
**Location**: Agent projects (all booking/finance/music/venue/marketing agents)

**Usage**: MCP (Model Context Protocol) server implementation
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
```

**Purpose**: Enable agents to expose capabilities to LLMs

---

### 2.2 Custom TypeScript Wrappers

#### **OpenRouterClient**
**Location**: `domains/shared/openrouter-client/src/index.ts`

**Implementation**:
```typescript
export async function callOpenRouterChat(input: OpenRouterCallInput) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.max_tokens
    })
  });
  return res.json();
}
```

**Features**:
- Minimal wrapper around OpenRouter API
- Error handling for HTTP status codes
- Default temperature (0.2) for deterministic output
- Message passing for chat completions

---

#### **UniversalModelRouter**
**Location**: `domains/shared/crew-coordination/src/universal-model-router.ts`

**Capabilities**:
- Routes between Claude (direct) and OpenRouter (multi-model)
- Selects based on:
  - Quality requirements (high/medium/low)
  - Speed requirements (fast/normal/slow)
  - Budget constraints
  - Provider preference
- Returns RoutingDecision with:
  - Selected model + reasoning
  - Estimated cost & latency
  - Alternative fallback models
  - Cost savings vs expensive option

**Model Options** (18 models across 2 providers):
- Claude: opus-4.5, sonnet-4, sonnet-3.5, haiku (4 models)
- OpenRouter: GPT-4o, Mistral, Llama, Gemini variants (14 models)

---

#### **ModelRouter**
**Location**: `domains/shared/cost-tracking/src/model-router.ts`

**Capabilities**:
- Specialized cost optimization router
- Routes based on task complexity:
  - **Simple** (1-3 complexity) → Gemini Flash
  - **Medium** (4-7 complexity) → Claude Sonnet / GPT-4
  - **Complex** (8-10 complexity) → Claude Opus
- Filters by:
  - Tool support requirements
  - Context window size
  - Cost tier preference
- Returns cheapest viable model

**Model Database**: 6 models hardcoded
- Claude Opus 4, Sonnet 4, Sonnet 3.5
- GPT-4o
- Llama 3.3 70B
- Gemini Flash 1.5

---

#### **LLMRouter** (VSCode Extension)
**Location**: `domains/vscode-extension/src/services/llm-router.ts`

**Optimized for IDE context**:
- Complexity analysis (1-10 scale)
- Intent detection (code review, generation, refactoring, etc.)
- Budget-aware selection
- User preference override

**Cost Strategy**: 90%+ reduction vs GitHub Copilot
- Simple → Gemini Flash ($0.0001 per 1K tokens)
- Medium → GPT-4 or Claude Sonnet
- Complex → Claude Sonnet/Opus

---

### 2.3 HTTP Client Library

#### **axios** (^1.6.5)
**Usage**: Generic HTTP client for OpenRouter and provider APIs
- Used in CLI, agents, and utilities
- Handles authentication headers
- Request/response serialization

---

## 3. PROMPT SYSTEM & TEMPLATES

### 3.1 Crew Member System Prompts

Each crew member has a **system personality** embedded in their definition:

**Location**: `domains/shared/crew-coordination/src/members.ts`

#### System Prompt Structure:
```typescript
interface CrewMember {
  id: string;
  displayName: string;
  personality: string;        // System-level personality
  expertise: string[];        // Skills/specializations
  bio: string;               // Detailed description
  role: CrewMemberRole;      // Role classification
  defaultModel: string;      // Model selection
}
```

#### Example: Captain Picard
```
Personality: "Thoughtful, diplomatic, strategic thinker.
              Values ethics and considers long-term consequences."
Expertise: ["strategy", "diplomacy", "leadership", "ethics", "decision-making"]
Bio: "Strategic leader who provides high-level architectural decisions..."
Role: "strategic-leadership"
Default Model: "anthropic/claude-sonnet-4"
```

#### All Crew Members:
1. **captain_picard** - Strategic leadership (Claude Sonnet 4)
2. **commander_data** - Data analytics (Claude Sonnet 3.5)
3. **commander_riker** - Tactical execution (Claude Sonnet 3.5)
4. **counselor_troi** - User experience (Claude Sonnet 3.5)
5. **lt_worf** - Security compliance (Claude Sonnet 3.5)
6. **dr_crusher** - System health (Claude Sonnet 3.5)
7. **geordi_la_forge** - Infrastructure (Claude Sonnet 3.5)
8. **lt_uhura** - Communications (Claude Sonnet 3.5)
9. **chief_obrien** - Pragmatic solutions (Gemini Flash)
10. **quark** - Business intelligence (Gemini Flash)

---

### 3.2 N8N Workflow Prompt Templates

**Location**: `domains/product-factory/workflows/` (100+ workflows)

#### Pattern 1: OpenRouter Chat Endpoint
```json
{
  "name": "LLM Call",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://api.openrouter.ai/api/v1/chat/completions",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{ $env.OPENROUTER_API_KEY }}"
    },
    "bodyParametersJson": "{
      \"model\": \"anthropic/claude-3.5-sonnet\",
      \"messages\": [
        {
          \"role\": \"system\",
          \"content\": \"You are [CREW_PERSONALITY]...\"
        },
        {
          \"role\": \"user\",
          \"content\": \"{{ $json.prompt }}\"
        }
      ],
      \"temperature\": 0.7,
      \"max_tokens\": 1000
    }"
  }
}
```

#### Pattern 2: Dynamic Model Router (JavaScript)
```javascript
// Optimize LLM selection for crew member based on context
const businessContext = $input.first().json.businessContext;
const crewMember = 'Quark';

// Crew expertise mapping
const quarkExpertise = {
  'financial': ['cost-optimization', 'budget-analysis'],
  'negotiation': ['deal-making', 'contract-optimization'],
  'strategy': ['business-strategy', 'market-analysis'],
};

// Context-based model selection
if (context.type === 'analytical' && context.profitability) {
  return 'openai/gpt-4o';  // Financial analysis
}
if (context.type === 'strategic' && context.domain === 'strategy') {
  return 'anthropic/claude-3-opus';  // Strategy
}
if (context.complexity === 'high') {
  return 'anthropic/claude-3-opus';  // Complex
}
if (context.complexity === 'low') {
  return 'anthropic/claude-3-haiku';  // Cost-effective
}
return 'openai/gpt-4o';  // Default
```

---

### 3.3 Workflow Examples

#### **crew-captain-jean-luc-picard-strategic-leadership-openrouter-production.json**
- **Purpose**: Strategic decision-making for Captain Picard
- **Model**: `openrouter/auto` (or specific per request)
- **System Prompt**: Leadership expertise with ethical focus
- **Use Case**: High-level architectural decisions

#### **crew-quark-business-intelligence-budget-optimization-openrouter-optimized.json**
- **Purpose**: Business optimization for Quark
- **Model**: Dynamic selection based on profitability context
- **System Prompt**: Business expertise with ROI focus
- **Use Case**: Cost optimization analysis

#### **anti-hallucination-crew-detection-openrouter-production.json**
- **Purpose**: Detect hallucinations in crew responses
- **Model**: `anthropic/claude-3.5-sonnet`
- **Pattern**: Multi-step LLM validation
- **Use Case**: Quality assurance on LLM outputs

#### **coordination-democratic-collaboration-openrouter-production.json**
- **Purpose**: Democratic model selection with task-model affinity
- **Models**: 4-model comparison (Claude, GPT-4o, Gemini, Llama)
- **Logic**:
  - Code implementation → Llama 3 (95% affinity)
  - Strategic analysis → Claude Sonnet (98% affinity)
  - Research → GPT-4o (95% affinity)
  - Optimization → Gemini Pro (95% affinity)
- **Use Case**: Choose best model per task, not provider

---

## 4. COST TRACKING INTEGRATION

### 4.1 Usage Event Tracking

**Location**: `domains/shared/cost-tracking/src/tracker.ts`

**Tracked Data** (Supabase: `llm_usage_events` table):
```typescript
interface UsageEvent {
  projectId: string;           // Project context
  workflowId: string;          // N8N workflow or 'direct-api'
  crewMember: string;          // Assigned crew (e.g., 'captain_picard')

  provider: 'openrouter' | 'anthropic' | 'openai' | 'gemini';
  model: string;               // Model ID used

  inputTokens: number;         // Prompt tokens
  outputTokens: number;        // Completion tokens
  totalTokens: number;

  estimatedCost: number;       // Cost pre-execution
  actualCost: number;          // Cost post-execution

  routingMode: CostTier;       // premium/standard/budget/ultra_budget
  requestType: string;         // crew-coordination, code-gen, review, etc.
  timestamp: Date;
}
```

---

### 4.2 Cost Estimation

**Location**: `domains/vscode-extension/src/services/cost-estimator.ts`

**Pre-execution Estimation**:
1. Analyze prompt length → estimate input tokens
2. Request max_tokens → estimate output tokens
3. Look up model pricing
4. Calculate: `(input_tokens * inputCostPer1M / 1M) + (output_tokens * outputCostPer1M / 1M)`

**Cost Optimization Strategy**:
```
Simple task (tokens < 500):
  → Gemini Flash: ~$0.0001
  → Savings vs Copilot: 99%

Medium task (tokens 500-2000):
  → Claude Sonnet: ~$0.015
  → Savings vs Copilot: 85%

Complex task (tokens > 2000):
  → Claude Opus: ~$0.05
  → Savings vs Copilot: 70%
```

---

### 4.3 Budget Enforcement

**Location**: `domains/shared/cost-tracking/src/budget-enforcer.ts`

**Enforcement Strategy**:
1. Check project `budget_usd` limit (Supabase)
2. Calculate `total_cost_usd` so far
3. Estimate request cost
4. If `total + estimate > budget`: Reject or suggest cheaper model
5. Log all decisions to audit trail

---

## 5. REQUEST/RESPONSE FLOW

### 5.1 Typical Crew Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SUBMITS REQUEST                                         │
│    (Web form, CLI, VSCode command)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CREW COORDINATION                                            │
│    CrewCoordinator.selectCrewMember(taskType, expertise)        │
│    → Returns: captain_picard (or other crew member)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. MODEL SELECTION                                              │
│    ModelRouter.route(taskComplexity, crewDefaultModel)          │
│    → Returns: anthropic/claude-sonnet-4                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. COST ESTIMATION                                              │
│    CostCalculator.estimate(model, inputTokens)                  │
│    → Returns: $0.015 estimated                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. BUDGET CHECK                                                 │
│    BudgetEnforcer.canAfford(projectId, estimatedCost)           │
│    → Returns: true/false                                        │
│    → If false: suggest cheaper model or reject                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. BUILD PROMPT                                                 │
│    System: crew_member.personality                              │
│    User: user_prompt                                            │
│    Parameters: temperature=0.7, max_tokens=1000                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. SEND REQUEST                                                 │
│    → OpenRouter API (or direct provider)                        │
│    → Method: POST /api/v1/chat/completions                      │
│    → Auth: Bearer {OPENROUTER_API_KEY}                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. RECEIVE RESPONSE                                             │
│    {                                                             │
│      "content": "Generated response...",                         │
│      "usage": {                                                  │
│        "input_tokens": 150,                                      │
│        "output_tokens": 250                                      │
│      },                                                          │
│      "model": "anthropic/claude-3.5-sonnet"                      │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. COST TRACKING                                                │
│    UsageTracker.track({                                         │
│      projectId, crewMember, model,                              │
│      inputTokens, outputTokens,                                 │
│      actualCost: (150*3 + 250*15)/1M = $0.0045                 │
│    })                                                            │
│    → Persist to Supabase + in-memory cache                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. RETURN RESPONSE                                             │
│     {                                                            │
│       "content": "...",                                          │
│       "model": "anthropic/claude-3.5-sonnet",                    │
│       "crewMember": "captain_picard",                            │
│       "cost": { "estimated": 0.015, "actual": 0.0045 },        │
│       "tokens": { "input": 150, "output": 250 }                │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. INTEGRATION PATTERNS

### 6.1 Pattern: Direct API Call (Dashboard)
```typescript
// Next.js API route
export async function POST(request: Request) {
  const { prompt, crewMember } = await request.json();

  const crew = getCrewMember(crewMember);
  const model = selectModel(crew.expertise);

  const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: 'system', content: crew.personality },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  return response.json();
}
```

---

### 6.2 Pattern: N8N Workflow
```json
{
  "nodes": [
    {
      "name": "Select Model",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Dynamic model selection logic"
      }
    },
    {
      "name": "Call OpenRouter",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.openrouter.ai/api/v1/chat/completions",
        "body": "{{ { model: $('Select Model').json.selectedModel, ... } }}"
      }
    },
    {
      "name": "Track Cost",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "query": "INSERT INTO llm_usage_events (...)"
      }
    }
  ]
}
```

---

### 6.3 Pattern: Crew Request (MCP)
```typescript
// Agent using MCP
const request: CrewRequest = {
  projectId: 'project-123',
  crewMember: 'captain_picard',
  message: 'Design architecture for...',
  context: { codebase: '...' },
  maxTokens: 2000,
  temperature: 0.5
};

// Send via webhook to N8N
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify(request)
});

const result: CrewResponse = await response.json();
// { crewMember, content, model, tokensUsed, estimatedCost }
```

---

## 7. ENVIRONMENT CONFIGURATION

### 7.1 Required Environment Variables

```bash
# OpenRouter (Recommended - cost-optimized)
OPENROUTER_API_KEY=sk_or_xxxxx

# Direct Provider APIs (Optional - for specific use cases)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx

# Database (Cost tracking)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=xxxxx
```

### 7.2 Model Pricing Cache

**Location**: Hardcoded in router implementations

**Update Strategy**:
- Manual updates to `MODEL_DATABASE` in `model-router.ts`
- Should be refreshed quarterly or when pricing changes
- OpenRouter provides pricing via `/api/v1/models` endpoint

---

## 8. QUALITY & SAFETY MECHANISMS

### 8.1 Anti-Hallucination Workflows
**Location**: `domains/product-factory/workflows/anti-hallucination-crew-*.json`

**Patterns**:
1. **Detection**: Run response through hallucination detection model
2. **Validation**: Cross-check facts against knowledge base
3. **Fallback**: Use higher-quality model if hallucination detected

---

### 8.2 Model Fallbacks
**UniversalModelRouter** provides fallback chain:
```
Primary: claude-sonnet-4
Fallback 1: gpt-4o
Fallback 2: claude-sonnet-3.5
Fallback 3: mistral-7b
```

---

### 8.3 Cost Limits
**BudgetEnforcer** prevents overspending:
```typescript
if (estimatedCost + totalCost > projectBudget) {
  // Suggest cheaper model OR reject request
  suggestCheaperModel(task, budget);
}
```

---

## 9. MONITORING & OBSERVABILITY

### 9.1 Usage Tracking
**Dashboard**: Real-time cost dashboard in unified-dashboard
- Total spend per project
- Cost per crew member
- Model usage distribution
- Cost trends over time

### 9.2 Optimization Reports
**CostOptimizer** generates recommendations:
- "Switch from Claude Opus to Claude Sonnet for 30% savings"
- "Gemini Flash can handle 50% of your tasks for 90% less cost"
- Task-specific model suggestions

### 9.3 Alerts
**BudgetEnforcer** triggers alerts:
- Budget 75% consumed
- Budget 90% consumed
- Budget exceeded

---

## 10. SUMMARY TABLE

| Component | Location | Purpose | Input | Output |
|-----------|----------|---------|-------|--------|
| **ModelRouter** | `shared/cost-tracking` | Select cheapest model | Complexity, requirements | ModelInfo |
| **UniversalModelRouter** | `shared/crew-coordination` | Route Claude vs OpenRouter | Quality/speed/budget | RoutingDecision |
| **LLMRouter** (VSCode) | `vscode-extension/services` | IDE-optimized routing | Complexity, intent | Model selection |
| **OpenRouterClient** | `shared/openrouter-client` | HTTP wrapper | Request object | Response JSON |
| **UsageTracker** | `shared/cost-tracking` | Log LLM calls | Event data | Supabase insert |
| **CostCalculator** | `shared/cost-tracking` | Estimate/calculate cost | Model, tokens | USD cost |
| **CostOptimizer** | `shared/cost-tracking` | Recommend alternatives | Usage history | Optimization list |
| **CrewCoordinator** | `shared/crew-coordination` | Select crew member | Task, expertise | CrewMember |
| **Crew Members** | `shared/crew-coordination` | Define personas | Role | System prompt |
| **N8N Workflows** | `product-factory/workflows` | Orchestrate crew | Input data | LLM response |
| **API Routes** | `dashboard/app/api` | Web endpoints | HTTP request | JSON response |
| **Agents (MCP)** | `project/agents` | Autonomous capabilities | Request | Response |

---

## 11. INTEGRATION TOPOLOGY

```
┌────────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                            │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Web Browser    │  │  VSCode IDE  │  │   CLI Tool       │ │
│  │  (Dashboard)     │  │  (Extension) │  │   (Crew command) │ │
│  └──────────────────┘  └──────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   API Routes     │  │  N8N Flows   │  │  Agent (MCP)     │
│  (Next.js)       │  │  (Workflow)  │  │  (Direct)        │
└──────────────────┘  └──────────────┘  └──────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
              ┌────────────────────────────┐
              │  Crew Coordination Layer   │
              │ (CrewCoordinator)          │
              │ → Select crew member       │
              │ → Assign default model     │
              └────────────────────────────┘
                           ▼
        ┌──────────────────────────────────┐
        │  Model Routing Layer             │
        │ ┌────────────────────────────┐   │
        │ │ UniversalModelRouter       │   │ (Quality/Speed/Budget)
        │ │ ModelRouter                │   │ (Cost optimization)
        │ │ LLMRouter (VSCode)         │   │ (IDE-specific)
        │ └────────────────────────────┘   │
        └──────────────────────────────────┘
                           ▼
        ┌──────────────────────────────────┐
        │  Cost Management Layer           │
        │ ┌────────────────────────────┐   │
        │ │ CostCalculator (estimate)  │   │
        │ │ BudgetEnforcer (limit)     │   │
        │ │ CostOptimizer (recommend)  │   │
        │ └────────────────────────────┘   │
        └──────────────────────────────────┘
                           ▼
        ┌──────────────────────────────────┐
        │  LLM Provider Layer              │
        │ ┌────────────────────────────┐   │
        │ │ OpenRouter API (primary)   │   │
        │ │ Anthropic API (direct)     │   │
        │ │ OpenAI API (direct)        │   │
        │ │ Google Gemini API (direct) │   │
        │ └────────────────────────────┘   │
        └──────────────────────────────────┘
                           ▼
        ┌──────────────────────────────────┐
        │  Cost Tracking Layer             │
        │ (UsageTracker → Supabase)        │
        └──────────────────────────────────┘
```

---

**Generated**: 2026-02-09
**Total Models Supported**: 18+ across 4 providers
**Workflows Using LLMs**: 100+
**Cost Optimization Target**: 90%+ reduction vs Copilot
