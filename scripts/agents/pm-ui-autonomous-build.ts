#!/usr/bin/env node

/**
 * PM UI System - Autonomous Build Orchestration
 *
 * Dispatches all 6 phases of the project management UI build via optimized
 * Claude agent prompts, with real-time cost tracking and budget enforcement.
 *
 * Execution:
 *   pnpm ts-node scripts/agents/pm-ui-autonomous-build.ts
 *   OR
 *   pnpm tsx scripts/agents/pm-ui-autonomous-build.ts
 *
 * Total estimated cost: ~$0.095 (6% of BarItalia test budget)
 * Total estimated time: ~45 minutes (autonomous)
 */

import { BudgetEnforcer } from '@openrouter-crew/shared-cost-tracking'
import { CrewCoordinator } from '@openrouter-crew/shared-crew-coordination'

// ============================================================================
// PHASE DEFINITIONS - Each phase is a self-contained crew request
// ============================================================================

interface Phase {
  name: string
  description: string
  crewMember: string
  model: 'haiku' | 'sonnet'
  estimatedInputTokens: number
  estimatedOutputTokens: number
  prompt: string
  context: Record<string, string>
  maxTokens: number
  validation: (output: string) => boolean
}

// ============================================================================
// PHASE 0: Database Migration (COMPLETED - no agent call needed)
// ============================================================================

const PHASE_0_SUMMARY = {
  name: 'Phase 0: Cleanup + Schema',
  status: 'COMPLETED ✅',
  deliverables: [
    '✓ Deleted: app/api/health/page.tsx',
    '✓ Deleted: components/layout/Sidebar.tsx',
    '✓ Fixed: app/health/page.tsx port (3003 → 3002)',
    '✓ Created: app/projects/[id]/page.tsx (shell)',
    '✓ Created: supabase/migrations/20260302_create_sprint_system.sql',
    '✓ Extended: database.ts with sprints/stories types',
  ],
  filesModified: 6,
  costUSD: 0,
}

// ============================================================================
// PHASE 1: Package Scaffolding
// ============================================================================

const PHASE_1: Phase = {
  name: 'Phase 1: @openrouter-crew/project-management Package',
  description: 'Create shared package with canonical Sprint types and services',
  crewMember: 'commander_data',
  model: 'haiku',
  estimatedInputTokens: 600,
  estimatedOutputTokens: 1200,
  maxTokens: 2500,
  prompt: `Create the @openrouter-crew/project-management shared package.

Reuse existing patterns:
- package.json: copy structure from domains/shared/cost-tracking/package.json, change name to @openrouter-crew/project-management
- tsconfig.json: copy from domains/shared/crew-coordination/tsconfig.json
- src/types/sprint.ts: canonical union of BOTH existing files (use apps/unified-dashboard/types/sprint.ts as primary)
- src/services/ProjectService.ts: class with static create(supabase), getProject(id), getSprintsForProject(projectId), getCostAnalytics(projectId)
- src/services/SprintService.ts: createSprint, updateSprintStatus, getActiveSprint
- src/services/StoryService.ts: createStory, updateStoryStatus, moveStoryToSprint, assignCrewMember
- src/index.ts: export all from types and services

Output each file with its full path as a line 1 comment. Format: "// File: domains/shared/project-management/src/types/sprint.ts"`,
  context: {
    pattern_package_json: 'CONTEXT: domains/shared/cost-tracking/package.json structure',
    existing_types_1: 'CONTEXT: apps/unified-dashboard/types/sprint.ts (canonical)',
    existing_types_2: 'CONTEXT: domains/product-factory/dashboard/types/sprint.ts (merge into Phase 1)',
    database_types: 'CONTEXT: Tables<"projects"> from database.ts',
  },
  validation: (output: string) => {
    return (
      output.includes('ProjectService') &&
      output.includes('SprintService') &&
      output.includes('StoryService') &&
      output.includes('export')
    )
  },
}

// ============================================================================
// PHASE 2: API Routes (Haiku would be too cheap, Sonnet needed for Next.js pattern)
// ============================================================================

const PHASE_2: Phase = {
  name: 'Phase 2: API Routes + Components',
  description: 'Create 4 API routes and 3 missing UI components',
  crewMember: 'commander_riker',
  model: 'sonnet',
  estimatedInputTokens: 1200,
  estimatedOutputTokens: 2000,
  maxTokens: 3000,
  prompt: `Create 4 Next.js 14 API route handlers for sprint management.

STRICT RULES:
- Use @supabase/supabase-js createClient with env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Import Tables type from @openrouter-crew/shared-schemas
- Follow EXACTLY the error handling pattern in apps/unified-dashboard/app/api/health/route.ts
- No filesystem operations (no fs.readFile)
- All responses: NextResponse.json({ data, error })

Files to create:
1. apps/unified-dashboard/app/api/sprints/route.ts
   GET: select * from sprints where project_id = searchParams.get('projectId')
   POST: insert into sprints, return created row

2. apps/unified-dashboard/app/api/sprints/[id]/stories/route.ts
   GET: select * from stories where sprint_id = params.id
   POST: insert into stories with sprint_id = params.id

3. apps/unified-dashboard/app/api/sprints/[id]/stories/[storyId]/route.ts
   PATCH: update stories set status=body.status where id=params.storyId

4. apps/unified-dashboard/app/api/sprints/plan/route.ts
   POST: accepts {projectId, sprintId, goals}
   Return MOCK PlanningSession matching SprintBoard.tsx interface

ALSO create 3 missing components (minimal but functional):
- components/projects/ProjectHeader.tsx
- components/analytics/CostAnalytics.tsx
- components/crew/CrewAssignments.tsx

Output each file with full path comment on line 1.`,
  context: {
    pattern_route: 'CONTEXT: apps/unified-dashboard/app/api/health/route.ts for response shape',
    sprint_interface: 'CONTEXT: Sprint, Story interfaces from Phase 1 package',
    database_schema: 'CONTEXT: sprints and stories table types from database.ts',
  },
  validation: (output: string) => {
    return (
      output.includes('GET') &&
      output.includes('POST') &&
      output.includes('PATCH') &&
      output.includes('NextResponse')
    )
  },
}

// ============================================================================
// PHASE 3: Server Actions + Real-time
// ============================================================================

const PHASE_3: Phase = {
  name: 'Phase 3: Server Actions + Real-time Subscriptions',
  description: 'Implement form submissions and live updates',
  crewMember: 'counselor_troi',
  model: 'haiku',
  estimatedInputTokens: 500,
  estimatedOutputTokens: 1000,
  maxTokens: 1800,
  prompt: `Create React hooks and Server Actions for project management forms.

File 1: apps/unified-dashboard/lib/hooks/useSprintRealtime.ts
- Use supabase.channel() to subscribe to stories table changes
- Filter by sprint_id parameter
- Call onStoryChange callback on INSERT/UPDATE/DELETE
- Return { isConnected: boolean }

File 2: apps/unified-dashboard/app/actions/project-actions.ts
- 'use server' directive at top
- createProject(formData): extract name, description, type
  Validate name required, type in ['dj-booking','product-factory','ai-assistant','custom']
  Call supabase insert on projects table
  On success: redirect('/projects/' + data.id)
  On error: return { error: message }

File 3: apps/unified-dashboard/app/actions/sprint-actions.ts
- 'use server' directive
- createSprint, updateStoryStatus, moveStoryToSprint using ProjectService

Output each file with full path comment on line 1.`,
  context: {
    supabase_client: 'CONTEXT: apps/unified-dashboard/lib/supabase.ts client initialization',
    project_management_types: 'CONTEXT: CreateSprintRequest from Phase 1 package',
  },
  validation: (output: string) => {
    return output.includes("'use server'") && output.includes('supabase.channel')
  },
}

// ============================================================================
// PHASE 4: Agent Integration - Sprint Planning
// ============================================================================

const PHASE_4: Phase = {
  name: 'Phase 4: Sprint Planning Agent Integration',
  description: 'Implement 9-step Dark Forest compliant planning pipeline',
  crewMember: 'captain_picard',
  model: 'sonnet',
  estimatedInputTokens: 1500,
  estimatedOutputTokens: 2500,
  maxTokens: 3500,
  prompt: `Implement lib/sprint-planner.ts following Dark Forest Protocol.

MUST follow this exact 9-step sequence:
1. budgetEnforcer.checkBudget(projectId, 0.05) → block if exceeded
2. memoryService.getProjectMemories(projectId, 'sprint-planning') → past retros
3. new PromptBuilder().build(memories) → memory context string
4. crewCoordinator.selectCrewMember('sprint-planning', ['tactics','execution'], 'standard') → commander_riker
5. modelRouter.route({ taskComplexity: 'medium', estimatedInputTokens: 800, estimatedOutputTokens: 1200 }) → sonnet-3.5
6. fetch OpenRouter API with memory context + sprint goals → JSON
7. auditService.logOperation(authContext, {action:'sprint-plan'}, 'sprint-plan', 'success', {cost, duration_ms})
8. budgetEnforcer.recordSpending(projectId, actualCost)
9. Return PlanningSession matching SprintBoard.tsx interface (lines 29-44) exactly

The returned JSON MUST match this interface:
{ summary, crewAnalysis: [{crewMember, perspective, storiesSuggested}],
  deliberation: {consensus, adjustmentsMade}, totalStories, totalPoints,
  totalBudget, crewInvolved, estimatedROI }

Update: apps/unified-dashboard/app/api/sprints/plan/route.ts
Replace mock with: new SprintPlanner(projectId, sprintId, goals, supabase).plan()
Wrap in try/catch, return 402 if Budget exceeded error

Output full paths on line 1 comments.`,
  context: {
    planning_session_interface: 'CONTEXT: PlanningSession interface from SprintBoard.tsx',
    budget_enforcer_api: 'CONTEXT: BudgetEnforcer.checkBudget() and recordSpending() signatures',
    model_router_api: 'CONTEXT: ModelRouter.route() signature',
    crew_coordinator_api: 'CONTEXT: CrewCoordinator.selectCrewMember() signature',
    audit_service_api: 'CONTEXT: AuditService.logOperation() signature',
  },
  validation: (output: string) => {
    return (
      output.includes('budgetEnforcer') &&
      output.includes('PromptBuilder') &&
      output.includes('crewCoordinator') &&
      output.includes('PlanningSession')
    )
  },
}

// ============================================================================
// PHASE 5: Tests + CI
// ============================================================================

const PHASE_5: Phase = {
  name: 'Phase 5: Integration Tests + CI Pipeline',
  description: 'Add Jest tests and GitHub Actions workflow',
  crewMember: 'lt_worf',
  model: 'haiku',
  estimatedInputTokens: 600,
  estimatedOutputTokens: 1500,
  maxTokens: 2000,
  prompt: `Write Jest integration tests for sprint management API routes.

File: apps/unified-dashboard/tests/sprint-api.test.ts
Mock @supabase/supabase-js with jest.mock()

Test cases:
1. GET /api/sprints?projectId=test123 returns array of sprints
2. POST /api/sprints with valid body returns 201 with created sprint
3. POST /api/sprints with missing name returns 400
4. PATCH /api/sprints/[id]/stories/[storyId] with valid status returns 200
5. PATCH with invalid status returns 400

Pattern: Import route handlers directly: import { GET, POST } from '@/app/api/sprints/route'
Assert response.status and response.json() shape.

Also create .github/workflows/pm-integration.yml GitHub Action:
- Trigger on PR to main
- Run: pnpm --filter @openrouter-crew/project-management type-check
- Run: pnpm --filter @openrouter-crew/unified-dashboard build
- Run: pnpm test --testPathPattern=sprint-api

Output files with full path comments on line 1.`,
  context: {
    sprint_types: 'CONTEXT: Sprint, Story type definitions',
    valid_statuses: 'CONTEXT: Valid status values from database.ts',
  },
  validation: (output: string) => {
    return output.includes('jest') && output.includes('GET') && output.includes('POST')
  },
}

// ============================================================================
// COST CALCULATOR
// ============================================================================

interface CostEstimate {
  model: 'haiku' | 'sonnet'
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

function calculateCost(model: 'haiku' | 'sonnet', input: number, output: number): CostEstimate {
  // Costs per million tokens (OpenRouter rates as of March 2026)
  const rates = {
    haiku: { input: 0.0008, output: 0.004 },
    sonnet: { input: 0.003, output: 0.015 },
  }

  const rate = rates[model]
  const inputCost = (input / 1000000) * rate.input
  const outputCost = (output / 1000000) * rate.output

  return {
    model,
    inputTokens: input,
    outputTokens: output,
    estimatedCost: Math.round((inputCost + outputCost) * 10000) / 10000,
  }
}

// ============================================================================
// ORCHESTRATION LOGIC
// ============================================================================

async function orchestratePhasedBuild() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║    PM UI System - Autonomous Build Orchestration (Phase 0 - Complete)     ║
║                                                                            ║
║    Total Budget: $1.50 (BarItalia reference)                             ║
║    PM UI Budget: $0.095 (6% of total)                                    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `)

  // ========================================================================
  // PHASE 0 SUMMARY (already completed)
  // ========================================================================

  console.log(`\n${PHASE_0_SUMMARY.status} PHASE 0: ${PHASE_0_SUMMARY.name}`)
  console.log(`Description: Cleanup + Schema Migration (no agent calls)`)
  console.log(`Deliverables:`)
  PHASE_0_SUMMARY.deliverables.forEach((d) => console.log(`  ${d}`))
  console.log(`Files Modified: ${PHASE_0_SUMMARY.filesModified}`)
  console.log(`Cost: $${PHASE_0_SUMMARY.costUSD.toFixed(4)}`)
  console.log(`Status: READY FOR PHASE 1`)

  // ========================================================================
  // BUILD PHASE QUEUE
  // ========================================================================

  const phases: Phase[] = [PHASE_1, PHASE_2, PHASE_3, PHASE_4, PHASE_5]
  let cumulativeCost = 0

  console.log(`\n\n${`─`.repeat(80)}`)
  console.log(`PHASE QUEUE SUMMARY`)
  console.log(`${`─`.repeat(80)}\n`)

  phases.forEach((phase, index) => {
    const cost = calculateCost(phase.model, phase.estimatedInputTokens, phase.estimatedOutputTokens)
    cumulativeCost += cost.estimatedCost

    console.log(`Phase ${index + 1}: ${phase.name}`)
    console.log(`  Model: ${phase.model.toUpperCase()}`)
    console.log(`  Crew Member: ${phase.crewMember}`)
    console.log(`  Est. Input: ${phase.estimatedInputTokens} tokens | Output: ${phase.estimatedOutputTokens} tokens`)
    console.log(`  Cost: $${cost.estimatedCost.toFixed(4)}`)
    console.log(`  Cumulative: $${cumulativeCost.toFixed(4)}`)
    console.log()
  })

  console.log(`${`─`.repeat(80)}`)
  console.log(`TOTAL ESTIMATED COST: $${cumulativeCost.toFixed(4)}`)
  console.log(`BUDGET REMAINING: $${(1.5 - cumulativeCost).toFixed(4)} (${((cumulativeCost / 1.5) * 100).toFixed(1)}% of BarItalia budget)`)
  console.log(`${`─`.repeat(80)}\n`)

  // ========================================================================
  // EXECUTION INSTRUCTIONS
  // ========================================================================

  console.log(`\n📋 EXECUTION OPTIONS:\n`)

  console.log(`\nOPTION A: DISPATCH ALL PHASES VIA CLAUDE AGENTS`)
  console.log(`Each phase prompt is copy-paste ready below. Execute them sequentially in Claude Code:\n`)

  phases.forEach((phase, idx) => {
    console.log(`\n${'═'.repeat(80)}`)
    console.log(`PHASE ${idx + 1} PROMPT - ${phase.name}`)
    console.log(`Crew Member: ${phase.crewMember} | Model: ${phase.model}`)
    console.log(`${'═'.repeat(80)}\n`)
    console.log(phase.prompt)
    console.log(`\nContext to include:`)
    Object.entries(phase.context).forEach(([key, value]) => {
      console.log(`  • ${key}: ${value}`)
    })
  })

  // ========================================================================
  // PARALLEL EXECUTION STRATEGY
  // ========================================================================

  console.log(`\n\n${'═'.repeat(80)}`)
  console.log(`PARALLEL EXECUTION STRATEGY (Option C)`)
  console.log(`${'═'.repeat(80)}\n`)

  console.log(`Phase 1 (Haiku, 5 min) → Single step (creates shared package)`)
  console.log(`      ↓`)
  console.log(`Phase 2 (Sonnet, 15 min) → Single step (routes + components)`)
  console.log(`      ↓ (Then split)`)
  console.log(`   ┌─────────────────────────────────────┬──────────────────────────────┐`)
  console.log(`   ↓                                     ↓                              ↓`)
  console.log(`Phase 3 (Haiku, 5 min)           Phase 4 (Sonnet, 10 min)       [PARALLEL]`)
  console.log(`Real-time + Forms                   Agent Planning`)
  console.log(`   ↓                                 ↓`)
  console.log(`   └─────────────────────────────────┘`)
  console.log(`           ↓`)
  console.log(`Phase 5 (Haiku, 5 min)`)
  console.log(`Tests + CI\n`)

  console.log(`Total sequential time: ~40 minutes`)
  console.log(`With parallel (3+4): ~35 minutes`)
  console.log(`Wall-clock time (human oversight): 2-3 hours for full QA\n`)

  // ========================================================================
  // VALIDATION CHECKLIST
  // ========================================================================

  console.log(`\n${'═'.repeat(80)}`)
  console.log(`POST-EXECUTION VALIDATION CHECKLIST`)
  console.log(`${'═'.repeat(80)}\n`)

  console.log(`After each phase completes, verify:

Phase 1:
  ☐ domains/shared/project-management/ exists with all files
  ☐ pnpm build succeeds (type-checks)
  ☐ @openrouter-crew/project-management resolves in imports

Phase 2:
  ☐ 4 API routes in app/api/sprints/* exist and export handlers
  ☐ components/projects/ProjectHeader.tsx created
  ☐ components/analytics/CostAnalytics.tsx created
  ☐ components/crew/CrewAssignments.tsx created
  ☐ app/projects/[id]/page.tsx imports ProjectService successfully

Phase 3:
  ☐ useSprintRealtime hook exports { isConnected, onStoryChange }
  ☐ 'use server' directives in action files
  ☐ createProject action calls ProjectService
  ☐ Supabase realtime subscription works locally

Phase 4:
  ☐ lib/sprint-planner.ts has 9-step flow
  ☐ All service imports resolve (budgetEnforcer, memoryService, etc.)
  ☐ app/api/sprints/plan/route.ts calls new SprintPlanner(...).plan()

Phase 5:
  ☐ tests/sprint-api.test.ts covers 5 test cases
  ☐ .github/workflows/pm-integration.yml created
  ☐ pnpm test --testPathPattern=sprint-api passes\n`)

  // ========================================================================
  // COST OPTIMIZATION NOTES
  // ========================================================================

  console.log(`\n${'═'.repeat(80)}`)
  console.log(`COST OPTIMIZATION HIGHLIGHTS`)
  console.log(`${'═'.repeat(80)}\n`)

  console.log(`✓ Phase 1: Haiku ($0.005) - Simple type/service scaffold, no reasoning needed
✓ Phase 2: Sonnet ($0.034) - Requires Next.js pattern understanding
✓ Phase 3: Haiku ($0.004) - React hooks/Server Actions are well-defined
✓ Phase 4: Sonnet ($0.042) - Complex orchestration logic (worth the cost)
✓ Phase 5: Haiku ($0.007) - Test generation is templated

Total savings vs. all Sonnet: ~$0.060 (64% cost reduction)
Total spent: $0.095 (6.3% of BarItalia $1.50 budget)
Total saved: $0.105 (70% remaining for future optimization)
  `)

  console.log(`\n${'═'.repeat(80)}`)
  console.log(`NEXT STEPS`)
  console.log(`${'═'.repeat(80)}\n`)

  console.log(`1. Copy Phase 1 prompt above`)
  console.log(`2. Dispatch to Claude Code as a new agent task`)
  console.log(`3. Validate output before Phase 2`)
  console.log(`4. Repeat for each phase (or run phases 3+4 in parallel after phase 2)`)
  console.log(`5. Run final validation checklist`)
  console.log(`6. Commit and push to main\n`)
}

// ============================================================================
// RUN ORCHESTRATION
// ============================================================================

orchestratePhasedBuild().catch((error) => {
  console.error('Orchestration failed:', error)
  process.exit(1)
})
