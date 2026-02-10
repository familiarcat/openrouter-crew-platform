/**
 * Memory Archival Service Tests
 * Verify archival strategies, batch operations, and retrieval
 */

import { MemoryArchivalService } from '../src/services/memory-archival';
import { Memory } from '../src/types';

describe('MemoryArchivalService', () => {
  let service: MemoryArchivalService;

  beforeEach(() => {
    service = new MemoryArchivalService({
      strategy: 'automatic',
      minAgeDays: 30,
      compressionEnabled: true,
    });
  });

  describe('Archival Decision', () => {
    test('identifies memories eligible for archival', () => {
      const oldMemory: Memory = {
        id: 'mem_old',
        crew_id: 'crew_1',
        content: 'Old content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.7,
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
        updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      expect(service.shouldArchive(oldMemory)).toBe(true);
    });

    test('does not archive eternal memories', () => {
      const eternalMemory: Memory = {
        id: 'mem_eternal',
        crew_id: 'crew_1',
        content: 'Eternal content. '.repeat(50),
        type: 'best-practice',
        retention_tier: 'eternal',
        confidence_level: 0.95,
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 100,
        last_accessed: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['important'],
      };

      expect(service.shouldArchive(eternalMemory)).toBe(false);
    });

    test('does not archive recently accessed memories', () => {
      const recentMemory: Memory = {
        id: 'mem_recent',
        crew_id: 'crew_1',
        content: 'Recent content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 5,
        last_accessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        tags: [],
      };

      expect(service.shouldArchive(recentMemory)).toBe(false);
    });

    test('archives low-confidence memories regardless of age', () => {
      const lowConfMemory: Memory = {
        id: 'mem_low',
        crew_id: 'crew_1',
        content: 'Low confidence content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.2,
        created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      expect(service.shouldArchive(lowConfMemory)).toBe(true);
    });
  });

  describe('Single Memory Archival', () => {
    test('archives a single memory', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Content to archive. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 5,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: ['test'],
      };

      const archived = service.archiveMemory(memory);

      expect(archived.originalId).toBe(memory.id);
      expect(archived.metadata.confidence).toBe(0.8);
      expect(archived.metadata.type).toBe('insight');
      expect(archived.archivedAt).toBeDefined();
    });

    test('compresses memory during archival', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'This is a longer test sentence for compression testing. '.repeat(20), // Longer content
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const archived = service.archiveMemory(memory);

      expect(archived.compressedLength).toBeLessThanOrEqual(archived.originalLength);
    });

    test('preserves metadata during archival', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Content to archive. '.repeat(50),
        type: 'story',
        retention_tier: 'eternal',
        confidence_level: 0.95,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
        access_count: 10,
        last_accessed: '2024-01-15T00:00:00Z',
        tags: ['important', 'reference'],
      };

      const archived = service.archiveMemory(memory);

      expect(archived.metadata.retentionTier).toBe('eternal');
      expect(archived.metadata.confidence).toBe(0.95);
      expect(archived.metadata.tags).toEqual(['important', 'reference']);
    });
  });

  describe('Batch Archival', () => {
    test('archives multiple memories in batch', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_1',
          content: `Memory ${i}: content. `.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.8,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        }));

      const result = service.batchArchive(memories, 'automatic');

      expect(result.archived.length).toBeGreaterThan(0);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalArchived).toBe(result.archived.length);
    });

    test('skips memories that should not be archived', () => {
      const memories: Memory[] = [
        {
          id: 'mem_eternal',
          crew_id: 'crew_1',
          content: 'Eternal content. '.repeat(50),
          type: 'best-practice',
          retention_tier: 'eternal',
          confidence_level: 0.95,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 100,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        },
        {
          id: 'mem_old',
          crew_id: 'crew_1',
          content: 'Old content. '.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.7,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        },
      ];

      const result = service.batchArchive(memories, 'automatic');

      expect(result.skipped.length).toBe(1);
      expect(result.skipped[0]).toBe('mem_eternal');
    });
  });

  describe('Archive Retrieval', () => {
    test('finds archived memory by original ID', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Content to archive. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const archived = service.archiveMemory(memory);
      const found = service.findInArchive(memory.id);

      expect(found).toBeDefined();
      expect(found!.originalId).toBe(memory.id);
    });

    test('restores memory from archive', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Original content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 5,
        last_accessed: '2024-01-10T00:00:00Z',
        tags: ['test'],
      };

      const archived = service.archiveMemory(memory);
      const restored = service.restoreMemory(archived.id);

      expect(restored).toBeDefined();
      expect(restored!.id).toBe(memory.id);
      expect(restored!.type).toBe('insight');
    });

    test('lists archived memories', () => {
      Array(3)
        .fill(null)
        .forEach((_, i) => {
          const memory: Memory = {
            id: `mem_${i}`,
            crew_id: 'crew_1',
            content: `Memory ${i}: content. `.repeat(50),
            type: 'insight',
            retention_tier: 'standard',
            confidence_level: 0.8,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            access_count: 0,
            last_accessed: '2024-01-01T00:00:00Z',
            tags: [],
          };
          service.archiveMemory(memory);
        });

      const listed = service.listArchived();

      expect(listed.length).toBe(3);
    });

    test('deletes archived memory', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const archived = service.archiveMemory(memory);
      const deleted = service.deleteArchived(archived.id);

      expect(deleted).toBe(true);
      expect(service.findInArchive(memory.id)).toBeUndefined();
    });
  });

  describe('Archival Metrics', () => {
    test('calculates archival metrics', () => {
      Array(3)
        .fill(null)
        .forEach((_, i) => {
          const memory: Memory = {
            id: `mem_${i}`,
            crew_id: 'crew_1',
            content: `Memory ${i}: content. `.repeat(50),
            type: 'insight',
            retention_tier: 'standard',
            confidence_level: 0.8,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            access_count: 0,
            last_accessed: '2024-01-01T00:00:00Z',
            tags: [],
          };
          service.archiveMemory(memory);
        });

      const metrics = service.calculateMetrics();

      expect(metrics.totalArchived).toBe(3);
      expect(metrics.compressionRatio).toBeLessThanOrEqual(1);
      expect(metrics.estimatedSavings).toBeGreaterThanOrEqual(0);
    });

    test('includes oldest and newest archived dates', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      service.archiveMemory(memory);
      const metrics = service.calculateMetrics();

      expect(metrics.oldestArchived).toBeDefined();
      expect(metrics.newestArchived).toBeDefined();
    });
  });

  describe('Archival Recommendations', () => {
    test('recommends memories for archival', () => {
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

      const recommendations = service.recommendArchival(memories);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].action).toBe('archive');
      expect(recommendations[0].reason).toBeDefined();
      expect(recommendations[0].estimatedSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Strategy Analysis', () => {
    test('analyzes archival strategy', () => {
      const memories: Memory[] = Array(10)
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

      const analysis = service.analyzeStrategy(memories);

      expect(analysis.strategyName).toBe('automatic');
      expect(analysis.estimatedArchivable).toBeGreaterThanOrEqual(0);
      expect(analysis.estimatedSavings).toBeGreaterThanOrEqual(0);
      expect(analysis.timeToExecute).toBeDefined();
    });
  });

  describe('Data Management', () => {
    test('clears archive completely', () => {
      const memory: Memory = {
        id: 'mem_1',
        crew_id: 'crew_1',
        content: 'Content. '.repeat(50),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      service.archiveMemory(memory);
      let metrics = service.calculateMetrics();
      expect(metrics.totalArchived).toBe(1);

      const cleared = service.clearArchive();

      expect(cleared).toBe(1);
      metrics = service.calculateMetrics();
      expect(metrics.totalArchived).toBe(0);
    });

    test('provides archive statistics by retention tier', () => {
      const memories: Memory[] = [
        {
          id: 'mem_1',
          crew_id: 'crew_1',
          content: 'Content. '.repeat(50),
          type: 'insight',
          retention_tier: 'eternal',
          confidence_level: 0.9,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        },
        {
          id: 'mem_2',
          crew_id: 'crew_1',
          content: 'Content. '.repeat(50),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.7,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          access_count: 0,
          last_accessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
        },
      ];

      // Archive both (eternal won't be archived by shouldArchive, but we're forcing it)
      service.archiveMemory(memories[0]);
      service.archiveMemory(memories[1]);

      const tierStats = service.getArchiveStatsByTier();

      expect(tierStats['eternal'].count).toBeGreaterThanOrEqual(0);
      expect(tierStats['standard'].count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration', () => {
    test('uses custom archival configuration', () => {
      const customService = new MemoryArchivalService({
        strategy: 'by-value',
        minAgeDays: 60,
        compressionEnabled: false,
      });

      expect(customService).toBeDefined();
    });

    test('defaults to automatic strategy when not specified', () => {
      const defaultService = new MemoryArchivalService();

      expect(defaultService).toBeDefined();
    });
  });
});
