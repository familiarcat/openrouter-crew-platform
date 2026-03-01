/**
 * Cost Optimization Service
 * Manages costs, budgets, and API optimization for memory operations
 */
import { Memory } from '../types';
export interface CostTrackingConfig {
    costPerToken?: number;
    costPerEmbedding?: number;
    costPerClusteringOp?: number;
    alertThreshold?: number;
    budgetCap?: number;
}
export interface MemoryCost {
    memoryId: string;
    createdDate: Date;
    embeddingCost: number;
    compressionCost: number;
    clusteringCost: number;
    storageCost: number;
    totalCost: number;
}
export interface CostBudget {
    crewId: string;
    period: 'daily' | 'weekly' | 'monthly';
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    alertThresholdReached: boolean;
}
export interface OptimizationMetrics {
    totalCost: number;
    averageCostPerMemory: number;
    cacheHitRate: number;
    batchSavings: number;
    totalSavingsByCompression: number;
    costReductionRatio: number;
    recommendedActions: string[];
}
export interface CachingMetrics {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    estimatedSavings: number;
}
export declare class CostOptimizationService {
    private costs;
    private budgets;
    private cacheMetrics;
    private config;
    constructor(config?: CostTrackingConfig);
    /**
     * Track cost for a memory operation
     */
    trackMemoryCost(memoryId: string, contentLength: number, operations?: {
        embedding?: boolean;
        compression?: boolean;
        clustering?: boolean;
    }): MemoryCost;
    /**
     * Calculate storage cost based on content length (in bytes)
     */
    private calculateStorageCost;
    /**
     * Track cache hit/miss and update metrics
     */
    trackCacheAccess(isHit: boolean, contentLength: number): void;
    /**
     * Get caching effectiveness metrics
     */
    getCachingMetrics(): CachingMetrics;
    /**
     * Reset caching metrics (e.g., at start of new period)
     */
    resetCachingMetrics(): void;
    /**
     * Set budget for a crew
     */
    setBudget(crewId: string, limitAmount: number, period?: 'daily' | 'weekly' | 'monthly'): void;
    /**
     * Update budget with new spending
     */
    updateBudget(crewId: string, additionalSpending: number): CostBudget;
    /**
     * Get budget for a crew
     */
    getBudget(crewId: string): CostBudget | undefined;
    /**
     * Check if budget allows additional spending
     */
    canSpend(crewId: string, amount: number): boolean;
    /**
     * Get total cost for a crew
     */
    getCostForCrew(crewId: string): number;
    /**
     * Get cost for a specific memory
     */
    getMemoryCost(memoryId: string): MemoryCost | undefined;
    /**
     * Calculate optimization metrics
     */
    getOptimizationMetrics(): OptimizationMetrics;
    /**
     * Calculate savings from batching operations
     */
    private calculateBatchSavings;
    /**
     * Calculate savings from compression
     */
    private calculateCompressionSavings;
    /**
     * Generate optimization recommendations
     */
    private generateRecommendations;
    /**
     * Estimate cost for a memory operation
     */
    estimateOperationCost(memory: Memory, operations?: {
        embedding?: boolean;
        compression?: boolean;
        clustering?: boolean;
    }): number;
    /**
     * Batch estimate costs for multiple memories
     */
    estimateBatchCost(memories: Memory[], operations?: {
        embedding?: boolean;
        compression?: boolean;
        clustering?: boolean;
    }): number;
    /**
     * Get cost breakdown by operation type
     */
    getCostBreakdown(): {
        embedding: number;
        compression: number;
        clustering: number;
        storage: number;
        total: number;
    };
    /**
     * Clear all cost history (e.g., for new period)
     */
    clearHistory(): void;
    /**
     * Get cost statistics
     */
    getCostStats(): {
        totalMemories: number;
        totalCost: number;
        averageCost: number;
        maxCost: number;
        minCost: number;
    };
}
//# sourceMappingURL=cost-optimization.d.ts.map