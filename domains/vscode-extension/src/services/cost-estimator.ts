import * as vscode from 'vscode';
import { Intent, ExtendedIntent, LLMRouter, Complexity } from './llm-router.js';
import { CostTracker } from './cost-tracker.js';

export class CostEstimator {
  constructor(private llmRouter: LLMRouter, private costTracker: CostTracker) {}

  /**
   * Estimates the total cost for a hypothetical request.
   * @param text The code/text context for the request.
   * @param intent The intended action.
   * @returns An object with the estimated cost, model, and token counts.
   */
  public estimateRequestCost(text: string, intent: ExtendedIntent): { cost: number; model: string; inputTokens: number; outputTokens: number; complexity: Complexity } {
    const contextLength = text.length;

    // 0. Estimate Complexity
    const request = { prompt: text, intent };
    const complexity = this.llmRouter.estimateComplexity(request);

    // 1. Estimate Tokens
    const { inputTokens, outputTokens } = this.estimateTokens(contextLength, intent, complexity);

    // 2. Select Model
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const model = this.llmRouter.selectModel({ ...request, complexity }, config);

    // 3. Estimate Cost
    const cost = this.costTracker.estimateCost(inputTokens, outputTokens, model);

    return { cost, model, inputTokens, outputTokens, complexity };
  }

  private estimateTokens(contextLength: number, intent: ExtendedIntent, complexity: Complexity): { inputTokens: number; outputTokens: number } {
    // Estimate Input Tokens (Rough approximation: 4 chars ~= 1 token)
    const inputTokens = Math.ceil(contextLength / 4) + 100; // +100 overhead for system prompt

    // Estimate Output Tokens based on intent heuristics
    let outputTokens = 500; // Default
    switch (intent) {
      case 'GENERATE': outputTokens = 2000; break;
      case 'REFACTOR': outputTokens = Math.ceil(inputTokens * 1.2); break;
      case 'REVIEW': outputTokens = 1000; break;
      case 'TEST': outputTokens = 1500; break;
      case 'DOCUMENT': outputTokens = Math.ceil(inputTokens * 1.1); break;
      case 'DEBUG': outputTokens = 1000; break;
      case 'OPTIMIZE': outputTokens = Math.ceil(inputTokens * 1.0); break;
      case 'EXPLAIN': outputTokens = 800; break;
    }

    // Adjust for complexity
    if (complexity === 'HIGH') {
      outputTokens = Math.ceil(outputTokens * 1.5);
    } else if (complexity === 'MEDIUM') {
      outputTokens = Math.ceil(outputTokens * 1.2);
    }

    return { inputTokens, outputTokens };
  }
}