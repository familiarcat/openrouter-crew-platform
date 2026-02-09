# OpenRouter Crew Platform - Repository Manifest

**Repository**: openrouter-crew-platform
**Repository Type**: Monorepo (pnpm workspace)
**Architecture Pattern**: Domain-Driven Design (DDD) with 3 Bounded Contexts
**Date**: 2026-02-09

---

## 📊 Repository Structure (Depth ≤ 4)

```
openrouter-crew-platform/
├── apps/                          # Core Applications
│   ├── cli/                       # Command-line interface (crew orchestration)
│   │   ├── src/                   # TypeScript source
│   │   ├── __tests__/             # Tests
│   │   ├── package.json           # CLI package config
│   │   └── tsconfig.json          # TypeScript config
│   │
│   └── unified-dashboard/         # Next.js web dashboard (entry point)
│       ├── app/                   # Next.js App Router
│       ├── components/            # React components
│       ├── lib/                   # Utilities and helpers
│       ├── public/                # Static assets
│       ├── types/                 # TypeScript type definitions
│       ├── package.json           # Dashboard package config
│       ├── next.config.js         # Next.js configuration
│       ├── tailwind.config.js     # Tailwind CSS config
│       ├── postcss.config.js      # PostCSS config
│       ├── Dockerfile             # Docker build for dashboard
│       └── tsconfig.json          # TypeScript config
│
├── domains/                       # Domain-Driven Bounded Contexts
│   ├── product-factory/           # Sprint Planning & Project Management Domain
│   │   ├── dashboard/             # Next.js UI (port 3002)
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── api/                   # API endpoints for domain
│   │   ├── schema/                # Zod schemas & types
│   │   ├── types/                 # Domain-specific types
│   │   ├── workflows/             # N8N workflow definitions (54+ workflows)
│   │   ├── project-templates/     # Project templates (dj-booking, etc.)
│   │   │   └── dj-booking/
│   │   │       ├── dashboard/
│   │   │       ├── agents/        # 6 MCP agents
│   │   │       └── workflows/     # N8N workflows
│   │   └── projects/              # Project instances
│   │       └── test-event-venue/  # Example project instance
│   │
│   ├── alex-ai-universal/         # Universal Platform & AI Integration Domain
│   │   ├── dashboard/             # Next.js UI (port 3003)
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   ├── api/                   # API endpoints for domain
│   │   ├── knowledge/             # Knowledge base & RAG resources
│   │   ├── schema/                # Zod schemas & types
│   │   ├── types/                 # Domain-specific types
│   │   ├── vscode-extension/      # VSCode extension for domain
│   │   │   ├── src/               # Extension source code
│   │   │   ├── tests/             # Extension tests
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── workflows/             # N8N workflows (36+ workflows)
│   │
│   ├── vscode-extension/          # Global VSCode Extension Domain
│   │   ├── src/                   # Extension source code
│   │   ├── tests/                 # Extension tests
│   │   ├── dist/                  # Compiled extension
│   │   ├── package.json           # Extension package config
│   │   ├── jest.config.js         # Jest test config
│   │   └── tsconfig.json          # TypeScript config
│   │
│   └── shared/                    # Shared Infrastructure & Utilities
│       ├── crew-coordination/     # Crew orchestration library
│       │   ├── src/
│       │   ├── package.json
│       │   └── tsconfig.json
│       ├── cost-tracking/         # Cost analysis & tracking
│       │   ├── src/
│       │   ├── package.json
│       │   └── tsconfig.json
│       ├── schemas/               # Supabase-generated TypeScript types
│       │   ├── src/
│       │   ├── package.json
│       │   └── tsconfig.json
│       ├── openrouter-client/     # OpenRouter API client
│       │   ├── src/
│       │   └── package.json
│       ├── ui-components/         # Shared React components
│       │   ├── src/
│       │   └── package.json
│       └── workflows/             # Shared N8N workflows
│
├── configs/                       # Shared Build & Dev Configs
│   ├── eslint/
│   │   ├── base.js                # Base ESLint rules
│   │   └── next.js                # Next.js ESLint config
│   ├── jest/
│   │   └── base.config.js         # Jest base configuration
│   ├── prettier/
│   │   └── base.json              # Prettier formatting rules
│   └── tsconfig/
│       ├── base.json              # Base TypeScript config
│       └── node.json              # Node.js TypeScript config
│
├── scripts/                       # Automation & Utility Scripts
│   ├── agile/                     # Agile workflow automation
│   │   ├── create-feature.sh
│   │   ├── push-feature.sh
│   │   ├── create-story.sh
│   │   └── push-story.sh
│   ├── deploy/                    # Deployment scripts
│   │   ├── deploy-aws.sh
│   │   ├── deploy-domain.sh
│   │   └── deploy-project.sh
│   ├── domain/                    # Domain management
│   │   ├── create-domain.sh
│   │   ├── federate-feature.sh    # Promote features across layers
│   │   ├── migrate-to-ddd.sh
│   │   ├── sync-all.sh
│   │   └── import-existing-projects.sh
│   ├── n8n/                       # N8N workflow management
│   │   ├── sync-workflows.js
│   │   ├── backup-workflows-cli.sh
│   │   ├── upload-backup-to-rag.js
│   │   └── verify-webhooks.js
│   ├── secrets/                   # Secrets management
│   │   ├── sync-from-zshrc.sh
│   │   ├── setup-github-secrets.sh
│   │   └── sync-all-projects.sh
│   ├── git/                       # Git utilities
│   │   ├── setup-remote.js
│   │   └── verify-git-status.sh
│   ├── system/                    # System utilities
│   │   ├── fix-ts-references.js
│   │   └── sync-all.sh
│   ├── docker/                    # Docker management (directory)
│   ├── build.sh                   # Build all packages
│   ├── reset-build.sh             # Clean build artifacts
│   ├── local-dev.sh               # Local development setup
│   ├── organize-workspace.sh      # Workspace organization
│   └── setup-project.sh           # Initial project setup
│
├── infrastructure/                # Infrastructure setup (if any)
│
├── terraform/                     # Infrastructure as Code (AWS)
│   ├── main.tf                    # Terraform main config
│   ├── ec2.tf                     # EC2 instance configuration
│   ├── vpc.tf                     # VPC configuration
│   ├── security-groups.tf         # Security group rules
│   ├── iam.tf                     # IAM roles and policies
│   ├── variables.tf               # Input variables
│   ├── outputs.tf                 # Output values
│   ├── userdata.sh                # EC2 initialization script
│   ├── terraform.tfvars.example   # Example variables file
│   └── README.md                  # Terraform documentation
│
├── supabase/                      # Database Schema & Migrations
│   ├── config.toml                # Supabase configuration
│   └── migrations/                # SQL migration files
│       ├── 00001_unified_schema.sql
│       └── 20260203_create_workflow_requests_table.sql
│
├── docs/                          # Documentation
│   ├── DEPLOYMENT.md
│   ├── SETUP_GUIDE.md
│   ├── GETTING_STARTED.md
│   ├── CLI_REFERENCE.md
│   ├── MIGRATION_GUIDE.md
│   ├── SECRETS_SETUP.md
│   ├── N8N_CALLBACK_PATTERNS.md
│   ├── VSCODE_EXTENSION_ARCHITECTURE.md
│   ├── EXTENSION_FEATURES_IMPLEMENTATION.md
│   ├── WEBHOOK_CLIENT_CONSOLIDATION.md
│   ├── THREE_BODY_PHILOSOPHY.md
│   └── README.md
│
├── .github/                       # GitHub Configuration
│   └── workflows/
│       ├── deploy.yml             # AWS EC2 deployment workflow
│       └── secrets-audit.yml      # Secrets audit workflow
│
├── .milestones/                   # Milestone tracking
│
├── .claude/                       # Claude Code configuration & memory
│
├── .turbo/                        # Turbo cache directory
│
├── package.json                   # Root monorepo package config
├── pnpm-workspace.yaml            # pnpm workspace definition
├── pnpm-lock.yaml                 # Dependency lock file
├── tsconfig.json                  # Root TypeScript config
├── turbo.json                     # Turbo build configuration
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
│
├── Dockerfile                     # Root Docker build (monorepo)
├── docker-compose.yml             # Local development services
├── docker-compose.prod.yml        # Production deployment config
├── docker-compose.n8n.yml         # N8N-specific services
│
├── README.md                      # Project root README
└── [Phase documentation & status files]
    ├── DDD_ARCHITECTURE.md
    ├── IMPLEMENTATION_COMPLETE.md
    ├── UNIFIED_DASHBOARD_ARCHITECTURE.md
    └── [Additional phase completion documents]
```

---

## 🛠️ Technology Stack

### Package Manager & Build Orchestration
- **Package Manager**: pnpm (v9.12.3)
- **Build Orchestrator**: Turbo (v2.0.0)
- **Workspace**: pnpm workspace with 20+ packages

### Primary Language & Runtime
- **Language**: TypeScript (v5.9.3)
- **Target**: ES2020
- **Module System**: node16
- **Node.js**: >= 20.0.0

### Frontend Frameworks
- **React**: v18.x
- **Next.js**: v14.2.35
  - App Router (Next.js App Directory)
  - Server-side rendering
  - API Routes support
- **Styling**: Tailwind CSS (v3.4.1) + PostCSS

### Backend & Services
- **Supabase**: v2.72.9 (PostgreSQL + RealtimeDB + Auth)
- **n8n**: Workflow orchestration (Docker-based)
- **OpenRouter API**: AI model orchestration

### Database & ORM
- **Database**: PostgreSQL (via Supabase)
- **Type Generation**: Supabase CLI (generates TypeScript types)
- **Migrations**: SQL-based (in `supabase/migrations/`)

### Development Tools
- **Testing Framework**: Jest
- **Linting**: ESLint (v8.x)
- **Code Formatting**: Prettier (v3.1.0)
- **CLI Tools**:
  - Commander.js (CLI argument parsing)
  - Chalk (terminal colors)
  - Axios (HTTP client)
  - Table (terminal table formatting)

### Containerization & Orchestration
- **Container Platform**: Docker
- **Compose**: Docker Compose (3 configurations)
  - `docker-compose.yml` - Local development
  - `docker-compose.prod.yml` - Production
  - `docker-compose.n8n.yml` - N8N-specific services
- **Base Image**: node:20-slim
- **Caching**: Docker layer caching with pnpm store

### CI/CD & Deployment
- **CI/CD Provider**: GitHub Actions
- **Workflows**: 2 defined workflows
  - `deploy.yml` - AWS EC2 deployment pipeline
  - `secrets-audit.yml` - Security audit
- **Deployment Targets**:
  - AWS EC2 (primary)
  - AWS ECR (Docker image registry)
  - Vercel (Next.js deployment option)
- **Deployment Method**: SSM (AWS Systems Manager) for EC2 commands
- **Health Checks**: HTTP endpoint verification

### Infrastructure & Cloud
- **Cloud Provider**: AWS
- **IaC Tool**: Terraform (v0.x compatible)
- **AWS Services Used**:
  - EC2 (compute)
  - ECR (container registry)
  - VPC (networking)
  - Security Groups (firewall)
  - IAM (access control)
  - Systems Manager Session Manager (deployment)
  - SSM (remote command execution)
- **Region**: us-east-2 (configurable)

### VSCode Extension
- **Extension Type**: Native VSCode extension
- **Base Technology**: TypeScript
- **Testing**: Jest
- **Build**: TypeScript compiler

### Architecture & Design Patterns
- **Architectural Style**: Domain-Driven Design (DDD)
- **Bounded Contexts**: 3 domains
  1. **Product Factory** - Sprint planning and project management
  2. **Alex-AI-Universal** - Universal AI platform with VSCode integration
  3. **Vscode-Extension** - Global VSCode extension
  4. **Shared** - Cross-domain infrastructure
- **Feature Federation**: Layered promotion (domain → shared → global)

---

## 📦 Key Package Dependencies

### Root Workspace Dependencies
```
devDependencies:
  - @types/node: ^20.11.0
  - concurrently: ^8.2.2
  - turbo: ^2.0.0
  - typescript: ^5.9.3
  - tailwindcss: ^3.4.1

dependencies:
  - supabase: ^2.72.9
```

### Key Shared Libraries (Cross-Package)
- `@openrouter-crew/shared-schemas` - Supabase TypeScript types
- `@openrouter-crew/shared-cost-tracking` - Cost analysis
- `@openrouter-crew/shared-crew-coordination` - Crew orchestration
- `@openrouter-crew/shared-ui-components` - Shared React components

### Common Runtime Dependencies (per package)
- UI: React, Next.js, Lucide React, Tailwind CSS, clsx, tailwind-merge
- HTTP: Axios, @supabase/supabase-js
- CLI: Commander.js, Chalk, Table
- Utilities: dotenv, TSX (TypeScript executor)

---

## 🔄 Build Configuration

### Turbo Tasks Defined
```
build
  - dependsOn: ["^build"]
  - outputs: ["dist/**", ".next/**", "out/**", "build/**"]

dev
  - cache: false
  - persistent: true

lint
  - dependsOn: ["^build"]

type-check
  - dependsOn: ["^build"]

test
  - dependsOn: ["^build"]
  - outputs: ["coverage/**"]

clean
  - cache: false

format / format:check
  - outputs: []
```

### Global Dependencies (Turbo Cache)
- `**/.env`, `**/.env.local`
- `tsconfig.json`

---

## 🔌 Integration Points

### External APIs & Services
- **OpenRouter API**: AI model access
- **Supabase API**: PostgreSQL, Auth, Realtime
- **N8N**: Workflow orchestration
- **AWS Services**: EC2, ECR, IAM, VPC, SSM
- **GitHub API**: Workflow triggers, deployment info

### Webhook Support
- N8N webhook verification
- GitHub Actions webhooks
- Supabase realtime subscriptions

---

## 📋 CI/CD Pipeline Overview

### GitHub Actions Workflow: `deploy.yml`
**Trigger**: Manual (workflow_dispatch)

**Jobs**:
1. **pre-deployment** - Validation & checks
   - Type checking (`pnpm type-check`)
   - Linting (`pnpm lint`)
   - AWS credential validation
   - Image tag generation

2. **build** - Docker image build & push
   - AWS ECR login
   - Docker build (Next.js dashboard)
   - Image push to ECR
   - Image scan (async)

3. **deploy** - EC2 deployment via SSM
   - Container orchestration (docker-compose)
   - Environment configuration
   - Health verification

4. **verify** - Post-deployment checks
   - Dashboard health check (HTTP)
   - n8n service check
   - Supabase connectivity check

5. **notify** - Deployment notifications
   - Status reporting
   - Optional Slack/email integration

---

## 🔐 Secrets & Configuration

### GitHub Secrets Used
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_INSTANCE_ID`
- `EC2_PUBLIC_IP`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `N8N_BASE_URL`
- `N8N_API_KEY`

### Environment Variables (Application)
- `NODE_ENV`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 📊 Development Workflow Commands

### Root-Level Scripts
```bash
pnpm dev              # Dashboard + Supabase local
pnpm build            # Turbo build all packages
pnpm type-check       # TypeScript validation
pnpm lint             # ESLint all packages
pnpm test             # Jest tests
pnpm deploy:local     # Docker Compose up
pnpm docker:down      # Stop containers
pnpm n8n:sync         # Sync N8N workflows
pnpm setup            # Initial setup
```

### Domain-Specific Development
```bash
cd domains/product-factory/dashboard && pnpm dev    # Port 3002
cd domains/alex-ai-universal/dashboard && pnpm dev  # Port 3003
cd apps/unified-dashboard && pnpm dev               # Port 3000
```

---

## ⚠️ Special Considerations

### Monorepo Structure
- Uses pnpm workspace for efficient dependency sharing
- Turbo for incremental builds and caching
- TypeScript project references for type checking

### Database
- Supabase migrations in `supabase/migrations/`
- Type generation: `supabase gen types`
- Local Supabase CLI support (`supabase start/stop`)

### Docker
- Multi-stage builds for optimization
- pnpm layer caching via `--mount=type=cache`
- Separate Dockerfiles per application

### CI/CD
- Manual deployment trigger (cost protection)
- AWS ECR for image registry
- SSM for secure EC2 command execution
- Pre-deployment validation required

---

## 🔍 Notable Files & Configuration

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace package definitions |
| `turbo.json` | Build orchestration config |
| `tsconfig.json` | Root TypeScript references |
| `.github/workflows/deploy.yml` | AWS EC2 deployment pipeline |
| `terraform/` | AWS infrastructure definition |
| `supabase/migrations/` | Database schema migrations |
| `scripts/` | Automation and deployment scripts |
| `.env` | Local environment configuration |

---

## 📈 Workspace Composition

**Total Packages**: 20+ managed packages
- **Apps**: 2 (unified-dashboard, CLI)
- **Domains**: 4 (product-factory, alex-ai-universal, vscode-extension, shared)
- **Shared Libraries**: 6 (crew-coordination, cost-tracking, schemas, openrouter-client, ui-components, workflows)
- **Configuration Packages**: 1 (configs/)

---

**Generated**: 2026-02-09
**Repository**: https://github.com/bradygeorgen/openrouter-crew-platform.git
**Current Branch**: milestone/n8n-sync-testing-20260202-174222
