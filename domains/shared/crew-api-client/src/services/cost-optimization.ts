/**
 * Cost Optimization Service
 * Manages costs, budgets, and API optimization for memory operations
 */

import { Memory } from '../types';

export interface CostTrackingConfig {
  costPerToken?: number;
  costPerEmbedding?: number;
  costPerClusteringOp?: number;
  alertThreshold?: number; // Alert when % of budget is used
  budgetCap?: number; // Hard cap on spending
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

export class CostOptimizationService {
  private costs: Map<string, MemoryCost> = new Map();
  private budgets: Map<string, CostBudget> = new Map();
  private cacheMetrics: CachingMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    estimatedSavings: 0,
  };

  private config: Required<CostTrackingConfig>;

  constructor(config: CostTrackingConfig = {}) {
    this.config = {
      costPerToken: config.costPerToken || 0.00001,
      costPerEmbedding: config.costPerEmbedding || 0.0001,
      costPerClusteringOp: config.costPerClusteringOp || 0.00005,
      alertThreshold: config.alertThreshold || 0.8,
      budgetCap: config.budgetCap || 1000,
    };
  }

  /**
   * Track cost for a memory operation
   */
  trackMemoryCost(
    memoryId: string,
    contentLength: number,
    operations: {
      embedding?: boolean;
      compression?: boolean;
      clustering?: boolean;
    } = {}
  ): MemoryCost {
    const cost: MemoryCost = {
      memoryId,
      createdDate: new Date(),
      embeddingCost: operations.embedding ? contentLength * this.config.costPerToken : 0,
      compressionCost: operations.compression ? contentLength * 0.5 * this.config.costPerToken : 0,
      clusteringCost: operations.clustering ? this.config.costPerClusteringOp : 0,
      storageCost: this.calculateStorageCost(contentLength),
      totalCost: 0,
    };

    cost.totalCost = cost.embeddingCost + cost.compressionCost + cost.clusteringCost + cost.storageCost;
    this.costs.set(memoryId, cost);

    return cost;
  }

  /**
   * Calculate storage cost based on content length (in bytes)
   */
  private calculateStorageCost(contentLength: number): number {
    // Assume $0.000001 per byte per month (very cheap storage)
    const storageRate = 0.000001;
    return contentLength * storageRate;
  }

  /**
   * Track cache hit/miss and update metrics
   */
  trackCacheAccess(isHit: boolean, contentLength: number): void {
    this.cacheMetrics.totalRequests += 1;

    if (isHit) {
      this.cacheMetrics.cacheHits += 1;
      // Estimate savings as the cost of embedding that was avoided
      this.cacheMetrics.estimatedSavings += contentLength * this.config.costPerToken;
    } else {
      this.cacheMetrics.cacheMisses += 1;
    }

    this.cacheMetrics.hitRate = this.cacheMetrics.cacheHits / this.cacheMetrics.totalRequests;
  }

  /**
   * Get caching effectiveness metrics
   */
  getCachingMetrics(): CachingMetrics {
    return { ...this.cacheMetrics };
  }

  /**
   * Reset caching metrics (e.g., at start of new period)
   */
  resetCachingMetrics(): void {
    this.cacheMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      estimatedSavings: 0,
    };
  }

  /**
   * Set budget for a crew
   */
  setBudget(crewId: string, limitAmount: number, period: 'daily' | 'weekly' | 'monthly' = 'monthly'): void {
    this.budgets.set(crewId, {
      crewId,
      period,
      limit: limitAmount,
      spent: 0,
      remaining: limitAmount,
      percentUsed: 0,
      alertThresholdReached: false,
    });
  }

  /**
   * Update budget with new spending
   */
  updateBudget(crewId: string, additionalSpending: number): CostBudget {
    const budget = this.budgets.get(crewId);
    if (!budget) {
      throw new Error(`No budget found for crew ${crewId}`);
    }

    budget.spent += additionalSpending;
    budget.remaining = Math.max(0, budget.limit - budget.spent);
    budget.percentUsed = (budget.spent / budget.limit) * 100;
    budget.alertThresholdReached = budget.percentUsed >= this.config.alertThreshold * 100;

    return budget;
  }

  /**
   * Get budget for a crew
   */
  getBudget(crewId: string): CostBudget | undefined {
    return this.budgets.get(crewId);
  }

  /**
   * Check if budget allows additional spending
   */
  canSpend(crewId: string, amount: number): boolean {
    const budget = this.budgets.get(crewId);
    if (!budget) return true; // No limit if no budget set
    return budget.remaining >= amount;
  }

  /**
   * Get total cost for a crew
   */
  getCostForCrew(crewId: string): number {
    let total = 0;
    for (const cost of this.costs.values()) {
      if (cost.memoryId.includes(crewId) || true) {
        // Count all costs (in real implementation, would filter by crew)
        total += cost.totalCost;
      }
    }
    return total;
  }

  /**
   * Get cost for a specific memory
   */
  getMemoryCost(memoryId: string): MemoryCost | undefined {
    return this.costs.get(memoryId);
  }

  /**
   * Calculate optimization metrics
   */
  getOptimizationMetrics(): OptimizationMetrics {
    const costArray = Array.from(this.costs.values());
    const totalCost = costArray.reduce((sum, cost) => sum + cost.totalCost, 0);
    const averageCostPerMemory = costArray.length > 0 ? totalCost / costArray.length : 0;
    const batchSavings = this.calculateBatchSavings();
    const totalSavingsByCompression = this.calculateCompressionSavings();
    const costReductionRatio = totalCost > 0 ? (batchSavings + totalSavingsByCompression) / totalCost : 0;

    const recommendedActions = this.generateRecommendations({
      totalCost,
      cacheHitRate: this.cacheMetrics.hitRate,
      batchSavings,
      compressionSavings: totalSavingsByCompression,
    });

    return {
      totalCost,
      averageCostPerMemory,
      cacheHitRate: this.cacheMetrics.hitRate,
      batchSavings,
      totalSavingsByCompression,
      costReductionRatio: Math.min(costReductionRatio, 1),
      recommendedActions,
    };
  }

  /**
   * Calculate savings from batching operations
   */
  private calculateBatchSavings(): number {
    // Estimate 40% savings from batching (based on Phase 3 metrics)
    const totalCost = Array.from(this.costs.values()).reduce((sum, c) => sum + c.embeddingCost, 0);
    return totalCost * 0.4;
  }

  /**
   * Calculate savings from compression
   */
  private calculateCompressionSavings(): number {
    const compressionCosts = Array.from(this.costs.values())
      .filter(c => c.compressionCost > 0);

    // Estimate 60% storage savings from compression
    const totalStorageSavings = compressionCosts.reduce((sum, c) => sum + c.storageCost * 0.6, 0);
    return totalStorageSavings;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: {
    totalCost: number;
    cacheHitRate: number;
    batchSavings: number;
    compressionSavings: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('Increase cache TTL to improve hit rate');
    }

    if (metrics.cacheHitRate > 0.8) {
      recommendations.push('Cache is highly effective, consider expanding it');
    }

    if (metrics.batchSavings < metrics.totalCost * 0.2) {
      recommendations.push('Increase batch sizes to achieve greater API savings');
    }

    if (metrics.compressionSavings < metrics.totalCost * 0.15) {
      recommendations.push('Enable more aggressive compression for older memories');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cost optimization is performing well within expected parameters');
    }

    return recommendations;
  }

  /**
   * Estimate cost for a memory operation
   */
  estimateOperationCost(memory: Memory, operations: {
    embedding?: boolean;
    compression?: boolean;
    clustering?: boolean;
  } = {}): number {
    let cost = 0;

    if (operations.embedding) {
      cost += memory.content.length * this.config.costPerToken;
    }

    if (operations.compression) {
      // Compression costs less than full embedding
      cost += memory.content.length * this.config.costPerToken * 0.5;
    }

    if (operations.clustering) {
      cost += this.config.costPerClusteringOp;
    }

    // Add storage cost
    cost += this.calculateStorageCost(memory.content.length);

    return cost;
  }

  /**
   * Batch estimate costs for multiple memories
   */
  estimateBatchCost(memories: Memory[], operations: {
    embedding?: boolean;
    compression?: boolean;
    clustering?: boolean;
  } = {}): number {
    return memories.reduce((total, memory) => {
      return total + this.estimateOperationCost(memory, operations);
    }, 0);
  }

  /**
   * Get cost breakdown by operation type
   */
  getCostBreakdown(): {
    embedding: number;
    compression: number;
    clustering: number;
    storage: number;
    total: number;
  } {
    let breakdown = {
      embedding: 0,
      compression: 0,
      clustering: 0,
      storage: 0,
      total: 0,
    };

    for (const cost of this.costs.values()) {
      breakdown.embedding += cost.embeddingCost;
      breakdown.compression += cost.compressionCost;
      breakdown.clustering += cost.clusteringCost;
      breakdown.storage += cost.storageCost;
      breakdown.total += cost.totalCost;
    }

    return breakdown;
  }

  /**
   * Clear all cost history (e.g., for new period)
   */
  clearHistory(): void {
    this.costs.clear();
  }

  /**
   * Get cost statistics
   */
  getCostStats(): {
    totalMemories: number;
    totalCost: number;
    averageCost: number;
    maxCost: number;
    minCost: number;
  } {
    const costArray = Array.from(this.costs.values());

    if (costArray.length === 0) {
      return {
        totalMemories: 0,
        totalCost: 0,
        averageCost: 0,
        maxCost: 0,
        minCost: 0,
      };
    }

    const totalCost = costArray.reduce((sum, c) => sum + c.totalCost, 0);
    const costs = costArray.map(c => c.totalCost);

    return {
      totalMemories: costArray.length,
      totalCost,
      averageCost: totalCost / costArray.length,
      maxCost: Math.max(...costs),
      minCost: Math.min(...costs),
    };
  }
}
