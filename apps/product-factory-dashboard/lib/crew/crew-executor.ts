/**
 * Selective crew executor.
 *
 * This is the CRITICAL enforcement layer that ensures only activated crew
 * members make LLM calls. Prevents the "all crew respond to every request"
 * problem by filtering crew at the execution layer.
 *
 * Workflow:
 * 1. Receives list of activated crew from orchestration
 * 2. Loads configs ONLY for activated crew
 * 3. Builds LLM requests ONLY for activated crew
 * 4. Executes with batching (groups by model)
 * 5. Returns responses ONLY from activated crew
 */

import fs from "fs";
import path from "path";
import { loadCrewConfig, getCrewModelForTier, CrewConfig } from "./crew-config-loader";
import { batchCrewRequests } from "../llm/batch-executor";
import {
  CrewLLMRequest,
  CrewLLMResponse,
  BatchExecutionResult
} from "../llm/types";
import { LLMTier } from "../orchestration/types";

/**
 * Request for executing selected crew members
 */
export interface CrewExecutionRequest {
  /** List of activated crew member IDs - ONLY these will be executed */
  activatedCrew: string[];

  /** Crew ID to LLM tier assignments */
  llmAssignments: Record<string, LLMTier>;

  /** The user's request/task */
  userRequest: string;

  /** Optional context */
  context?: Record<string, any>;
}

/**
 * Result of crew execution
 */
export interface CrewExecutionResult {
  /** Responses from activated crew members */
  crewResponses: Record<string, CrewLLMResponse>;

  /** Batching performance metrics */
  batchingMetrics: BatchExecutionResult;
}

/**
 * Load cost database for batching
 */
function loadCostDatabase(): any {
  const projectRoot = process.cwd();
  const costDbPath = path.join(projectRoot, "data", "llm-cost-database.json");

  try {
    const data = fs.readFileSync(costDbPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load cost database from ${costDbPath}:`, error);
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
 * Execute ONLY the selected crew members with batching.
 *
 * This function is the key enforcement point for selective crew activation.
 * It ensures that unselected crew members:
 * - Never have their configs loaded
 * - Never have LLM requests created
 * - Never make any API calls
 *
 * @param request - Execution request with activated crew list
 * @returns Execution result with crew responses and metrics
 */
export async function executeSelectedCrew(
  request: CrewExecutionRequest
): Promise<CrewExecutionResult> {
  const { activatedCrew, llmAssignments, userRequest, context } = request;

  console.log(
    `🚀 Executing ${activatedCrew.length} selected crew members: ` +
    `[${activatedCrew.join(", ")}]`
  );

  // Step 1: Load configs for ONLY activated crew
  const crewConfigs: Record<string, CrewConfig> = {};
  for (const crewId of activatedCrew) {
    try {
      crewConfigs[crewId] = loadCrewConfig(crewId);
    } catch (error) {
      console.error(`Failed to load config for ${crewId}:`, error);
      throw error;
    }
  }

  console.log(
    `✅ Loaded ${Object.keys(crewConfigs).length} crew configs`
  );

  // Step 2: Build CrewLLMRequest[] for ONLY activated crew
  const crewRequests: CrewLLMRequest[] = activatedCrew.map(crewId => {
    const config = crewConfigs[crewId];
    const tier = llmAssignments[crewId];

    return {
      crewId,
      crewName: config.name,
      systemPrompt: config.aiConfiguration.systemPrompt,
      userRequest,
      context,
      temperature: config.aiConfiguration.temperature,
      maxTokens: config.aiConfiguration.maxTokens
    };
  });

  console.log(
    `📝 Built ${crewRequests.length} LLM requests for activated crew`
  );

  // Step 3: Execute with batching
  console.log("⚡ Executing crew tasks with intelligent batching...");

  const costDatabase = loadCostDatabase();
  const batchResult = await batchCrewRequests(
    crewRequests,
    crewConfigs,
    llmAssignments,
    costDatabase
  );

  console.log(
    `✅ Execution complete: ` +
    `${batchResult.totalApiCalls} API calls, ` +
    `${batchResult.batchedGroups} batched groups, ` +
    `$${batchResult.totalCost.toFixed(4)} total cost`
  );

  // Step 4: Return results
  return {
    crewResponses: batchResult.crewResponses,
    batchingMetrics: batchResult
  };
}

/**
 * Validate that only activated crew have responses.
 * This is a safety check to ensure no unintended crew were executed.
 *
 * @param activatedCrew - List of crew that should have responses
 * @param responses - Actual responses received
 * @throws Error if responses contain unexpected crew members
 */
export function validateCrewResponses(
  activatedCrew: string[],
  responses: Record<string, CrewLLMResponse>
): void {
  const responseCrewIds = Object.keys(responses);
  const unexpected = responseCrewIds.filter(
    id => !activatedCrew.includes(id)
  );

  if (unexpected.length > 0) {
    throw new Error(
      `Unexpected crew responses from: ${unexpected.join(", ")}. ` +
      `Only activated crew should respond.`
    );
  }

  const missing = activatedCrew.filter(
    id => !responseCrewIds.includes(id)
  );

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing responses from activated crew: ${missing.join(", ")}`
    );
  }
}
