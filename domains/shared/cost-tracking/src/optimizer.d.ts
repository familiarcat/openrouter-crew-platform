import { LLMUsageEvent } from '@openrouter-crew/shared-schemas';
export interface OptimizationSuggestion {
    id: string;
    type: 'model_switch' | 'batching' | 'caching';
    description: string;
    potentialSavings: number;
    impact: 'low' | 'medium' | 'high';
    action: string;
    context?: {
        currentModel?: string;
        suggestedModel?: string;
        taskType?: string;
        averageTokens?: number;
    };
}
export declare class CostOptimizer {
    private modelRouter;
    private costCalculator;
    constructor();
    /**
     * Analyze usage events to find cost optimization opportunities
     */
    analyzeUsage(events: LLMUsageEvent[]): Promise<OptimizationSuggestion[]>;
    /**
     * Identify opportunities to switch to cheaper models
     */
    private analyzeModelSelection;
    /**
     * Identify opportunities to batch small requests
     */
    private analyzeBatching;
    /**
     * Identify opportunities to cache repeated similar queries
     */
    private analyzeCaching;
    private groupEventsByModel;
    private groupEventsByProject;
    private calculateAverage;
    private isPremiumModel;
    private isStandardModel;
    private calculateProjectedCost;
    /**
     * Aggregate total costs from a list of events
     */
    calculateTotalCost(events: LLMUsageEvent[]): number;
    /**
     * Breakdown costs by project
     */
    costByProject(events: LLMUsageEvent[]): Record<string, number>;
    /**
     * Breakdown costs by crew member
     */
    costByCrewMember(events: LLMUsageEvent[]): Record<string, number>;
}
export declare const costOptimizer: CostOptimizer;
//# sourceMappingURL=optimizer.d.ts.map