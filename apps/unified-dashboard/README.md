# Unified Dashboard

Unified project management and cost optimization platform for OpenRouter Crew.

## Features

- **Project Management**: Create and manage projects with status tracking
- **Real-time Cost Tracking**: Live OpenRouter API usage monitoring via Supabase
- **Dashboard Analytics**: Visualize costs, usage patterns, and project metrics
- **Crew Management**: Assign and track crew member activities
- **n8n Integration**: Manage and monitor workflow executions

## Tech Stack

- **Framework**: Next.js 14.2.16 with App Router
- **Database**: Supabase (PostgreSQL + real-time subscriptions)
- **Styling**: Tailwind CSS with CSS variables
- **State**: React hooks with real-time sync
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.12.3+
- Supabase instance (local or cloud)

### Installation

```bash
# From project root
pnpm install

# Generate environment file
cp apps/unified-dashboard/.env.local.example apps/unified-dashboard/.env.local

# Start local Supabase
supabase start

# Start dashboard
pnpm --filter @openrouter-crew/unified-dashboard dev
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your-key

# n8n
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-api-key
```

## Development

```bash
# Run dev server
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
apps/unified-dashboard/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Dashboard homepage
│   ├── globals.css          # Global styles & CSS variables
│   └── api/
│       └── health/
│           └── route.ts     # Health check endpoint
├── components/              # React components (future)
├── lib/
│   ├── supabase.ts         # Supabase clients
│   └── utils.ts            # Utility functions
├── Dockerfile              # Multi-stage production build
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Features Implemented

### Phase 1 (MVP) ✅
- [x] Project listing with status badges
- [x] Real-time cost tracking
- [x] Supabase integration with real-time subscriptions
- [x] Basic dashboard with stats overview
- [x] Recent API usage table
- [x] Health check endpoint
- [x] Responsive design with Tailwind
- [x] Production Docker build

### Phase 2 (Planned)
- [ ] Project CRUD operations
- [ ] n8n workflow visualization
- [ ] Crew member management
- [ ] Cost analytics charts
- [ ] Project detail pages
- [ ] Settings & preferences

### Phase 3 (Future)
- [ ] Advanced visualizations (Cytoscape, Mermaid)
- [ ] Workflow editor
- [ ] Multi-agent coordination
- [ ] Learning analytics (RAG)
- [ ] Command palette

## Database Schema

The dashboard uses the unified schema from `packages/shared-schemas`. Key tables:

- `projects` - Project registry with status and budget
- `llm_usage_events` - OpenRouter API usage tracking
- `crew_members` - Crew definitions
- `workflows` - n8n workflow registry
- `workflow_executions` - Execution logs

## API Routes

- `GET /api/health` - Health check for load balancers

## Deployment

### Docker Build

```bash
# Build image
docker build -t openrouter-crew-dashboard \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -f apps/unified-dashboard/Dockerfile .

# Run container
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e OPENROUTER_API_KEY=your-key \
  openrouter-crew-dashboard
```

### Production Deployment

See [DEPLOYMENT.md](../../docs/DEPLOYMENT.md) for complete deployment guide.

```bash
# Via GitHub Actions
- Go to Actions → Deploy to AWS EC2
- Click "Run workflow"
- Select environment (staging/production)
```

## Troubleshooting

### "supabaseUrl is required"

Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

### Real-time updates not working

Check Supabase real-time is enabled:
```sql
ALTER TABLE llm_usage_events REPLICA IDENTITY FULL;
```

### Build fails with module resolution errors

Ensure packages are built first:
```bash
pnpm -r build
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with conventional commits: `feat: add new feature`
4. Push and create pull request

## License

MIT

## Support

- Documentation: `/docs/`
- Issues: https://github.com/your-org/openrouter-crew-platform/issues
