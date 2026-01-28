/**
 * Type definitions for LLM batching system.
 *
 * This module defines the core types and interfaces used for batched LLM API calls,
 * including request/response models, batching results, and error types.
 */

export enum RequestType {
  BATCHED = "batched",
  INDIVIDUAL = "individual",
  FALLBACK = "fallback",
}

export enum ParseErrorType {
  MISSING_DELIMITER = "missing_delimiter",
  INCOMPLETE_RESPONSE = "incomplete_response",
  MALFORMED_FORMAT = "malformed_format",
  QUALITY_VALIDATION_FAILED = "quality_validation_failed",
}

export interface CrewLLMRequest {
  crewId: string;
  crewName: string;
  systemPrompt: string;
  userRequest: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
}

export interface BatchedRequest {
  modelId: string;
  crewRequests: CrewLLMRequest[];
  combinedPrompt: string;
  temperature: number;
  maxTokens: number;
  metadata?: Record<string, any>;
}

export interface CrewLLMResponse {
  crewId: string;
  responseText: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  modelUsed: string;
  requestType: RequestType;
  latencyMs?: number;
  metadata?: Record<string, any>;
}

export interface BatchExecutionResult {
  crewResponses: Record<string, CrewLLMResponse>;
  totalApiCalls: number;
  batchedGroups: number;
  totalCost: number;
  totalTokens: number;
  executionTimeMs: number;
  fallbackUsed: boolean;
  errors: string[];
  metadata?: Record<string, any>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelPricing {
  modelId: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  contextWindow: number;
}

export interface BatchGroup {
  modelId: string;
  temperature: number;
  crewIds: string[];
  crewConfigs: Record<string, any>[];
}

export interface BatchingMetrics {
  timestamp: Date;
  totalRequests: number;
  batchedRequests: number;
  individualRequests: number;
  fallbackRequests: number;
  totalApiCalls: number;
  totalCostUsd: number;
  averageLatencyMs: number;
  parseSuccessRate: number;
  costSavingsPercentage: number;
}

export class ParseError extends Error {
  public errorType: ParseErrorType;
  public expectedCrewIds: string[];
  public foundCrewIds: string[];

  constructor(
    message: string,
    errorType: ParseErrorType,
    expectedCrewIds: string[] = [],
    foundCrewIds: string[] = []
  ) {
    super(message);
    this.name = "ParseError";
    this.errorType = errorType;
    this.expectedCrewIds = expectedCrewIds;
    this.foundCrewIds = foundCrewIds;
  }

  get missingCrewIds(): string[] {
    return this.expectedCrewIds.filter(
      (id) => !this.foundCrewIds.includes(id)
    );
  }
}

export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class RateLimitError extends OpenRouterError {
  constructor(message: string = "OpenRouter rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class AuthenticationError extends OpenRouterError {
  constructor(message: string = "Invalid OpenRouter API key") {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Utility types for OpenRouter API

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;
  _latencyMs?: number;
}

// Helper functions

export function calculateSavingsPercentage(
  crewCount: number,
  apiCalls: number
): number {
  if (crewCount === 0) return 0;
  return ((crewCount - apiCalls) / crewCount) * 100;
}

export function calculateSuccessRate(
  responses: Record<string, CrewLLMResponse>
): number {
  const total = Object.keys(responses).length;
  if (total === 0) return 0;

  const successful = Object.values(responses).filter(
    (r) => r.responseText && r.responseText.length > 0
  ).length;

  return (successful / total) * 100;
}

export function calculateAverageCostPerCrew(
  totalCost: number,
  crewCount: number
): number {
  return crewCount > 0 ? totalCost / crewCount : 0;
}

export function tokenUsageFromApiResponse(usage: OpenRouterUsage): TokenUsage {
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}
