/**
 * Phase 3 Sprint 3 Integration Tests
 * Verify cost optimization, analytics, and archival working together
 */

import { CostOptimizationService } from '../src/services/cost-optimization';
import { MemoryAnalyticsService } from '../src/services/memory-analytics';
import { MemoryArchivalService } from '../src/services/memory-archival';
import { EmbeddingProvider } from '../src/services/embedding-provider';
import { SemanticClusteringService } from '../src/services/semantic-clustering';
import { MemoryRankerService } from '../src/services/memory-ranker';
import { Memory } from '../src/types';

describe('Phase 3 Sprint 3 Integration', () => {
  let costService: CostOptimizationService;
  let analyticsService: MemoryAnalyticsService;
  let archivalService: MemoryArchivalService;
  let embeddingProvider: EmbeddingProvider;
  let clusteringService: SemanticClusteringService;
  let rankerService: MemoryRankerService;

  beforeEach(() => {
    costService = new CostOptimizationService({
      costPerToken: 0.00001,
      alertThreshold: 0.8,
    });

    analyticsService = new MemoryAnalyticsService();
    archivalService = new MemoryArchivalService({
      strategy: 'automatic',
      minAgeDays: 30,
      compressionEnabled: true,
    });

    embeddingProvider = new EmbeddingProvider({ cache: { enabled: true } });
    clusteringService = new SemanticClusteringService(embeddingProvider);
    rankerService = new MemoryRankerService(embeddingProvider);
  });

  describe('Cost-Aware Archival Pipeline', () => {
    test('archives memories while tracking costs', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Database optimization content. `.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      // Estimate costs before archival
      const estimatedCost = costService.estimateBatchCost(memories, { compression: true });

      // Archive memories
      const archivalResult = archivalService.batchArchive(memories, 'automatic');

      // Track costs
      for (const archived of archivalResult.archived) {
        costService.trackMemoryCost(archived.originalId, archived.originalLength, {
          compression: archived.compressed,
        });
      }

      const breakdown = costService.getCostBreakdown();

      expect(estimatedCost).toBeGreaterThan(0);
      expect(archivalResult.archived.length).toBeGreaterThan(0);
      expect(breakdown.total).toBeGreaterThan(0);
    });

    test('respects budget when archiving memories', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: content. `.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.7,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      // Set a budget
      costService.setBudget('crew_1', 10, 'monthly');

      // Archive memories and track cost
      const archivalResult = archivalService.batchArchive(memories, 'automatic');

      let totalSpent = 0;
      for (const archived of archivalResult.archived) {
        const cost = costService.estimateOperationCost(
          memories.find(m => m.id === archived.originalId)!,
          { compression: archived.compressed }
        );
        totalSpent += cost;
      }

      // Check if we can spend
      const canSpendMore = costService.canSpend('crew_1', totalSpent);

      expect(canSpendMore).toBe(true);
      if (canSpendMore) {
        costService.updateBudget('crew_1', totalSpent);
        const budget = costService.getBudget('crew_1')!;
        expect(budget.spent).toBe(totalSpent);
      }
    });
  });

  describe('Analytics-Driven Archival', () => {
    test('uses analytics to identify archival candidates', async () => {
      const now = new Date();
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Performance optimization topic. `.repeat(20),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8 - i * 0.1,
          created_at: new Date(now.getTime() - (120 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - (120 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 10 - i * 2,
          last_accessed: new Date(now.getTime() - (60 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      // Generate analytics
      const analytics = analyticsService.generateAnalytics('crew_1', memories);

      // Get archival recommendations
      const recommendations = archivalService.recommendArchival(memories);

      expect(analytics.insights.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].action).toBe('archive');
    });

    test('tracks insights after archival operation', () => {
      const now = new Date();
      const memories: Memory[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Content. `.repeat(20),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.7,
          created_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      // Generate initial analytics
      const beforeAnalytics = analyticsService.generateAnalytics('crew_1', memories);

      // Archive half the memories
      const archivalResult = archivalService.batchArchive(memories.slice(0, 5), 'automatic');

      // Get remaining memories for updated analytics
      const remainingMemories = memories.slice(5);

      // Generate updated analytics
      const afterAnalytics = analyticsService.generateAnalytics('crew_1', remainingMemories);

      expect(beforeAnalytics.totalMemories).toBe(10);
      expect(afterAnalytics.totalMemories).toBe(5);
      expect(archivalResult.archived.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Memory Lifecycle', () => {
    test('processes memories through clustering, ranking, and archival', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Database optimization and performance techniques. `.repeat(15),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 5 - i,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['performance'],
        }));

      // Step 1: Cluster memories
      const clusters = await clusteringService.clusterMemories(memories);

      // Step 2: Rank memories
      const ranked = await rankerService.rankMemories('database optimization', memories);

      // Step 3: Get analytics
      const analytics = analyticsService.generateAnalytics('crew_1', memories);

      // Step 4: Recommend archival
      const archivalRecommendations = archivalService.recommendArchival(memories);

      expect(clusters.clusters.length).toBeGreaterThan(0);
      expect(ranked.length).toBe(memories.length);
      expect(analytics.topTopics.length).toBeGreaterThan(0);
      expect(archivalRecommendations.length).toBeGreaterThan(0);
    });

    test('complete workflow: cluster → rank → analyze → archive → cost track', async () => {
      const memories: Memory[] = Array(8)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Integration testing and optimization. `.repeat(20),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      // Setup budget
      costService.setBudget('crew_1', 100, 'monthly');

      // Step 1: Clustering
      const clusters = await clusteringService.clusterMemories(memories);

      // Step 2: Ranking
      const ranked = await rankerService.rankMemories('test query', memories);

      // Step 3: Analytics
      const analytics = analyticsService.generateAnalytics('crew_1', memories);

      // Step 4: Archival
      const archivalResult = archivalService.batchArchive(memories, 'automatic');

      // Step 5: Cost tracking
      const archiveMetrics = archivalService.calculateMetrics();
      for (const archived of archivalResult.archived) {
        costService.trackMemoryCost(archived.originalId, archived.originalLength, {
          compression: archived.compressed,
        });
      }

      const costMetrics = costService.getOptimizationMetrics();
      const budget = costService.getBudget('crew_1')!;

      expect(clusters.clusters.length).toBeGreaterThan(0);
      expect(ranked.length).toBe(memories.length);
      expect(analytics.insights.length).toBeGreaterThan(0);
      expect(archivalResult.archived.length).toBeGreaterThan(0);
      expect(archiveMetrics.totalArchived).toBe(archivalResult.archived.length);
      expect(costMetrics.totalCost).toBeGreaterThanOrEqual(0);
      expect(budget.spent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Effectiveness with Archival', () => {
    test('tracks cache metrics during archival workflow', async () => {
      const memories: Memory[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Caching strategies and optimization. `.repeat(20),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 10,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['cache'],
        }));

      // Generate embeddings (would use cache)
      for (const memory of memories) {
        await embeddingProvider.generateEmbedding(memory.content);
      }

      // Generate again (should hit cache)
      for (const memory of memories) {
        await embeddingProvider.generateEmbedding(memory.content);
      }

      // Track cache accesses
      costService.trackCacheAccess(true, 500); // Hit
      costService.trackCacheAccess(true, 500); // Hit
      costService.trackCacheAccess(false, 500); // Miss

      const cacheMetrics = costService.getCachingMetrics();

      expect(cacheMetrics.totalRequests).toBe(3);
      expect(cacheMetrics.cacheHits).toBe(2);
      expect(cacheMetrics.hitRate).toBeCloseTo(0.667, 1);
    });
  });

  describe('Recommendation Quality', () => {
    test('provides accurate archival recommendations based on analytics', () => {
      const now = new Date();
      const memories: Memory[] = [
        {
          id: 'mem_high_value',
          crew_id: 'crew_1',
          content: 'High value content. '.repeat(20),
          type: 'best-practice',
          retention_tier: 'eternal',
          confidence_level: 0.95,
          created_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 100,
          last_accessed: now.toISOString(),
          tags: ['critical'],
        },
        {
          id: 'mem_low_value',
          crew_id: 'crew_1',
          content: 'Low value content. '.repeat(20),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.3,
          created_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        },
      ];

      const recommendations = archivalService.recommendArchival(memories, 10);

      // Should recommend archiving low-value memory but not high-value
      expect(recommendations.some(r => r.memoryId === 'mem_low_value')).toBe(true);
      expect(recommendations.some(r => r.memoryId === 'mem_high_value')).toBe(false);
    });

    test('generates top memory recommendations with analytics', async () => {
      const now = new Date();
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Important content. `.repeat(20),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9 - i * 0.1,
          created_at: new Date(now.getTime() - (100 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - (100 + i * 10) * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 20 - i * 5,
          last_accessed: new Date(now.getTime() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['important'],
        }));

      const recommendations = analyticsService.getTopRecommendations(memories, 3);

      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations[0].recommendationScore).toBeGreaterThanOrEqual(
        recommendations[recommendations.length - 1].recommendationScore
      );
    });
  });

  describe('Performance Under Load', () => {
    test('handles large batch archival efficiently', async () => {
      const startTime = Date.now();

      const memories: Memory[] = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Performance test content. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.7,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      // Batch archive
      const archivalResult = archivalService.batchArchive(memories, 'automatic');

      // Generate analytics
      analyticsService.generateAnalytics('crew_1', memories);

      // Track costs
      for (const archived of archivalResult.archived) {
        costService.trackMemoryCost(archived.originalId, archived.originalLength);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete in <5 seconds
      expect(archivalResult.archived.length).toBeGreaterThan(0);
    });
  });
});
