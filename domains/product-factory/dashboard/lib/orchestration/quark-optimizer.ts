/**
 * Quark's ROI analysis and cost optimization module.
 *
 * Optimizes LLM tier selection for crew members based on task complexity
 * and crew roles to maximize cost efficiency while maintaining quality.
 * Port of Python implementation from src/rag_factory/orchestration/crew_orchestrator.py
 * lines 294-374.
 */

import { TaskComplexity, LLMTier, TaskAnalysis, ROIAnalysis, CostDatabase } from "./types";

/**
 * Tier assignment rules based on task complexity and crew member
 *
 * Philosophy:
 * - CRITICAL tasks: Use premium for Picard's strategy, standard for execution
 * - IMPORTANT tasks: Standard for leadership, budget for implementation
 * - ROUTINE tasks: Budget for most, standard only for Picard
 * - TRIVIAL tasks: Ultra-budget for all except Riker (budget)
 */
const COMPLEXITY_TIER_MAP: Record<TaskComplexity, Record<string, LLMTier>> = {
  [TaskComplexity.CRITICAL]: {
    captain_picard: LLMTier.PREMIUM,
    commander_riker: LLMTier.STANDARD,
    default: LLMTier.STANDARD
  },
  [TaskComplexity.IMPORTANT]: {
    captain_picard: LLMTier.STANDARD,
    commander_riker: LLMTier.STANDARD,
    default: LLMTier.BUDGET
  },
  [TaskComplexity.ROUTINE]: {
    captain_picard: LLMTier.STANDARD,
    commander_riker: LLMTier.BUDGET,
    default: LLMTier.BUDGET
  },
  [TaskComplexity.TRIVIAL]: {
    commander_riker: LLMTier.BUDGET,
    default: LLMTier.ULTRA_BUDGET
  }
};

/**
 * Optimize LLM tier selection and calculate ROI.
 *
 * This function implements Quark's cost optimization strategy:
 * 1. Calculate premium cost baseline (all crew with premium tier)
 * 2. Assign optimal tiers based on complexity and crew role
 * 3. Calculate optimized cost
 * 4. Compute savings
 *
 * @param taskAnalysis - Picard's task analysis
 * @param activatedCrew - List of crew member IDs to optimize
 * @param costDatabase - Cost database with tier pricing
 * @returns ROI analysis with tier assignments and cost savings
 */
export function optimizeQuarkROI(
  taskAnalysis: TaskAnalysis,
  activatedCrew: string[],
  costDatabase: CostDatabase
): ROIAnalysis {
  // Extract cost map from database
  const costMap = {
    [LLMTier.PREMIUM]: costDatabase.cost_calculations.cost_per_request.premium_mid?.cost_usd ?? 0.0135,
    [LLMTier.STANDARD]: costDatabase.cost_calculations.cost_per_request.standard?.cost_usd ?? 0.01,
    [LLMTier.BUDGET]: costDatabase.cost_calculations.cost_per_request.budget?.cost_usd ?? 0.001575,
    [LLMTier.ULTRA_BUDGET]: costDatabase.cost_calculations.cost_per_request.ultra_budget?.cost_usd ?? 0.0003
  };

  // Step 1: Calculate premium cost (all crew with premium tier)
  const totalCostPremium = activatedCrew.length * costMap[LLMTier.PREMIUM];

  // Step 2: Assign optimal tiers based on complexity and crew role
  const tierAssignments = COMPLEXITY_TIER_MAP[taskAnalysis.complexity];
  const crewLLMAssignments: Record<string, LLMTier> = {};
  let totalCostOptimized = 0;

  for (const crewId of activatedCrew) {
    // Get tier for this crew member (use crew-specific or default)
    const tier = tierAssignments[crewId] ?? tierAssignments.default;
    crewLLMAssignments[crewId] = tier;

    // Add cost for this crew member
    totalCostOptimized += costMap[tier];
  }

  // Step 3: Calculate savings
  const costSavings = totalCostPremium - totalCostOptimized;
  const savingsPercentage = totalCostPremium > 0
    ? (costSavings / totalCostPremium) * 100
    : 0;

  // Step 4: Generate recommendation
  const recommendation =
    `Optimized crew activation saves $${costSavings.toFixed(4)} (${savingsPercentage.toFixed(1)}%) ` +
    `compared to premium-only approach. ` +
    `Total estimated cost: $${totalCostOptimized.toFixed(4)}`;

  return {
    totalCostPremium,
    totalCostOptimized,
    costSavings,
    savingsPercentage,
    crewLLMAssignments,
    recommendation
  };
}

/**
 * Calculate total cost from tier assignments.
 * Helper function for drill testing with tier overrides.
 *
 * @param tierAssignments - Map of crew ID to tier
 * @param costDatabase - Cost database
 * @returns Total cost in USD
 */
export function calculateCostFromTiers(
  tierAssignments: Record<string, LLMTier>,
  costDatabase: CostDatabase
): number {
  const costMap = {
    [LLMTier.PREMIUM]: costDatabase.cost_calculations.cost_per_request.premium_mid?.cost_usd ?? 0.0135,
    [LLMTier.STANDARD]: costDatabase.cost_calculations.cost_per_request.standard?.cost_usd ?? 0.01,
    [LLMTier.BUDGET]: costDatabase.cost_calculations.cost_per_request.budget?.cost_usd ?? 0.001575,
    [LLMTier.ULTRA_BUDGET]: costDatabase.cost_calculations.cost_per_request.ultra_budget?.cost_usd ?? 0.0003
  };

  return Object.values(tierAssignments).reduce(
    (total, tier) => total + costMap[tier],
    0
  );
}
