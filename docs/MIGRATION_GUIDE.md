# Migration Guide: Existing Projects → Crew Platform

**How to migrate your existing projects to use the OpenRouter Crew Platform.**

---

## Overview

This guide helps you integrate the Crew Platform into your existing projects. The migration is **non-breaking** - your existing code continues to work while new features are added.

---

## Pre-Migration Checklist

- [ ] Current project using n8n workflows
- [ ] Budget tracking needs (cost optimization)
- [ ] Team size (number of concurrent agents)
- [ ] Current LLM provider (OpenAI, Anthropic, etc.)
- [ ] Existing integrations (Supabase, databases, APIs)

---

## Phase 1: Environment Setup (15 minutes)

### Step 1: Install Dependencies

```bash
# In your project root
npm install @openrouter-crew/shared-crew-coordination
npm install @openrouter-crew/shared-cost-tracking
npm install @openrouter-crew/cli --save-dev
```

### Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# Crew Platform
SUPABASE_URL=https://your-supabase.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook
N8N_URL=https://n8n.yourdomain.com
N8N_API_KEY=your-n8n-api-key

# Optional
PROJECT_BUDGET=1000
DEBUG=false
```

### Step 3: Create Supabase Tables

Run the workflow_requests migration:

```bash
# Using Supabase CLI
supabase db push

# Or copy SQL from migration file
# domains/shared/crew-coordination/migrations/20260203_create_workflow_requests_table.sql
```

---

## Phase 2: Update Webhooks (30 minutes)

### Before: Direct n8n Calls

```javascript
// Old approach - synchronous, 30s timeout
async function callCrew(crewName, task) {
  const response = await fetch(
    `${N8N_URL}/webhook/crew-${crewName}`,
    {
      method: 'POST',
      body: JSON.stringify({ message: task })
    }
  );
  return response.json();
}
```

### After: Using AsyncWebhookClient

```typescript
// New approach - async, cost-optimized, tracked
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';

const webhookClient = new AsyncWebhookClient({
  baseUrl: process.env.N8N_WEBHOOK_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Option 1: Synchronous (< 30s)
const { data } = await webhookClient.call({
  crewMember: 'picard',
  message: 'Quick task',
  projectId: 'my-project'
});

// Option 2: Asynchronous (any duration)
const { data, requestId } = await webhookClient.call(
  {
    crewMember: 'data',
    message: 'Long-running analysis',
    projectId: 'my-project'
  },
  { async: true }
);

console.log(`Request ID: ${requestId}`);
// Later: poll for status
// const status = await webhookClient.getRequestStatus(requestId);
```

---

## Phase 3: Add Cost Optimization (30 minutes)

### Before: No Cost Awareness

```javascript
// Old approach - no budget checks
async function consultAgent(agent, task) {
  // Just call - hope it's not too expensive
  const response = await n8nWebhook(agent, task);
  return response;
}
```

### After: Cost-First Approach

```typescript
import { CostOptimizer } from '@openrouter-crew/shared-crew-coordination';

const optimizer = new CostOptimizer();

async function consultAgent(agent, task) {
  // 1. Analyze cost
  const analysis = await optimizer.analyze(agent, task);

  // 2. Check budget
  if (!analysis.withinBudget) {
    // Suggest alternatives
    console.log('Budget exceeded. Cheaper options:');
    analysis.alternatives.forEach(alt => {
      console.log(`  ${alt.member} (${alt.model}): $${alt.estimatedCost}`);
    });
    throw new Error('Budget exceeded');
  }

  // 3. Execute (within budget)
  const response = await webhookClient.call({
    crewMember: agent,
    message: task,
    projectId: 'my-project'
  });

  // 4. Cost is automatically tracked in Supabase
  return response;
}
```

---

## Phase 4: Integrate CLI (15 minutes)

### Use CLI in Your Application

```typescript
// From your app
import { spawn } from 'child_process';
import { promisify } from 'util';

const execFile = promisify(require('child_process').execFile);

async function useCLI() {
  // Get crew status
  const { stdout } = await execFile('crew', ['crew', 'roster', '--json']);
  const roster = JSON.parse(stdout);

  // Check costs
  const { stdout: costOutput } = await execFile(
    'crew',
    ['cost', 'report', '--period', '30', '--json']
  );
  const costs = JSON.parse(costOutput);

  // Consult crew
  const { stdout: responseOutput } = await execFile('crew', [
    'crew',
    'consult',
    'picard',
    'Your question here',
    '--json'
  ]);
  const response = JSON.parse(responseOutput);

  return { roster, costs, response };
}
```

---

## Phase 5: Integrate Polling (Optional - 20 minutes)

For long-running requests:

```typescript
import { getPollingService } from '@openrouter-crew/shared-crew-coordination';

async function runLongTask(task) {
  // 1. Submit async request
  const { requestId } = await webhookClient.call(
    {
      crewMember: 'data',
      message: task,
      projectId: 'my-project'
    },
    { async: true }
  );

  // 2. Subscribe to updates
  const polling = getPollingService();
  const subscription = polling.subscribe(requestId, (status) => {
    console.log(`Status: ${status.status}`);
    console.log(`Polls: ${status.pollCount}`);
  });

  // 3. Wait for completion
  const finalStatus = await polling.waitForCompletion(requestId, 300000);

  // 4. Get response
  if (finalStatus.status === 'success') {
    return finalStatus.response;
  } else {
    throw new Error(`Task failed: ${finalStatus.error}`);
  }
}
```

---

## Phase 6: Set Up VSCode Extension (Optional - 10 minutes)

```bash
# Install VSCode extension
code --install-extension openrouter-crew-0.1.0.vsix

# Or build from source
cd domains/alex-ai-universal/vscode-extension
npm run build
npm run package
code --install-extension openrouter-crew-0.1.0.vsix
```

Now you have:
- Real-time cost tracking in status bar
- Crew status in sidebar
- Command palette integration

---

## Migration Patterns by Project Type

### Pattern 1: REST API Project

**Current:** Express → n8n webhooks

**After:**
```typescript
// routes/crew.ts
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';

const webhookClient = new AsyncWebhookClient(config);

app.post('/api/crew/consult', async (req, res) => {
  const { member, task } = req.body;

  // Cost check
  const optimizer = new CostOptimizer();
  const analysis = await optimizer.analyze(member, task);
  if (!analysis.withinBudget) {
    return res.status(400).json({ error: 'Budget exceeded' });
  }

  // Execute
  const { data, requestId } = await webhookClient.call(
    { crewMember: member, message: task, projectId: req.projectId },
    { async: true }
  );

  return res.json({ requestId, status: 'pending' });
});
```

### Pattern 2: Next.js Dashboard

**Current:** API routes → n8n webhooks

**After:**
```typescript
// app/api/crew/consult/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';

const webhookClient = new AsyncWebhookClient(config);

export async function POST(request: NextRequest) {
  const { member, task } = await request.json();

  const { data, requestId } = await webhookClient.call({
    crewMember: member,
    message: task,
    projectId: 'my-project'
  });

  return NextResponse.json({ requestId });
}
```

### Pattern 3: Scheduled Tasks / Cron Jobs

**Current:** Scheduled webhooks with no tracking

**After:**
```typescript
// jobs/daily-analysis.ts
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';

async function runDailyAnalysis() {
  const webhookClient = new AsyncWebhookClient(config);
  const polling = getPollingService();

  // Submit async job
  const { requestId } = await webhookClient.call({
    crewMember: 'data',
    message: 'Analyze yesterday\'s metrics',
    projectId: 'analytics'
  }, { async: true });

  // Wait for completion (with timeout)
  const result = await polling.waitForCompletion(
    requestId,
    3600000 // 1 hour timeout
  );

  if (result.status === 'success') {
    // Process result
    await saveResults(result.response);
  }
}

// Cron: 0 0 * * * node dist/jobs/daily-analysis.js
```

---

## Testing Your Migration

### Test 1: Cost Estimation Works

```bash
crew cost optimize picard "Test task"
```

Expected output shows alternatives and savings.

### Test 2: Webhook Calls Work

```bash
crew crew consult picard "Test message"
```

Expected output shows crew response and cost.

### Test 3: Async Requests Work

```bash
crew crew consult data "Long task" --async
# Get request ID, then:
crew crew status <request-id>
```

Expected: Request is tracked in Supabase.

### Test 4: Cost Tracking Works

```bash
crew cost report
```

Expected: Shows today's costs aggregated.

---

## Rollback Plan

If issues arise, you can **revert to old webhooks** since migration is non-breaking:

```typescript
// Old code still works
const response = await fetch(`${N8N_URL}/webhook/crew-picard`, {
  method: 'POST',
  body: JSON.stringify({ message: task })
});

// New code runs in parallel
const { data } = await webhookClient.call({ ... });
```

Both can coexist during transition period.

---

## Troubleshooting

### CLI Not Found

```bash
# Install: npm install -g @openrouter-crew/cli
# Or link: npm link apps/cli
# Or configure path in code
```

### Supabase Connection Error

```bash
# Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/rest/v1/workflow_requests"
```

### n8n Webhooks Not Responding

```bash
# Test webhook
curl -X POST "$N8N_URL/webhook/crew-picard" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

---

## Success Metrics

After migration, you should see:

✅ **Cost reduction** - Smart model selection saves 25%+
✅ **Longer tasks** - No more 30-second timeouts
✅ **Better tracking** - All costs visible in Supabase
✅ **Smarter decisions** - CLI suggests better crew members
✅ **Team visibility** - VSCode shows costs in real-time

---

## Next Steps

1. ✅ Set up environment (Phase 1)
2. ✅ Update webhooks (Phase 2)
3. ✅ Add cost optimization (Phase 3)
4. ✅ Integrate CLI (Phase 4)
5. ✅ (Optional) Add polling (Phase 5)
6. ✅ (Optional) Install VSCode extension (Phase 6)

---

**Estimated Total Time:** 2-3 hours for full migration

**Status:** Ready to migrate
**Last Updated:** 2026-02-03
