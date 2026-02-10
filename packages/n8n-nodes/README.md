# OpenRouter Crew Platform - N8N Custom Nodes

Custom n8n nodes for integrating CrewAPIClient into n8n workflows.

## Installation

1. Build the package:
```bash
npm install
npm run build
```

2. Copy the compiled files to your n8n custom nodes directory:
```bash
cp -r dist/* /path/to/.n8n/custom/
```

Or mount the package in your n8n docker-compose:
```yaml
volumes:
  - ./packages/n8n-nodes/dist:/home/node/.n8n/nodes/crew-platform:ro
```

## Nodes

### Crew Memory Node

Provides comprehensive memory management for n8n workflows.

**Operations:**
- **Create Memory** - Save crew memories with type and retention tier
- **List Memories** - Retrieve memories with filtering and retrieval policies
- **Search Memories** - Full-text search across crew memories
- **Update Memory** - Modify existing memory content
- **Delete Memory** - Soft delete with 30-day recovery window
- **Restore Memory** - Recover soft-deleted memories
- **Get Compliance Status** - Check GDPR compliance
- **Get Expiration Forecast** - Forecast memory expiration

**Input:**
- Supabase credentials (URL + API Key)
- Operation parameters (content, type, filters, etc.)
- Context (crew_id, user_id)

**Output:**
- Operation result as JSON
- Cost tracking information
- Success/error status

## Credentials

### Supabase API

Required credentials for all operations:
- **Supabase URL**: Your Supabase project URL
- **API Key**: Supabase anon or service role key

## Usage Example

```
Crew Memory (Create)
  - Operation: Create Memory
  - Content: "Important insight about the project"
  - Type: insight
  - Retention Tier: standard
  - Crew ID: crew_123
  - User ID: n8n_user
  ↓
  {
    "id": "mem_xxx",
    "content": "Important insight...",
    "type": "insight",
    "created_at": "2024-...",
    "cost": 0.0001
  }
```

## Semantic Parity

These nodes ensure that n8n workflows operate with the same API semantics as:
- CLI (`crew memory` commands)
- Web dashboard (React hooks)
- VSCode extension
- IDE integration

All operations:
- Use CrewAPIClient for consistency
- Have identical authorization rules
- Generate identical audit trails
- Charge identical costs
- Produce identical responses

## Development

Build TypeScript:
```bash
npm run build
```

Watch mode:
```bash
npm run dev
```

Lint:
```bash
npm run lint
```

## License

See [LICENSE](../../LICENSE)
