/**
 * Crew Execution API
 *
 * Endpoint: POST /api/crew/execute
 *
 * Executes ONLY the selected crew members with intelligent batching.
 * This endpoint enforces selective crew activation - unselected crew
 * members will NOT make any LLM calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeSelectedCrew, validateCrewResponses } from '@/lib/crew';
import { LLMTier } from '@/lib/orchestration/types';

interface ExecutionRequest {
  /** List of activated crew member IDs - ONLY these will be executed */
  activatedCrew: string[];

  /** Crew ID to LLM tier assignments */
  llmAssignments: Record<string, string>;

  /** The user's task/request */
  userRequest: string;

  /** Optional context */
  context?: Record<string, any>;
}

interface ExecutionResponse {
  success: boolean;
  crewResponses?: Record<string, {
    responseText: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    modelUsed: string;
    requestType: string;
    latencyMs?: number;
  }>;
  batchingMetrics?: {
    totalApiCalls: number;
    batchedGroups: number;
    totalCost: number;
    totalTokens: number;
    executionTimeMs: number;
    fallbackUsed: boolean;
    errors?: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecutionRequest = await request.json();

    // Validate required fields
    if (!body.activatedCrew || body.activatedCrew.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'activatedCrew is required and must not be empty'
        } as ExecutionResponse,
        { status: 400 }
      );
    }

    if (!body.llmAssignments) {
      return NextResponse.json(
        {
          success: false,
          error: 'llmAssignments is required'
        } as ExecutionResponse,
        { status: 400 }
      );
    }

    if (!body.userRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'userRequest is required'
        } as ExecutionResponse,
        { status: 400 }
      );
    }

    // Convert string tier assignments to LLMTier enum
    const llmAssignments = Object.entries(body.llmAssignments).reduce(
      (acc, [crewId, tier]) => {
        acc[crewId] = tier as LLMTier;
        return acc;
      },
      {} as Record<string, LLMTier>
    );

    // Execute ONLY the selected crew
    const result = await executeSelectedCrew({
      activatedCrew: body.activatedCrew,
      llmAssignments,
      userRequest: body.userRequest,
      context: body.context
    });

    // Validate that only activated crew responded
    validateCrewResponses(body.activatedCrew, result.crewResponses);

    return NextResponse.json({
      success: true,
      crewResponses: result.crewResponses,
      batchingMetrics: {
        totalApiCalls: result.batchingMetrics.totalApiCalls,
        batchedGroups: result.batchingMetrics.batchedGroups,
        totalCost: result.batchingMetrics.totalCost,
        totalTokens: result.batchingMetrics.totalTokens,
        executionTimeMs: result.batchingMetrics.executionTimeMs,
        fallbackUsed: result.batchingMetrics.fallbackUsed,
        errors: result.batchingMetrics.errors
      }
    } as ExecutionResponse);

  } catch (error) {
    console.error('Crew execution error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ExecutionResponse,
      { status: 500 }
    );
  }
}
