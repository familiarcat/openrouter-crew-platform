/**
 * Cost Calculator (Subflow #1: Token Cost Meter)
 *
 * Estimates token usage and cost before execution
 * Based on openrouter-ai-milestone pattern
 */
import { CostEstimate } from './types';
export declare class CostCalculator {
    /**
     * Estimate tokens in text (rough approximation: 1 token ≈ 4 characters)
     */
    estimateTokens(text: string): number;
    /**
     * Estimate cost for a request
     */
    estimateCost(modelId: string, promptText: string, estimatedOutputTokens?: number): CostEstimate;
    /**
     * Calculate actual cost from token usage
     */
    calculateActualCost(modelId: string, inputTokens: number, outputTokens: number): number;
    /**
     * Estimate cost savings by switching models
     */
    estimateSavings(currentModel: string, proposedModel: string, inputTokens: number, outputTokens: number): {
        currentCost: number;
        proposedCost: number;
        savings: number;
        savingsPercent: number;
    };
}
export declare const costCalculator: CostCalculator;
//# sourceMappingURL=cost-calculator.d.ts.map