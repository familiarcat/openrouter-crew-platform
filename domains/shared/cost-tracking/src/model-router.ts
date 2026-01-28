/**
 * Model Router (Subflow #3: Hybrid Model Router)
 *
 * Selects the cheapest viable model based on:
 * - Task complexity
 * - Required capabilities (tools, context window)
 * - Cost tier preference
 * - Historical performance
 *
 * Based on openrouter-ai-milestone subflow pattern
 */

import { ModelInfo, ModelTier } from './types';

// Model database extracted from rag-refresh-product-factory
const MODEL_DATABASE: ModelInfo[] = [
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    tier: 'premium',
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    tier: 'premium',
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true
  },
  {
    id: 'anthropic/claude-sonnet-3.5',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'standard',
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    contextWindow: 200000,
    supportsTools: true,
    supportsStreaming: true
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'standard',
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    contextWindow: 128000,
    supportsTools: true,
    supportsStreaming: true
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'openrouter',
    tier: 'budget',
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    contextWindow: 128000,
    supportsTools: true,
    supportsStreaming: true
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    tier: 'ultra_budget',
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    contextWindow: 1000000,
    supportsTools: true,
    supportsStreaming: true
  }
];

export interface RoutingRequest {
  taskComplexity: 'simple' | 'medium' | 'complex';
  requiresTools: boolean;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  preferredTier?: ModelTier;
  maxCost?: number;
}

export class ModelRouter {
  /**
   * Route to the cheapest viable model
   */
  route(request: RoutingRequest): ModelInfo {
    // Filter models based on requirements
    let candidates = MODEL_DATABASE.filter(model => {
      // Must support tools if required
      if (request.requiresTools && !model.supportsTools) {
        return false;
      }

      // Must have sufficient context window
      const totalTokens = request.estimatedInputTokens + request.estimatedOutputTokens;
      if (totalTokens > model.contextWindow) {
        return false;
      }

      return true;
    });

    // Filter by preferred tier if specified
    if (request.preferredTier) {
      const tieredCandidates = candidates.filter(m => m.tier === request.preferredTier);
      if (tieredCandidates.length > 0) {
        candidates = tieredCandidates;
      }
    }

    // Filter by max cost if specified
    if (request.maxCost) {
      candidates = candidates.filter(model => {
        const estimatedCost = this.estimateCost(
          model,
          request.estimatedInputTokens,
          request.estimatedOutputTokens
        );
        return estimatedCost <= request.maxCost!;
      });
    }

    // Sort by task complexity requirements
    if (request.taskComplexity === 'complex') {
      // For complex tasks, prioritize premium/standard models
      candidates.sort((a, b) => {
        const tierOrder: Record<ModelTier, number> = {
          premium: 0,
          standard: 1,
          budget: 2,
          ultra_budget: 3
        };
        return tierOrder[a.tier] - tierOrder[b.tier];
      });
    } else {
      // For simple/medium tasks, prioritize by cost
      candidates.sort((a, b) => {
        const costA = this.estimateCost(a, request.estimatedInputTokens, request.estimatedOutputTokens);
        const costB = this.estimateCost(b, request.estimatedInputTokens, request.estimatedOutputTokens);
        return costA - costB;
      });
    }

    // Return cheapest viable model
    if (candidates.length === 0) {
      // Fallback to Claude Sonnet 3.5 if no candidates
      return MODEL_DATABASE.find(m => m.id === 'anthropic/claude-sonnet-3.5')!;
    }

    return candidates[0];
  }

  /**
   * Estimate cost for a model
   */
  private estimateCost(model: ModelInfo, inputTokens: number, outputTokens: number): number {
    return (
      (inputTokens / 1_000_000) * model.inputCostPer1M +
      (outputTokens / 1_000_000) * model.outputCostPer1M
    );
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): ModelInfo | undefined {
    return MODEL_DATABASE.find(m => m.id === modelId);
  }

  /**
   * Get all models by tier
   */
  getModelsByTier(tier: ModelTier): ModelInfo[] {
    return MODEL_DATABASE.filter(m => m.tier === tier);
  }

  /**
   * Compare costs between models
   */
  compareCosts(
    modelA: string,
    modelB: string,
    inputTokens: number,
    outputTokens: number
  ): { modelA: number; modelB: number; savings: number; cheaperModel: string } {
    const mA = this.getModel(modelA);
    const mB = this.getModel(modelB);

    if (!mA || !mB) {
      throw new Error('One or both models not found');
    }

    const costA = this.estimateCost(mA, inputTokens, outputTokens);
    const costB = this.estimateCost(mB, inputTokens, outputTokens);

    return {
      modelA: costA,
      modelB: costB,
      savings: Math.abs(costA - costB),
      cheaperModel: costA < costB ? modelA : modelB
    };
  }
}

// Export singleton
export const modelRouter = new ModelRouter();
