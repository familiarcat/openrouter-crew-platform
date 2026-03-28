/**
 * Main crew orchestration module.
 *
 * Combines Picard's strategic task analysis with Quark's cost optimization
 * to orchestrate intelligent crew activation. Port of Python implementation
 * from src/rag_factory/orchestration/crew_orchestrator.py lines 376-438.
 */

import fs from "fs";
import path from "path";
import { analyzePicardTask } from "./picard-analyzer";
import { optimizeQuarkROI, calculateCostFromTiers } from "./quark-optimizer";
import { selectOpenRouterModel } from "@/lib/llm/model-selector";
import {
  OrchestrationResult,
  LLMTier,
  ROIAnalysis,
  CostDatabase
} from "./types";

/**
 * Load the LLM cost database from data/llm-cost-database.json
 */
function loadCostDatabase(): CostDatabase {
  const projectRoot = process.cwd();
  const costDbPath = path.join(projectRoot, "data", "llm-cost-database.json");

  try {
    const data = fs.readFileSync(costDbPath, "utf-8");
    return JSON.parse(data) as CostDatabase;
  } catch (error) {
    console.error(`Failed to load cost database from ${costDbPath}:`, error);
    // Return a minimal fallback database
    return {
      tiers: {},
      cost_calculations: {
        cost_per_request: {
          premium_mid: { cost_usd: 0.0135 },
          standard: { cost_usd: 0.01 },
          budget: { cost_usd: 0.001575 },
          ultra_budget: { cost_usd: 0.0003 }
        }
      }
    };
  }
}

/**
 * Orchestrate cost-optimized crew activation.
 *
 * This is the main entry point for crew orchestration. It combines:
 * 1. Picard's strategic task analysis
 * 2. Quark's ROI optimization
 * 3. Returns complete orchestration result
 *
 * Workflow:
 * - Picard analyzes task → determines complexity & required crew
 * - Quark performs ROI analysis → optimizes LLM tier selection
 * - Returns orchestration result with activated crew and tier assignments
 *
 * @param userRequest - The user's task request
 * @param context - Optional context about the task
 * @param tierOverride - Optional tier overrides for drill testing
 * @returns Complete orchestration result
 */
export async function orchestrateCrewActivation(
  userRequest: string,
  context?: Record<string, any>,
  tierOverride?: Record<string, LLMTier>
): Promise<OrchestrationResult> {
  console.log("🎖️  Picard analyzing task...");

  // Step 1: Picard's strategic analysis
  const taskAnalysis = analyzePicardTask(userRequest, context);

  console.log(
    `📊 Task complexity: ${taskAnalysis.complexity}, ` +
    `Recommended crew: ${taskAnalysis.recommendedCrew.length} members`
  );

  // Step 2: Quark's ROI analysis
  let roiAnalysis: ROIAnalysis;
  let llmAssignments: Record<string, LLMTier>;
  let estimatedCost: number;

  if (tierOverride) {
    // Use tier override (for drill testing)
    console.log("💰 Using tier override for drill testing...");
    llmAssignments = tierOverride;
    const costDb = loadCostDatabase();
    estimatedCost = calculateCostFromTiers(tierOverride, costDb);

    // Create simplified ROI analysis
    roiAnalysis = {
      totalCostPremium: estimatedCost * 1.5, // Estimate
      totalCostOptimized: estimatedCost,
      costSavings: estimatedCost * 0.5,
      savingsPercentage: 33.3,
      crewLLMAssignments: llmAssignments,
      recommendation: `Using tier override for testing: $${estimatedCost.toFixed(4)}`
    };
  } else {
    console.log("💰 Riker coordinating with Quark for ROI analysis...");
    const costDb = loadCostDatabase();
    roiAnalysis = optimizeQuarkROI(
      taskAnalysis,
      taskAnalysis.recommendedCrew,
      costDb
    );
    llmAssignments = roiAnalysis.crewLLMAssignments;
    estimatedCost = roiAnalysis.totalCostOptimized;
  }

  // Step 3: Assemble orchestration result
  const result: OrchestrationResult = {
    activatedCrew: taskAnalysis.recommendedCrew,
    llmAssignments,
    taskComplexity: taskAnalysis.complexity,
    estimatedCost,
    picardReasoning: taskAnalysis.reasoning,
    quarkROIAnalysis: roiAnalysis
  };

  console.log(
    `✅ Orchestration complete: ${result.activatedCrew.length} crew members, ` +
    `$${result.estimatedCost.toFixed(4)} estimated cost ` +
    `(${roiAnalysis.savingsPercentage.toFixed(1)}% savings)`
  );

  return result;
}
