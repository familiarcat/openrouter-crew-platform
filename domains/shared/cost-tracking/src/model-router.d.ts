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
export interface RoutingRequest {
    taskComplexity: 'simple' | 'medium' | 'complex';
    requiresTools: boolean;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    preferredTier?: ModelTier;
    maxCost?: number;
}
export declare class ModelRouter {
    /**
     * Route to the cheapest viable model
     */
    route(request: RoutingRequest): ModelInfo;
    /**
     * Estimate cost for a model
     */
    private estimateCost;
    /**
     * Get model by ID
     */
    getModel(modelId: string): ModelInfo | undefined;
    /**
     * Get all models by tier
     */
    getModelsByTier(tier: ModelTier): ModelInfo[];
    /**
     * Compare costs between models
     */
    compareCosts(modelA: string, modelB: string, inputTokens: number, outputTokens: number): {
        modelA: number;
        modelB: number;
        savings: number;
        cheaperModel: string;
    };
}
export declare const modelRouter: ModelRouter;
//# sourceMappingURL=model-router.d.ts.map