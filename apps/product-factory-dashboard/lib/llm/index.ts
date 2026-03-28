/**
 * LLM batching module for optimized OpenRouter API calls.
 *
 * This module provides intelligent batching of LLM calls for crew members
 * using the same model, reducing API overhead by 30-60%.
 */

export * from "./types";
export * from "./openrouter-client";
export { batchCrewRequests } from "./batch-executor";
