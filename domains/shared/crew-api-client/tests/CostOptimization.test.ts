/**
 * Cost Optimization Service Tests
 * Verify cost tracking, budgeting, and optimization metrics
 */

import { CostOptimizationService } from '../src/services/cost-optimization';
import { Memory } from '../src/types';

describe('CostOptimizationService', () => {
  let service: CostOptimizationService;

  beforeEach(() => {
    service = new CostOptimizationService({
      costPerToken: 0.00001,
      costPerEmbedding: 0.0001,
      costPerClusteringOp: 0.00005,
      alertThreshold: 0.8,
    });
  });

  describe('Cost Tracking', () => {
    test('tracks cost for memory with embedding operation', () => {
      const cost = service.trackMemoryCost('mem_1', 1000, { embedding: true });

      expect(cost.memoryId).toBe('mem_1');
      expect(cost.embeddingCost).toBeGreaterThan(0);
      expect(cost.totalCost).toBeGreaterThan(0);
    });

    test('tracks cost for memory with compression operation', () => {
      const cost = service.trackMemoryCost('mem_2', 2000, { compression: true });

      expect(cost.compressionCost).toBeGreaterThan(0);
      expect(cost.totalCost).toBeGreaterThan(0);
    });

    test('tracks cost for memory with multiple operations', () => {
      const cost = service.trackMemoryCost('mem_3', 1500, {
        embedding: true,
        compression: true,
        clustering: true,
      });

      expect(cost.embeddingCost).toBeGreaterThan(0);
      expect(cost.compressionCost).toBeGreaterThan(0);
      expect(cost.clusteringCost).toBeGreaterThan(0);
      expect(cost.storageCost).toBeGreaterThan(0);
      expect(cost.totalCost).toBeGreaterThan(0);
    });

    test('retrieves tracked memory cost', () => {
      service.trackMemoryCost('mem_4', 1000, { embedding: true });
      const cost = service.getMemoryCost('mem_4');

      expect(cost).toBeDefined();
      expect(cost!.memoryId).toBe('mem_4');
    });

    test('returns undefined for non-existent memory cost', () => {
      const cost = service.getMemoryCost('non_existent');
      expect(cost).toBeUndefined();
    });
  });

  describe('Cache Metrics', () => {
    test('tracks cache hits and misses', () => {
      service.trackCacheAccess(true, 500);
      service.trackCacheAccess(false, 500);
      service.trackCacheAccess(true, 500);

      const metrics = service.getCachingMetrics();

      expect(metrics.totalRequests).toBe(3);
      expect(metrics.cacheHits).toBe(2);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.hitRate).toBeCloseTo(0.667, 1);
    });

    test('calculates cache hit rate correctly', () => {
      for (let i = 0; i < 10; i++) {
        service.trackCacheAccess(i < 8, 500);
      }

      const metrics = service.getCachingMetrics();

      expect(metrics.hitRate).toBe(0.8);
    });

    test('estimates savings from cache hits', () => {
      service.trackCacheAccess(true, 1000);
      service.trackCacheAccess(true, 1000);

      const metrics = service.getCachingMetrics();

      expect(metrics.estimatedSavings).toBeGreaterThan(0);
    });

    test('resets caching metrics', () => {
      service.trackCacheAccess(true, 500);
      service.trackCacheAccess(false, 500);

      service.resetCachingMetrics();
      const metrics = service.getCachingMetrics();

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.estimatedSavings).toBe(0);
    });
  });

  describe('Budget Management', () => {
    test('sets budget for crew', () => {
      service.setBudget('crew_1', 1000, 'monthly');
      const budget = service.getBudget('crew_1');

      expect(budget).toBeDefined();
      expect(budget!.limit).toBe(1000);
      expect(budget!.spent).toBe(0);
      expect(budget!.remaining).toBe(1000);
      expect(budget!.period).toBe('monthly');
    });

    test('updates budget when spending occurs', () => {
      service.setBudget('crew_2', 500, 'monthly');
      service.updateBudget('crew_2', 100);

      const budget = service.getBudget('crew_2')!;

      expect(budget.spent).toBe(100);
      expect(budget.remaining).toBe(400);
      expect(budget.percentUsed).toBe(20);
    });

    test('triggers alert when threshold reached', () => {
      service.setBudget('crew_3', 100, 'monthly');
      service.updateBudget('crew_3', 81);

      const budget = service.getBudget('crew_3')!;

      expect(budget.alertThresholdReached).toBe(true);
      expect(budget.percentUsed).toBe(81);
    });

    test('prevents overspending when budget exceeded', () => {
      service.setBudget('crew_4', 100, 'monthly');
      service.updateBudget('crew_4', 90);

      const budget = service.getBudget('crew_4')!;
      expect(budget.remaining).toBe(10);

      service.updateBudget('crew_4', 20);
      const updated = service.getBudget('crew_4')!;
      expect(updated.remaining).toBe(0);
    });

    test('checks if spending is allowed within budget', () => {
      service.setBudget('crew_5', 100, 'monthly');
      service.updateBudget('crew_5', 80);

      expect(service.canSpend('crew_5', 20)).toBe(true);
      expect(service.canSpend('crew_5', 21)).toBe(false);
    });

    test('throws error when updating budget for non-existent crew', () => {
      expect(() => {
        service.updateBudget('non_existent', 10);
      }).toThrow();
    });
  });

  describe('Cost Estimation', () => {
    test('estimates cost for single memory operation', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'This is test content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const cost = service.estimateOperationCost(memory, { embedding: true });

      expect(cost).toBeGreaterThan(0);
    });

    test('estimates cost for batch of memories', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}. `.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const batchCost = service.estimateBatchCost(memories, { embedding: true });
      const singleCost = service.estimateOperationCost(memories[0], { embedding: true });

      expect(batchCost).toBeGreaterThan(singleCost);
      expect(batchCost).toBeGreaterThan(0);
    });
  });

  describe('Optimization Metrics', () => {
    test('calculates overall optimization metrics', () => {
      service.trackMemoryCost('mem_1', 1000, { embedding: true });
      service.trackMemoryCost('mem_2', 1500, { compression: true });
      service.trackCacheAccess(true, 500);
      service.trackCacheAccess(false, 500);

      const metrics = service.getOptimizationMetrics();

      expect(metrics.totalCost).toBeGreaterThan(0);
      expect(metrics.averageCostPerMemory).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeCloseTo(0.5, 1);
      expect(metrics.recommendedActions.length).toBeGreaterThan(0);
    });

    test('includes recommended actions in metrics', () => {
      service.trackCacheAccess(true, 500);
      service.trackCacheAccess(false, 500);

      const metrics = service.getOptimizationMetrics();

      expect(Array.isArray(metrics.recommendedActions)).toBe(true);
      expect(metrics.recommendedActions.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Breakdown', () => {
    test('breaks down costs by operation type', () => {
      service.trackMemoryCost('mem_1', 1000, { embedding: true });
      service.trackMemoryCost('mem_2', 1000, { compression: true });
      service.trackMemoryCost('mem_3', 1000, { clustering: true });

      const breakdown = service.getCostBreakdown();

      expect(breakdown.embedding).toBeGreaterThan(0);
      expect(breakdown.compression).toBeGreaterThan(0);
      expect(breakdown.clustering).toBeGreaterThan(0);
      expect(breakdown.total).toBeGreaterThan(0);
    });

    test('calculates total cost from breakdown', () => {
      service.trackMemoryCost('mem_1', 1000, {
        embedding: true,
        compression: true,
        clustering: true,
      });

      const breakdown = service.getCostBreakdown();
      const sum = breakdown.embedding + breakdown.compression + breakdown.clustering + breakdown.storage;

      expect(breakdown.total).toBeCloseTo(sum, 5);
    });
  });

  describe('Cost Statistics', () => {
    test('calculates cost statistics', () => {
      service.trackMemoryCost('mem_1', 1000, { embedding: true });
      service.trackMemoryCost('mem_2', 2000, { embedding: true });
      service.trackMemoryCost('mem_3', 500, { embedding: true });

      const stats = service.getCostStats();

      expect(stats.totalMemories).toBe(3);
      expect(stats.totalCost).toBeGreaterThan(0);
      expect(stats.averageCost).toBeLessThanOrEqual(stats.maxCost);
      expect(stats.minCost).toBeLessThanOrEqual(stats.maxCost);
    });

    test('returns zero stats for empty history', () => {
      const stats = service.getCostStats();

      expect(stats.totalMemories).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.averageCost).toBe(0);
      expect(stats.maxCost).toBe(0);
      expect(stats.minCost).toBe(0);
    });
  });

  describe('History Management', () => {
    test('clears cost history', () => {
      service.trackMemoryCost('mem_1', 1000, { embedding: true });
      service.trackMemoryCost('mem_2', 1000, { embedding: true });

      let stats = service.getCostStats();
      expect(stats.totalMemories).toBe(2);

      service.clearHistory();

      stats = service.getCostStats();
      expect(stats.totalMemories).toBe(0);
      expect(stats.totalCost).toBe(0);
    });
  });

  describe('Configuration', () => {
    test('uses custom cost configuration', () => {
      const customService = new CostOptimizationService({
        costPerToken: 0.0001,
        costPerEmbedding: 0.001,
        alertThreshold: 0.9,
      });

      const cost = customService.trackMemoryCost('mem_1', 1000, { embedding: true });

      expect(cost.totalCost).toBeGreaterThan(0);
    });

    test('defaults to standard configuration when not provided', () => {
      const defaultService = new CostOptimizationService();

      const cost = defaultService.trackMemoryCost('mem_1', 1000, { embedding: true });

      expect(cost.totalCost).toBeGreaterThan(0);
    });
  });
});
