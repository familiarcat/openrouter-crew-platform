# Webhook Client Consolidation Plan

**Purpose:** Consolidate multiple webhook client implementations into a single, unified interface.

**Status:** Ready for Implementation
**Author:** Claude (Haiku 4.5)
**Date:** 2026-02-03

---

## Executive Summary

Currently, there are **5+ webhook client implementations** scattered across the codebase. This causes:

- ❌ Code duplication and maintenance burden
- ❌ Inconsistent error handling and retry logic
- ❌ Duplicate cost tracking
- ❌ Difficult to add new features (must update multiple files)
- ❌ Testing complexity (multiple implementations to test)

**Solution:** Consolidate into a single `AsyncWebhookClient` in shared infrastructure.

---

## Identified Webhook Clients

### 1. **`CrewWebhookClient`** (Original - to be deprecated)
**Location:** `domains/shared/crew-coordination/src/webhook-client.ts`

**Status:** Synchronous only, no request tracking

**Functions:**
- `call(request)` - Make webhook call
- `testConnection(crewMemberName)` - Test connectivity

**Issues:**
- No async support
- No cost tracking
- No retries
- 30-second timeout limitation

**Migration:** → Use `AsyncWebhookClient` instead

---

### 2. **`AsyncWebhookClient`** (New - primary)
**Location:** `domains/shared/crew-coordination/src/async-webhook-client.ts`

**Status:** ✅ Production ready - use this going forward

**Functions:**
- `call(request, options)` - Make webhook call with cost check
- `getRequestStatus(requestId)` - Get tracking status
- `testConnection(crewMemberName)` - Test connectivity

**Features:**
- ✅ Async/sync support
- ✅ Automatic retries with exponential backoff
- ✅ Pre-execution cost checks
- ✅ Supabase request tracking
- ✅ Budget enforcement

**Status:** This is the unified client. All other clients should delegate to this.

---

### 3. **`n8n-client.js`** (Dashboard specific - to be removed)
**Location:** `domains/alex-ai-universal/dashboard/lib/n8n-client.js`

**Status:** Standalone n8n HTTP client, lacks features

**Functions:**
```javascript
triggerWebhook(path, payload)      // POST to webhook
triggerWebhookWithHeaders(path, payload, headers)  // With custom headers
```

**Issues:**
- No async tracking
- No cost estimation
- No retries
- No error handling
- Duplicates AsyncWebhookClient functionality

**Migration Plan:**
```javascript
// Before (OLD)
import { triggerWebhook } from './n8n-client';
const response = await triggerWebhook('crew-captain-picard', payload);

// After (NEW)
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';
const client = new AsyncWebhookClient(config);
const { data, requestId } = await client.call({ crewMember: 'picard', ... });
```

**Action:** Remove this file after migration

---

### 4. **`agent-memory-client.js`** (Memory storage - to be refactored)
**Location:** `domains/alex-ai-universal/dashboard/lib/agent-memory-client.js`

**Status:** Specialized client for memory operations

**Functions:**
```javascript
storeMemory(crewMember, data)     // Store crew memory
retrieveMemory(crewMember)        // Get crew memory
deleteMemory(crewId)              // Delete memory
```

**Issues:**
- Duplicates webhook client functionality for memory operations
- Should use AsyncWebhookClient under the hood

**Migration Plan:**
```typescript
// Create specialized wrapper around AsyncWebhookClient
export class CrewMemoryClient {
  private webhookClient: AsyncWebhookClient;

  async storeMemory(crewMember: string, data: any) {
    return this.webhookClient.call({
      crewMember: 'memory-storage',
      message: JSON.stringify(data),
      context: { type: 'memory-store', target: crewMember }
    });
  }

  async retrieveMemory(crewMember: string) {
    return this.webhookClient.call({
      crewMember: 'memory-storage',
      message: `retrieve:${crewMember}`,
      context: { type: 'memory-retrieve' }
    });
  }
}
```

**Action:** Refactor to wrap AsyncWebhookClient

---

### 5. **`crew/client.ts`** (Product Factory - to be refactored)
**Location:** `domains/product-factory/dashboard/lib/alex-ai/crew/client.ts`

**Status:** Product-factory specific crew client

**Functions:**
```typescript
engageCrew(crewId, task, options)  // Engage crew member
```

**Issues:**
- Likely duplicates AsyncWebhookClient
- Product-factory specific (should be generic)

**Action:** Make it a thin wrapper around AsyncWebhookClient

---

### 6. **`webhook-auth.ts`** (Auth/security - to be kept)
**Location:** `domains/alex-ai-universal/dashboard/lib/webhook-auth.ts`

**Status:** ✅ Keep - handles HMAC signature generation

**Functions:**
```typescript
generateWebhookSignature(body, secret)      // Generate HMAC
sendAuthenticatedWebhook(url, data, opts)   // Send signed request
```

**Use Case:** Security layer for webhooks

**Integration:** This should be integrated into AsyncWebhookClient's headers

---

## Consolidation Architecture

### Current State (Duplicated)
```
┌─────────────────────┬──────────────┬──────────────┬──────────────┐
│   Dashboard Lib     │ Product Fact │    Alex AI   │   Shared     │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│  n8n-client.js      │  crew/       │  webhook-    │ webhook-     │
│  agent-memory-      │  client.ts   │  auth.ts     │ client.ts    │
│  client.js          │              │              │ async-       │
│                     │              │              │ webhook-     │
│                     │              │              │ client.ts    │
└─────────────────────┴──────────────┴──────────────┴──────────────┘
            ↓              ↓              ↓              ↓
        Various HTTP calls (duplicated logic)
```

### Desired State (Consolidated)
```
┌──────────────────────────────────────────────────────────┐
│              All Domains & Applications                 │
└────────────────────┬─────────────────────────────────────┘
                     ↓
      ┌──────────────────────────────┐
      │  Specialized Clients (thin)  │
      ├──────────────────────────────┤
      │  CrewMemoryClient            │
      │  CrewCoordinationClient      │
      │  CrewEngagementClient        │
      │  WorkflowClient              │
      └────────────────┬─────────────┘
                       ↓
      ┌──────────────────────────────────┐
      │   AsyncWebhookClient (core)      │
      │   - Cost estimation              │
      │   - Budget enforcement           │
      │   - Request tracking             │
      │   - Retries & backoff            │
      │   - Supabase integration         │
      │   - HMAC signing                 │
      └────────────────┬─────────────────┘
                       ↓
             ┌──────────────────┐
             │  n8n Webhooks    │
             │  OpenRouter API  │
             │  Supabase REST   │
             └──────────────────┘
```

---

## Migration Checklist

### Phase 1: Audit (Current)
- [x] Identify all webhook clients
- [x] Document duplicates
- [x] Map dependencies

### Phase 2: Create Unified Client (✅ DONE)
- [x] Implement `AsyncWebhookClient` in shared
- [x] Add cost estimation
- [x] Add request tracking
- [x] Add retry logic
- [x] Test async/sync modes

### Phase 3: Create Specialized Wrappers (TO DO)
- [ ] `CrewMemoryClient` - wraps AsyncWebhookClient for memory operations
- [ ] `CrewCoordinationClient` - crew engagement wrapper
- [ ] `WorkflowClient` - workflow execution wrapper
- [ ] Update existing clients to use wrappers

### Phase 4: Update Dependencies (TO DO)
- [ ] Update `n8n-client.js` callers → use AsyncWebhookClient
- [ ] Update `agent-memory-client.js` callers → use CrewMemoryClient
- [ ] Update `crew/client.ts` callers → use specialized clients
- [ ] Update dashboard API routes

### Phase 5: Remove Duplicates (TO DO)
- [ ] Delete `n8n-client.js`
- [ ] Delete `agent-memory-client.js`
- [ ] Deprecate `CrewWebhookClient` in webhook-client.ts
- [ ] Update imports in all files

### Phase 6: Documentation & Testing (TO DO)
- [ ] Write migration guides
- [ ] Create examples for each specialized client
- [ ] Write integration tests
- [ ] Update all API documentation

---

## Detailed Migration Examples

### Example 1: n8n-client.js → AsyncWebhookClient

**Before:**
```javascript
// domains/alex-ai-universal/dashboard/lib/n8n-client.js
import { triggerWebhook } from './n8n-client';

async function engageCrew(crewName, input) {
  const result = await triggerWebhook(`crew-${crewName}`, {
    message: input,
    timestamp: new Date()
  });
  return result;
}
```

**After:**
```typescript
// domains/alex-ai-universal/dashboard/lib/crew-client.ts
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';

const webhookClient = new AsyncWebhookClient({
  baseUrl: process.env.N8N_WEBHOOK_URL,
  n8nUrl: process.env.N8N_URL,
  n8nApiKey: process.env.N8N_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

export async function engageCrew(crewName: string, input: string) {
  const { data, requestId } = await webhookClient.call(
    {
      crewMember: crewName,
      message: input,
      projectId: 'default'
    },
    { async: true }  // Enable async if needed
  );

  return { response: data, requestId };
}
```

**Files to Update:**
- `domains/alex-ai-universal/dashboard/app/api/crew/engage/route.ts`
- `domains/alex-ai-universal/dashboard/lib/mcp/universal-client.ts`
- All other callers of `triggerWebhook`

---

### Example 2: agent-memory-client.js → CrewMemoryClient Wrapper

**Before:**
```javascript
// domains/alex-ai-universal/dashboard/lib/agent-memory-client.js
import { triggerWebhook } from './n8n-client';

export async function storeMemory(crewId, data) {
  return await triggerWebhook('crew-memory-storage', {
    action: 'store',
    crew_id: crewId,
    data: data
  });
}
```

**After:**
```typescript
// domains/shared/crew-coordination/src/crew-memory-client.ts
import { AsyncWebhookClient } from './async-webhook-client';

export class CrewMemoryClient {
  private webhookClient: AsyncWebhookClient;

  constructor(webhookClient: AsyncWebhookClient) {
    this.webhookClient = webhookClient;
  }

  async storeMemory(crewId: string, data: any) {
    const { data: response, requestId } = await this.webhookClient.call({
      crewMember: 'memory-storage',
      message: `store:${crewId}`,
      context: { type: 'memory-store', data },
      projectId: 'default'
    });
    return { response, requestId };
  }

  async retrieveMemory(crewId: string) {
    const { data: response, requestId } = await this.webhookClient.call({
      crewMember: 'memory-storage',
      message: `retrieve:${crewId}`,
      projectId: 'default'
    });
    return { response, requestId };
  }

  async deleteMemory(crewId: string) {
    const { data: response, requestId } = await this.webhookClient.call({
      crewMember: 'memory-storage',
      message: `delete:${crewId}`,
      projectId: 'default'
    });
    return { response, requestId };
  }
}
```

**Usage:**
```typescript
import { AsyncWebhookClient } from '@openrouter-crew/shared-crew-coordination';
import { CrewMemoryClient } from '@openrouter-crew/shared-crew-coordination';

const webhookClient = new AsyncWebhookClient(config);
const memoryClient = new CrewMemoryClient(webhookClient);

await memoryClient.storeMemory('picard', { knowledge: [...] });
```

---

## Timeline & Priority

**Phase 3 Completion:** Create specialized wrappers (next iteration)
**Phase 4-5 Completion:** Gradual migration over next 2 weeks
**Phase 6 Completion:** Full documentation after phase 5

---

## Testing Strategy

### Unit Tests
```typescript
describe('AsyncWebhookClient', () => {
  it('should estimate costs correctly', () => { });
  it('should enforce budget limits', () => { });
  it('should retry with exponential backoff', () => { });
  it('should track requests in Supabase', () => { });
  it('should handle timeouts gracefully', () => { });
});

describe('CrewMemoryClient', () => {
  it('should store and retrieve crew memories', () => { });
  it('should delete memories', () => { });
});
```

### Integration Tests
```typescript
describe('Crew Engagement (End-to-End)', () => {
  it('should engage crew and track cost', () => { });
  it('should support async polling', () => { });
  it('should handle budget exceeded', () => { });
});
```

---

## Benefits After Consolidation

| Benefit | Impact |
|---------|--------|
| Single source of truth | Easier maintenance, bug fixes apply everywhere |
| Cost tracking consistency | Accurate budget enforcement across all operations |
| Feature parity | New features added once, available to all clients |
| Error handling | Uniform retry logic and error responses |
| Testing | Single test suite for all webhook operations |
| Documentation | Single reference point for webhook patterns |
| Performance | Potential for connection pooling, caching |
| Monitoring | Unified metrics and observability |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing code | Gradual migration with deprecation warnings |
| Different behavior | Comprehensive test suite before cutover |
| New bugs | Phased rollout: test → staging → production |
| Lost functionality | Wrappers preserve all existing functionality |

---

## Current Status Summary

✅ **COMPLETED:**
- `AsyncWebhookClient` implementation
- Supabase request tracking
- Cost estimation and budget checks
- Polling service

⏳ **NEXT STEPS:**
- Create specialized wrapper clients
- Update all existing callers
- Remove duplicate implementations
- Comprehensive testing

---

## References

- [AsyncWebhookClient Implementation](../domains/shared/crew-coordination/src/async-webhook-client.ts)
- [N8N Callback Patterns](./N8N_CALLBACK_PATTERNS.md)
- [CLI Integration](../apps/cli/src/lib/mcp-client.ts)
- [Request Tracking Schema](../supabase/migrations/20260203_create_workflow_requests_table.sql)

---

**Status:** Ready for Phase 3 Implementation
**Last Updated:** 2026-02-03
**Next Review:** After Phase 4 (Documentation) completion
