// File: apps/unified-dashboard/app/api/sprints/plan/route.ts

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createSprintPlanner } from '@/lib/sprint-planner'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, sprintId, goals } = body

    // Validation
    if (!projectId || !sprintId || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sprintId, goals (non-empty array)' },
        { status: 400 }
      )
    }

    // Instantiate planner with 9-step Dark Forest pipeline
    const supabase = getSupabaseAdmin()
    const planner = createSprintPlanner({
      projectId,
      sprintId,
      goals,
      supabase,
      budgetLimit: 0.05,
    })

    try {
      // Execute 9-step pipeline:
      // 1. budgetEnforcer.checkBudget
      // 2. memoryService.getProjectMemories
      // 3. PromptBuilder.build
      // 4. crewCoordinator.selectCrewMember
      // 5. modelRouter.route
      // 6. OpenRouter API call
      // 7. auditService.logOperation
      // 8. budgetEnforcer.recordSpending
      // 9. Return PlanningSession
      const planningSession = await planner.plan()

      return NextResponse.json(
        { data: planningSession },
        { status: 201 }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      // Return 402 (Payment Required) if budget exceeded
      if (message.includes('BudgetExceededError')) {
        return NextResponse.json(
          { error: 'Budget limit exceeded for sprint planning' },
          { status: 402 }
        )
      }

      throw error
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
