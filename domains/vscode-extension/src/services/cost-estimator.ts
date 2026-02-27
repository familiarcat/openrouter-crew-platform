import { CostTracker } from './cost-tracker.js';
import { LLMRequest } from './types.js';

/**
 * Estimates the cost of LLM requests before they are sent.
 * This service provides heuristics for token counting and cost prediction.
 */
export class CostEstimator {
    constructor(private costTracker: CostTracker) {}

    /**
     * A rough estimation of tokens based on character count.
     * This is a heuristic and not perfectly accurate. A common ratio is ~4 characters per token.
     * @param text The text to estimate tokens for.
     * @returns An estimated token count.
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Estimates the cost of an LLM request before sending it.
     * @param request The LLM request details.
     * @param model The model that will be used for the request.
     * @returns The estimated cost in USD.
     */
    public estimateRequestCost(request: LLMRequest, model: string): number {
        // 1. Estimate input tokens from all messages in the request.
        const inputTokens = request.messages.reduce((acc, msg) => {
            if (typeof msg.content === 'string') {
                return acc + this.estimateTokens(msg.content);
            }
            // Note: This doesn't account for complex message parts like images.
            return acc;
        }, 0);

        // 2. Estimate output tokens. This is highly speculative.
        // A simple heuristic is to assume the output will be a fraction of the input, e.g., 50%.
        const outputTokens = Math.ceil(inputTokens * 0.5);

        return this.costTracker.estimateCost(inputTokens, outputTokens, model);
    }
}