/**
 * Cost Calculator (Subflow #1: Token Cost Meter)
 *
 * Estimates token usage and cost before execution
 * Based on openrouter-ai-milestone pattern
 */
import { modelRouter } from './model-router';
export class CostCalculator {
    /**
     * Estimate tokens in text (rough approximation: 1 token ≈ 4 characters)
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Estimate cost for a request
     */
    estimateCost(modelId, promptText, estimatedOutputTokens = 1000) {
        const model = modelRouter.getModel(modelId);
        if (!model) {
            throw new Error(`Unknown model: ${modelId}`);
        }
        const inputTokens = this.estimateTokens(promptText);
        const outputTokens = estimatedOutputTokens;
        const totalTokens = inputTokens + outputTokens;
        const estimatedCost = (inputTokens / 1_000_000) * model.inputCostPer1M +
            (outputTokens / 1_000_000) * model.outputCostPer1M;
        return {
            model: modelId,
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCost: Math.round(estimatedCost * 1000000) / 1000000, // Round to 6 decimals
            tier: model.tier
        };
    }
    /**
     * Calculate actual cost from token usage
     */
    calculateActualCost(modelId, inputTokens, outputTokens) {
        const model = modelRouter.getModel(modelId);
        if (!model) {
            throw new Error(`Unknown model: ${modelId}`);
        }
        return ((inputTokens / 1_000_000) * model.inputCostPer1M +
            (outputTokens / 1_000_000) * model.outputCostPer1M);
    }
    /**
     * Estimate cost savings by switching models
     */
    estimateSavings(currentModel, proposedModel, inputTokens, outputTokens) {
        const currentCost = this.calculateActualCost(currentModel, inputTokens, outputTokens);
        const proposedCost = this.calculateActualCost(proposedModel, inputTokens, outputTokens);
        const savings = currentCost - proposedCost;
        const savingsPercent = (savings / currentCost) * 100;
        return {
            currentCost,
            proposedCost,
            savings,
            savingsPercent: Math.round(savingsPercent * 100) / 100
        };
    }
}
// Export singleton
export const costCalculator = new CostCalculator();
//# sourceMappingURL=cost-calculator.js.map