# Universal Memory Setup - Organizational Knowledge Graph

**Generated**: March 1, 2026
**Purpose**: Connect local development to a shared remote Supabase instance that serves as the central organizational memory hub
**Impact**: All stakeholders (developers, agents, executives) access the same knowledge base regardless of access method

---

## 🎯 Core Concept

The OpenRouter Crew Platform uses a **distributed organizational knowledge system** where development insights, decisions, and metrics flow to a central Supabase instance. This enables:

- **Developer Level**: Local feature development creates memories automatically
- **Agent Level**: Autonomous task execution records decisions and outcomes
- **Management Level**: Strategic planning informed by unified development data

All three levels access the **same memory pool**, creating genuine organizational alignment.

---

## 📊 Three-Tier Architecture

### Tier 1: Developer (Local Contributor)
**Who**: Individual contributors working on features locally
**Access**: VSCode extension + local dashboards
**Memory Created**:
- Code decisions and trade-offs
- Blocker resolution attempts
- Feature implementation choices
- Testing outcomes

**Sync**: Automatic to universal Supabase

### Tier 2: Agent (Autonomous Execution)
**Who**: n8n workflows and AI agents executing tasks
**Access**: n8n UI + crew coordination
**Memory Created**:
- Workflow execution logs
- Task completion outcomes
- Resource usage & costs
- Autonomous decision records

**Sync**: Continuous to universal Supabase

### Tier 3: Management/Executive (Strategic Oversight)
**Who**: Project leads, product managers, stakeholders
**Access**: Web dashboards + analytics
**Memory Created**:
- Strategic decisions
- Resource allocation
- Priority changes
- Business plan alignment tracking

**Sync**: Real-time from universal Supabase

---

## 🔧 Setup Instructions

### Step 1: Get Remote Supabase Credentials

Obtain credentials for a **remote Supabase project** (not local):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

These should be obtained from your Supabase project settings.

### Step 2: Configure Environment

Create `.env.local` in the root project directory:

```bash
# Universal Supabase (Remote - Shared Memory Hub)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-key

# n8n Webhook Bridge (if using workflow automation)
N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# VSCode Extension Settings
VSCODE_SUPABASE_URL=https://your-project.supabase.co
VSCODE_SUPABASE_KEY=your-anon-key
```

### Step 3: Verify Supabase Connection

```bash
# Test remote Supabase connectivity
node -e "
const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing credentials'); process.exit(1); }
const client = createClient(url, key);
client.from('conversations').select('count(*)', { count: 'exact' })
  .then(({ count, error }) => {
    if (error) throw error;
    console.log('✅ Remote Supabase connected. Conversations table exists.');
  })
  .catch(e => { console.error('❌ Connection failed:', e.message); process.exit(1); });
"
```

### Step 4: Distribute Credentials to All Packages

```bash
# Copy credentials to all dashboard directories
for dashboard in apps/unified-dashboard domains/alex-ai-universal/dashboard domains/product-factory/project-templates/dj-booking/dashboard domains/product-factory/projects/test-event-venue/dashboard; do
  cat > "$dashboard/.env.local" << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
done

# Copy to VSCode extension config
cat > domains/vscode-extension/.env.local << EOF
VSCODE_SUPABASE_URL=$SUPABASE_URL
VSCODE_SUPABASE_KEY=$SUPABASE_ANON_KEY
EOF

echo "✅ Credentials distributed to all packages"
```

### Step 5: Start Universal Development

```bash
# Start all dashboards + extension connecting to universal Supabase
pnpm dev:universal

# Opens:
# - Unified Dashboard: localhost:3000
# - DJ Booking: localhost:3002
# - Alex AI: localhost:3003
# - Product Factory: localhost:3004
# - VSCode Extension: Debug mode (F5)

# All automatically connect to: https://your-project.supabase.co
```

---

## 📝 Memory Types by Tier

### Developer Tier Memories

When a developer uses the VSCode extension while working locally:

```typescript
// Automatically created when developer uses crew commands
await crewAPIService.createMemory({
  content: "Refactored authentication module to use JWT instead of session tokens",
  type: "decision",
  crew_id: "vscode-dev-team",
  retention_tier: "standard",  // 90-day retention
  tags: ["auth", "refactoring", "infrastructure"]
});
```

**Example memories created**:
- `type: "decision"` - Architecture/design choices
- `type: "blocker"` - Obstacles encountered and resolutions
- `type: "insight"` - Performance findings, security discoveries
- `type: "lesson"` - What didn't work, what should be avoided
- `type: "best_practice"` - Reusable patterns discovered

### Agent Tier Memories

When n8n workflows execute or agents make decisions:

```typescript
// Created by crew coordination system
await agent.recordOutcome({
  memory: {
    content: "Business generator completed for BarItalia in 45 seconds",
    type: "task_completion",
    crew_id: "autonomous-agents",
    cost_usd: 1.50,
    success: true
  },
  reinforcement: {
    succeeded: true,
    weight_multiplier: 1.1  // Success strengthens this decision path
  }
});
```

**Example memories created**:
- `type: "task_completion"` - Workflow execution outcomes
- `type: "cost_analysis"` - Resource usage metrics
- `type: "resource_allocation"` - Capacity planning updates
- `type: "autonomous_decision"` - Recorded choices and rationale

### Management Tier Memories

When executives/product managers make decisions in the web dashboard:

```typescript
// Created through management dashboard UI
await managementAPI.recordDecision({
  content: "Prioritized authentication refactoring over UI redesign (Q1 2026)",
  type: "strategic_decision",
  crew_id: "management",
  business_impact: "security-critical",
  affected_teams: ["backend", "devops"],
  deadline: "2026-03-15"
});
```

**Example memories created**:
- `type: "strategic_decision"` - Priority and roadmap changes
- `type: "business_alignment"` - How development aligns with business goals
- `type: "resource_constraint"` - Budget/capacity decisions
- `type: "executive_directive"` - Strategic guidance for teams

---

## 🔄 Memory Flow Across Tiers

```
Developer (Local)
    ↓ (creates memories via VSCode)
    ↓
Universal Supabase (Central Hub)
    ↓ (accessible to all)
    ├→ Agent (n8n/autonomous) - reads & updates
    ├→ Management (Web Dashboard) - reads & creates directives
    └→ Other Developers (via VSCode) - sees insights & decisions

Feedback Loop:
- Agent success records reinforce developer decisions
- Management decisions guide agent objectives
- Developer insights inform management strategy
```

---

## 📊 Unified Dashboard Views

### For Developers
**VSCode Sidebar - Memories Panel**:
- Recent team memories (what did others discover?)
- Active blockers (shared obstacles)
- Best practices (proven approaches)
- Decisions affecting your code area

### For Agents
**n8n Integration**:
- Access developer insights for context
- Read management directives for task prioritization
- Record outcomes automatically
- Strengthen decision paths with outcome reinforcement

### For Management
**Web Dashboard Analytics**:
- Development velocity (features completed, blockers resolved)
- Cost tracking (API usage, resource allocation)
- Team capacity (who's working on what)
- Business alignment (execution vs. plan)

---

## 🎯 Practical Example Workflow

### Day 1: Developer Makes Decision

**Developer** works locally on JWT authentication refactoring:

```bash
# In VSCode: Command Palette → "Create Memory"
Memory created: "Refactored session auth to JWT. Found critical bug in token
rotation - added 30-min expiry. Blocked by Supabase RLS policy validation."
Type: decision
Tags: auth, security, blocker
```

### Day 2: Agent Picks Up Blocker

**Agent** (n8n workflow) sees the blocker memory:

```bash
# n8n "Smart Blocker Resolution" workflow triggers
# Reads developer memory about RLS policy issue
# Attempts automated RLS rule generation
# Records outcome: "Generated 3 candidate RLS policies.
#                   Awaiting developer review."
Type: autonomous_decision
Reinforcement: pending_review
```

### Day 3: Management Makes Strategic Choice

**Management** sees in dashboard:
- Developer's JWT decision
- Agent's RLS policy candidates
- Current budget usage
- Team capacity

**Decision**: "Prioritize security hardening over feature development this sprint"

```bash
# Creates strategic memory:
"Shifting Q1 focus to security infrastructure (auth, RLS, token management).
Estimated impact: +15% stability, +$200 in API costs, +2 weeks timeline."
Type: strategic_decision
Tags: roadmap, security, budget
```

### Day 4: Closing the Loop

- **Developer** sees the strategic decision, aligns work
- **Agent** updates task priorities based on directive
- **Management** tracks execution against plan
- **All teams** reference the same knowledge base

All memories live in universal Supabase, accessible from any context.

---

## 🔐 Security & Privacy

### Permission Model

| Tier | Memories Visible | Can Create | Can Update |
|------|-----------------|-----------|-----------|
| **Developer** | Own + team + management strategic | Own memories | Own memories |
| **Agent** | All (for context) | Autonomous decisions | Own outcomes |
| **Management** | All | Strategic decisions | Directives |

### Data Isolation (if needed)

For sensitive memories (board decisions, salary info):

```typescript
// Create restricted memory
await crewAPIService.createMemory({
  content: "Executive decision: Q2 headcount increase by 2 engineers",
  type: "strategic_decision",
  restricted_audience: ["management"],  // Only management sees this
  crew_id: "executive-team"
});
```

---

## 📋 Verification Checklist

After setup, verify each tier is connected:

### ✅ Developer Tier
```bash
# 1. Start VSCode extension
code domains/vscode-extension

# 2. Press F5 to debug extension

# 3. Open Command Palette (Cmd+Shift+P)
# 4. Run "Create Memory"
# 5. Enter test memory
# 6. Check: Memory appears in "Memories" sidebar panel
```

### ✅ Agent Tier
```bash
# 1. Check n8n has Supabase configured
# 2. Run a workflow manually
# 3. Verify: Outcome recorded in Supabase memories table
# 4. Check Supabase:
#    SELECT * FROM memories WHERE crew_id = 'n8n-workflows'
```

### ✅ Management Tier
```bash
# 1. Open Unified Dashboard (localhost:3000)
# 2. Navigate to "Crew Insights" or Analytics section
# 3. Verify: Team memories visible in dashboard
# 4. Verify: Can see developer decisions and agent outcomes
```

### ✅ Unified Access
```bash
# Test memory is visible from all contexts:
# - Developer creates memory in VSCode
# - Agent workflow reads it via API
# - Management sees it in web dashboard
# - Other developers see it in VSCode sidebar
```

---

## 🚀 Running the Unified Platform

### Command Reference

```bash
# Start everything connected to universal Supabase
pnpm dev:universal

# Or start individual tiers:
pnpm dev:unified        # Developer dashboards only
pnpm dev:dashboards     # All 4 dashboards
# VSCode: Open & press F5 in domains/vscode-extension

# Build before running locally
pnpm build
```

### Expected Services

| Service | URL | Purpose | Memory Access |
|---------|-----|---------|---|
| Unified Dashboard | localhost:3000 | Platform hub | Read/Write (all) |
| DJ Booking | localhost:3002 | Project test | Read/Write (team) |
| Alex AI | localhost:3003 | Agent network | Read/Write (agents) |
| Product Factory | localhost:3004 | Generator test | Read/Write (team) |
| VSCode Extension | Debug mode (F5) | Developer tools | Read/Write (dev) |
| Supabase | https://your-project.supabase.co | Memory hub | All tiers access |

---

## 📚 Advanced Configuration

### Custom Retention Tiers

By default, memories use these retention periods:
- `eternal`: Permanent (strategic decisions, business critical)
- `standard`: 90 days (development decisions, insights)
- `temporary`: 30 days (working notes, debugging)
- `session`: Current session only (ephemeral context)

To adjust:

```bash
# Edit in domains/shared/agent-memory/src/memory-service.ts
const RETENTION_CONFIG = {
  eternal: { days: 9999 },
  standard: { days: 90 },      // ← Change here
  temporary: { days: 30 },     // ← Or here
  session: { days: 0 }
};
```

### Memory Decay Function

Memories weaken over time (adjustable):

```typescript
// Default: 10% per week for standard tier
const decayRate = 0.10;  // Adjust in agent-memory config

// Strong memories (positive reinforcement) decay slower
// Weak memories (blocked/failed) decay faster
```

### Weighted Graph Edges

Memories connect based on semantic similarity:

```typescript
// When developer memory + agent memory both mention "JWT"
// System creates edge with weight proportional to success
const edgeWeight = successRate * semanticSimilarity;
// Successful patterns strengthen, blocked patterns weaken
```

---

## 🔗 Integration Points

### With n8n Workflows
```
n8n triggers → Reads developer memories for context
             → Executes task
             → Records outcome memory
             → Management adjusts priorities based on result
```

### With CI/CD
```
GitHub Actions → Detects failures
               → Creates blocker memory
               → n8n workflow attempts resolution
               → Developer sees in VSCode sidebar
```

### With Cost Tracking
```
Cost Tracker → Records API spending
            → Creates memory of cost implications
            → Management makes budget decisions
            → Agents adjust strategy based on budget
```

---

## 📖 Next Steps

1. **Set up remote Supabase** - Get credentials from your project
2. **Configure environment** - Copy credentials to all packages
3. **Start universal dev** - `pnpm dev:universal`
4. **Verify all tiers** - Check developer, agent, and management access
5. **Create test memories** - Validate flow across contexts
6. **Review unified dashboard** - See all memories in one place
7. **Document team conventions** - How your team uses shared memory

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
```bash
# Verify credentials are correct
echo $SUPABASE_URL $SUPABASE_ANON_KEY

# Test connectivity
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/memories?limit=1"
# Should return JSON or "not found", not error
```

### "Memories not syncing"
```bash
# Check network tab in browser DevTools
# Verify: POST requests to /rest/v1/memories succeeding
# Check: Supabase Row Level Security allows inserts

# Temporarily disable RLS to debug:
# Supabase Dashboard → Memories table → Disable RLS
# Test again, then re-enable RLS after fixing
```

### "Memory visible in VSCode but not dashboard"
```bash
# Verify dashboard is connected to same Supabase
# Check .env files match across projects
# Rebuild dashboards after changing env:
pnpm build
pnpm dev:unified
```

---

**Status**: Ready for deployment
**All tiers connected**: Developer → Supabase ← Agent ← Management
**Organizational knowledge unified**: ✅

When you run `pnpm dev:universal`, you have **one shared memory pool** accessible from all contexts, creating genuine organizational alignment around the platform's execution.

