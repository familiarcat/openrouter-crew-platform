# OpenRouter Crew Platform — Codebase Summary
**Repo:** `github.com/familiarcat/openrouter-crew-platform`
**Reviewed:** April 2026 | **Status:** Active Development | **Platform Lead:** @familiarcat

---

## Executive Summary

A TypeScript monorepo purpose-built to demonstrate **AI orchestration profitability** — generating complete local business packages (website, business plan, financial projections, marketing strategy) for under **$1.50 per execution**, with a projected 500x+ ROI at scale.

The platform combines:
- **OpenRouter** for cost-optimized multi-model LLM routing
- **Supabase** for persistent memory, auth, and PostgreSQL data
- **n8n** for workflow automation outside the code layer
- **Turborepo + pnpm workspaces** for monorepo orchestration
- A **VSCode extension** for developer-facing IDE integration

**Scale:** 2,000+ files · 500K+ lines · 27 packages · 5 DDD domains
**Languages:** TypeScript 70% · HTML 10% · Shell 9% · PLpgSQL 4.5% · JS/CSS remainder

---

## Monorepo Architecture

The repo enforces a strict **Domain-Driven Design (DDD)** separation between deployable experiences and logical capabilities.

```
openrouter-crew-platform/
├── apps/                        # Deployable consumers (depend on domains)
│   ├── unified-dashboard/       # Next.js management console (21 routes)
│   └── generated/               # Factory output (e.g. baritalia-stl)
│
├── domains/                     # Capability providers (no app awareness)
│   ├── shared/                  # Core primitives: schemas, cost-tracking, crew-api-client
│   ├── ai-orchestration/        # Agent coordination logic (formerly alex-ai)
│   ├── product-factory/         # Business package generation engine
│   └── vscode-extension/        # IDE integration domain logic
│
├── packages/                    # Shared library packages (27 total)
├── infrastructure/              # Docker Compose variants, deployment configs
├── scripts/                     # Shell toolkits (analyze, reorganize, deploy, env-bridge)
├── supabase/                    # Migrations, seed data, edge functions
├── terraform/                   # Workspace-based IaC (staging/production)
├── docs/                        # Architecture, protocols, strategic docs
├── configs/                     # Shared ESLint, TypeScript base configs
└── tests/                       # Integration and E2E test suites
```

### Key Root Files
| File | Purpose |
|---|---|
| `CLAUDE.md` | Primary AI agent memory file — project constitution for LLM context |
| `turbo.json` | Turborepo task graph (build → compile → test → lint) |
| `pnpm-workspace.yaml` | Workspace member declarations |
| `tsconfig.base.json` | Shared TypeScript strict config extended by all packages |
| `tsconfig.{cli,extension,server,web}.json` | Target-specific TS configs |
| `PLATFORM_CONSTITUTION.md` | Ship/crew/mission metaphor and governance principles |
| `ANALYZER_SUMMARY.md` | Latest codebase health metrics |
| `KNOWN_ISSUES.md` | Active bugs and remediation tracking |

---

## Domain Detail

### `domains/shared`
Core primitives consumed by every other domain and app.
- **schemas** — shared TypeScript interfaces and Zod validators
- **cost-tracking** — real-time token cost calculator; enforces budget ceiling
- **crew-api-client** — Supabase client wrapper; conversation and memory CRUD

### `domains/ai-orchestration`
Headless agent coordination. No UI dependencies.

**Five operating modes:**
| Mode | Description | Status |
|---|---|---|
| Manual | User controls each agent step | ✅ Active |
| Supervised | Agents propose, humans approve | ✅ Active |
| Autonomous | Agents run with rollback | 🔄 Ready for test |
| Self-Improving | Agents optimize their own prompts | 🔲 Planned |
| Market | Agents bid/compete for resources | 🔲 Future |

### `domains/product-factory`
The generation engine. Orchestrates Claude API calls → structured business artifacts.

**BarItalia STL — test project cost breakdown:**
| Step | Cost |
|---|---|
| Google Geolocation API (1x) | $0.50 |
| Claude API — writing (4 calls, ~4K tokens) | $0.60 |
| Claude API — analysis (2 calls, ~2K tokens) | $0.25 |
| Image generation (1x hero image) | $0.10 |
| Storage & processing | $0.05 |
| **Total per execution** | **$1.50** |

### `domains/vscode-extension`
IDE integration layer. Structure:
```
src/
├── commands/    # 20+ AI-powered command handlers
├── ui/          # Webview panels (Projects, Crew, Cost, Memory)
└── services/    # Extension services (cost meter, memory browser)
```

**Known issue (recently remediated):** `btoa()` crashes on emoji characters (e.g. `✅`). Fix: replace with `Buffer.from(str, 'utf8').toString('base64')` — see `fix-vscode-encoding.md`.

---

## Technology Stack

### Core Frameworks
| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.9.3 |
| UI Framework | React + Next.js | 18.3.1 + 14–15.x |
| Styling | Tailwind CSS | 3.4.1 |
| DB Client | Supabase JS | 2.39.0 |

### Build & Orchestration
| Tool | Role |
|---|---|
| Turborepo 2.0 | Monorepo task graph, caching, parallel builds |
| pnpm 9.12.3 | Package manager + workspace resolution |
| Node.js 20.x | Minimum runtime requirement |
| GitHub Actions | CI/CD: lint, test, build, deploy |

### External Services
| Service | Role |
|---|---|
| OpenRouter | Multi-model LLM routing (Haiku/Sonnet/Opus) |
| Supabase | PostgreSQL + Auth + Storage + Embeddings |
| n8n | Workflow automation (Docker container + webhook bridge) |
| AWS EC2 | Primary compute deployment target |
| Vercel | Next.js dashboard deployment |
| Terraform | IaC with workspace-per-environment isolation |

---

## Cost Optimization Architecture

This is the platform's core engineering differentiator.

### Model Routing Logic
```
Request → Complexity Analysis → Model Selection → OpenRouter → Cost Tracking

complexity < 0.3  →  claude-haiku    ($0.001 / 1K tokens)
complexity < 0.7  →  claude-sonnet   ($0.003 / 1K tokens)
complexity ≥ 0.7  →  claude-opus     ($0.015 / 1K tokens)
code review       →  gpt-4           ($0.010 / 1K tokens)
```

### Cost Reduction Stack
| Strategy | Mechanism | Savings Estimate |
|---|---|---|
| Complexity routing | Analyze request before LLM selection | Primary lever |
| Query cache | 5-min TTL for identical requests | ~20% |
| Semantic cache | Embedding similarity < 0.95 reuses responses | ~25% |
| Output cache | Artifacts stored 30 days | Long-tail |
| Batch aggregation | 5+ similar queries → single API call | ~40% overhead reduction |
| Adaptive throttling | Dynamic token limits as budget approaches ceiling | Safety net |
| Pattern matching | Pre-computed responses for top-100 common queries | Tail coverage |

**Net result:** 50–70% cost reduction vs. naive API calls.

---

## Supabase Memory Architecture

```sql
conversations (id, user_id, metadata, embedding)
├── messages (id, content, role, tokens_used)
└── memories (id, type, content, retrieval_count)
```

- Embeddings power semantic search across conversation history
- 30-day automatic retention and cleanup
- Auth strategy: API key (VSCode), session (dashboards), service role key (n8n)
- Integration point: `domains/shared/crew-api-client/src/`

---

## n8n Workflow Endpoints

**Base:** `http://localhost:5678/webhook/crew-*`

| Webhook | Trigger |
|---|---|
| `crew-generate` | Business package generation flow |
| `crew-analyze` | Codebase analysis scan |
| `crew-optimize` | Cost optimization audit |

Current active workflows: cost tracking aggregation (hourly), project generation pipeline, weekly analytics rollup.

---

## Build Commands Reference

```bash
# Install
pnpm install

# Development
pnpm dev                  # All dashboards + Supabase
pnpm dev:dashboard        # Unified dashboard only

# Build
pnpm build                # Full monorepo
pnpm fix:tsconfig         # Repair TypeScript configs

# Test
pnpm test                 # All packages
pnpm test:integration     # Integration tests
pnpm test:e2e             # End-to-end

# Database
pnpm supabase:start
pnpm db:seed
pnpm db:migrate

# n8n
pnpm n8n:sync
pnpm n8n:export

# Deploy
pnpm deploy:vercel
pnpm deploy:aws staging    # Provisions EC2 via Terraform + Docker

# VSCode Extension
pnpm --filter @openrouter-crew/vscode-extension compile
pnpm vscode:package
pnpm vscode:install
```

---

## Known Issues & Active Remediation

| Issue | Domain | Fix Location |
|---|---|---|
| `btoa()` crashes on emoji | `vscode-extension` | `fix-vscode-encoding.md` |
| Broken relative imports (`../../../../`) in dashboard | `ai-orchestration/dashboard` | `fix-dashboard-build.md` |
| VSCode TypeScript compilation errors | `vscode-extension` | `fix-vscode-compilation.md` |
| macOS system bash 3.2 lacks `declare -A` | All shell scripts | Use `case` statements + `python3` for JSON |

---

## Governance & Protocol Docs

| Document | Purpose |
|---|---|
| `PLATFORM_CONSTITUTION.md` | Ship/crew/mission metaphor; DDD contract rules |
| `docs/THE_DARK_FOREST_PROTOCOL.md` | Safety & governance framework — "Verify Then Trust" |
| `CLAUDE.md` | AI agent project memory (this is the primary LLM context file) |
| `AGILE.md.template` | Sprint planning template with SMART goal framework |
| `docs/AUTONOMOUS_BUSINESS_ARCHITECTURE.md` | Full strategic blueprint |
| `docs/COST_OPTIMIZATION_PATTERNS.md` | Implementation patterns for cost reduction |

---

## Prompt Engineering Reference

This section provides reusable context blocks for working with AI agents on this codebase.

### Minimal Context Block (for fast task-specific prompts)
```
You are working on `openrouter-crew-platform`, a TypeScript monorepo using:
- Turborepo + pnpm workspaces
- Next.js (apps), Domain-Driven Design (domains/), n8n, Supabase, OpenRouter
- Strict TypeScript 5.9 with no `any` types
- Path aliases: @openrouter-crew/*
- Package manager: pnpm ONLY (never npm or yarn)
- macOS bash constraint: no `declare -A` — use `case` statements or python3 for JSON in shell scripts

DDD rule: apps/ consume domains/. domains/ must never import from apps/.
Cost constraint: all LLM calls route through OpenRouter; default to Haiku for simple tasks.
```

### Domain-Specific Context Snippets

**For VSCode extension work:**
```
Target: domains/vscode-extension/
Structure: src/commands/, src/ui/, src/services/
Known issue: never use btoa() for encoding — use Buffer.from(str, 'utf8').toString('base64')
Build: pnpm --filter @openrouter-crew/vscode-extension compile
```

**For dashboard / Next.js work:**
```
Target: apps/unified-dashboard/
Framework: Next.js App Router, Tailwind CSS 3.4.1, React 18.3.1
Import rule: use @openrouter-crew/* path aliases, never relative ../../../../ paths
Supabase client: import from domains/shared/crew-api-client
```

**For agent orchestration work:**
```
Target: domains/ai-orchestration/
Operating modes: Manual → Supervised → Autonomous → Self-Improving → Market
Current active: Manual (mode 1) and Supervised (mode 2)
Pattern: agents propose actions, surface to human approval in Supervised mode
State persistence: Supabase conversations/messages/memories tables
```

**For shell script work:**
```
Shell target: bash (not zsh), compatible with macOS bash 3.2
No associative arrays (declare -A not supported)
JSON manipulation: python3 -c "import json, sys; ..."
Script conventions: --dry-run, --yes, --phase N flags; timestamped backups before modifications
Script location: scripts/ directory
```

**For cost/routing work:**
```
Target: domains/shared/cost-tracking/ and domains/shared/crew-api-client/src/routing.ts
Budget ceiling: $1.50 per full execution
Routing: complexity < 0.3 → haiku, < 0.7 → sonnet, ≥ 0.7 → opus
Always track token usage; write to Supabase messages.tokens_used
```

### Full Project Context Block (for architecture-level or multi-domain tasks)
```xml
<project_context>
  <name>openrouter-crew-platform</name>
  <description>
    Cost-optimized AI orchestration monorepo. Generates complete business packages
    (website, plan, financials) for under $1.50/execution using multi-model routing.
  </description>
  <stack>
    TypeScript 5.9 · React 18 · Next.js 14-15 · Tailwind 3.4
    Turborepo 2.0 · pnpm 9.12 · Node 20
    OpenRouter · Supabase · n8n · AWS EC2 · Vercel · Terraform
  </stack>
  <architecture>
    DDD monorepo. apps/ consume domains/. Never reverse.
    5 domains: shared, ai-orchestration, product-factory, vscode-extension
    27 packages total. 13 compile successfully as of March 2026.
  </architecture>
  <constraints>
    - pnpm only (no npm/yarn)
    - No `any` types — use unknown + type guards
    - macOS bash 3.2 in scripts — no declare -A
    - All LLM calls via OpenRouter (never direct Anthropic/OpenAI API)
    - Budget ceiling: $1.50 / execution for product-factory workflows
    - Imports: always use @openrouter-crew/* aliases
    - Never import from apps/ inside domains/
  </constraints>
  <active_issues>
    - btoa() crash on emoji in vscode-extension (use Buffer.from utf8)
    - Dashboard broken relative imports (use path aliases)
    - CI/CD pipeline integration incomplete
    - VSCode webview panels for codebase dashboard in progress
  </active_issues>
</project_context>
```

### Task-Specific Prompt Templates

**Code review prompt:**
```
Review the following code from [domain/path] in openrouter-crew-platform.
Apply these standards: TypeScript strict mode, no any types, DDD layer boundaries,
pnpm-compatible imports, OpenRouter routing for any LLM calls under $1.50 budget.
Flag: cross-domain imports, direct API calls bypassing OpenRouter, any btoa() usage.
```

**Architecture decision prompt:**
```
I'm working on openrouter-crew-platform (DDD TypeScript monorepo).
Current state: [describe state].
Constraint: change must respect DDD boundaries (apps consume domains, not vice versa),
stay within $1.50/execution budget, use pnpm, TypeScript strict.
Question: [your question]
```

**Shell script generation prompt:**
```
Write a bash script for openrouter-crew-platform that [task].
Requirements:
- Compatible with bash 3.2 (macOS system bash — no declare -A, no mapfile)
- Use python3 for JSON manipulation
- Include --dry-run, --yes, and --phase N flags
- Create timestamped backups before any file modifications
- Script should live in scripts/ directory
```

---

## Current Sprint Priorities (as of March 2026)

1. **Enhanced analyzer metrics** — cyclomatic complexity, duplication detection, test coverage estimation
2. **Weekly analysis GitHub Action** — scheduled codebase scanning with PR impact comments
3. **VSCode codebase dashboard webview** — visual metrics panel in sidebar
4. **Automated PR analysis** — comment bot for diff impact scoring
5. **CI/CD pipeline completion** — GitHub Actions integration for full deploy chain

---

*Generated from live repo review · April 6, 2026 · Reviewed by Claude Sonnet 4.6*
