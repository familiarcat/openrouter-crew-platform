/**
 * Batch executor for crew LLM requests.
 *
 * This module orchestrates the batching of multiple crew member LLM calls,
 * grouping by model, building combined prompts, parsing responses, and
 * tracking usage/costs.
 */

import { OpenRouterClient } from "./openrouter-client";
import {
  CrewLLMRequest,
  CrewLLMResponse,
  BatchExecutionResult,
  RequestType,
  ParseError,
  ParseErrorType,
  BatchGroup,
} from "./types";

const DELIMITER_PREFIX = "---CREW:";
const DELIMITER_SUFFIX = "---";
const END_MARKER = "---END_RESPONSES---";

/**
 * Main entry point: batch crew requests and execute with LLM API.
 */
export async function batchCrewRequests(
  crewRequests: CrewLLMRequest[],
  crewConfigs: Record<string, any>,
  llmTierAssignments: Record<string, string>,
  costDatabase: any
): Promise<BatchExecutionResult> {
  const startTime = Date.now();
  const client = new OpenRouterClient();

  try {
    // Step 1: Group crew members by model
    const batchGroups = groupCrewByModel(
      crewRequests,
      crewConfigs,
      llmTierAssignments
    );

    console.log(
      `[Batch] Grouped ${crewRequests.length} crew into ${batchGroups.length} batches`
    );

    // Step 2: Execute each batch group
    const allResponses: Record<string, CrewLLMResponse> = {};
    let totalApiCalls = 0;
    let batchedGroups = 0;
    let totalCost = 0;
    let totalTokens = 0;
    let fallbackUsed = false;
    const errors: string[] = [];

    for (const group of batchGroups) {
      const groupRequests = crewRequests.filter((req) =>
        group.crewIds.includes(req.crewId)
      );

      if (group.crewIds.length === 1) {
        // Single crew - execute individually
        const response = await executeIndividualRequest(
          groupRequests[0],
          group.modelId,
          client,
          costDatabase
        );
        allResponses[response.crewId] = response;
        totalApiCalls++;
        totalCost += response.costUsd;
        totalTokens += response.totalTokens;
      } else {
        // Multiple crew - batch them
        try {
          const batchResponses = await executeBatchedRequest(
            groupRequests,
            group.modelId,
            group.temperature,
            client,
            costDatabase
          );

          for (const response of batchResponses) {
            allResponses[response.crewId] = response;
          }

          totalApiCalls++;
          batchedGroups++;
          totalCost += batchResponses.reduce((sum, r) => sum + r.costUsd, 0);
          totalTokens += batchResponses.reduce((sum, r) => sum + r.totalTokens, 0);
        } catch (error) {
          console.warn(
            `[Batch] Batching failed for ${group.modelId}, falling back to individual calls`,
            error
          );

          fallbackUsed = true;
          errors.push(
            `Batch failed for ${group.modelId}: ${error instanceof Error ? error.message : String(error)}`
          );

          // Fallback: execute individually
          for (const request of groupRequests) {
            const response = await executeIndividualRequest(
              request,
              group.modelId,
              client,
              costDatabase
            );
            allResponses[response.crewId] = response;
            totalApiCalls++;
            totalCost += response.costUsd;
            totalTokens += response.totalTokens;
          }
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      crewResponses: allResponses,
      totalApiCalls,
      batchedGroups,
      totalCost,
      totalTokens,
      executionTimeMs,
      fallbackUsed,
      errors,
    };
  } catch (error) {
    console.error("[Batch] Fatal error:", error);
    throw error;
  }
}

/**
 * Group crew members by (model_id, temperature).
 */
function groupCrewByModel(
  crewRequests: CrewLLMRequest[],
  crewConfigs: Record<string, any>,
  llmTierAssignments: Record<string, string>
): BatchGroup[] {
  const groups = new Map<string, BatchGroup>();

  for (const request of crewRequests) {
    const tier = llmTierAssignments[request.crewId] || "standard";
    const crewConfig = crewConfigs[request.crewId];

    if (!crewConfig) {
      console.warn(`[Batch] No config for crew ${request.crewId}, skipping`);
      continue;
    }

    // Get model from tier
    const tieredModels = crewConfig.aiConfiguration?.tieredModels || {};
    const tierConfig = tieredModels[tier];

    if (!tierConfig) {
      console.warn(
        `[Batch] No tier '${tier}' for crew ${request.crewId}, skipping`
      );
      continue;
    }

    const modelId = tierConfig.primary;
    const temperature = request.temperature || crewConfig.aiConfiguration?.temperature || 0.7;

    // Group key: model@temperature
    const groupKey = `${modelId}@${temperature.toFixed(2)}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        modelId,
        temperature,
        crewIds: [],
        crewConfigs: [],
      });
    }

    const group = groups.get(groupKey)!;
    group.crewIds.push(request.crewId);
    group.crewConfigs.push(crewConfig);
  }

  return Array.from(groups.values());
}

/**
 * Execute a single individual request.
 */
async function executeIndividualRequest(
  request: CrewLLMRequest,
  modelId: string,
  client: OpenRouterClient,
  costDatabase: any
): Promise<CrewLLMResponse> {
  const messages = [
    {
      role: "system" as const,
      content: request.systemPrompt,
    },
    {
      role: "user" as const,
      content: request.userRequest,
    },
  ];

  const response = await client.createCompletion(
    modelId,
    messages,
    request.temperature || 0.7,
    request.maxTokens || 2000
  );

  const pricing = client.getModelPricing(modelId, costDatabase);
  const cost = pricing
    ? client.estimateCost(
        modelId,
        response.usage.prompt_tokens,
        response.usage.completion_tokens,
        pricing
      )
    : 0;

  return {
    crewId: request.crewId,
    responseText: response.choices[0]?.message?.content || "",
    promptTokens: response.usage.prompt_tokens,
    completionTokens: response.usage.completion_tokens,
    totalTokens: response.usage.total_tokens,
    costUsd: cost,
    modelUsed: modelId,
    requestType: RequestType.INDIVIDUAL,
    latencyMs: response._latencyMs || 0,
  };
}

/**
 * Execute a batched request for multiple crew members.
 */
async function executeBatchedRequest(
  requests: CrewLLMRequest[],
  modelId: string,
  temperature: number,
  client: OpenRouterClient,
  costDatabase: any
): Promise<CrewLLMResponse[]> {
  // Build combined prompt
  const combinedPrompt = buildBatchedPrompt(requests);

  // Calculate max tokens (sum + 10% buffer)
  const totalMaxTokens = requests.reduce((sum, r) => sum + (r.maxTokens || 2000), 0);
  const maxTokens = Math.floor(totalMaxTokens * 1.1);

  // Make API call
  const messages = [
    {
      role: "user" as const,
      content: combinedPrompt,
    },
  ];

  const response = await client.createCompletion(
    modelId,
    messages,
    temperature,
    maxTokens
  );

  const responseText = response.choices[0]?.message?.content || "";

  // Parse batched response
  const parsedResponses = parseBatchedResponse(
    responseText,
    requests.map((r) => r.crewId)
  );

  // Attribute usage to each crew member
  const crewResponses = attributeUsageToCrews(
    parsedResponses,
    requests,
    response.usage,
    modelId,
    costDatabase,
    client,
    response._latencyMs || 0
  );

  return crewResponses;
}

/**
 * Build a combined prompt for multiple crew members.
 */
function buildBatchedPrompt(requests: CrewLLMRequest[]): string {
  const parts: string[] = [];

  // System context
  parts.push(
    "SYSTEM CONTEXT:",
    "You are being consulted in multiple roles for a single task. " +
      "Provide separate responses for each role, maintaining distinct personalities.",
    ""
  );

  // User request
  parts.push("USER REQUEST:", requests[0].userRequest, "");

  // Formatting instructions
  parts.push("RESPONSE FORMAT INSTRUCTIONS:");
  parts.push("Provide responses using EXACTLY these delimiters:");
  parts.push("");

  for (const req of requests) {
    parts.push(`${DELIMITER_PREFIX} ${req.crewId} ${DELIMITER_SUFFIX}`);
    parts.push(`[Your response as ${req.crewName}]`);
    parts.push("");
  }

  parts.push(END_MARKER);
  parts.push("");

  // Crew details
  parts.push("CREW MEMBER DETAILS:");
  parts.push("");

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    parts.push(`${"=".repeat(60)}`);
    parts.push(`CREW MEMBER ${i + 1}: ${req.crewId}`);
    parts.push(`${"=".repeat(60)}`);
    parts.push(`Name: ${req.crewName}`);
    parts.push("");
    parts.push("System Prompt:");
    parts.push(req.systemPrompt);
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Parse batched response into individual crew responses.
 */
function parseBatchedResponse(
  responseText: string,
  expectedCrewIds: string[]
): Record<string, string> {
  const crewResponses: Record<string, string> = {};

  const delimiterPattern = new RegExp(
    `${DELIMITER_PREFIX}\\s*(\\w+)\\s*${DELIMITER_SUFFIX}\\s*\\n([\\s\\S]*?)(?=${DELIMITER_PREFIX}|${END_MARKER}|$)`,
    "g"
  );

  let match;
  while ((match = delimiterPattern.exec(responseText)) !== null) {
    const crewId = match[1].trim();
    const response = match[2].trim();

    if (expectedCrewIds.includes(crewId)) {
      crewResponses[crewId] = response;
    }
  }

  // Validate all expected crew IDs are present
  const missing = expectedCrewIds.filter((id) => !crewResponses[id]);
  if (missing.length > 0) {
    throw new ParseError(
      `Missing responses for: ${missing.join(", ")}`,
      ParseErrorType.INCOMPLETE_RESPONSE,
      expectedCrewIds,
      Object.keys(crewResponses)
    );
  }

  // Validate response quality
  for (const [crewId, response] of Object.entries(crewResponses)) {
    if (response.length < 50) {
      throw new ParseError(
        `Response for ${crewId} too short (${response.length} chars)`,
        ParseErrorType.QUALITY_VALIDATION_FAILED,
        expectedCrewIds,
        Object.keys(crewResponses)
      );
    }
  }

  return crewResponses;
}

/**
 * Attribute token usage and costs to individual crew members.
 */
function attributeUsageToCrews(
  parsedResponses: Record<string, string>,
  requests: CrewLLMRequest[],
  totalUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  modelId: string,
  costDatabase: any,
  client: OpenRouterClient,
  latencyMs: number
): CrewLLMResponse[] {
  const responses: CrewLLMResponse[] = [];

  // Calculate total character counts for proportional attribution
  const totalPromptChars = requests.reduce(
    (sum, r) => sum + r.systemPrompt.length,
    0
  );
  const totalResponseChars = Object.values(parsedResponses).reduce(
    (sum, r) => sum + r.length,
    0
  );

  const pricing = client.getModelPricing(modelId, costDatabase);

  for (const request of requests) {
    const response = parsedResponses[request.crewId];

    // Proportional token attribution
    const promptRatio = request.systemPrompt.length / totalPromptChars;
    const responseRatio = response.length / totalResponseChars;

    const promptTokens = Math.floor(totalUsage.prompt_tokens * promptRatio);
    const completionTokens = Math.floor(
      totalUsage.completion_tokens * responseRatio
    );
    const totalTokens = promptTokens + completionTokens;

    // Calculate cost
    const cost = pricing
      ? client.estimateCost(modelId, promptTokens, completionTokens, pricing)
      : 0;

    responses.push({
      crewId: request.crewId,
      responseText: response,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd: cost,
      modelUsed: modelId,
      requestType: RequestType.BATCHED,
      latencyMs,
    });
  }

  return responses;
}
