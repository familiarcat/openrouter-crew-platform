/**
 * Memory Analytics Service Tests
 * Verify analytics, insights, and recommendations
 */

import { MemoryAnalyticsService } from '../src/services/memory-analytics';
import { Memory } from '../src/types';

describe('MemoryAnalyticsService', () => {
  let service: MemoryAnalyticsService;

  beforeEach(() => {
    service = new MemoryAnalyticsService();
  });

  describe('Access Pattern Tracking', () => {
    test('records memory access', () => {
      const accessDate = new Date();
      service.recordAccess('mem_1', accessDate);

      const pattern = service.getAccessPattern('mem_1');

      expect(pattern).toBeDefined();
      expect(pattern!.accessCount).toBe(1);
      expect(pattern!.memoryId).toBe('mem_1');
    });

    test('tracks multiple accesses to same memory', () => {
      const now = new Date();
      service.recordAccess('mem_1', new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
      service.recordAccess('mem_1', new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
      service.recordAccess('mem_1', now);

      const pattern = service.getAccessPattern('mem_1');

      expect(pattern!.accessCount).toBe(3);
      expect(pattern!.lastAccessed).toEqual(now);
    });

    test('calculates access frequency', () => {
      const now = new Date();
      service.recordAccess('mem_1', new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000));
      service.recordAccess('mem_1', now);

      const pattern = service.getAccessPattern('mem_1');

      expect(pattern!.accessFrequency).toBeGreaterThan(0);
    });

    test('determines access trend', () => {
      const now = new Date();
      // Old accesses
      service.recordAccess('mem_1', new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000));
      service.recordAccess('mem_1', new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000));
      // Recent accesses (increasing trend)
      service.recordAccess('mem_1', new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
      service.recordAccess('mem_1', new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
      service.recordAccess('mem_1', now);

      const pattern = service.getAccessPattern('mem_1');

      expect(pattern!.accessTrend).toBe('increasing');
    });

    test('returns undefined for non-existent access pattern', () => {
      const pattern = service.getAccessPattern('non_existent');

      expect(pattern).toBeUndefined();
    });

    test('uses base memory data when no access history', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Test content',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 5,
        last_accessed: '2024-01-10T00:00:00Z',
        tags: [],
      };

      const pattern = service.getAccessPattern('mem_1', memory);

      expect(pattern).toBeDefined();
      expect(pattern!.accessCount).toBe(5);
    });
  });

  describe('Topic Analysis', () => {
    test('extracts topics from memory content', () => {
      const memories: Memory[] = [
        {
          id: 'mem_1',
          crew_id: 'crew_1',
          content: 'Performance optimization and caching strategies. '.repeat(5),
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

      const topics = service.analyzeTopicTrends(memories);

      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0].frequency).toBeGreaterThan(0);
    });

    test('analyzes topic trends across multiple memories', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Database optimization and performance. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const topics = service.analyzeTopicTrends(memories);

      expect(topics.length).toBeGreaterThan(0);
      expect(topics.some(t => t.relatedMemories.length > 0)).toBe(true);
    });

    test('calculates average confidence per topic', () => {
      const memories: Memory[] = [
        {
          id: 'mem_1',
          crew_id: 'crew_1',
          content: 'Performance optimization strategies. '.repeat(10),
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
          id: 'mem_2',
          crew_id: 'crew_1',
          content: 'Performance improvements in cache layer. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.7,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
      ];

      const topics = service.analyzeTopicTrends(memories);
      const perfTopic = topics.find(t => t.topic === 'performance');

      expect(perfTopic).toBeDefined();
      expect(perfTopic!.avgConfidence).toBeLessThanOrEqual(0.9);
      expect(perfTopic!.avgConfidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Confidence Decay', () => {
    test('calculates confidence decay for new memory', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Test content. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        access_count: 0,
        last_accessed: new Date().toISOString(),
        tags: [],
      };

      const decay = service.calculateConfidenceDecay(memory);

      expect(decay.memoryId).toBe('mem_1');
      expect(decay.initialConfidence).toBe(0.9);
      expect(decay.currentConfidence).toBeCloseTo(0.9, 1); // Nearly no decay for new memory
      expect(decay.decayRate).toBeGreaterThan(0);
    });

    test('calculates higher decay for older memories', () => {
      const now = new Date();
      const oldMemory: Memory = {
        id: 'mem_old',
        crew_id: 'crew_1',
        content: 'Old content. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        updated_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const decay = service.calculateConfidenceDecay(oldMemory);

      expect(decay.currentConfidence).toBeLessThan(decay.initialConfidence);
    });

    test('reduces decay rate for frequently accessed memories', () => {
      const now = new Date();
      const accessedMemory: Memory = {
        id: 'mem_accessed',
        crew_id: 'crew_1',
        content: 'Accessed content. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 20, // Frequently accessed
        last_accessed: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const decay = service.calculateConfidenceDecay(accessedMemory);

      expect(decay.decayRate).toBeLessThan(0.05);
    });
  });

  describe('Insight Generation', () => {
    test('generates insights from memory analytics', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Test content. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const insights = service.generateInsights(memories);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    test('identifies confidence decay warnings', () => {
      const now = new Date();
      const decayedMemory: Memory = {
        id: 'mem_decayed',
        crew_id: 'crew_1',
        content: 'Decayed content. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.85,
        created_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const insights = service.generateInsights([decayedMemory]);

      expect(insights.some(i => i.type === 'warning')).toBe(true);
    });

    test('identifies stale memories', () => {
      const now = new Date();
      const oldMemory: Memory = {
        id: 'mem_stale',
        crew_id: 'crew_1',
        content: 'Stale content. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.7,
        created_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 1,
        last_accessed: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const insights = service.generateInsights([oldMemory]);

      expect(insights.some(i => i.title === 'Stale Memories Identified')).toBe(true);
    });

    test('includes affected memory IDs in insights', () => {
      const now = new Date();
      const memories: Memory[] = [
        {
          id: 'mem_1',
          crew_id: 'crew_1',
          content: 'Content. '.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.3,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          access_count: 0,
          last_accessed: now.toISOString(),
          tags: [],
        },
      ];

      const insights = service.generateInsights(memories);

      expect(insights.some(i => i.affected.length > 0)).toBe(true);
    });
  });

  describe('Recommendations', () => {
    test('calculates recommendation score for memory', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Test content. '.repeat(10),
        type: 'insight',
        retention_tier: 'eternal',
        confidence_level: 0.9,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 10,
        last_accessed: new Date().toISOString(),
        tags: ['important', 'recent'],
      };

      const score = service.getRecommendationScore(memory);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('higher score for recently accessed memories', () => {
      const baseMemory: Memory = {
        id: 'mem_base',
        crew_id: 'crew_1',
        content: 'Test. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        tags: [],
      };

      const recentMemory: Memory = {
        ...baseMemory,
        id: 'mem_recent',
        last_accessed: new Date().toISOString(),
      };

      const baseScore = service.getRecommendationScore(baseMemory);
      const recentScore = service.getRecommendationScore(recentMemory);

      expect(recentScore).toBeGreaterThan(baseScore);
    });

    test('gets top recommendations', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9 - i * 0.1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: i * 2,
          last_accessed: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      const recommendations = service.getTopRecommendations(memories, 3);

      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations[0].recommendationScore).toBeGreaterThanOrEqual(
        recommendations[recommendations.length - 1].recommendationScore
      );
    });
  });

  describe('Complete Analytics', () => {
    test('generates complete analytics report', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: Database optimization and performance. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const analytics = service.generateAnalytics('crew_1', memories);

      expect(analytics.crewId).toBe('crew_1');
      expect(analytics.totalMemories).toBe(5);
      expect(analytics.topTopics.length).toBeGreaterThan(0);
      expect(analytics.insights.length).toBeGreaterThan(0);
      expect(analytics.typeDistribution).toBeDefined();
      expect(analytics.retentionMetrics).toBeDefined();
    });

    test('includes type distribution in analytics', () => {
      const memories: Memory[] = [
        {
          id: 'mem_story',
          crew_id: 'crew_1',
          content: 'Story content. '.repeat(10),
          type: 'story',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        {
          id: 'mem_insight',
          crew_id: 'crew_1',
          content: 'Insight content. '.repeat(10),
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

      const analytics = service.generateAnalytics('crew_1', memories);

      expect(analytics.typeDistribution.story).toBe(1);
      expect(analytics.typeDistribution.insight).toBe(1);
    });
  });

  describe('Data Management', () => {
    test('clears all analytics data', () => {
      service.recordAccess('mem_1', new Date());
      let insights = service.getInsights();
      expect(insights.length).toBeGreaterThanOrEqual(0);

      service.clearData();

      const pattern = service.getAccessPattern('mem_1');
      expect(pattern).toBeUndefined();
    });

    test('indexes memory topics for future analysis', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Performance optimization strategies. '.repeat(10),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      service.indexMemoryTopics(memory);

      // Memory should be tracked for topics
      const memories = [memory];
      const topics = service.analyzeTopicTrends(memories);
      expect(topics.length).toBeGreaterThan(0);
    });
  });
});
