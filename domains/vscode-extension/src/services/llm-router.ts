import * as vscode from 'vscode';
import { CostTracker } from './cost-tracker.js';

export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH';

export type Intent =
  | 'ASK'
  | 'REVIEW'
  | 'EXPLAIN'
  | 'REFACTOR'
  | 'GENERATE'
  | 'DEBUG'
  | 'TEST'
  | 'DOCUMENT'
  | 'COMPLETE'
  | 'OPTIMIZE';

export type ExtendedIntent = Intent | 'TRANSLATE';

export interface FileContext {
  path: string;
  content: string;
  language: string;
}

export interface ImageContext {
  base64: string;
  mimeType: string;
}

export interface LLMRequest {
  prompt: string;
  files?: FileContext[];
  images?: ImageContext[];
  language?: string;
  intent?: ExtendedIntent;
  complexity?: Complexity;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: 'claude' | 'openrouter' | 'gemini';
  costUSD: number;
  executionTimeMs: number;
  cached: boolean;
}

export class LLMRouter {
  // Pricing per 1k tokens (Input / Output)
  private static PRICING: Record<string, { input: number; output: number }> = {
    'gemini-flash-1.5': { input: 0.0001, output: 0.0004 },
    'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-opus': { input: 0.015, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'mistral-large': { input: 0.004, output: 0.012 }
  };
  private costTracker: CostTracker;

  constructor(costTracker: CostTracker) {
    this.costTracker = costTracker;
  }

  /**
   * Routes the request to the optimal model based on complexity and intent.
   */
  async route(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // 1. Analyze complexity if not provided
    const complexity = request.complexity || this.estimateComplexity(request);
    
    // 2. Select Model
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const model = this.selectModel({ ...request, complexity }, config);

    // 3. Estimate cost and check budget before execution
    const inputTokens = Math.ceil(request.prompt.length / 4);
    const estimatedOutputTokens = 1000; // A reasonable default for pre-execution check
    const estimatedCost = this.costTracker.estimateCost(inputTokens, estimatedOutputTokens, model);
    await this.checkBudget(estimatedCost);

    // 4. Mock Execution (Integration with actual API comes in later phase)
    // This would normally call the OpenRouter/Alex-AI-Universal API
    const responseContent = `[Mock Response from ${model}] This is a placeholder response for the ${request.intent || 'ASK'} intent.`;
    
    // 5. Calculate actual cost based on mock response length
    const outputTokens = Math.ceil(responseContent.length / 4);
    const costUSD = this.costTracker.estimateCost(inputTokens, outputTokens, model);

    return {
      content: responseContent,
      model: model,
      provider: model.includes('claude') ? 'claude' : (model.includes('gemini') ? 'gemini' : 'openrouter'),
      costUSD,
      executionTimeMs: Date.now() - startTime,
      cached: false
    };
  }

  /**
   * Estimates the complexity of a request based on heuristics.
   */
  public estimateComplexity(request: LLMRequest): Complexity {
    const length = request.prompt.length;
    const intent = request.intent;
    const fileCount = request.files?.length || 0;

    if (intent === 'DEBUG' || intent === 'REFACTOR' || intent === 'OPTIMIZE') return 'HIGH';
    if (length > 4000 || fileCount > 3) return 'HIGH';
    if (intent === 'REVIEW' || intent === 'TEST' || intent === 'GENERATE') return 'MEDIUM';
    if (length > 1000 || fileCount > 0) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Selects the best model for the job based on cost/performance trade-offs.
   */
  public selectModel(request: LLMRequest, config: vscode.WorkspaceConfiguration): string {
    const complexity = request.complexity || 'LOW';
    const intent = request.intent;
    const preferredModel = config.get<string>('model.preferred');

    if (preferredModel && preferredModel !== 'auto') return preferredModel;

    // Intent-based routing
    if (intent === 'REVIEW') return 'gpt-4-turbo';
    if (intent === 'DEBUG') return 'claude-3-5-sonnet';

    // Complexity-based routing
    switch (complexity) {
      case 'HIGH': return 'claude-3-5-sonnet';
      case 'MEDIUM': return 'claude-3-5-sonnet';
      case 'LOW': default: return 'gemini-flash-1.5';
    }
  }

  /**
   * Checks if the estimated cost is within the user's budget.
   * Throws an error if the budget is exceeded, which is caught by the CommandExecutor.
   */
  public async checkBudget(estimatedCost: number): Promise<void> {
    const budgetCheck = await this.costTracker.checkBudget(estimatedCost);
    if (!budgetCheck.allowed) {
      throw new Error(budgetCheck.reason || 'Budget limit exceeded. Request blocked.');
    }
  }
}