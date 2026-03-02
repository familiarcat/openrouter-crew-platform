// File: apps/unified-dashboard/lib/sprint-planner.ts

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@openrouter-crew/shared-schemas'
import {
  BudgetEnforcer,
  CostCalculator,
} from '@openrouter-crew/cost-tracking'
import {
  PromptBuilder,
  MemoryService,
} from '@openrouter-crew/agent-memory'
import {
  CrewCoordinator,
  type CrewRequest,
} from '@openrouter-crew/crew-coordination'
import { AuditService } from '@openrouter-crew/crew-api-client'

interface PlanningSession {
  summary: string
  crewAnalysis: Array<{
    crewMember: string
    perspective: string
    storiesSuggested: number
  }>
  deliberation: { consensus: string; adjustmentsMade: string[] }
  totalStories: number
  totalPoints: number
  totalBudget: number
  crewInvolved: string[]
  estimatedROI: number
}

interface PlannerConfig {
  projectId: string
  sprintId: string
  goals: string[]
  supabase: SupabaseClient<Database>
  budgetLimit?: number
}

export class SprintPlanner {
  private projectId: string
  private sprintId: string
  private goals: string[]
  private supabase: SupabaseClient<Database>
  private budgetLimit: number
  private budgetEnforcer: BudgetEnforcer
  private memoryService: MemoryService
  private crewCoordinator: CrewCoordinator
  private auditService: AuditService

  constructor(config: PlannerConfig) {
    this.projectId = config.projectId
    this.sprintId = config.sprintId
    this.goals = config.goals
    this.supabase = config.supabase
    this.budgetLimit = config.budgetLimit || 0.05

    // Initialize services
    this.budgetEnforcer = BudgetEnforcer.create()
    this.memoryService = MemoryService.create(config.supabase)
    this.crewCoordinator = CrewCoordinator.create(config.supabase)
    this.auditService = AuditService.create(config.supabase)
  }

  /**
   * Execute 9-step Dark Forest compliant planning pipeline
   * Step-by-step execution with cost control and audit logging
   */
  async plan(): Promise<PlanningSession> {
    const startTime = Date.now()
    const operationId = `sprint-plan-${this.projectId}-${this.sprintId}-${Date.now()}`

    try {
      // STEP 1: Check budget - prevent overallocation
      await this.budgetEnforcer.checkBudget(this.projectId, this.budgetLimit)

      // STEP 2: Retrieve project memories - inject context
      const memories = await this.memoryService.getProjectMemories(this.projectId, 'sprint-planning')

      // STEP 3: Build memory-enriched prompt
      const promptBuilder = new PromptBuilder()
      const memoryContext = promptBuilder.build(memories)

      // STEP 4: Select crew member - assign planning role
      const crewSelection = await this.crewCoordinator.selectCrewMember(
        'sprint-planning',
        ['tactics', 'execution'],
        'standard'
      )
      const selectedCrew = crewSelection.selectedCrew || 'commander_riker'

      // STEP 5: Route to appropriate model - cost-optimized
      const modelSelection = await this.crewCoordinator.routeToModel({
        taskComplexity: 'medium',
        estimatedInputTokens: 1200,
        estimatedOutputTokens: 2000,
        crew: selectedCrew,
      })
      const modelId = modelSelection.modelId || 'anthropic/claude-3.5-sonnet'

      // STEP 6: Call OpenRouter API with planning prompt
      const apiResponse = await this.callOpenRouterAPI(
        modelId,
        memoryContext,
        selectedCrew
      )

      // STEP 7: Log operation to immutable audit trail
      await this.auditService.logOperation(
        {
          user_id: 'system',
          project_id: this.projectId,
          context: { sprintId: this.sprintId },
        },
        {
          operationId,
          action: 'sprint-plan',
          timestamp: new Date().toISOString(),
          cost: apiResponse.cost,
          tokens: {
            input: apiResponse.inputTokens,
            output: apiResponse.outputTokens,
          },
        },
        'sprint-planning',
        'success',
        {
          crewMember: selectedCrew,
          model: modelId,
          duration_ms: Date.now() - startTime,
        }
      )

      // STEP 8: Record spending - update budget tracker
      await this.budgetEnforcer.recordSpending(this.projectId, apiResponse.cost)

      // STEP 9: Return PlanningSession matching interface exactly
      const planningSession: PlanningSession = {
        summary: apiResponse.summary || 'Sprint planning session completed',
        crewAnalysis: apiResponse.crewAnalysis || [
          {
            crewMember: selectedCrew,
            perspective: 'AI-generated sprint analysis',
            storiesSuggested: apiResponse.totalStories || 10,
          },
        ],
        deliberation: {
          consensus: apiResponse.consensus || 'Sprint focused on core objectives',
          adjustmentsMade: apiResponse.adjustments || ['Prioritized high-impact work', 'Balanced team capacity'],
        },
        totalStories: apiResponse.totalStories || 10,
        totalPoints: apiResponse.totalPoints || 25,
        totalBudget: apiResponse.cost || 0.02,
        crewInvolved: apiResponse.crewInvolved || [selectedCrew],
        estimatedROI: apiResponse.roi || 2.5,
      }

      return planningSession
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      // Log failure
      await this.auditService.logOperation(
        {
          user_id: 'system',
          project_id: this.projectId,
          context: { sprintId: this.sprintId },
        },
        {
          operationId,
          action: 'sprint-plan',
          timestamp: new Date().toISOString(),
        },
        'sprint-planning',
        'failure',
        { error: message, duration_ms: Date.now() - startTime }
      )

      if (message.includes('budget')) {
        throw new Error('BudgetExceededError: Cannot execute sprint planning - budget limit exceeded')
      }

      throw error
    }
  }

  /**
   * Call OpenRouter API with planning prompt
   */
  private async callOpenRouterAPI(
    modelId: string,
    memoryContext: string,
    crewMember: string
  ): Promise<{
    summary: string
    crewAnalysis: Array<{ crewMember: string; perspective: string; storiesSuggested: number }>
    consensus: string
    adjustments: string[]
    totalStories: number
    totalPoints: number
    cost: number
    inputTokens: number
    outputTokens: number
    crewInvolved: string[]
    roi: number
  }> {
    const systemPrompt = `You are ${crewMember}, an expert sprint planner in the OpenRouter Crew Platform.
Your role is to analyze project goals and create detailed sprint plans.

Context from project memories:
${memoryContext}

Respond ONLY with valid JSON matching this structure:
{
  "summary": "Sprint planning analysis",
  "crewAnalysis": [{"crewMember": "string", "perspective": "string", "storiesSuggested": number}],
  "consensus": "Sprint consensus",
  "adjustments": ["adjustment1", "adjustment2"],
  "totalStories": number,
  "totalPoints": number,
  "crewInvolved": ["crew1", "crew2"],
  "roi": number
}

No markdown, no explanations - ONLY valid JSON.`

    const userPrompt = `Plan a sprint for these goals: ${this.goals.join(', ')}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 }

    // Parse JSON response
    let parsed: any
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch {
      parsed = {
        summary: 'Sprint planning completed',
        crewAnalysis: [],
        consensus: 'Sprint ready for execution',
        adjustments: [],
        totalStories: 10,
        totalPoints: 25,
        crewInvolved: [crewMember],
        roi: 2.5,
      }
    }

    // Calculate cost using shared CostCalculator for model-agnostic pricing
    // Assigned to: Quark (Cost optimization specialist)
    // This replaces hardcoded Sonnet pricing with actual model-aware calculations
    const totalCost = await CostCalculator.calculateActualCost(
      modelSelection.selectedModel,
      usage.prompt_tokens || 0,
      usage.completion_tokens || 0
    )

    return {
      summary: parsed.summary || 'Sprint planning analysis',
      crewAnalysis: parsed.crewAnalysis || [],
      consensus: parsed.consensus || 'Sprint ready',
      adjustments: parsed.adjustments || [],
      totalStories: parsed.totalStories || 10,
      totalPoints: parsed.totalPoints || 25,
      cost: totalCost,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      crewInvolved: parsed.crewInvolved || [crewMember],
      roi: parsed.roi || 2.5,
    }
  }
}

/**
 * Factory function for creating SprintPlanner instances
 */
export function createSprintPlanner(config: PlannerConfig): SprintPlanner {
  return new SprintPlanner(config)
}
