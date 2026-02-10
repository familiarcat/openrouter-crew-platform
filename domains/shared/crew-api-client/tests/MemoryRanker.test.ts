/**
 * Memory Ranker Service Tests
 * Verify intelligent memory ranking and retrieval strategies
 */

import { MemoryRankerService } from '../src/services/memory-ranker';
import { EmbeddingProvider } from '../src/services/embedding-provider';
import { Memory } from '../src/types';

describe('MemoryRankerService', () => {
  let ranker: MemoryRankerService;
  let embeddingProvider: EmbeddingProvider;

  beforeEach(() => {
    embeddingProvider = new EmbeddingProvider({ cache: { enabled: true } });
    ranker = new MemoryRankerService(embeddingProvider);
  });

  describe('Memory Ranking', () => {
    test('ranks memories by query relevance', async () => {
      const query = 'Database optimization and performance';
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Database performance and indexing. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        {
          id: 'mem2',
          crew_id: 'crew1',
          content: 'Pizza recipes. '.repeat(10),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      const ranked = await ranker.rankMemories(query, memories);

      expect(ranked.length).toBe(2);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[0].relevanceScore).toBeGreaterThanOrEqual(ranked[1].relevanceScore);
    });

    test('handles empty memory list', async () => {
      const ranked = await ranker.rankMemories('test query', []);
      expect(ranked.length).toBe(0);
    });

    test('includes all score components', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Test content. '.repeat(15),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 5,
          last_accessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        },
      ];

      const ranked = await ranker.rankMemories('test', memories);

      expect(ranked[0].scores.semantic).toBeDefined();
      expect(ranked[0].scores.recency).toBeDefined();
      expect(ranked[0].scores.confidence).toBeDefined();
      expect(ranked[0].scores.context).toBeDefined();
      expect(ranked[0].scores.adaptive).toBeDefined();
    });

    test('assigns correct rank positions', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Content ${i}. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9 - i * 0.05,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const ranked = await ranker.rankMemories('test', memories);

      ranked.forEach((item, index) => {
        expect(item.rank).toBe(index + 1);
      });
    });

    test('considers context in ranking', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Story about events. '.repeat(10),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: ['important', 'event'],
        },
      ];

      const context = {
        operation: 'story',
        tags: ['important'],
        importance: 'high',
      };

      const ranked = await ranker.rankMemories('test', memories, context);

      expect(ranked[0].scores.context).toBeGreaterThan(0.3);
    });
  });

  describe('Adaptive Ranking', () => {
    test('records and uses success history', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Content one. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        {
          id: 'mem2',
          crew_id: 'crew1',
          content: 'Content two. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      // Record successes
      ranker.recordSuccess('mem1');
      ranker.recordSuccess('mem1');
      ranker.recordFailure('mem2');

      const ranked = await ranker.rankMemories('test', memories);

      // After successes, mem1 should have higher adaptive score
      expect(ranked[0].scores.adaptive).toBeGreaterThanOrEqual(ranked[1].scores.adaptive);
    });
  });

  describe('Budget-Aware Selection', () => {
    test('selects memories within budget', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Content ${i}. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const ranked = await ranker.rankMemories('test', memories);
      const selected = ranker.selectWithinBudget(ranked, 3);

      expect(selected.length).toBeLessThanOrEqual(3);
    });

    test('respects maximum count parameter', async () => {
      const memories: Memory[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Content ${i}. `.repeat(5),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const ranked = await ranker.rankMemories('test', memories);
      const selected = ranker.selectWithinBudget(ranked, 3);

      expect(selected.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Re-ranking with Custom Weights', () => {
    test('re-ranks with different weight distributions', async () => {
      const memories: Memory[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Memory ${i}. `.repeat(15),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9 - i * 0.1,
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      const ranked = await ranker.rankMemories('test', memories);

      // Re-rank with emphasis on confidence
      const reranked = ranker.rerank(ranked, {
        confidence: 0.8,
        semantic: 0.1,
        recency: 0.1,
      });

      expect(reranked.length).toBe(ranked.length);
      reranked.forEach((r, i) => {
        expect(r.rank).toBe(i + 1);
      });
    });
  });

  describe('Diversity Analysis', () => {
    test('analyzes result diversity', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Story content. '.repeat(10),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'mem2',
          crew_id: 'crew1',
          content: 'Insight content. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['tag3'],
        },
      ];

      const ranked = await ranker.rankMemories('test', memories);
      const diversity = ranker.analyzeDiversity(ranked);

      expect(diversity.tagCoverage).toBeDefined();
      expect(diversity.topicDiversity).toBeGreaterThan(0);
      expect(diversity.typeDistribution).toBeDefined();
      expect(diversity.ageProportion).toBeDefined();
    });

    test('calculates tag coverage correctly', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Content. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      ];

      const ranked = await ranker.rankMemories('test', memories);
      const diversity = ranker.analyzeDiversity(ranked);

      expect(diversity.tagCoverage.length).toBe(3);
    });
  });

  describe('Ranking Statistics', () => {
    test('calculates ranking statistics', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Content ${i}. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const ranked = await ranker.rankMemories('test', memories);
      const stats = ranker.getRankingStats(ranked);

      expect(stats.avgRelevance).toBeGreaterThan(0);
      expect(stats.maxRelevance).toBeGreaterThanOrEqual(stats.avgRelevance);
      expect(stats.minRelevance).toBeLessThanOrEqual(stats.avgRelevance);
      expect(stats.totalCost).toBeGreaterThanOrEqual(0);
    });

    test('handles empty ranked list in statistics', () => {
      const stats = ranker.getRankingStats([]);

      expect(stats.avgRelevance).toBe(0);
      expect(stats.maxRelevance).toBe(0);
      expect(stats.minRelevance).toBe(0);
      expect(stats.totalCost).toBe(0);
      expect(stats.avgCost).toBe(0);
    });
  });

  describe('Recency Calculation', () => {
    test('scores recent memories higher', async () => {
      const memories: Memory[] = [
        {
          id: 'recent',
          crew_id: 'crew1',
          content: 'Recent content. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          access_count: 0,
          last_accessed: new Date().toISOString(),
          tags: [],
        },
        {
          id: 'old',
          crew_id: 'crew1',
          content: 'Old content. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        },
      ];

      const ranked = await ranker.rankMemories('test', memories);

      expect(ranked[0].scores.recency).toBeGreaterThan(ranked[1].scores.recency);
    });
  });

  describe('Configuration Options', () => {
    test('uses custom weight configuration', async () => {
      const customRanker = new MemoryRankerService(embeddingProvider, {
        weights: {
          semantic: 0.7,
          recency: 0.15,
          confidence: 0.15,
        },
        costPerToken: 0.05,
      });

      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Test content. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      const ranked = await customRanker.rankMemories('test', memories);

      expect(ranked).toBeDefined();
      expect(ranked.length).toBe(1);
    });
  });
});
