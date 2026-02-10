/**
 * Semantic Clustering Service Tests
 * Verify memory clustering, deduplication, and duplicate detection
 */

import { SemanticClusteringService } from '../src/services/semantic-clustering';
import { EmbeddingProvider } from '../src/services/embedding-provider';
import { Memory } from '../src/types';

describe('SemanticClusteringService', () => {
  let clusteringService: SemanticClusteringService;
  let embeddingProvider: EmbeddingProvider;

  beforeEach(() => {
    embeddingProvider = new EmbeddingProvider({
      cache: { enabled: true },
    });
    clusteringService = new SemanticClusteringService(embeddingProvider, {
      similarityThreshold: 0.7,
      duplicateThreshold: 0.95,
    });
  });

  describe('Memory Clustering', () => {
    test('clusters semantically similar memories', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Database optimization and query performance improvements. '.repeat(10),
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
          content: 'Indexing strategies for database performance. '.repeat(10),
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
          id: 'mem3',
          crew_id: 'crew1',
          content: 'Pizza recipes and cooking techniques. '.repeat(10),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      const { clusters, stats } = await clusteringService.clusterMemories(memories);

      expect(clusters.length).toBeGreaterThan(0);
      expect(stats.totalMemories).toBe(3);
      expect(stats.clusterCount).toBeGreaterThan(0);
      expect(stats.avgCohesion).toBeGreaterThan(0);
    });

    test('handles empty memory list', async () => {
      const { clusters, stats } = await clusteringService.clusterMemories([]);

      expect(clusters.length).toBe(0);
      expect(stats.totalMemories).toBe(0);
      expect(stats.clusterCount).toBe(0);
    });

    test('clusters single memory correctly', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Single memory for clustering. '.repeat(10),
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

      const { clusters } = await clusteringService.clusterMemories(memories);

      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters[0].memories.length).toBe(1);
    });

    test('assigns representative memory to cluster', async () => {
      const memories: Memory[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Memory ${i}: ${Array(20).fill('Similar content here. ').join('')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { clusters } = await clusteringService.clusterMemories(memories);

      clusters.forEach((cluster) => {
        expect(cluster.representative).toBeDefined();
        expect(cluster.memories).toContain(cluster.representative);
      });
    });

    test('calculates cluster cohesion', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: Array(30).fill('Consistent topic discussion. ').join(''),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { clusters } = await clusteringService.clusterMemories(memories);

      clusters.forEach((cluster) => {
        expect(cluster.cohesion).toBeGreaterThan(0);
        expect(cluster.cohesion).toBeLessThanOrEqual(1.001); // Allow for floating point precision
      });
    });

    test('extracts topics from cluster', async () => {
      const memories: Memory[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: 'Database performance index query optimization. '.repeat(15),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { clusters } = await clusteringService.clusterMemories(memories);

      clusters.forEach((cluster) => {
        expect(cluster.topics).toBeDefined();
        expect(Array.isArray(cluster.topics)).toBe(true);
      });
    });
  });

  describe('Duplicate Detection', () => {
    test('detects duplicate memories', async () => {
      const content = 'Exact duplicate content for testing. '.repeat(15);

      const memories: Memory[] = [
        {
          id: 'dup1',
          crew_id: 'crew1',
          content,
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
          id: 'dup2',
          crew_id: 'crew1',
          content,
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

      const duplicates = await clusteringService.findDuplicates(memories);

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].similarity).toBeGreaterThanOrEqual(0.95);
    });

    test('does not detect dissimilar memories as duplicates', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Database optimization and performance. '.repeat(10),
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
          content: 'Pizza recipes and cooking tips. '.repeat(10),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      const duplicates = await clusteringService.findDuplicates(memories);

      expect(duplicates.length).toBe(0);
    });

    test('includes similarity score in duplicate detection', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Identical test content. '.repeat(20),
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
          content: 'Identical test content. '.repeat(20),
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

      const duplicates = await clusteringService.findDuplicates(memories);

      if (duplicates.length > 0) {
        expect(duplicates[0].similarity).toBeGreaterThan(0.9);
        expect(duplicates[0].similarity).toBeLessThanOrEqual(1);
      }
    });

    test('provides merge recommendations', async () => {
      const memories: Memory[] = [
        {
          id: 'mem1_high_conf',
          crew_id: 'crew1',
          content: 'Duplicate content here. '.repeat(15),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.95,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        {
          id: 'mem2_low_conf',
          crew_id: 'crew1',
          content: 'Duplicate content here. '.repeat(15),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.6,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      const duplicates = await clusteringService.findDuplicates(memories);

      if (duplicates.length > 0) {
        expect(['keep_first', 'keep_second', 'merge']).toContain(
          duplicates[0].mergeRecommendation
        );
      }
    });
  });

  describe('Merge Operations', () => {
    test('merges duplicate memories', () => {
      const dup = {
        memory1: {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'First memory. ',
          type: 'insight' as const,
          retention_tier: 'standard' as const,
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 5,
          last_accessed: '2024-01-02T00:00:00Z',
          tags: ['tag1'],
        },
        memory2: {
          id: 'mem2',
          crew_id: 'crew1',
          content: 'Second memory. ',
          type: 'insight' as const,
          retention_tier: 'standard' as const,
          confidence_level: 0.85,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 3,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: ['tag2'],
        },
        similarity: 0.95,
        mergeRecommendation: 'merge' as const,
      };

      const merged = clusteringService.mergeDuplicates(dup);

      expect(merged).toBeDefined();
      expect(merged.content).toContain('First memory');
      expect(merged.content).toContain('Second memory');
      expect(merged.tags).toContain('tag1');
      expect(merged.tags).toContain('tag2');
    });

    test('respects keep_first recommendation', () => {
      const dup = {
        memory1: {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Keep this memory. ',
          type: 'insight' as const,
          retention_tier: 'standard' as const,
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        memory2: {
          id: 'mem2',
          crew_id: 'crew1',
          content: 'Discard this memory. ',
          type: 'insight' as const,
          retention_tier: 'standard' as const,
          confidence_level: 0.8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        similarity: 0.95,
        mergeRecommendation: 'keep_first' as const,
      };

      const result = clusteringService.mergeDuplicates(dup);

      expect(result).toEqual(dup.memory1);
    });
  });

  describe('Clustering Statistics', () => {
    test('calculates clustering statistics', async () => {
      const memories: Memory[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Memory ${i}: ${Array(20).fill('content').join(' ')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { stats } = await clusteringService.clusterMemories(memories);

      expect(stats.totalMemories).toBe(10);
      expect(stats.clusterCount).toBeGreaterThan(0);
      expect(stats.avgClusterSize).toBeGreaterThan(0);
      expect(stats.avgCohesion).toBeGreaterThanOrEqual(0);
    });

    test('estimates duplicate savings', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: Array(50).fill('Duplicate content. ').join(''),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { stats } = await clusteringService.clusterMemories(memories);

      expect(stats.potentialSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cluster Insights', () => {
    test('provides cluster quality insights', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: 'Quality insight test content. '.repeat(15),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.85,
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 5 - i,
          last_accessed: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      const { clusters } = await clusteringService.clusterMemories(memories);

      clusters.forEach((cluster) => {
        const insights = clusteringService.getClusterInsights(cluster);
        expect(insights.coverage).toBeGreaterThanOrEqual(0);
        expect(insights.coverage).toBeLessThanOrEqual(1);
        expect(insights.diversity).toBeGreaterThanOrEqual(0);
        expect(insights.diversity).toBeLessThanOrEqual(1);
        expect(insights.freshness).toBeGreaterThanOrEqual(0);
        expect(insights.freshness).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Configuration Options', () => {
    test('uses custom similarity threshold', async () => {
      const customService = new SemanticClusteringService(embeddingProvider, {
        similarityThreshold: 0.85,
      });

      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Very similar content. '.repeat(20),
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
          content: 'Very similar content. '.repeat(20),
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

      const { clusters } = await customService.clusterMemories(memories);

      expect(clusters).toBeDefined();
    });

    test('uses custom duplicate threshold', async () => {
      const customService = new SemanticClusteringService(embeddingProvider, {
        duplicateThreshold: 0.98,
      });

      const memories: Memory[] = [
        {
          id: 'mem1',
          crew_id: 'crew1',
          content: 'Test duplicate content. '.repeat(15),
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
          content: 'Test duplicate content. '.repeat(15),
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

      const duplicates = await customService.findDuplicates(memories);

      expect(Array.isArray(duplicates)).toBe(true);
    });
  });
});
