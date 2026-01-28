/**
 * Cost Tracking Types
 */

export type ModelTier = 'premium' | 'standard' | 'budget' | 'ultra_budget';
export type Provider = 'openrouter' | 'anthropic' | 'openai' | 'gemini';

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  tier: ModelTier;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
}

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  tier: ModelTier;
}

export interface BudgetConfig {
  dailyLimit?: number;
  monthlyLimit?: number;
  perRequestLimit?: number;
  projectLimit?: number;
}

export interface UsageEvent {
  projectId: string;
  workflowId?: string;
  crewMember?: string;
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  actualCost?: number;
  routingMode: ModelTier;
  requestType?: string;
  timestamp: Date;
}

export interface OptimizationResult {
  originalModel: string;
  originalCost: number;
  recommendedModel: string;
  recommendedCost: number;
  savings: number;
  savingsPercent: number;
  reasoning: string;
}
