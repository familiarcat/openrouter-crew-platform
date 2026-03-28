/**
 * Cost-Optimized Crew Orchestration API
 *
 * Endpoint: POST /api/crew/orchestrate
 *
 * Implements Picard → Riker + Quark workflow for minimal-cost crew activation
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrateCrewActivation } from '@/lib/orchestration';
import { LLMTier } from '@/lib/orchestration/types';

interface OrchestrationRequest {
  task: string;
  context?: Record<string, any>;
  forceCrewMembers?: string[];
  maxCost?: number;
  preferredTier?: 'premium' | 'standard' | 'budget' | 'ultra_budget';
}

interface OrchestrationResponse {
  success: boolean;
  orchestration?: {
    activatedCrew: string[];
    llmAssignments: Record<string, string>;
    taskComplexity: string;
    estimatedCost: number;
    picardReasoning: string;
    quarkROI: {
      totalCostPremium: number;
      totalCostOptimized: number;
      costSavings: number;
      savingsPercentage: number;
      recommendation: string;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestrationRequest = await request.json();

    if (!body.task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task description is required'
        } as OrchestrationResponse,
        { status: 400 }
      );
    }

    // Call TypeScript orchestrator
    // Note: tierOverride supports drill testing with forceCrewMembers
    const tierOverride = body.forceCrewMembers
      ? body.forceCrewMembers.reduce((acc, crewId) => {
          const tier = body.preferredTier || 'standard';
          acc[crewId] = tier as LLMTier;
          return acc;
        }, {} as Record<string, LLMTier>)
      : undefined;

    const orchestration = await orchestrateCrewActivation(
      body.task,
      body.context,
      tierOverride
    );

    return NextResponse.json({
      success: true,
      orchestration: {
        activatedCrew: orchestration.activatedCrew,
        llmAssignments: orchestration.llmAssignments,
        taskComplexity: orchestration.taskComplexity,
        estimatedCost: orchestration.estimatedCost,
        picardReasoning: orchestration.picardReasoning,
        quarkROI: {
          totalCostPremium: orchestration.quarkROIAnalysis.totalCostPremium,
          totalCostOptimized: orchestration.quarkROIAnalysis.totalCostOptimized,
          costSavings: orchestration.quarkROIAnalysis.costSavings,
          savingsPercentage: orchestration.quarkROIAnalysis.savingsPercentage,
          recommendation: orchestration.quarkROIAnalysis.recommendation
        }
      }
    } as OrchestrationResponse);

  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as OrchestrationResponse,
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve orchestration cost estimates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const complexity = searchParams.get('complexity') || 'routine';
    const crewSize = parseInt(searchParams.get('crewSize') || '3');

    // Calculate cost estimates based on complexity
    const costMap = {
      critical: { premium: 0.0135, standard: 0.01, budget: 0.001575 },
      important: { premium: 0.0135, standard: 0.01, budget: 0.001575 },
      routine: { premium: 0.0135, standard: 0.01, budget: 0.001575 },
      trivial: { premium: 0.0135, standard: 0.01, budget: 0.0003 }
    };

    const costs = costMap[complexity as keyof typeof costMap] || costMap.routine;

    return NextResponse.json({
      success: true,
      estimates: {
        complexity,
        crewSize,
        premiumCost: costs.premium * crewSize,
        standardCost: costs.standard * crewSize,
        budgetCost: costs.budget * crewSize,
        optimizedEstimate: complexity === 'critical'
          ? costs.premium + (costs.standard * (crewSize - 1))
          : costs.budget * crewSize
      }
    });

  } catch (error) {
    console.error('Cost estimation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
