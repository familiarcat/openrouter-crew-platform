# Setup Guide: OpenRouter Crew Platform

**Complete guide to getting the unified platform running locally and deploying to production.**

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 20+** - `node --version`
- ✅ **pnpm 9+** - `pnpm --version` (install: `npm install -g pnpm`)
- ✅ **Docker Desktop** - Running and accessible
- ✅ **Supabase CLI** - `supabase --version` (install: `brew install supabase/tap/supabase`)
- ✅ **Git** - For version control
- ✅ **n8n** (optional for local) - Or use remote n8n instance

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd openrouter-crew-platform

# 2. Run the setup script (handles everything)
pnpm setup

# 3. Start all services
pnpm dev

# 4. Open the dashboard
open http://localhost:3000
```

That's it! The setup script will:
- Install all dependencies
- Sync secrets from `~/.zshrc`
- Start local Supabase
- Apply database migrations
- Seed test data

## Detailed Setup

### Step 1: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This installs dependencies for:
# - Root workspace
# - All apps (dashboard, dj-booking, product-factory, cli)
# - All packages (crew-core, cost-tracking, shared-schemas, n8n-workflows)
```

### Step 2: Configure Secrets

#### Option A: Auto-sync from ~/.zshrc (Recommended)

```bash
# Add secrets to your shell configuration
nano ~/.zshrc

# Add these lines:
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export OPENROUTER_API_KEY="sk-or-v1-your-key"
export N8N_BASE_URL="https://n8n.yourdomain.com"
export N8N_API_KEY="your-n8n-api-key"

# Reload shell config
source ~/.zshrc

# Sync to project
pnpm secrets:sync
```

#### Option B: Manual .env.local

```bash
# Copy example files
cp .env.example .env.local
cp apps/unified-dashboard/.env.example apps/unified-dashboard/.env.local

# Edit with your values
nano .env.local
```

### Step 3: Start Local Supabase

```bash
# Start local Supabase (PostgreSQL + Studio + APIs)
pnpm supabase:start

# This starts:
# - PostgreSQL: localhost:54322
# - API: localhost:54321
# - Studio: localhost:54323
# - Inbucket (emails): localhost:54324

# View status
pnpm supabase:status
```

**Expected Output:**
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Apply Database Migrations

```bash
# Apply the unified schema
pnpm db:migrate

# This creates:
# - projects table
# - llm_usage_events table
# - crew_members table (with 10 crew members)
# - crew_memories table
# - workflows table
# - workflow_executions table
# - Project-specific tables (dj_events, product_sprints, etc.)
```

### Step 5: Seed Test Data (Optional)

```bash
# Seed sample projects and usage data
pnpm db:seed

# This creates:
# - 3 sample projects (DJ booking, Product factory, AI assistant)
# - 10 crew members
# - Sample usage events
# - Sample workflows
```

### Step 6: Start Development Server

#### Option A: All Services via pnpm

```bash
# Start dashboard + Supabase (recommended for development)
pnpm dev

# Dashboard will be available at:
# http://localhost:3000
```

#### Option B: All Services via Docker

```bash
# Start everything in Docker
pnpm docker:up

# This starts:
# - Supabase (PostgreSQL + Studio)
# - n8n
# - Dashboard
# - Redis

# View logs
pnpm docker:logs

# Stop all services
pnpm docker:down
```

### Step 7: Verify Installation

Open your browser and check:

1. **Dashboard**: http://localhost:3000
   - Should show unified dashboard
   - Project selector
   - Cost tracking

2. **Supabase Studio**: http://localhost:54323
   - Browse tables
   - View data
   - Run queries

3. **n8n** (if local): http://localhost:5678
   - Username: admin (or N8N_USER)
   - Password: admin (or N8N_PASSWORD)
   - View workflows

## Project Structure Tour

```
openrouter-crew-platform/
├── apps/
│   ├── unified-dashboard/     # Main dashboard (Next.js)
│   │   ├── app/               # Next.js app router
│   │   ├── lib/               # Utilities and clients
│   │   ├── components/        # React components
│   │   └── package.json
│   │
│   ├── dj-booking/            # DJ event management (future)
│   ├── product-factory/       # Product ideation (future)
│   └── cli/                   # CLI interface (future)
│
├── packages/
│   ├── crew-core/             # Crew member logic
│   │   └── src/
│   │       ├── members/       # Individual crew definitions
│   │       └── coordinator.ts # Crew coordination
│   │
│   ├── cost-tracking/         # OpenRouter cost optimization
│   │   └── src/
│   │       ├── optimizer.ts   # Cost optimization logic
│   │       └── tracker.ts     # Usage tracking
│   │
│   ├── shared-schemas/        # TypeScript types from Supabase
│   │   └── src/
│   │       └── database.ts    # Generated types
│   │
│   └── n8n-workflows/         # Workflow definitions
│       ├── subflows/          # 8 cost optimization subflows
│       ├── crew/              # 10 crew member workflows
│       └── projects/          # Project-specific workflows
│
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── seed.sql               # Test data
│   └── config.toml            # Local Supabase config
│
├── scripts/
│   ├── deploy/                # Deployment automation
│   ├── n8n/                   # Workflow sync
│   ├── secrets/               # Secret management
│   ├── milestone/             # GitFlow helpers
│   └── docker/                # Docker utilities
│
└── infrastructure/
    └── terraform/             # AWS infrastructure
```

## Development Workflow

### Creating a New Feature

```bash
# 1. Create milestone branch
pnpm milestone:create "my-feature"

# 2. Make your changes
cd apps/unified-dashboard
# ... edit files ...

# 3. Commit frequently
git add .
git commit -m "feat: add new dashboard widget"

# 4. Push to remote
pnpm milestone:push

# 5. When complete, merge to main
git checkout main
git merge milestone/my-feature-<timestamp>
git push
```

### Working with Supabase

```bash
# Start local Supabase
pnpm supabase:start

# Create new migration
supabase migration new my_migration_name

# Edit migration file
nano supabase/migrations/<timestamp>_my_migration_name.sql

# Apply migration
pnpm db:migrate

# Reset database (destructive!)
pnpm supabase:reset
```

### Syncing n8n Workflows

```bash
# Export workflows FROM n8n TO git
pnpm n8n:export

# Import workflows FROM git TO n8n
pnpm n8n:sync

# Activate all workflows in n8n
pnpm n8n:activate
```

### Testing Cost Optimization

```bash
# 1. Create a test project
# Visit http://localhost:54323
# Insert into projects table

# 2. Trigger a crew workflow via n8n webhook
curl -X POST http://localhost:5678/webhook/crew-captain-picard \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "your-project-uuid",
    "message": "Analyze this code for improvements"
  }'

# 3. View cost in dashboard
# Visit http://localhost:3000
# Should see new entry in real-time
```

## Troubleshooting

### Issue: Supabase won't start

```bash
# Check Docker is running
docker ps

# Clean up old containers
pnpm supabase:stop
pnpm supabase:start

# If still failing, check logs
docker logs supabase_db_<project>
```

### Issue: Secrets not syncing

```bash
# Verify secrets in shell config
cat ~/.zshrc | grep -E "SUPABASE|OPENROUTER|N8N"

# Reload shell
source ~/.zshrc

# Re-sync
pnpm secrets:sync

# Validate
pnpm secrets:validate
```

### Issue: n8n webhooks not working

```bash
# Check n8n is accessible
curl http://localhost:5678/healthz

# Check webhook URLs are configured
cat .env.local | grep N8N_CREW

# Activate workflows
pnpm n8n:activate

# Check n8n logs
pnpm docker:logs n8n
```

### Issue: Dashboard shows "No projects"

```bash
# Seed test data
pnpm db:seed

# Or manually create project
# Visit http://localhost:54323
# Go to Table Editor → projects
# Insert new row
```

### Issue: TypeScript errors

```bash
# Regenerate Supabase types
supabase gen types typescript --local > packages/shared-schemas/src/database.ts

# Type check all packages
pnpm type-check

# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Issue: Port conflicts

If ports are already in use:

```bash
# Check what's using ports
lsof -i :3000  # Dashboard
lsof -i :5678  # n8n
lsof -i :54321 # Supabase API
lsof -i :54322 # Supabase DB

# Kill process
kill -9 <PID>

# Or change ports in .env.local
```

## Production Deployment

### Deploy to AWS (Terraform)

```bash
# 1. Configure AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="us-east-2"

# 2. Initialize Terraform
cd infrastructure/terraform
terraform init

# 3. Review plan
terraform plan

# 4. Apply infrastructure
terraform apply

# 5. Deploy applications
pnpm deploy:aws
```

### Deploy Dashboard to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd apps/unified-dashboard
vercel

# 3. Set environment variables in Vercel dashboard
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENROUTER_API_KEY
```

## Next Steps

1. **Explore the Dashboard** - http://localhost:3000
2. **Review Database Schema** - http://localhost:54323
3. **Read Integration Plan** - [docs/INTEGRATION_PLAN.md](INTEGRATION_PLAN.md)
4. **Configure n8n Workflows** - See [docs/N8N_WORKFLOWS.md](N8N_WORKFLOWS.md)
5. **Join Development** - Create a milestone branch and start coding!

## Support

- **Documentation**: Check [docs/](../docs/) directory
- **Issues**: Open an issue on GitHub
- **Questions**: Review [docs/FAQ.md](FAQ.md)

---

**Ready to build?** Start with: `pnpm setup && pnpm dev`
