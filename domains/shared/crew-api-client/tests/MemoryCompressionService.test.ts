/**
 * Memory Compression Service Tests
 * Verify compression algorithms, ratios, and data integrity
 */

import { MemoryCompressionService } from '../src/services/memory-compression';
import { Memory } from '../src/types';

describe('MemoryCompressionService', () => {
  let service: MemoryCompressionService;

  beforeEach(() => {
    service = new MemoryCompressionService();
  });

  describe('Extractive Compression', () => {
    test('extracts key sentences from long content', () => {
      const memory: Memory = {
        id: 'mem_test',
        crew_id: 'crew_123',
        content:
          'The system is working normally. However, we discovered a critical bug in the authentication module. The bug is causing user sessions to expire prematurely. We have implemented a fix. The fix resolves the issue completely. Users can now log in successfully.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.95,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const result = service.compress(memory, {
        strategy: 'extractive',
        targetRatio: 0.5,
      });

      expect(result.compressed).toBe(true);
      expect(result.strategy).toBe('extractive');
      expect(result.ratio).toBeLessThan(0.95);
      expect(result.bytesReduced).toBeGreaterThan(0);
      expect(result.compressedContent).toBeTruthy();
      expect(result.compressedContent!.length).toBeLessThan(memory.content.length);
    });

    test('preserves important keywords in compressed content', () => {
      const memory: Memory = {
        id: 'mem_test',
        crew_id: 'crew_123',
        content: 'This is filler text. Critical decision made today. More filler here. Success was achieved.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const result = service.compress(memory, { strategy: 'extractive' });

      expect(result.compressedContent).toContain('Critical decision');
      expect(result.compressedContent).toContain('Success');
    });

    test('does not compress very short content', () => {
      const memory: Memory = {
        id: 'mem_short',
        crew_id: 'crew_123',
        content: 'Short',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const result = service.compress(memory);

      expect(result.compressed).toBe(false);
      expect(result.strategy).toBe('none');
      expect(result.ratio).toBe(1.0);
    });
  });

  describe('Compression Ratio', () => {
    test('achieves >40% compression on long content', () => {
      const longContent = Array(100)
        .fill(
          'This is a longer sentence with multiple words that will be used to test compression algorithms and ratios.'
        )
        .join(' ');

      const memory: Memory = {
        id: 'mem_long',
        crew_id: 'crew_123',
        content: longContent,
        type: 'story',
        retention_tier: 'standard',
        confidence_level: 0.85,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const result = service.compress(memory, { strategy: 'extractive' });

      expect(result.ratio).toBeLessThan(0.65);
      expect(result.bytesReduced).toBeGreaterThan(memory.content.length * 0.35);
    });

    test('estimates compression ratio accurately', () => {
      const contentLength = 2000;
      const estimatedRatio = service.estimateCompressionRatio(contentLength, 'extractive');

      expect(estimatedRatio).toBeGreaterThan(0.3);
      expect(estimatedRatio).toBeLessThan(0.9);
    });

    test('lossy compression achieves more reduction than extractive', () => {
      const memory: Memory = {
        id: 'mem_test',
        crew_id: 'crew_123',
        content:
          'Visit https://example.com for more info. [timestamp: 2024-01-01] Contact us at support@example.com. (confidence: 0.95) This is important information.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const extractiveResult = service.compress(memory, { strategy: 'extractive' });
      const lossyResult = service.compress(memory, { strategy: 'lossy' });

      expect(lossyResult.ratio).toBeLessThanOrEqual(extractiveResult.ratio);
      expect(lossyResult.bytesReduced).toBeGreaterThanOrEqual(extractiveResult.bytesReduced);
    });
  });

  describe('Batch Compression', () => {
    test('compresses multiple memories in batch', () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_123',
          content: `Memory ${i}: ${Array(50).fill('word').join(' ')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { results, stats } = service.compressBatch(memories, { strategy: 'extractive' });

      expect(results.length).toBe(5);
      expect(stats.totalProcessed).toBe(5);
      expect(stats.compressed).toBeGreaterThan(0);
      expect(stats.bytesReduced).toBeGreaterThan(0);
    });

    test('calculates aggregate statistics correctly', () => {
      const memories: Memory[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_123',
          content: `Memory: ${Array(30).fill('content').join(' ')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const { results, stats } = service.compressBatch(memories);

      const totalOriginal = results.reduce((sum, r) => sum + r.originalLength, 0);
      const totalCompressed = results.reduce((sum, r) => sum + r.compressedLength, 0);
      const totalReduced = results.reduce((sum, r) => sum + r.bytesReduced, 0);

      expect(stats.totalOriginalBytes).toBe(totalOriginal);
      expect(stats.totalCompressedBytes).toBe(totalCompressed);
      expect(stats.bytesReduced).toBe(totalReduced);
      expect(stats.averageRatio).toBeCloseTo(totalCompressed / totalOriginal, 2);
    });
  });

  describe('Auto-Compression', () => {
    test('identifies old memories for compression', () => {
      const oldMemory: Memory = {
        id: 'mem_old',
        crew_id: 'crew_123',
        content: 'This is old content that should be compressed.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 3 years ago
        updated_at: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const shouldCompress = service.shouldCompress(oldMemory, { minAgeDays: 730 });
      expect(shouldCompress).toBe(true);
    });

    test('does not compress recent memories', () => {
      const recentMemory: Memory = {
        id: 'mem_recent',
        crew_id: 'crew_123',
        content: 'This is recent content.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const shouldCompress = service.shouldCompress(recentMemory, { minAgeDays: 730 });
      expect(shouldCompress).toBe(false);
    });
  });

  describe('Strategy Suggestion', () => {
    test('suggests lossy for very old memories', () => {
      const veryOldMemory: Memory = {
        id: 'mem_very_old',
        crew_id: 'crew_123',
        content: 'Old content with lots of details that may not be relevant anymore.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.8,
        created_at: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 4 years ago
        updated_at: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        access_count: 0,
        last_accessed: new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
      };

      const strategy = service.suggestStrategy(veryOldMemory);
      expect(strategy).toBe('lossy');
    });

    test('suggests extractive for long content', () => {
      const longMemory: Memory = {
        id: 'mem_long',
        crew_id: 'crew_123',
        content: Array(100).fill('This is a longer sentence. ').join(''),
        type: 'story',
        retention_tier: 'standard',
        confidence_level: 0.85,
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-06-01T00:00:00Z',
        tags: [],
      };

      const strategy = service.suggestStrategy(longMemory);
      expect(strategy).toBe('extractive');
    });

    test('suggests no compression for recent short memories', () => {
      const shortMemory: Memory = {
        id: 'mem_short',
        crew_id: 'crew_123',
        content: 'Brief note.',
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-12-01T00:00:00Z',
        tags: [],
      };

      const strategy = service.suggestStrategy(shortMemory);
      expect(strategy).toBe('none');
    });
  });

  describe('Storage Savings', () => {
    test('calculates savings accurately', () => {
      const memories: Memory[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew_123',
          content: Array(50).fill(`Memory ${i} content. `).join(''),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      const savings = service.calculateSavings(memories, 'extractive');

      expect(savings.estimatedOriginalBytes).toBeGreaterThan(0);
      expect(savings.estimatedCompressedBytes).toBeGreaterThan(0);
      expect(savings.estimatedCompressedBytes).toBeLessThan(savings.estimatedOriginalBytes);
      expect(savings.estimatedBytesSaved).toBeGreaterThan(0);
      expect(savings.estimatedRatio).toBeCloseTo(
        savings.estimatedCompressedBytes / savings.estimatedOriginalBytes,
        2
      );
    });
  });

  describe('Data Integrity', () => {
    test('preserves essential information during compression', () => {
      const memory: Memory = {
        id: 'mem_test',
        crew_id: 'crew_123',
        content:
          'Started implementation of feature X on Monday. Completed 50% by Wednesday. Resolved critical bug preventing progress. Feature X is now 75% complete as of Friday.',
        type: 'story',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const result = service.compress(memory, { strategy: 'extractive' });

      // Check that key facts are preserved
      expect(result.compressedContent).toContain('feature X');
      expect(result.compressedContent).toContain('critical bug');
    });

    test('marks compression as reversible for extractive', () => {
      const memory: Memory = {
        id: 'mem_test',
        crew_id: 'crew_123',
        content: Array(20)
          .fill('This is longer test content for reversibility checking and validation.')
          .join(' '),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const result = service.compress(memory, { strategy: 'extractive' });
      expect(result.reversible).toBe(true);

      const lossyResult = service.compress(memory, { strategy: 'lossy' });
      expect(lossyResult.reversible).toBe(false);
    });
  });
});
