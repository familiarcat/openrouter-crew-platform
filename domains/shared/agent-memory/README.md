# @openrouter-crew/agent-memory

Weighted Memory Interpolation System - A neural network-inspired agent memory system that learns from experience.

## Overview

This domain implements Geoffrey Hinton's neural network concepts applied to agent memory:

- **Distributed Representations**: Memories as weighted nodes in a graph
- **Hierarchical Layers**: 4-level memory hierarchy (Observations → Patterns → Strategies → Institutional Knowledge)
- **Weighted Connections**: Co-activated memories strengthen edges (synapses)
- **Reinforcement Learning**: Success/failure outcomes adjust confidence weights (backpropagation-like)
- **Confidence Decay**: Time-based exponential decay per retention tier
- **Keyword-Based Retrieval**: Zero-cost semantic matching without embeddings

## Architecture

```
memory-service.ts (Main Facade)
├── memory-graph.ts (CRUD operations)
├── context-encoder.ts (Feature extraction)
├── interpolator.ts (Weighted retrieval)
├── reinforcer.ts (Outcome reinforcement)
├── decay-manager.ts (Confidence decay)
└── prompt-builder.ts (Prompt injection formatting)
```

## Database Schema

**Memory Tables** (Supabase):

- `memory_nodes` - Memory entries with hierarchy, confidence, and metadata
- `memory_edges` - Weighted connections between co-activated nodes
- `memory_contexts` - Context fingerprints for outcome tracking
- `memory_outcomes` - Outcome records for reinforcement learning

See `supabase/migrations/20260301_agent_memory_weights.sql` for full schema.

## Installation

```bash
pnpm install @openrouter-crew/agent-memory
```

## Quick Start

### Store a Memory

```typescript
import { createMemoryService } from '@openrouter-crew/agent-memory';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const memoryService = createMemoryService(supabase);

await memoryService.store({
  crewId: 'crew-1',
  projectId: 'project-123',
  layer: 1,  // Observation
  content: 'User asked about TypeScript best practices',
  summary: 'TypeScript best practices inquiry',
  tags: ['typescript', 'performance'],
  contextKeywords: ['typescript', 'performance', 'best-practices'],
  retentionTier: 'standard'
});
```

### Retrieve Relevant Memories

```typescript
const result = await memoryService.retrieve({
  projectId: 'project-123',
  context: 'how to optimize TypeScript compilation',
  maxResults: 10,
  minConfidence: 0.1
});

console.log('Found:', result.memories.length);
console.log('Prompt section:');
console.log(result.promptSection);
```

### Report Outcome (Reinforcement)

```typescript
await memoryService.reportOutcome({
  sessionId: 'session-123',
  activatedNodeIds: ['node-1', 'node-2'],
  outcome: 'success',  // 'success' | 'failure' | 'partial'
  outcomeDelta: 0.05,
  crewMember: 'crew-1'
});
```

## Visualization Tools

### 1. Web Dashboard

Interactive React component for visualizing the memory system:

```typescript
import { MemoryDashboard } from '@openrouter-crew/agent-memory';

export default function Page() {
  return (
    <MemoryDashboard
      apiUrl="http://localhost:3333"
      projectId="project-123"
      autoRefresh={30000}  // Auto-refresh every 30s
    />
  );
}
```

**Features:**
- Memory nodes grouped by layer
- Real-time statistics (count, confidence, edge weights)
- Memory detail inspection with edges
- Test retrieval with custom contexts
- Auto-refresh capability

### 2. REST API Server

Start an Express server to access the memory system:

```typescript
import { createMemoryAPI } from '@openrouter-crew/agent-memory';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const server = createMemoryAPI(supabase, 3333);

// Server listens on http://localhost:3333
```

**Endpoints:**

- `GET /api/memories/project/:projectId` - List all memories
  - Query params: `layer` (1-4), `minConfidence` (0-1)

- `GET /api/memories/:memoryId` - Single memory with edges

- `GET /api/stats/project/:projectId` - Statistics and metrics

- `GET /api/retrieve?projectId=X&context=Y&maxResults=10` - Test retrieval

- `GET /health` - Server health check

### 3. CLI Inspector

Command-line tool for quick memory inspection:

```bash
# List all memories in a project
memory-cli list 550e8400-e29b-41d4-a716-446655440000

# List Layer 1 observations only
memory-cli list 550e8400-e29b-41d4-a716-446655440000 1

# Show detailed memory information
memory-cli show 660e8400-e29b-41d4-a716-446655440001

# View project statistics
memory-cli stats 550e8400-e29b-41d4-a716-446655440000

# Test retrieval with a context
memory-cli test 550e8400-e29b-41d4-a716-446655440000 "how to debug TypeScript"

# Generate detailed debug report
memory-cli debug 550e8400-e29b-41d4-a716-446655440000
```

**Environment:**

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-anon-key"
memory-cli list <projectId>
```

## Memory Layers

| Layer | Name | Purpose | Example |
|-------|------|---------|---------|
| 1 | Observation | Raw facts from direct interactions | "User asked about TypeScript performance" |
| 2 | Pattern | Regularities across observations | "Users frequently ask about optimization" |
| 3 | Strategy | Successful decision patterns | "Always start with profiling before optimizing" |
| 4 | Institutional | Cross-project generalizations | "Good TypeScript practices reduce bugs by 30%" |

## Retention Tiers

| Tier | Decay Rate | Purpose |
|------|-----------|---------|
| eternal | 0.0001/day | Permanent institutional knowledge |
| standard | 0.001/day | Normal project memories (default) |
| temporary | 0.01/day | Session-specific observations |
| session | 0.1/day | Current conversation only |

## Weight Formulas

### Retrieval Scoring

```
relevanceScore = keyword_overlap * 0.5
               + confidence_weight * 0.3
               + recency_bonus * 0.2

recency_bonus = exp(-daysSinceActivation / 7)  // 7-day half-life
```

### Edge Weights (Co-activation)

```
edge_weight = min(1.0, (co_activation_count / 10) * 0.8 + base_weight * 0.2)
```

### Confidence Updates (Reinforcement)

```
success:  delta = +0.05   (capped at 1.0)
failure:  delta = -0.10   (floored at 0.01)
partial:  delta = +0.01

new_confidence = clamp(old_confidence + delta, 0.01, 1.0)
```

### Decay Over Time

```
new_confidence = current_confidence * (1 - decay_rate * days_since_activation)
```

## Pattern Synthesis

Automatic layer-2 pattern creation when:
- Outcome is 'success'
- 3+ layer-1 observations were co-activated

New layer-2 node summarizes common keywords and tags from the observations.

## Integration with CrewCoordinator

To inject memory context into agent requests:

```typescript
// Before calling crew webhook
const { enrichedMessage, contextId } = await memoryService.enrichCrewRequest({
  projectId: 'project-123',
  crewMember: 'crew-1',
  message: 'How to optimize TypeScript?'
});

const response = await crew.call({
  message: enrichedMessage,  // Original message + memory context
  context: { memoryContextId: contextId }
});

// After response
await memoryService.reportOutcome({
  sessionId: request.sessionId,
  activatedNodeIds: /* from contextId lookup */,
  outcome: response.metadata?.success ? 'success' : 'failure',
  crewMember: response.crewMember
});
```

## Maintenance Tasks

### Apply Time-Based Decay

```typescript
// Decay all memories for a crew
const updatedCount = await memoryService.runDecay('crew-1');
console.log(`Updated ${updatedCount} nodes`);
```

### Hard-Delete Expired Memories

```typescript
// Permanently delete memories past recovery windows
const deletedCount = await memoryService.hardDeleteExpired();
console.log(`Deleted ${deletedCount} expired nodes`);
```

### Restore Soft-Deleted Memory

```typescript
await memoryService.restoreMemory('memory-id');
```

### Export for Backup

```typescript
const backup = await memoryService.exportMemories('project-123');
console.log(`Exported ${backup.nodes.length} nodes and ${backup.edges.length} edges`);
```

## Debugging

### Debug Report

Get a comprehensive summary of the memory system state:

```typescript
const report = await memoryService.getDebugReport('project-123');
console.log(report);
```

Output includes:
- Total memory count by layer
- Average confidence by tier
- Edge statistics
- Recent activations

### Verbose Retrieval Report

See detailed scoring for each retrieved memory:

```typescript
const memories = await memoryService.retrieve({...});
const report = memoryService.getPromptBuilder().buildVerbose(memories);
console.log(report);
```

## Performance Characteristics

- **Retrieval**: O(n) keyword filtering + O(log n) sorting
- **Storage**: O(1) node insert + O(m) edge creation (m = co-activated count)
- **Decay**: O(n) for full project, can be scheduled
- **Memory overhead**: ~200 bytes/node + 100 bytes/edge (index data)

## Testing

```bash
# Build the package
pnpm --filter @openrouter-crew/agent-memory build

# Type check
pnpm --filter @openrouter-crew/agent-memory type-check

# Run with Supabase local
supabase start
pnpm run cli -- list <projectId>
```

## References

- Geoffrey Hinton's neural network lectures (distributed representations, backpropagation)
- Hopfield networks (associative memory)
- Graph neural networks (message passing between nodes)

## License

Part of OpenRouter Crew Platform
