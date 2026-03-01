# Memory System Integration Guide

This document outlines how to integrate the @openrouter-crew/agent-memory system with CrewCoordinator and other services.

## 1. CrewCoordinator Integration

### A. Inject Memory Before Crew Member Call

In `domains/shared/crew-coordination/src/coordinator.ts`:

```typescript
import { createMemoryService } from '@openrouter-crew/agent-memory';

// In your coordinator initialization:
const memoryService = createMemoryService(supabaseClient);

// Before sending request to crew member:
const { enrichedMessage, contextId } = await memoryService.retrieve({
  projectId: request.projectId,
  context: request.message,
  requestingCrewId: request.crewMember
});

const enrichedRequest = {
  ...request,
  message: enrichedMessage,  // Prepends memory context
  metadata: {
    ...request.metadata,
    memoryContextId: contextId
  }
};

// Send enrichedRequest instead of request
```

### B. Capture Outcome After Response

After receiving response from crew member:

```typescript
// Report success or failure
await memoryService.reportOutcome({
  sessionId: request.sessionId,
  activatedNodeIds: contextId,
  outcome: response.success ? 'success' : 'failure',
  outcomeDelta: response.success ? 0.05 : -0.10,
  crewMember: request.crewMember
});

// Store response as Layer 1 observation
await memoryService.store({
  crewId: request.crewMember,
  layer: 1,
  content: response.content,
  summary: response.content.slice(0, 200),
  retentionTier: 'standard',
  projectId: request.projectId
});
```

## 2. Unified Dashboard Integration

Import memory components into unified-dashboard:

```typescript
// In apps/unified-dashboard/app/layout.tsx or your dashboard:
import { MemoryDashboard } from '@openrouter-crew/agent-memory';

export function DashboardLayout() {
  return (
    <>
      <MemoryDashboard
        apiUrl="http://localhost:3333"
        projectId={projectId}
        autoRefresh={true}
      />
    </>
  );
}
```

## 3. CLI Tool Usage

Access memory via command line:

```bash
# List all memories for a project
npx memory-cli list <projectId>

# Show specific memory details
npx memory-cli show <memoryId>

# Get project statistics
npx memory-cli stats <projectId>

# Test retrieval with custom context
npx memory-cli test <projectId> "your context here"

# Debug information
npx memory-cli debug <projectId>
```

## 4. API Server

Start the memory API server:

```bash
node dist/memory-api.js

# Server runs on http://localhost:3333
# GET /api/memories/project/:projectId
# GET /api/memories/:memoryId
# GET /api/stats/project/:projectId
# GET /api/retrieve?projectId=X&context=Y
```

## 5. Design System Usage

Use unified design tokens in your components:

### HTML/CSS
```html
<link rel="stylesheet" href="node_modules/@openrouter-crew/agent-memory/dist/dashboard.css">

<div class="card">
  <div class="badge badge-layer-1">Layer 1</div>
  <div style="color: var(--color-text-primary); padding: var(--spacing-lg);">
    Content
  </div>
</div>
```

### React
```typescript
import { colors, spacing, designSystem } from '@openrouter-crew/agent-memory';

export function MyComponent() {
  return (
    <div style={{
      backgroundColor: colors.bg.primary,
      padding: spacing.lg,
      color: colors.text.primary
    }}>
      Content
    </div>
  );
}
```

## 6. Testing

Run integration tests:

```bash
# Build and test the memory system
pnpm --filter @openrouter-crew/agent-memory build
pnpm --filter @openrouter-crew/agent-memory type-check

# Test with sample data
node dist/memory-api.js &
curl http://localhost:3333/api/health
```

## Next Steps

1. ✅ Database migration applied
2. ✅ Memory package built and published
3. ✅ Integration hooks created
4. → Integrate with CrewCoordinator
5. → Add memory enrichment to crew requests
6. → Capture outcomes and update weights
7. → Monitor memory growth and learning
