# Unified CrewAPIClient

**Single source of truth for all Crew Platform surfaces (IDE, CLI, Web, n8n)**

## Overview

The `CrewAPIClient` is a unified API client that provides consistent, deterministic operations across all surfaces of the Crew Platform:

- **IDE**: VSCode extension
- **CLI**: Command-line interface
- **Web**: Unified dashboard
- **n8n**: Workflow automation

Every operation follows the pattern:
```
Intent → Authorization → Execution → Logging → Response
```

## Core Principles

1. **Single API**: All surfaces use `CrewAPIClient`, never bypass it
2. **Semantic Parity**: Same input → same output across all surfaces
3. **Authorization Parity**: Same permission rules everywhere
4. **Audit Parity**: Identical audit trails (except surface field)
5. **Cost Parity**: Same cost across all surfaces
6. **Determinism**: Identical operations produce identical results

## Installation

```bash
npm install @openrouter-crew/crew-api-client
```

## Usage

### Basic Setup

```typescript
import { CrewAPIClient } from '@openrouter-crew/crew-api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const client = new CrewAPIClient(supabase);
```

### Example: Create Memory

```typescript
const response = await client.create_memory(
  {
    content: "User story about mobile onboarding",
    type: "story",
    retention_tier: "standard",
    tags: ["mobile", "onboarding"]
  },
  {
    user_id: "user_123",
    crew_id: "crew_abc",
    role: "member",
    surface: "cli"
  }
);

console.log(response.id); // Memory ID
console.log(response.cost); // Cost in USD
```

### Example: Retrieve Memories

```typescript
const result = await client.retrieve_memories(
  {
    crew_id: "crew_abc",
    filter: "onboarding",
    policy: "task-specific",
    limit: 10
  },
  {
    user_id: "user_123",
    crew_id: "crew_abc",
    role: "member",
    surface: "web"
  }
);

console.log(result.memories); // Array of memories
console.log(result.total); // Total count
console.log(result.cost); // Total cost
```

### Example: Execute Crew

```typescript
const execution = await client.execute_crew(
  {
    crew_id: "crew_abc",
    input: "Generate a story for the mobile feature",
    budget: 0.10
  },
  {
    user_id: "user_123",
    crew_id: "crew_abc",
    role: "member",
    surface: "n8n"
  }
);

console.log(execution.output); // Generated output
console.log(execution.cost); // Actual cost
```

## API Operations

### Memory Operations

- `create_memory(params, context)` - Create a new memory
- `retrieve_memories(params, context)` - Retrieve memories with filtering
- `update_memory(params, context)` - Update existing memory
- `delete_memory(params, context)` - Soft delete (recoverable for 30 days)
- `restore_memory(params, context)` - Restore soft-deleted memory

### Crew Operations

- `execute_crew(params, context)` - Execute a crew with input

### Audit Operations

- `getAuditLog(crew_id)` - Get audit trail for crew

## Authorization

All operations enforce role-based access control:

- **Owner**: Full access (create, update, delete, manage crew)
- **Member**: Read + write (create, update, execute crew)
- **Viewer**: Read-only (retrieve, search, view status)

Attempting an unauthorized action raises `UnauthorizedError`.

## Error Handling

```typescript
import { UnauthorizedError, OperationError } from '@openrouter-crew/crew-api-client';

try {
  await client.delete_memory({ id: "mem_123" }, context);
} catch (error) {
  if (error instanceof UnauthorizedError) {
    console.log("User not authorized");
  } else if (error instanceof OperationError) {
    console.log(`Operation failed: ${error.message}`);
    console.log(`Code: ${error.code}`);
  }
}
```

## Audit Logging

Every operation is logged to an immutable audit trail:

```typescript
const logs = await client.getAuditLog("crew_abc");

logs.forEach((entry) => {
  console.log(`${entry.action} by ${entry.user_id} on ${entry.surface}`);
  console.log(`Cost: $${entry.metadata.cost}`);
  console.log(`Duration: ${entry.metadata.duration_ms}ms`);
});
```

## Cost Tracking

Operations have transparent cost tracking:

```typescript
const response = await client.create_memory(
  { content: "...", type: "story" },
  context
);

console.log(`Cost: $${response.cost}`);
console.log(`Per character: $${response.cost / params.content.length}`);
```

## Surface Integration Examples

### IDE (VSCode Extension)

```typescript
// vscode-extension/src/commands/crew.ts
const client = new CrewAPIClient(supabaseClient);

const response = await client.retrieve_memories(
  { crew_id: crewId, filter: query },
  { user_id: userId, crew_id: crewId, role: "member", surface: "ide" }
);
```

### CLI

```typescript
// cli/src/commands/memory.ts
const client = new CrewAPIClient(supabaseClient);

const response = await client.create_memory(
  params,
  { user_id: userId, crew_id: crewId, role: "member", surface: "cli" }
);
```

### Web

```typescript
// unified-dashboard/lib/api.ts
const client = new CrewAPIClient(supabaseClient);

const response = await client.execute_crew(
  { crew_id, input },
  { user_id, crew_id, role: "member", surface: "web" }
);
```

### n8n

```typescript
// packages/n8n-nodes/CrewMemoryNode.ts
const client = new CrewAPIClient(supabaseClient);

const response = await client.create_memory(
  nodeInput,
  { user_id, crew_id, role: "member", surface: "n8n" }
);
```

## Testing

```bash
npm test
```

## Development

```bash
npm run dev      # Watch mode
npm run build    # Build
npm run lint     # Lint
```

## Documentation

- [Surface Parity Contract](../../docs/surface-parity.md)
- [Authorization Model](../../docs/authorization.md)
- [Audit Trail Specification](../../docs/audit-trail.md)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

See [LICENSE](../../LICENSE)
