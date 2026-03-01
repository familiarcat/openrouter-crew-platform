# Memory System - Quick Start Guide

🧠 Your weighted memory interpolation system is ready to use! Here's how to get started.

## What You Have

✅ **Complete Memory System Implementation**
- Neural network-inspired architecture with Hinton concepts
- 4-layer hierarchical memory (Observations → Patterns → Strategies → Institutional)
- Weighted graph with confidence decay
- Reinforcement learning from outcomes
- Keyword-based retrieval (zero API cost)

✅ **Three Visualization Tools**
1. **Standalone HTML Dashboard** - No dependencies, works instantly
2. **React Component Dashboard** - For integration into Next.js apps
3. **CLI Inspector Tool** - Command-line inspection and testing

✅ **REST API Server** - Complete Express API for accessing the system

## Getting Started (5 minutes)

### 1. Start the Memory API Server

```typescript
import { createMemoryAPI } from '@openrouter-crew/agent-memory';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const server = createMemoryAPI(supabase, 3333);

// Visit: http://localhost:3333/?projectId=your-project-id
```

### 2. View the Dashboard

**Option A: Standalone HTML** (No React needed)
```
http://localhost:3333/?projectId=550e8400-e29b-41d4-a716-446655440000
```

**Option B: React Component** (In your Next.js app)
```typescript
import { MemoryDashboard } from '@openrouter-crew/agent-memory/dashboard';

export default function Page() {
  return <MemoryDashboard projectId="..." autoRefresh={30000} />;
}
```

### 3. Use the CLI Inspector

```bash
# Build it first
pnpm --filter @openrouter-crew/agent-memory build

# List memories
pnpm --filter @openrouter-crew/agent-memory cli list 550e8400-e29b-41d4-a716-446655440000

# Test retrieval
pnpm --filter @openrouter-crew/agent-memory cli test 550e8400-... "how to optimize TypeScript?"
```

## Core Workflow

```typescript
const memoryService = createMemoryService(supabase);

// 1. Store observations
await memoryService.store({
  crewId: 'agent-1',
  projectId: 'project-1',
  layer: 1,
  content: 'User asked about TypeScript performance',
  summary: 'Performance inquiry',
  contextKeywords: ['typescript', 'performance']
});

// 2. Retrieve relevant memories before agent call
const memories = await memoryService.retrieve({
  projectId: 'project-1',
  context: 'How to optimize TypeScript?',
  maxResults: 5
});

// 3. Inject memories into prompt
const enrichedPrompt = memories.promptSection + '\n\n' + userMessage;

// 4. Report outcome to reinforce learning
await memoryService.reportOutcome({
  sessionId: 'session-123',
  activatedNodeIds: memories.memories.map(m => m.node.id),
  outcome: 'success',  // success | failure | partial
  crewMember: 'agent-1'
});
```

## Dashboard Features

### Web Dashboard
- 📊 Real-time statistics (node count, confidence levels, edge weights)
- 🔍 Search/test retrieval with custom contexts
- 💡 Memory detail inspection with edge information
- 📈 Layer-wise filtering and visualization
- ⏱️ Auto-refresh (configurable)

### CLI Inspector
```bash
memory-cli list <projectId> [layer]     # List memories
memory-cli show <memoryId>              # Show details
memory-cli stats <projectId>            # Show statistics
memory-cli test <projectId> <context>   # Test retrieval
memory-cli debug <projectId>            # Full debug report
```

## Integration with CrewCoordinator

```typescript
// Before calling crew
const { enrichedMessage, contextId } = await memoryService.enrichCrewRequest({
  projectId: 'project-1',
  crewMember: 'agent-1',
  message: userMessage
});

// Call crew with enriched message
const response = await crew.call({
  message: enrichedMessage,
  context: { memoryContextId: contextId }
});

// After response
await memoryService.reportOutcome({
  sessionId: contextId,
  activatedNodeIds: [...],
  outcome: response.success ? 'success' : 'failure',
  crewMember: response.crewMember
});

// Store response as observation
await memoryService.store({
  crewId: response.crewMember,
  projectId: 'project-1',
  layer: 1,
  content: response.content,
  summary: response.content.slice(0, 200),
  retentionTier: 'standard'
});
```

## Memory Layers

| Layer | Purpose | Example |
|-------|---------|---------|
| 1 | **Observations** - Raw facts from interactions | "User asked about TypeScript performance" |
| 2 | **Patterns** - Regularities across observations | "Users often ask about optimization before profiling" |
| 3 | **Strategies** - Successful decision patterns | "Always profile first, then optimize build tools" |
| 4 | **Institutional** - Cross-project knowledge | "Good TypeScript practices reduce bugs 30%" |

## Performance Characteristics

- **Retrieval**: O(n) keyword filtering + O(log n) sorting
- **Storage**: O(1) node insert + O(m) edge creation
- **Memory**: ~200 bytes/node + 100 bytes/edge
- **Decay**: O(n) per run (can be scheduled)

## Configuration

### Retention Tiers

```typescript
{
  eternal: 0.0001/day,    // Permanent institutional knowledge
  standard: 0.001/day,    // Default for project memories
  temporary: 0.01/day,    // Session-specific observations
  session: 0.1/day        // Current conversation only
}
```

### Decay Schedule

Run decay regularly:
```typescript
// Daily maintenance job
setInterval(async () => {
  const updated = await memoryService.runDecay(crewId);
  console.log(`Updated ${updated} memories`);
}, 24 * 60 * 60 * 1000); // Daily
```

## Files Reference

```
domains/shared/agent-memory/
├── src/
│   ├── memory-service.ts      ← Main facade (start here!)
│   ├── memory-api.ts          ← Express server
│   ├── cli.ts                 ← CLI inspector
│   ├── dashboard.tsx          ← React component (optional)
│   ├── dashboard.html         ← Standalone HTML dashboard
│   ├── interpolator.ts        ← Retrieval engine
│   ├── reinforcer.ts          ← Reinforcement learning
│   ├── decay-manager.ts       ← Confidence decay
│   ├── memory-graph.ts        ← Database CRUD
│   ├── context-encoder.ts     ← Feature extraction
│   └── prompt-builder.ts      ← Prompt formatting
├── README.md                  ← Detailed documentation
├── QUICKSTART.md              ← This file
├── example.ts                 ← Complete example
└── package.json
```

## Next Steps

1. **Apply SQL migration**
   ```bash
   supabase db push domains/shared/agent-memory/supabase/migrations/20260301_agent_memory_weights.sql
   ```

2. **Start the API server**
   ```typescript
   const server = createMemoryAPI(supabase, 3333);
   ```

3. **Open the dashboard**
   Visit: `http://localhost:3333/?projectId=your-project-id`

4. **Integrate with CrewCoordinator**
   Add memory enrichment before crew calls and outcome reporting after

5. **Test with BarItalia project**
   Run a crew with memory system enabled to see learning in action

## Troubleshooting

**"Cannot find module 'express'"**
- Run `pnpm install` to install dependencies

**Dashboard shows "No memories found"**
- Check that the project ID is correct
- Verify memories are stored in the database
- Check Supabase connection

**Retrieval returns no results**
- Ensure context keywords match memory keywords
- Check minimum confidence thresholds
- Try the `memory-cli test` command to debug

**Build fails**
- Run `pnpm install` to update dependencies
- Check TypeScript version: `tsc --version`

## Support

For detailed documentation, see `README.md`

For complete working example, see `example.ts`

For implementation details, explore the source files in `src/`
