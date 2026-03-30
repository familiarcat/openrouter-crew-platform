# OpenRouter Crew Platform — Script Suite

**March 2026 AI-Native Development Toolkit**

This is a three-script system for deep AI analysis, safe structural reorganization,
and automated local→cloud deployment of the `openrouter-crew-platform`.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `crew-ai-analyze.sh` | AI-powered deep codebase analysis via OpenRouter |
| `crew-reorganize.sh` | Safe structural refactoring (dry-run by default) |
| `crew-deploy.sh` | Local → Staging → Production pipeline |

---

## Quick Start

```bash
# 1. Set your OpenRouter API key
export OPENROUTER_API_KEY=sk-or-...

# 2. Dry-run the reorganizer (no changes, just print what would happen)
bash crew-reorganize.sh

# 3. Apply the reorganization (git-safe, creates backup tag)
bash crew-reorganize.sh --apply

# 4. Run AI deep analysis (costs ~$0.50–$1.50 depending on budget)
bash crew-ai-analyze.sh --repo /path/to/openrouter-crew-platform

# 5. Start local stack
bash crew-deploy.sh local

# 6. Check status
bash crew-deploy.sh status
```

---

## crew-ai-analyze.sh

### What It Does

Runs **6 parallel analysis modes** against your codebase, each using
purpose-built prompts with 2026 best practices:

| Mode | Model Used | What It Finds |
|------|-----------|---------------|
| `architecture` | Sonnet | DDD boundary violations, domain misplacements |
| `duplication` | Sonnet | Structural duplicates (agent patterns, dashboards) |
| `cost_optimization` | Sonnet | OpenRouter routing improvements, caching gaps |
| `prompt_engineering` | Sonnet | Prompt quality, XML delimiters, CoT enforcement |
| `local_test_readiness` | Haiku | Docker compose, port conflicts, missing .env |
| `deployment_gaps` | Haiku | Terraform, CI/CD, Vercel config completeness |

Then synthesises all findings into a **prioritised master action plan**.

### Prompting Principles Applied

These are the March 2026 techniques baked into every prompt:

1. **XML context delimitation** — `<system_role>`, `<context>`, `<task>`, `<output_format>` tags prevent prompt bleed
2. **Chain-of-thought enforcement** — "State your reasoning before your conclusion"
3. **Few-shot examples** — 2–3 inline examples per analysis type
4. **Complexity-based routing** — text length + code signals → cheapest viable model
5. **Meta-prompting** — the synthesis pass critiques and revises its own output
6. **Self-critique loop** — synthesis: draft → critique → revise in one call
7. **Budget guarding** — hard-stops before exceeding configured limit
8. **JSONL cost logging** — every call tracked with token counts

### Options

```bash
crew-ai-analyze.sh [options]

--repo     /path/to/repo         (default: .)
--budget   2.00                  (max USD to spend, default: $2.00)
--mode     architecture,duplication  (run specific modes only)
--dry-run  Print snapshot, no API calls
```

### Output

```
ai-analysis-output/
├── analysis_20260328_143022.md    # Full report
└── prompt_log_20260328_143022.jsonl  # Cost tracking per call
```

---

## crew-reorganize.sh

### What It Does

**8 safe, idempotent tasks** that clean up the repo structure:

| Task | What Changes |
|------|-------------|
| `git-snapshot` | Tags current HEAD before any changes |
| `extract-base` | Creates `domains/product-factory/templates/base-agent/` from dj-booking pattern |
| `move-docs` | Moves `fix-*.md` from root → `docs/fixes/` |
| `local-test` | Creates `scripts/local-test.sh` (one-command local stack) |
| `validate-imports` | Creates `scripts/validate-imports.sh` (deep path scanner) |
| `update-pkg` | Adds `local:test`, `ai:analyze`, `reorg:*` scripts to package.json |
| `prompt-library` | Creates `.claude/prompts/` with 3 starter templates |
| `verify-workspace` | Validates pnpm workspace links post-reorganization |

### Key Outputs

**`domains/product-factory/templates/base-agent/`** — eliminates the
`dj-booking` ↔ `test-event-venue` duplication (~2,400 lines) by giving
all agents a shared inheritance base.

**`.claude/prompts/`** — prompt library with:
- `agent-generation.md` — generate any new agent from a spec
- `codebase-analysis.md` — structured analysis prompt template
- `meta-prompt-generator.md` — meta-prompt to generate new prompts

### Options

```bash
crew-reorganize.sh [options]

--apply            Make changes (default: dry-run)
--repo <path>      Repo root (default: .)
--tasks <csv>      Run specific tasks only
```

---

## crew-deploy.sh

### Stages

```
local       → docker-compose.local.yml (Supabase + n8n + all services)
staging     → Vercel preview + Terraform staging workspace
production  → Vercel prod + Terraform production workspace + Supabase migrations
status      → Health check all ports and build artifacts
```

### Local Stack Services

After `bash crew-deploy.sh local`:

| Service | URL |
|---------|-----|
| Unified Dashboard | http://localhost:3000 |
| Alex AI Dashboard | http://localhost:3001 |
| n8n Automation | http://localhost:5678 |
| Supabase Studio | http://localhost:54323 |
| API Gateway | http://localhost:8080 |

---

## Installation (drop into your repo)

```bash
# Copy scripts into your repo
cp crew-ai-analyze.sh  /path/to/openrouter-crew-platform/scripts/
cp crew-reorganize.sh  /path/to/openrouter-crew-platform/scripts/
cp crew-deploy.sh      /path/to/openrouter-crew-platform/scripts/
chmod +x /path/to/openrouter-crew-platform/scripts/crew-*.sh

# Or add to package.json scripts
# (crew-reorganize.sh --apply will do this automatically)
```

---

## Architecture Decision: Why These Patterns

### XML Delimiters
The project's own `CLAUDE.md` uses `<system_role>` — these scripts extend that
convention into every API call, ensuring Claude never confuses context with instructions.

### Complexity Routing
The existing `routing.ts` concept is generalised here into a bash complexity scorer —
same principle (haiku for simple, sonnet for complex) at the script level.

### Base Agent Template
The `dj-booking` and `test-event-venue` domains have **identical agent structures**
(booking, finance, marketing, music, venue agents — all Express + Anthropic SDK).
The base-agent template lets future projects spin up in 1 file instead of 5.

### Meta-Prompting Synthesis
The analysis script's final pass critiques its own recommendations — a self-improving
loop that surfaces blind spots before the report lands in your inbox.
