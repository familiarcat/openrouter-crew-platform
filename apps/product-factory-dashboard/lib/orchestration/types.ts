/**
 * Type definitions for intelligent crew orchestration system.
 *
 * This module defines the core types for Picard's task analysis,
 * Quark's cost optimization, and the overall orchestration workflow.
 */

/**
 * Task complexity levels for crew activation and cost optimization
 */
export enum TaskComplexity {
  CRITICAL = "critical",    // High-stakes strategic decisions, architecture
  IMPORTANT = "important",  // Significant features or bug fixes
  ROUTINE = "routine",      // Standard implementation tasks
  TRIVIAL = "trivial"       // Simple queries or formatting changes
}

/**
 * LLM cost tiers for dynamic model selection
 */
export enum LLMTier {
  PREMIUM = "premium",          // Highest capability (~$0.0135 per request)
  STANDARD = "standard",        // Balanced performance (~$0.01 per request)
  BUDGET = "budget",            // Cost-efficient (~$0.001575 per request)
  ULTRA_BUDGET = "ultra_budget" // Minimal cost (~$0.0003 per request)
}

/**
 * Picard's strategic analysis of a task
 */
export interface TaskAnalysis {
  /** Assessed complexity level */
  complexity: TaskComplexity;

  /** Required areas of expertise */
  requiredExpertise: string[];

  /** Recommended crew member IDs */
  recommendedCrew: string[];

  /** Picard's reasoning for crew selection */
  reasoning: string;

  /** Estimated optimal crew size */
  estimatedCrewSize: number;
}

/**
 * Quark's ROI analysis and cost optimization
 */
export interface ROIAnalysis {
  /** Total cost if all crew used premium tier */
  totalCostPremium: number;

  /** Total cost with optimized tier assignments */
  totalCostOptimized: number;

  /** Absolute cost savings */
  costSavings: number;

  /** Percentage of cost savings */
  savingsPercentage: number;

  /** Crew member ID to assigned LLM tier mapping */
  crewLLMAssignments: Record<string, LLMTier>;

  /** Quark's recommendation text */
  recommendation: string;
}

/**
 * Complete orchestration result
 */
export interface OrchestrationResult {
  /** List of activated crew member IDs */
  activatedCrew: string[];

  /** Crew ID to LLM tier assignments */
  llmAssignments: Record<string, LLMTier>;

  /** Assessed task complexity */
  taskComplexity: TaskComplexity;

  /** Estimated total cost */
  estimatedCost: number;

  /** Picard's reasoning */
  picardReasoning: string;

  /** Quark's complete ROI analysis */
  quarkROIAnalysis: ROIAnalysis;
}

/**
 * Crew member roster configuration
 */
export interface CrewMember {
  id: string;
  name: string;
  specialization: string[];
  recommendedTier: LLMTier;
  costPerRequest: number;
}

/**
 * Cost database structure
 */
export interface CostDatabase {
  tiers: {
    [tierName: string]: {
      models: Array<{
        id: string;
        input_cost: number;
        output_cost: number;
        context_window: number;
      }>;
    };
  };
  cost_calculations: {
    cost_per_request: {
      [tierName: string]: {
        cost_usd: number;
      };
    };
  };
  crew_recommendations?: {
    [crewId: string]: {
      primary_tier: string;
    };
  };
}
