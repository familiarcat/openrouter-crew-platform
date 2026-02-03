# OpenRouter Crew Platform - Development & Deployment Guide

**Document Generated**: February 3, 2026 at 12:34 UTC
**Version**: 1.0.0
**Architecture**: Monorepo with Domain-Driven Design + Project Templates
**Last Updated**: 2026-02-03T12:34:00Z

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Workflow](#development-workflow)
3. [Domain Structure](#domain-structure)
4. [Project Creation & Management](#project-creation--management)
5. [Building & Testing](#building--testing)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Monitoring & Costs](#monitoring--costs)
8. [Troubleshooting](#troubleshooting)
9. [Team Collaboration](#team-collaboration)

---

## Architecture Overview

### Three-Domain System

The platform is organized around **Domain-Driven Design (DDD)** with AI-backed orchestration:

```
┌─────────────────────────────────────────────────────────────┐
│                   Unified Dashboard (Port 3000)             │
│         Central entry point for all domains                │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Product Factory  │ │ Alex-AI Universal│ │ Shared Services  │
│   (Port 3001)    │ │  (Port 3003)     │ │  (Infrastructure)│
├──────────────────┤ ├──────────────────┤ ├──────────────────┤
│ Project Mgmt     │ │ AI Coordination  │ │ Cost Tracking    │
│ Sprint Planning  │ │ n8n Integration  │ │ Crew Members     │
│ Feature Tracking │ │ OpenRouter Calls │ │ Workflows        │
├──────────────────┤ ├──────────────────┤ │ Schemas          │
│ Projects:        │ │ Backends:        │ │ UI Components    │
│ • dj-booking     │ │ • MCP Server     │ │ • Database       │
│ • custom-events  │ │ • n8n Workflows  │ │ • Supabase       │
│ • ... (template) │ │ • LLM Router     │ │ • Crew Registry  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Key Components

- **Product Factory Domain**: Project and sprint management system
  - Host for project templates (e.g., dj-booking)
  - Creates, manages, and tracks projects
  - Integrates with AI backend for planning

- **Alex-AI-Universal Domain**: AI coordination and optimization engine
  - n8n workflow orchestration
  - Cost optimization (25%+ reduction)
  - Crew member coordination (10 Star Trek agents)
  - OpenRouter API integration

- **Shared Infrastructure**: Cross-domain services
  - Cost tracking and budget enforcement
  - Crew coordination and workload management
  - Workflow templates and schemas
  - Shared UI components library

---

## Development Workflow

### For Teams

#### 1. **Local Setup** (First Time)

```bash
# Clone the repository
git clone https://github.com/openrouter-crew/platform.git
cd openrouter-crew-platform

# Install dependencies
pnpm install

# Start local development environment
./scripts/local-dev.sh

# Verify all services are running
# - Unified Dashboard: http://localhost:3000
# - Product Factory: http://localhost:3001
# - Alex-AI-Universal: http://localhost:3003
```

#### 2. **Feature Development Workflow**

```bash
# Step 1: Create feature branch
git checkout -b domain/product-factory/add-sprint-automation

# Step 2: Develop in domain
cd domains/product-factory/dashboard
pnpm dev

# Edit components, pages, or API routes
# Example: src/components/SprintAutomation.tsx

# Step 3: Test locally
# The dev server hot-reloads changes automatically

# Step 4: Commit changes (domain-scoped)
git add domains/product-factory/
git commit -m "feat(product-factory): add sprint automation"

# Step 5: If feature is successful and shareable,
# promote to shared infrastructure
./scripts/setup-project.sh product-factory dj-booking \
  my-new-project --interactive

# Or promote an existing component to shared:
cp domains/product-factory/dashboard/components/SprintAutomation.tsx \
   domains/shared/ui-components/src/SprintAutomation.tsx
```

#### 3. **Cross-Domain Collaboration**

When your domain feature needs to integrate with AI backend (alex-ai-universal):

```bash
# From Product Factory:
# Create an API endpoint that calls alex-ai-universal

# Example: domains/product-factory/dashboard/app/api/crew/consult/route.ts
import { crewCoordinator } from '@openrouter-crew/shared-crew-coordination';

export async function POST(req: Request) {
  const { task, crewMember } = await req.json();

  // alex-ai-universal handles:
  // 1. Cost estimation
  // 2. Model selection (Claude vs OpenRouter)
  // 3. Workflow execution via n8n
  // 4. Response caching and learning

  const response = await crewCoordinator
    .selectCrewMember('planning', ['sprint-management'])
    .executeTask(task);

  return Response.json(response);
}
```

---

## Domain Structure

### Product Factory (Project Management)

```
domains/product-factory/
├── dashboard/                 # Next.js UI (Port 3001)
│   ├── app/
│   │   ├── page.tsx          # Home
│   │   ├── projects/         # Project pages
│   │   ├── sprints/          # Sprint pages
│   │   ├── stories/          # Story pages
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── package.json          # npm dependencies
│
├── project-templates/        # Template library
│   └── dj-booking/           # Example template
│       ├── dashboard/        # Template UI
│       ├── agents/           # AI agents
│       ├── workflows/        # n8n workflows
│       ├── schema/           # Database schema
│       └── README.md
│
├── projects/                 # Created project instances
│   ├── my-event-space/       # Project created from dj-booking
│   │   ├── dashboard/        # Customized UI
│   │   ├── project.json      # Project metadata
│   │   └── .env.local        # Project-specific config
│   └── another-project/      # Another project instance
│
├── workflows/                # Domain-level n8n workflows
├── schema/                   # Database migrations
├── api/                      # Shared API utilities
└── README.md                 # Domain documentation
```

### Alex-AI-Universal (AI Backend)

```
domains/alex-ai-universal/
├── dashboard/                # AI management UI (Port 3003)
├── vscode-extension/         # VSCode IDE integration
│   ├── src/
│   │   ├── extension.ts      # Extension entry point
│   │   ├── commands/         # Command implementations
│   │   ├── providers/        # Tree view providers
│   │   └── services/         # CLI executor, status bar
│   └── package.json
│
├── workflows/                # n8n workflow definitions
│   ├── crew-coordination/    # Crew agent workflows
│   ├── cost-optimization/    # Cost analysis workflows
│   └── model-selection/      # LLM model routing
│
├── agents/                   # Crew member definitions
│   ├── picard.json           # Captain Picard (Commander)
│   ├── data.json             # Commander Data (Analyzer)
│   ├── riker.json            # Commander Riker (Strategist)
│   └── ... (7 more crew members)
│
├── schema/                   # Database for AI state
└── README.md
```

### Shared Infrastructure

```
domains/shared/
├── crew-coordination/        # Crew member coordination
│   ├── src/
│   │   ├── coordinator.ts    # Crew selection logic
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── members.ts        # Crew registry
│   └── package.json
│
├── cost-tracking/            # Cost analysis and optimization
│   ├── src/
│   │   ├── optimizer.ts      # Cost estimation
│   │   └── tracker.ts        # Cost recording
│   └── package.json
│
├── schemas/                  # Database types and migrations
│   ├── src/database.ts       # Type definitions
│   └── migrations/           # SQL migrations
│
├── ui-components/            # Shared React components
│   ├── src/
│   │   ├── Button.tsx
│   │   ├── SprintBoard.tsx
│   │   └── CostChart.tsx
│   └── package.json
│
├── workflows/                # Shared n8n workflows
└── openrouter-client/        # OpenRouter API client
```

---

## Project Creation & Management

### Creating a New Project

Projects are instances of templates. Use the DJ-Booking template as an example:

```bash
# 1. Create project from template
./scripts/setup-project.sh product-factory dj-booking my-event-space

# Output:
# ✅ PROJECT SETUP COMPLETE
# 📍 Project Location:
#    domains/product-factory/projects/my-event-space
# 📂 Directory Structure:
#    ├── dashboard/              # Next.js UI
#    ├── agents/                 # AI agents
#    ├── workflows/              # n8n workflows
#    ├── project.json            # Metadata
#    └── .env.local              # Config

# 2. Navigate to project
cd domains/product-factory/projects/my-event-space

# 3. Install dependencies
cd dashboard
pnpm install

# 4. Start development
pnpm dev   # Runs on Port 3004 (auto-assigned)

# 5. Update project configuration
# Edit: project.json (metadata)
# Edit: .env.local (environment variables)
```

### Project Configuration

Each project has a `project.json` file with metadata:

```json
{
  "name": "my-event-space",
  "title": "My Event Space",
  "description": "Event booking and management system",
  "domain": "product-factory",
  "template": "dj-booking",
  "owner": "your-email@company.com",
  "version": "1.0.0",
  "createdAt": "2026-02-03T12:34:00Z",
  "environment": "development",
  "budget": {
    "initial_usd": 1000,
    "current_usd": 150.25,
    "remaining_usd": 849.75
  },
  "status": "active",
  "settings": {
    "auto_scaling": true,
    "cost_optimization": true,
    "monitoring_enabled": true,
    "alerts_enabled": true
  }
}
```

---

## Building & Testing

### Build Commands

```bash
# Build all domains (uses Turbo for caching)
./scripts/build.sh all

# Build single domain
./scripts/build.sh product-factory
./scripts/build.sh alex-ai-universal

# Build project within domain
./scripts/build.sh product-factory:dj-booking

# Build with Turbo directly
pnpm turbo build
pnpm turbo build --filter="@openrouter-crew/product-factory-dashboard"
```

### Local Development

```bash
# Start all domains
./scripts/local-dev.sh

# Start specific domain
./scripts/local-dev.sh product-factory

# Start with verbose logging
./scripts/local-dev.sh all --verbose

# Start without UI dashboards
./scripts/local-dev.sh --no-ui

# Start specific project
cd domains/product-factory/projects/my-event-space/dashboard
PORT=3004 pnpm dev
```

### Testing

```bash
# Run all tests
pnpm turbo test

# Run tests for specific package
pnpm --filter "@openrouter-crew/product-factory-dashboard" test

# Run with coverage
pnpm turbo test -- --coverage

# Watch mode (for development)
pnpm --filter "@openrouter-crew/product-factory-dashboard" test --watch
```

---

## Deployment Pipeline

### Pre-Deployment Checklist

Before deploying to staging or production:

```bash
# 1. Ensure code is committed
git status

# 2. Run all tests
pnpm turbo test

# 3. Build locally to verify
./scripts/build.sh all

# 4. Check for TypeScript errors
pnpm turbo type-check

# 5. Lint code
pnpm turbo lint
```

### Staging Deployment

```bash
# Deploy entire domain to staging
./scripts/deploy-domain.sh product-factory staging

# Deploy specific project to staging
./scripts/deploy-project.sh product-factory dj-booking staging

# Output:
# ✅ PROJECT DEPLOYMENT COMPLETE: dj-booking → staging
# 🔗 Access:
#    • Project URL: https://dj-booking.staging.openrouter-crew.com
#    • Admin URL: https://admin.openrouter-crew.com/projects/dj-booking
#    • Metrics: https://metrics.openrouter-crew.com?project=dj-booking
```

### Production Deployment

```bash
# ⚠️  Requires manual confirmation
./scripts/deploy-domain.sh product-factory production

# For projects:
./scripts/deploy-project.sh product-factory dj-booking production

# Deployment process:
# 1. Build verification
# 2. Database migrations (with backup)
# 3. Cloud platform deployment (Vercel)
# 4. Health checks
# 5. Monitoring alerts enabled
```

### Zero-Downtime Updates

For production with zero downtime:

```bash
# 1. Deploy to staging first
./scripts/deploy-domain.sh product-factory staging

# 2. Run smoke tests
./scripts/test-deployment.sh product-factory staging

# 3. Switch traffic (gradual rollout)
# Using: infrastructure/traffic-router.ts
# - 10% traffic to new version
# - Monitor errors for 5 minutes
# - 50% traffic if errors < 0.1%
# - 100% traffic if all green

# 4. Monitor production
# - Cost tracking: Real-time metrics dashboard
# - Error rates: < 0.01%
# - Latency: < 200ms p95
```

---

## Integration: Product Factory + Alex-AI-Universal

The ideal workflow uses Product Factory for management and Alex-AI-Universal for intelligence:

### Scenario 1: AI-Powered Sprint Planning

```
User: Creates sprint with "AI suggest best tasks"
  ↓
Product Factory: Receives sprint creation request
  ↓
Alex-AI-Universal: Calls n8n → Cost Optimizer → OpenRouter
  - Model: Commander Data (analyzer)
  - Task: "Analyze project history and suggest optimal tasks"
  - Cost Check: ~$0.05 (within budget)
  ↓
OpenRouter: Returns optimized task suggestions
  ↓
Product Factory: Displays AI suggestions to user
  ↓
Cost Tracking: Records $0.05 to project budget
```

### Scenario 2: Automated Budget Alerts

```
Product Factory: Continuously monitors project spending
  ↓
Shared Cost Tracking: Checks remaining budget
  - Current: $850 / $1000
  - Threshold: 20% of budget
  ↓
Alert Triggered: "Budget 85% consumed"
  ↓
Alex-AI-Universal: Suggests cost optimizations
  - Switch expensive tasks to cheaper models
  - Batch similar tasks for efficiency
  ↓
Product Factory: Displays suggestions to project owner
```

### Scenario 3: VSCode Extension Integration

```
Developer: Types prompt in VSCode
  ↓
VSCode Extension: Captures prompt + selected code/files
  ↓
Alex-AI-Universal: Routes through n8n
  - Cost optimization applied
  - Model selection: Claude Sonnet or OpenRouter
  ↓
OpenRouter: Executes with cost ~$0.01-0.05
  ↓
VSCode Extension: Displays results in editor
  ↓
Cost Tracking: Logs cost to developer's project
```

---

## Monitoring & Costs

### Real-Time Monitoring

```bash
# View cost dashboard
open "https://metrics.openrouter-crew.com"

# Monitor specific project
./scripts/monitor-costs.sh product-factory:dj-booking

# Output:
# 📊 Cost Report - dj-booking
# Period: Last 24 hours
# Total: $47.23 / $1000.00 (4.7%)
#
# By Model:
#   Claude Sonnet: $30.15 (63.8%)
#   OpenRouter GPT-4: $12.50 (26.5%)
#   Gemini Flash: $4.58 (9.7%)
#
# By Crew Member:
#   Commander Data: $22.50 (47.7%)
#   Captain Picard: $18.73 (39.6%)
#   Lt. Worf: $6.00 (12.7%)
#
# Alerts:
#   ⚠️  Data consumption 18% above historical average
#   💡 Switch 30% of complex tasks to Gemini for 40% savings
```

### Cost Optimization Tips

1. **Model Selection**
   - Simple tasks → Gemini Flash ($0.0002/1M tokens) = 99% savings
   - Complex tasks → Claude Sonnet ($0.015/1M tokens) = best quality
   - Balance → OpenRouter options based on complexity

2. **Batch Processing**
   - Group similar tasks together
   - Reduces model initialization overhead
   - 10-20% cost savings

3. **Caching & Reuse**
   - alex-ai-universal learns from past tasks
   - Reuses answers for similar questions
   - Cache hit saves 95%+ of cost

---

## Troubleshooting

### Common Issues

**Issue**: Workspace doesn't recognize new packages
```bash
# Solution: Reinstall and rebuild
pnpm install
pnpm turbo build --filter=<package>
```

**Issue**: Port already in use
```bash
# Check what's running
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port manually
PORT=3005 pnpm dev
```

**Issue**: Build fails with missing dependencies
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm turbo build
```

**Issue**: n8n workflows not executing
```bash
# Check n8n service
curl http://localhost:5678/api/v1/health

# Check MCP server
curl http://localhost:5679/health

# View logs
tail -f /tmp/n8n-dev.log
tail -f /tmp/mcp-server-dev.log
```

---

## Team Collaboration

### Branch Strategy

```
main (production)
  └─ release/v1.2.0 (staging)
      ├─ domain/product-factory/feature-x
      ├─ domain/alex-ai-universal/feature-y
      └─ domain/shared/feature-z
```

### Code Review Process

1. **Create feature branch** from release branch
2. **Push and create PR** with description
3. **Automated checks**:
   - ✅ TypeScript compilation
   - ✅ Linting (ESLint, Prettier)
   - ✅ Tests pass
   - ✅ No security vulnerabilities
4. **Manual review**: 2 approvals required
5. **Merge to release branch**
6. **Deploy to staging** automatically
7. **Manual QA** in staging
8. **Merge to main** and deploy to production

### Communication

**Domain Owners**:
- Product Factory: alice@company.com
- Alex-AI-Universal: bob@company.com
- Shared Infrastructure: charlie@company.com

**Weekly Sync**: Fridays 10am PT
- Cost review
- Upcoming features
- Cross-domain coordination
- Performance metrics

---

## Ideal Development Sequence (Recommended)

1. **Monday**: Planning sprint with AI suggestions (alex-ai-universal)
2. **Tuesday-Thursday**: Development in domain with hot-reload
3. **Thursday**: Code review and merge to release
4. **Friday**: Staging deployment and QA verification
5. **Monday (next week)**: Production deployment after weekend stability check

---

## Additional Resources

- [Architecture Decision Records](docs/architecture/)
- [CLI Reference](docs/CLI_REFERENCE.md)
- [Cost Optimization Guide](docs/COST_OPTIMIZATION.md)
- [N8N Workflow Patterns](docs/N8N_CALLBACK_PATTERNS.md)
- [VSCode Extension Setup](domains/alex-ai-universal/vscode-extension/SETUP.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)

---

**Document Version**: 1.0.0
**Last Generated**: February 3, 2026 at 12:34 UTC
**Next Review**: February 10, 2026
