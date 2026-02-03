/**
 * Cost Estimator Service
 *
 * Provides accurate cost estimation before making LLM API calls.
 * Learns from actual costs to improve future estimates.
 */

import { MODELS, ModelId, LLMRequest, Complexity } from './llm-router';

export interface CostEstimate {
  model: ModelId;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
  accuracy: number;  // 0-1, based on historical estimates
}

export interface CostHistory {
  timestamp: number;
  model: ModelId;
  actualInputTokens: number;
  actualOutputTokens: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualCostUSD: number;
  estimatedCostUSD: number;
}

export class CostEstimator {
  private history: CostHistory[] = [];
  private estimationAccuracy: Map<ModelId, number[]> = new Map();

  /**
   * Estimate cost for a request
   *
   * Uses:
   * 1. Prompt/output length estimation
   * 2. Historical accuracy data
   * 3. Model-specific overhead
   */
  estimateCost(request: LLMRequest): CostEstimate {
    const estimatedInputTokens = this.estimateInputTokens(request);
    const estimatedOutputTokens = this.estimateOutputTokens(request);

    const model = request.preferModel || ('GEMINI_FLASH' as ModelId);
    const modelConfig = MODELS[model];

    const inputCost = (estimatedInputTokens / 1_000_000) * modelConfig.inputCost;
    const outputCost = (estimatedOutputTokens / 1_000_000) * modelConfig.outputCost;
    const estimatedCostUSD = inputCost + outputCost;

    const accuracy = this.getEstimationAccuracy(model);

    return {
      model,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUSD,
      accuracy,
    };
  }

  /**
   * Estimate input tokens from prompt
   *
   * OpenAI tokenizer rule of thumb:
   * ~4 characters = 1 token (English)
   * ~2 characters = 1 token (code/special chars)
   */
  private estimateInputTokens(request: LLMRequest): number {
    let tokenCount = 0;

    // Main prompt
    tokenCount += Math.ceil(request.prompt.length / 3.5);

    // System prompt overhead (~100 tokens)
    tokenCount += 100;

    // Context overhead
    if (request.context?.selectedCode) {
      tokenCount += Math.ceil(request.context.selectedCode.length / 2);  // Code is denser
    }

    if (request.context?.fileContent) {
      // Only count first 5KB to avoid huge file overheads
      const content = request.context.fileContent.slice(0, 5000);
      tokenCount += Math.ceil(content.length / 3);
    }

    return Math.max(50, tokenCount);  // Minimum 50 tokens
  }

  /**
   * Estimate output tokens from request intent and complexity
   */
  private estimateOutputTokens(request: LLMRequest): number {
    let estimate = 512;  // Base estimate

    // Intent-based estimates
    if (request.intent === 'GENERATE') {
      estimate = 2048;  // Code generation produces more output
    } else if (request.intent === 'REVIEW') {
      estimate = 1024;  // Code review feedback is moderate
    } else if (request.intent === 'DEBUG') {
      estimate = 1536;  // Debugging often requires explanation
    } else if (request.intent === 'TEST') {
      estimate = 2048;  // Tests can be lengthy
    }

    // Complexity adjustment
    if (request.complexity === 'HIGH') {
      estimate = Math.floor(estimate * 1.5);  // 50% more for complex tasks
    }

    // User override
    if (request.maxTokens) {
      estimate = Math.min(estimate, request.maxTokens);
    }

    return estimate;
  }

  /**
   * Record actual cost for learning
   */
  recordActual(
    model: ModelId,
    actualInputTokens: number,
    actualOutputTokens: number,
    actualCostUSD: number,
    estimate: CostEstimate
  ): void {
    const history: CostHistory = {
      timestamp: Date.now(),
      model,
      actualInputTokens,
      actualOutputTokens,
      estimatedInputTokens: estimate.estimatedInputTokens,
      estimatedOutputTokens: estimate.estimatedOutputTokens,
      actualCostUSD,
      estimatedCostUSD: estimate.estimatedCostUSD,
    };

    this.history.push(history);

    // Update accuracy tracking
    const error = Math.abs(actualCostUSD - estimate.estimatedCostUSD) / actualCostUSD;
    const accuracy = Math.max(0, 1 - error);

    if (!this.estimationAccuracy.has(model)) {
      this.estimationAccuracy.set(model, []);
    }
    this.estimationAccuracy.get(model)!.push(accuracy);

    // Keep only last 100 for performance
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Get average estimation accuracy for a model
   */
  private getEstimationAccuracy(model: ModelId): number {
    const accuracies = this.estimationAccuracy.get(model) || [];

    if (accuracies.length === 0) return 0.8;  // Default 80% confidence

    const average = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    return Math.round(average * 100) / 100;  // 2 decimal places
  }

  /**
   * Get cost comparison between models
   */
  compareModels(request: LLMRequest): Map<ModelId, number> {
    const inputTokens = this.estimateInputTokens(request);
    const outputTokens = this.estimateOutputTokens(request);

    const costs = new Map<ModelId, number>();

    for (const [modelId, config] of Object.entries(MODELS)) {
      const inputCost = (inputTokens / 1_000_000) * config.inputCost;
      const outputCost = (outputTokens / 1_000_000) * config.outputCost;
      costs.set(modelId as ModelId, inputCost + outputCost);
    }

    return costs;
  }

  /**
   * Get cost statistics
   */
  getStats(): {
    totalCost: number;
    averageCost: number;
    requestCount: number;
    cheapestModel: ModelId;
    expensiveModel: ModelId;
  } {
    if (this.history.length === 0) {
      return {
        totalCost: 0,
        averageCost: 0,
        requestCount: 0,
        cheapestModel: 'GEMINI_FLASH',
        expensiveModel: 'CLAUDE_OPUS',
      };
    }

    const totalCost = this.history.reduce((sum, h) => sum + h.actualCostUSD, 0);
    const averageCost = totalCost / this.history.length;

    // Find cheapest and most expensive models used
    const modelCosts = new Map<ModelId, number[]>();
    for (const record of this.history) {
      if (!modelCosts.has(record.model)) {
        modelCosts.set(record.model, []);
      }
      modelCosts.get(record.model)!.push(record.actualCostUSD);
    }

    let cheapestModel = 'GEMINI_FLASH' as ModelId;
    let cheapestAvg = Infinity;

    let expensiveModel = 'CLAUDE_OPUS' as ModelId;
    let expensiveAvg = 0;

    for (const [model, costs] of modelCosts) {
      const avg = costs.reduce((a, b) => a + b, 0) / costs.length;
      if (avg < cheapestAvg) {
        cheapestModel = model;
        cheapestAvg = avg;
      }
      if (avg > expensiveAvg) {
        expensiveModel = model;
        expensiveAvg = avg;
      }
    }

    return {
      totalCost: Math.round(totalCost * 10000) / 10000,
      averageCost: Math.round(averageCost * 10000) / 10000,
      requestCount: this.history.length,
      cheapestModel,
      expensiveModel,
    };
  }

  /**
   * Get recent cost history (last N requests)
   */
  getHistory(limit: number = 10): CostHistory[] {
    return this.history.slice(-limit);
  }

  /**
   * Clear history (for testing or manual reset)
   */
  clearHistory(): void {
    this.history = [];
    this.estimationAccuracy.clear();
  }
}
