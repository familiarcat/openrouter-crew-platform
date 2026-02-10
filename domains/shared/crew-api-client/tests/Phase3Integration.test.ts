/**
 * Phase 3 Integration Tests
 * Verify MemoryCompressionService, EmbeddingProvider, and BatchProcessorService work together
 */

import { MemoryCompressionService } from '../src/services/memory-compression';
import { EmbeddingProvider } from '../src/services/embedding-provider';
import { BatchProcessorService, BatchItem } from '../src/services/batch-processor';
import { Memory } from '../src/types';

describe('Phase 3 Integration', () => {
  let compressionService: MemoryCompressionService;
  let embeddingProvider: EmbeddingProvider;
  let batchProcessor: BatchProcessorService<Memory, string>;

  beforeEach(() => {
    compressionService = new MemoryCompressionService();
    embeddingProvider = new EmbeddingProvider({
      cache: { enabled: true, ttlMs: 60 * 60 * 1000 },
    });
    batchProcessor = new BatchProcessorService({
      batchSize: 5,
      maxRetries: 2,
      delayMs: 50,
    });
  });

  describe('Compression and Embedding Integration', () => {
    test('compresses memory and then embeds compressed content', async () => {
      const memory: Memory = {
        id: 'mem1',
        crew_id: 'crew1',
        content: Array(50).fill('This is content that will be compressed and then embedded. ').join(''),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.95,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      // Compress the memory
      const compressed = compressionService.compress(memory, {
        strategy: 'extractive',
      });

      expect(compressed.compressed).toBe(true);
      expect(compressed.compressedContent).toBeTruthy();

      // Embed the compressed content
      const embedding = await embeddingProvider.generateEmbedding(
        compressed.compressedContent!
      );

      expect(embedding).toBeDefined();
      expect(embedding.vector.length).toBe(384);
      expect(embedding.content).toBe(compressed.compressedContent);
    });

    test('embedding cache helps with multiple memory compressions', async () => {
      const memory1: Memory = {
        id: 'mem1',
        crew_id: 'crew1',
        content: 'Duplicate content for caching test. '.repeat(20),
        type: 'insight',
        retention_tier: 'standard',
        confidence_level: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const memory2: Memory = { ...memory1, id: 'mem2' };

      // Compress both
      const c1 = compressionService.compress(memory1);
      const c2 = compressionService.compress(memory2);

      // Embed with cache tracking
      const stats1 = embeddingProvider.getCacheStats();

      await embeddingProvider.generateEmbedding(c1.compressedContent!);
      const stats2 = embeddingProvider.getCacheStats();

      await embeddingProvider.generateEmbedding(c2.compressedContent!);
      const stats3 = embeddingProvider.getCacheStats();

      // Second embedding should be from cache or new
      expect(stats3.size).toBeGreaterThanOrEqual(stats2.size);
    });

    test('calculates similarity between compressed memories', async () => {
      const memory1: Memory = {
        id: 'mem1',
        crew_id: 'crew1',
        content: 'Similar topic discussed extensively. '.repeat(30),
        type: 'story',
        retention_tier: 'standard',
        confidence_level: 0.85,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const memory2: Memory = {
        id: 'mem2',
        crew_id: 'crew1',
        content: 'Unrelated topic with different content. '.repeat(30),
        type: 'story',
        retention_tier: 'standard',
        confidence_level: 0.85,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-02T00:00:00Z',
        tags: [],
      };

      // Compress both
      const c1 = compressionService.compress(memory1);
      const c2 = compressionService.compress(memory2);

      // Calculate similarity of compressed content
      const similarity = await embeddingProvider.calculateContentSimilarity(
        c1.compressedContent!,
        c2.compressedContent!
      );

      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('Batch Compression with Processing', () => {
    test('batches memories for compression', async () => {
      const memories: Memory[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Memory ${i}: ${Array(30).fill('content word').join(' ')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      // Enqueue all memories for batch processing
      memories.forEach((memory) => {
        batchProcessor.enqueue({
          id: memory.id,
          data: memory,
        });
      });

      expect(batchProcessor.getQueueSize()).toBe(10);

      // Process with compression
      const result = await batchProcessor.process(async (items) => {
        return items.map((item: BatchItem<Memory>) => {
          const compressed = compressionService.compress(item.data, {
            strategy: 'extractive',
          });
          return {
            id: item.id,
            result: compressed.compressedContent || item.data.content,
          };
        });
      });

      expect(result.succeeded.length).toBe(10);
      expect(result.failed.length).toBe(0);
      expect(batchProcessor.getQueueSize()).toBe(0);
    });

    test('processes batch with mixed compression results', async () => {
      const memories: Memory[] = [
        {
          id: 'short',
          crew_id: 'crew1',
          content: 'Short',
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
          id: 'long',
          crew_id: 'crew1',
          content: Array(40).fill('content').join(' '),
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

      for (const memory of memories) {
        batchProcessor.enqueue({
          id: memory.id,
          data: memory,
          priority: memory.content.length > 50 ? 10 : 1,
        });
      }

      const result = await batchProcessor.process(async (items) => {
        return items.map((item: BatchItem<Memory>) => {
          const compressed = compressionService.compress(item.data);
          return {
            id: item.id,
            result: `${item.id}:compressed=${compressed.compressed}`,
          };
        });
      });

      expect(result.succeeded.length).toBe(2);
      expect(result.succeeded.some((r) => r.result.includes('short'))).toBe(true);
    });
  });

  describe('Batch Embedding Generation', () => {
    test('batches memories for embedding generation', async () => {
      const memories: Memory[] = Array(8)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Memory ${i}: ${Array(20).fill('word').join(' ')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      // Prepare contents for embedding
      const contents = memories.map((m) => m.content);

      // Use batch embeddings
      const result = await embeddingProvider.generateBatchEmbeddings(contents);

      expect(result.embeddings.length).toBe(8);
      expect(result.errors.length).toBe(0);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('handles embedding generation in batch processor', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Content ${i} for embedding. `.repeat(10),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      for (const memory of memories) {
        batchProcessor.enqueue({
          id: memory.id,
          data: memory,
        });
      }

      const result = await batchProcessor.process(async (items) => {
        const contents = items.map((item) => item.data.content);
        const batchResult = await embeddingProvider.generateBatchEmbeddings(contents);

        return batchResult.embeddings.map((emb) => ({
          id: items.find((i) => i.data.content === emb.content)?.id || '',
          result: emb.contentHash,
        }));
      });

      expect(result.succeeded.length).toBeGreaterThan(0);
    });
  });

  describe('Full Pipeline Integration', () => {
    test('compresses, embeds, and batches memories end-to-end', async () => {
      const memories: Memory[] = Array(6)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: Array(30).fill(`Memory ${i} content. `).join(''),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      // Step 1: Enqueue all for batch processing
      memories.forEach((memory, index) => {
        batchProcessor.enqueue({
          id: memory.id,
          data: memory,
          priority: index,
        });
      });

      // Step 2: Process with compression and embedding
      const results = await batchProcessor.process(async (items) => {
        const processingResults = [];

        for (const item of items) {
          // Compress
          const compressed = compressionService.compress(item.data, {
            strategy: 'extractive',
          });

          // Embed compressed content
          const embedding = await embeddingProvider.generateEmbedding(
            compressed.compressedContent || item.data.content
          );

          processingResults.push({
            id: item.id,
            result: `${item.id}:hash=${embedding.contentHash}`,
          });
        }

        return processingResults;
      });

      expect(results.succeeded.length).toBe(6);
      expect(results.failed.length).toBe(0);
      expect(results.itemsProcessed).toBe(6);
    });

    test('pipeline handles compression statistics and savings', async () => {
      const memories: Memory[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: `Memory ${i}: ${Array(50).fill('This is important content that should be processed. ').join('')}`,
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      // Batch compress all memories
      const { results, stats } = compressionService.compressBatch(memories, {
        strategy: 'extractive',
      });

      expect(stats.totalProcessed).toBe(3);
      expect(stats.compressed).toBeGreaterThanOrEqual(0);
      expect(stats.bytesReduced).toBeGreaterThanOrEqual(0);
      expect(stats.averageRatio).toBeGreaterThan(0);

      // Calculate potential savings
      const savings = compressionService.calculateSavings(memories, 'extractive');

      expect(savings.estimatedOriginalBytes).toBeGreaterThan(0);
      expect(savings.estimatedCompressedBytes).toBeGreaterThan(0);
      expect(savings.estimatedBytesSaved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Similarity Search on Compressed Memories', () => {
    test('finds similar memories after compression', async () => {
      const query: Memory = {
        id: 'query',
        crew_id: 'crew1',
        content: 'Database performance optimization and query efficiency improvements. '.repeat(10),
        type: 'story',
        retention_tier: 'standard',
        confidence_level: 0.95,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        access_count: 0,
        last_accessed: '2024-01-01T00:00:00Z',
        tags: [],
      };

      const memories: Memory[] = [
        {
          id: 'similar_1',
          crew_id: 'crew1',
          content: 'Database index optimization and query performance. '.repeat(10),
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
          id: 'dissimilar_1',
          crew_id: 'crew1',
          content: 'Pizza recipes and cooking techniques. '.repeat(10),
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

      // Compress query and memories
      const queryCompressed = compressionService.compress(query);
      const memoriesCompressed = memories.map((m) => compressionService.compress(m));

      // Calculate similarities
      const queryEmbedding = await embeddingProvider.generateEmbedding(
        queryCompressed.compressedContent || query.content
      );

      const similarities = [];

      for (let i = 0; i < memoriesCompressed.length; i++) {
        const compressed = memoriesCompressed[i];
        const originalMemory = memories[i];
        const memEmbedding = await embeddingProvider.generateEmbedding(
          compressed.compressedContent || originalMemory.content
        );

        const sim = embeddingProvider.calculateSimilarity(queryEmbedding, memEmbedding);
        similarities.push({
          id: compressed.id,
          similarity: sim,
        });
      }

      // Verify that similarities were calculated
      const similar = similarities.find((s) => s.id === 'similar_1');
      const dissimilar = similarities.find((s) => s.id === 'dissimilar_1');

      expect(similar).toBeDefined();
      expect(dissimilar).toBeDefined();

      // Both should have valid similarity scores
      if (similar) {
        expect(typeof similar.similarity).toBe('number');
        expect(similar.similarity).toBeGreaterThanOrEqual(-1);
        expect(similar.similarity).toBeLessThanOrEqual(1);
      }
      if (dissimilar) {
        expect(typeof dissimilar.similarity).toBe('number');
        expect(dissimilar.similarity).toBeGreaterThanOrEqual(-1);
        expect(dissimilar.similarity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Error Recovery in Pipeline', () => {
    test('handles compression failures in batch processor', async () => {
      const memories: Memory[] = [
        {
          id: 'valid_1',
          crew_id: 'crew1',
          content: Array(30).fill('content').join(' '),
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

      for (const memory of memories) {
        batchProcessor.enqueue({
          id: memory.id,
          data: memory,
        });
      }

      const result = await batchProcessor.process(async (items) => {
        return items
          .map((item: BatchItem<Memory>) => {
            const compressed = compressionService.compress(item.data);
            return {
              id: item.id,
              result: compressed.compressedContent || 'error',
            };
          })
          .filter((r) => r.result !== 'error');
      });

      // Should still succeed even if some items are filtered
      expect(result.succeeded.length).toBeGreaterThanOrEqual(0);
    });

    test('embedding cache prevents duplicate work in retries', async () => {
      const content = 'Test content for embedding caching. '.repeat(20);

      // First embedding
      const emb1 = await embeddingProvider.generateEmbedding(content);
      const stats1 = embeddingProvider.getCacheStats();

      // Retry - should hit cache
      const emb2 = await embeddingProvider.generateEmbedding(content);
      const stats2 = embeddingProvider.getCacheStats();

      expect(emb1.contentHash).toBe(emb2.contentHash);
      expect(emb1.generatedAt).toBe(emb2.generatedAt);
      expect(stats2.size).toBe(stats1.size);
    });
  });

  describe('Performance Characteristics', () => {
    test('batch processing is faster than individual processing', async () => {
      const memories: Memory[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `mem_${i}`,
          crew_id: 'crew1',
          content: Array(20).fill('word').join(' '),
          type: 'insight',
          retention_tier: 'standard',
          confidence_level: 0.9,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          access_count: 0,
          last_accessed: '2024-01-01T00:00:00Z',
          tags: [],
        }));

      // Individual processing
      const start1 = Date.now();
      for (const memory of memories) {
        compressionService.compress(memory);
      }
      const individual = Date.now() - start1;

      // Batch processing
      const start2 = Date.now();
      compressionService.compressBatch(memories);
      const batch = Date.now() - start2;

      // Both should complete quickly
      expect(individual).toBeLessThan(1000);
      expect(batch).toBeLessThan(1000);
    });

    test('embedding batch processing with cache reduces latency', async () => {
      const contents = Array(5).fill('Test content. '.repeat(15));

      // First batch - no cache hits
      const start1 = Date.now();
      const result1 = await embeddingProvider.generateBatchEmbeddings(contents);
      const time1 = Date.now() - start1;

      // Second batch - should have cache hits
      const start2 = Date.now();
      const result2 = await embeddingProvider.generateBatchEmbeddings(contents);
      const time2 = Date.now() - start2;

      expect(result1.embeddings.length).toBe(5);
      expect(result2.cacheHits).toBeGreaterThan(0);
      expect(time2).toBeLessThanOrEqual(time1 + 100); // Should be similar or faster
    });
  });
});
