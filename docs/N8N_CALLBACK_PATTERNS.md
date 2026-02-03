# N8N Callback Patterns - Async Workflow Guide

**Purpose:** Document standardized patterns for n8n webhooks to support async operations without 30-second timeout limitations.

**Author:** Claude (Haiku 4.5)
**Date:** 2026-02-03
**Version:** 1.0.0

---

## Overview

This guide documents the callback patterns used in OpenRouter Crew Platform n8n workflows. These patterns enable:

- ✅ Asynchronous long-running workflows (no 30-second timeout)
- ✅ Request tracking with Supabase `workflow_requests` table
- ✅ Real-time polling via CLI (`crew status`, `crew wait`)
- ✅ Pre-execution cost optimization (3-Body Problem energy conservation)
- ✅ HMAC-signed webhook authentication
- ✅ Persistent audit trails and memory storage

---

## Architecture: Three-Layer Callback System

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  (CLI, Dashboard, VSCode Extension, External Integrations)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 1. POST /webhook/crew-{member}
                     │ 2. Request ID returned immediately
                     │ 3. Poll /workflow_requests/{id}
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      REQUEST TRACKING                       │
│           Supabase workflow_requests Table                   │
│  (id, status, poll_count, response_payload, cost_usd, ...)  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 4. Update status: pending → running
                     │ 5. Check budget constraints
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                       N8N LAYER                             │
│  (Webhook Trigger → Optimization → LLM → Memory Storage)    │
│  (Can now run longer than 30 seconds)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ 6. Complete workflow
                     │ 7. Update response_payload
                     │ 8. Call memory storage callbacks
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    CALLBACK TARGETS                         │
│  (Memory Storage, Observation Lounge, Analytics, Audit)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Synchronous Webhook Response (Existing)

**Use Case:** Tasks completing in < 30 seconds

**n8n Configuration:**

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "parameters": {
        "httpMethod": "POST",
        "path": "crew-captain-picard",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ {...} }}"
      }
    }
  ]
}
```

**Flow:**
```
Client → POST /webhook/crew-captain-picard
                ↓
        Workflow processes
                ↓
        respondToWebhook → 200 OK + response JSON
                ↓
Client receives response immediately
```

**Response Format:**
```javascript
{
  success: true,
  crew_member: 'captain_picard',
  crew_name: 'Captain Jean-Luc Picard',
  role: 'Strategic Leadership',
  summary: 'First line of response',
  full_response: 'Complete response text',
  request: { original webhook request },
  metadata: {
    generated_at: '2026-02-03T10:15:00Z',
    model: 'claude-sonnet-4',
    usage: { input_tokens: 150, output_tokens: 450 }
  }
}
```

---

## Pattern 2: Asynchronous with Request Tracking (NEW)

**Use Case:** Long-running tasks (> 30 seconds), cost-sensitive operations

**Key Changes:**

1. **Immediate response** with request ID (no waiting)
2. **Status tracking** via `workflow_requests` table
3. **Client polling** for completion
4. **Pre-execution cost check** before workflow starts

**Implementation:**

### 2a. Client Initiates Async Request

```typescript
// CLI: crew consult picard "analyze dataset" --async
const response = await mcpClient.consultCrew('picard', 'analyze dataset', {
  async: true,  // Return request ID immediately
});

console.log(`Request ID: ${response.requestId}`);
// Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// Continue with other work while request processes
console.log('Use: crew status a1b2c3d4... to check progress');
```

### 2b. Async Webhook Client Handler

**File:** `domains/shared/crew-coordination/src/async-webhook-client.ts`

```typescript
// 1. Pre-execution cost check
const estimatedCost = this.estimateCost(request, member);
if (!this.checkBudget(estimatedCost)) {
  throw new Error(`Cost exceeds budget: $${estimatedCost}`);
}

// 2. Create tracking entry in Supabase
const workflowRequest = await this.createWorkflowRequest(
  request,
  member,
  estimatedCost,
  options
);

// 3. Return request ID immediately to client
client.respond(200, { requestId: workflowRequest.id });

// 4. Process webhook asynchronously (in background)
this.executeWithRetry(request, member, workflowRequest, options)
  .then(response => {
    this.updateWorkflowRequest(workflowRequest.id, {
      status: 'success',
      responsePayload: response,
      actualCostUsd: response.estimatedCost,
      completedAt: new Date(),
    });
  })
  .catch(error => {
    this.updateWorkflowRequest(workflowRequest.id, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date(),
    });
  });
```

### 2c. Supabase Tracking Table

**Table:** `workflow_requests`

```sql
CREATE TABLE workflow_requests (
  id UUID PRIMARY KEY,
  workflow_name TEXT,
  request_type TEXT,                    -- 'crew-consult', 'workflow-trigger'
  request_payload JSONB,                -- Original webhook request
  status TEXT,                          -- 'pending', 'running', 'success', 'failed'
  response_payload JSONB,               -- Workflow response when complete
  estimated_cost_usd NUMERIC,           -- Pre-execution estimate
  actual_cost_usd NUMERIC,              -- Post-execution actual
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  poll_count INTEGER,                   -- Polling attempts
  max_poll_attempts INTEGER,            -- Safety limit (60)
  poll_interval_ms INTEGER,             -- 5000ms default
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2d. Client Polls for Completion

**Option 1: Manual polling (CLI)**
```bash
# Check status once
crew status a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Wait up to 5 minutes for completion
crew wait a1b2c3d4-e5f6-7890-abcd-ef1234567890 --timeout 300

# Watch status updates in real-time
crew status a1b2c3d4-e5f6-7890-abcd-ef1234567890 --watch
```

**Option 2: Polling service (backend)**
```typescript
import { getPollingService } from '@openrouter-crew/shared-crew-coordination';

const polling = getPollingService();

// Subscribe to status updates
const subscription = polling.subscribe(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  (status) => {
    console.log(`Status: ${status.status}`);
    console.log(`Polls: ${status.pollCount}`);
    if (status.status === 'success') {
      console.log('Response:', status.response);
    }
  }
);

// Or wait for completion
const finalStatus = await polling.waitForCompletion(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  300000  // 5 minute timeout
);
```

### 2e. N8N Workflow Updates

**Webhook node setup** (no changes needed - existing workflows work as-is):

```json
{
  "name": "Webhook Trigger",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "crew-captain-picard",
    "responseMode": "responseNode"
  }
}
```

**Response includes request ID**:

```javascript
{
  request_id: $('Workflow Request Tracker').item.json.id,
  status: 'pending',
  message: 'Request submitted for processing',
  poll_url: `/api/workflow-requests/${$('Workflow Request Tracker').item.json.id}`
}
```

---

## Pattern 3: Callback Chain (Audit Trail)

**Purpose:** Ensure all side effects are tracked

### Callback Targets:

#### 1. Memory Storage Callback
```javascript
// After LLM execution
{
  type: 'memory-storage',
  target: 'webhook/crew-memory-storage',
  payload: {
    crew_member: 'captain_picard',
    interaction_type: 'consultation',
    input: original_message,
    output: llm_response,
    model: model_used,
    tokens: { input: 150, output: 450 },
    cost_usd: 0.0075,
    timestamp: now(),
    request_id: workflow_request_id
  }
}
```

#### 2. Analytics Callback
```javascript
{
  type: 'analytics',
  target: 'supabase-rest-api',
  payload: {
    table: 'llm_usage_events',
    event: {
      workflow_id: 'crew-captain-picard',
      crew_member: 'captain_picard',
      provider: 'openrouter',
      model: 'claude-sonnet-4',
      input_tokens: 150,
      output_tokens: 450,
      estimated_cost_usd: 0.0075,
      request_id: workflow_request_id
    }
  }
}
```

#### 3. Observation Lounge Callback
```javascript
{
  type: 'observation',
  target: 'webhook/observation-lounge',
  payload: {
    crew_member: 'captain_picard',
    summary: 'First line of response',
    full_response: full_response_text,
    reasoning: 'Why this response was selected',
    alternatives_considered: [...]
  }
}
```

---

## Pattern 4: Error Handling & Retries

**Automatic Retry Logic:**

```typescript
// Exponential backoff: 100ms, 200ms, 400ms, 800ms...
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    return await executeWebhook(request);
  } catch (error) {
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt) * 100;
      await delay(delayMs);

      // Update workflow_requests.retry_count
      await updateWorkflowRequest(requestId, {
        retry_count: attempt + 1
      });
    }
  }
}
```

**Error Response Format:**

```json
{
  request_id: "uuid",
  status: "failed",
  error_code: "TIMEOUT|BUDGET_EXCEEDED|INTERNAL_ERROR",
  error_message: "Human-readable error description",
  error_details: {
    crew_member: "captain_picard",
    attempted_at: "2026-02-03T10:15:00Z",
    retry_count: 3,
    last_error: "Connection timeout after 30 seconds"
  }
}
```

---

## Pattern 5: Budget Enforcement (Energy Conservation)

**Pre-Execution Check:**

```typescript
// 1. Estimate cost BEFORE making webhook call
const estimatedCost = estimateCostFromTask(task, member);

// 2. Check against project budget
const projectBudget = await getProjectBudget(projectId);
if (estimatedCost > projectBudget.remaining) {
  throw new BudgetExceededError(
    `Task costs $${estimatedCost}, budget has $${projectBudget.remaining}`
  );
}

// 3. If within budget, proceed with webhook
const response = await executeWebhook(request);

// 4. Update actual cost after execution
await updateWorkflowRequest(requestId, {
  actual_cost_usd: response.cost
});
```

**Budget Response:**

```json
{
  request_id: "uuid",
  status: "cancelled",
  reason: "BUDGET_EXCEEDED",
  details: {
    estimated_cost: 0.0150,
    project_budget: 100.00,
    budget_remaining: 2.50,
    message: "Use 'crew cost optimize captain-picard \"task\"' for alternatives"
  }
}
```

---

## Implementation Checklist

### For New Crew Member Workflows

- [ ] Add webhook node with `responseMode: "responseNode"`
- [ ] Include `workflow_request_id` in request payload
- [ ] Return `request_id` in immediate response
- [ ] Implement async processing in background
- [ ] Update `workflow_requests` table with response
- [ ] Add memory storage callback
- [ ] Add analytics callback
- [ ] Implement retry logic with exponential backoff
- [ ] Test with `crew consult <member> "test" --async`
- [ ] Verify polling with `crew status <request-id>`

### For Updating Existing Workflows

- [ ] Add request tracking (`workflow_requests` table)
- [ ] Implement cost estimation
- [ ] Add budget checks
- [ ] Create callback chain
- [ ] Update response format to include `request_id`
- [ ] Test backward compatibility (sync mode)
- [ ] Test async mode (polling)
- [ ] Verify cost accuracy

---

## Example: Full Async Workflow

**n8n Workflow: `crew-captain-picard-async.json`**

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "crew-captain-picard",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Create Workflow Request Tracker",
      "type": "n8n-nodes-base.http",
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/rest/v1/workflow_requests",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}",
          "Content-Type": "application/json"
        },
        "body": {
          "workflow_name": "crew-captain-picard",
          "request_type": "crew-consult",
          "request_payload": "{{ $json }}",
          "status": "pending",
          "estimated_cost_usd": 0.0075
        }
      }
    },
    {
      "name": "Return Request ID Immediately",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { request_id: $('Create Workflow Request Tracker').item.json.id, status: 'pending', message: 'Request submitted for processing' } }}"
      }
    },
    {
      "name": "Memory Retrieval",
      "type": "n8n-nodes-base.http",
      "parameters": {
        "url": "{{ $env.N8N_WEBHOOK_URL }}/webhook/crew-memory-storage",
        "method": "POST",
        "body": "{{ { crew_member: 'captain_picard', request_id: $('Create Workflow Request Tracker').item.json.id } }}"
      }
    },
    {
      "name": "OpenRouter LLM Call",
      "type": "n8n-nodes-base.http",
      "parameters": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{ $env.OPENROUTER_API_KEY }}"
        },
        "body": "{{ { model: 'openai/gpt-4-turbo', messages: [...], max_tokens: 500 } }}"
      }
    },
    {
      "name": "Store Memory (Callback)",
      "type": "n8n-nodes-base.http",
      "parameters": {
        "url": "{{ $env.N8N_WEBHOOK_URL }}/webhook/crew-memory-storage",
        "method": "POST",
        "body": "{{ { crew_member: 'captain_picard', interaction: { input: $json.input, output: $('OpenRouter LLM Call').item.json.choices[0].message.content, request_id: $('Create Workflow Request Tracker').item.json.id } } }}"
      }
    },
    {
      "name": "Log Analytics (Callback)",
      "type": "n8n-nodes-base.http",
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/rest/v1/llm_usage_events",
        "method": "POST",
        "body": "{{ { crew_member: 'captain_picard', model: 'openai/gpt-4-turbo', request_id: $('Create Workflow Request Tracker').item.json.id } }}"
      }
    },
    {
      "name": "Update Request Status to Complete",
      "type": "n8n-nodes-base.http",
      "parameters": {
        "url": "{{ $env.SUPABASE_URL }}/rest/v1/workflow_requests/{{ $('Create Workflow Request Tracker').item.json.id }}",
        "method": "PATCH",
        "body": "{{ { status: 'success', response_payload: $json, completed_at: now() } }}"
      }
    }
  ]
}
```

**Testing:**
```bash
# Trigger async request
crew consult picard "Analyze the Federation constitution" --async
# Output: Request ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Check status
crew status a1b2c3d4-e5f6-7890-abcd-ef1234567890

# Wait for completion
crew wait a1b2c3d4-e5f6-7890-abcd-ef1234567890
# Output:
# Status: success
# Response: "The Federation constitution represents..."
# Cost: $0.0075
```

---

## Migration Guide: Sync → Async

### Before (Synchronous - 30s timeout)
```
Client POST → Webhook → Process → Wait 30s → Response
```

### After (Asynchronous - no timeout)
```
Client POST → Webhook → Create Request Tracker
                            ↓
                      Respond Immediately (request ID)
                            ↓
                      Process Asynchronously
                            ↓
                      Client Polls for Completion
```

### Implementation Steps

1. **Keep existing synchronous workflows working**
   - No changes needed for workflows < 30s

2. **For long-running workflows:**
   - Add `workflow_requests` table tracking
   - Respond immediately with `request_id`
   - Process in background
   - Update table with response

3. **Update CLI commands**
   - Add `--async` flag to optionally enable async
   - Add `status` and `wait` commands for polling
   - Show request ID when async mode used

4. **Test both modes**
   - Sync: `crew consult picard "task"` (< 30s)
   - Async: `crew consult picard "task" --async` (any duration)

---

## Monitoring & Debugging

### View Active Requests
```sql
SELECT * FROM workflow_requests
WHERE status IN ('pending', 'running')
ORDER BY created_at DESC;
```

### View Request History
```sql
SELECT
  id,
  workflow_name,
  status,
  duration_ms,
  actual_cost_usd,
  created_at
FROM workflow_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Cost Analysis
```sql
SELECT
  workflow_name,
  COUNT(*) as request_count,
  SUM(actual_cost_usd) as total_cost,
  AVG(duration_ms) as avg_duration_ms
FROM workflow_requests
WHERE created_at > NOW() - INTERVAL '7 days'
AND status = 'success'
GROUP BY workflow_name
ORDER BY total_cost DESC;
```

---

## References

- [Async Webhook Client Source](../domains/shared/crew-coordination/src/async-webhook-client.ts)
- [Polling Service Source](../domains/shared/crew-coordination/src/polling-service.ts)
- [CLI Status Commands](../apps/cli/src/commands/crew.ts)
- [3-Body Problem Philosophy](./THREE_BODY_PHILOSOPHY.md)

---

**Last Updated:** 2026-02-03
**Status:** Production Ready
**Version:** 1.0.0
