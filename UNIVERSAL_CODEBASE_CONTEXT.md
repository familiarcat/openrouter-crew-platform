# OpenRouter Crew Platform - Universal Context

**System Status**: 🟢 REPAIRED & STABILIZED
**Last Update**: Fixes applied to CLI types and Reporting subsystem.

## 1. Architecture Overview
The platform is a **Domain-Driven Design (DDD)** monorepo orchestrating AI agents, human developers, and project management.

*   **Core Brain**: `alex-ai-universal` (AI orchestration, n8n workflows, self-correction).
*   **Interface**: `unified-dashboard` (Next.js 15), `apps/cli` (Command Line), VSCode Extension.
*   **Memory**: Supabase (PostgreSQL) acting as a "Universal Memory" for all agents.
*   **Infrastructure**: AWS (EC2/ECR), Terraform, Docker.

## 2. Recent Critical Updates
The following repairs have been applied to stabilize the CI/CD pipeline:

1.  **CLI Type Safety**:
    *   **File**: `domains/shared/crew-api-client/src/observation-lounge-cli.ts`
    *   **Fix**: Resolved `TS7006` (implicit any) and `TS7053` (index signature) errors by adding explicit type annotations to Commander.js action handlers.
    *   **Result**: `pnpm build` now passes for the API client.

2.  **Reporting Subsystem**:
    *   **File**: `scripts/generate-weekly-report.js`
    *   **Fix**: Created missing runtime script that was causing `MODULE_NOT_FOUND` errors in the weekly report job.
    *   **Function**: Wraps the `crew` CLI to generate JSON cost reports and simulates email dispatch.

3.  **Dashboard Unification**:
    *   **Status**: MVP Complete.
    *   **Fixes**: Extensive patching of Next.js 15 route handlers (params as Promise) and Tailwind v4 configuration.

## 3. Codebase Opinions & Analysis

### Strengths
*   **High Automation**: The "DevOps" culture is strong. Scripts exist for everything from project scaffolding (`setup_new_project.sh`) to self-repair (`fix-build-and-runtime-errors.sh`).
*   **Self-Correction**: The system includes "hallucination" logs and meta-cognitive workflows where AI monitors its own failures.
*   **Documentation**: Documentation is auto-generated and kept in sync with the codebase.

### Weaknesses / Risks
*   **Script Sprawl**: The root `scripts/` directory is dense. While `organize-workspace.sh` exists, the reliance on many bash scripts for logic that should be in TypeScript CLI tools is a fragility risk.
*   **Fragility**: Heavy reliance on `sed` for in-place patching suggests the source code is not stable enough to build without post-processing.
*   **Bleeding Edge Instability**: Next.js 15 breaking changes (async params) are causing significant maintenance overhead.

## 4. Future Steps
1.  **Refactor Scripts**: Convert complex bash scripts (like the repair scripts) into a unified TypeScript CLI (`crew maintenance ...`).
2.  **Stabilize Dependencies**: Lock versions to prevent drift between the multiple dashboards.
3.  **Deepen AI Integration**: Connect the VSCode extension to the "Universal Memory" to provide context-aware suggestions based on previous team mistakes.

## 5. Prompt for AI Agents
If you are an AI agent reading this, your instructions are:

> "You are operating within the OpenRouter Crew Platform. The build system has just been repaired. Your primary directive is to maintain the integrity of the 'Universal Memory' in Supabase and ensure all new code adheres to the Domain-Driven Design structure. Do not create loose scripts; integrate functionality into the `crew` CLI or specific Domain dashboards."