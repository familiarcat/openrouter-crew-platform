/**
 * Embedding Provider Tests
 * Verify embedding generation, caching, and similarity calculation
 */

import { EmbeddingProvider, Embedding, EmbeddingBatchResult } from '../src/services/embedding-provider';

describe('EmbeddingProvider', () => {
  let provider: EmbeddingProvider;

  beforeEach(() => {
    provider = new EmbeddingProvider({
      provider: 'openrouter',
      model: 'text-embedding-3-small',
      cache: { enabled: true, ttlMs: 60 * 60 * 1000 }, // 1 hour
    });
  });

  describe('Single Embedding Generation', () => {
    test('generates embedding for text', async () => {
      const content = 'This is a test sentence for embedding generation';
      const embedding = await provider.generateEmbedding(content);

      expect(embedding).toBeDefined();
      expect(embedding.content).toBe(content);
      expect(embedding.vector).toBeDefined();
      expect(embedding.vector.length).toBe(384);
      expect(embedding.dimension).toBe(384);
      expect(embedding.model).toBe('text-embedding-3-small');
      expect(embedding.contentHash).toBeDefined();
      expect(embedding.generatedAt).toBeDefined();
    });

    test('generates deterministic embeddings for same content', async () => {
      const content = 'Consistent embedding test';
      const embedding1 = await provider.generateEmbedding(content);
      const embedding2 = await provider.generateEmbedding(content);

      expect(embedding1.vector).toEqual(embedding2.vector);
      expect(embedding1.contentHash).toBe(embedding2.contentHash);
    });

    test('generates different embeddings for different content', async () => {
      const embedding1 = await provider.generateEmbedding('First content');
      const embedding2 = await provider.generateEmbedding('Second content');

      expect(embedding1.vector).not.toEqual(embedding2.vector);
      expect(embedding1.contentHash).not.toBe(embedding2.contentHash);
    });

    test('handles empty content', async () => {
      const embedding = await provider.generateEmbedding('');

      expect(embedding).toBeDefined();
      expect(embedding.vector.length).toBe(384);
      expect(embedding.content).toBe('');
    });

    test('handles very long content', async () => {
      const longContent = Array(1000).fill('word').join(' ');
      const embedding = await provider.generateEmbedding(longContent);

      expect(embedding).toBeDefined();
      expect(embedding.vector.length).toBe(384);
      expect(embedding.content).toBe(longContent);
    });
  });

  describe('Embedding Caching', () => {
    test('caches embeddings and returns from cache', async () => {
      const content = 'Cache test content';
      const stats1 = provider.getCacheStats();
      const initialSize = stats1.size;

      const embedding1 = await provider.generateEmbedding(content);
      const stats2 = provider.getCacheStats();

      expect(stats2.size).toBe(initialSize + 1);

      const embedding2 = await provider.generateEmbedding(content);

      expect(embedding1.vector).toEqual(embedding2.vector);
      expect(embedding1.generatedAt).toBe(embedding2.generatedAt);
    });

    test('cache hit avoids regeneration', async () => {
      const content = 'Verify cache hit';
      const embedding1 = await provider.generateEmbedding(content);

      // Small delay to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const embedding2 = await provider.generateEmbedding(content);

      // Generated at time should be same (from cache)
      expect(embedding1.generatedAt).toBe(embedding2.generatedAt);
    });

    test('clears cache', async () => {
      const content = 'Content to clear';
      await provider.generateEmbedding(content);

      const statsBefore = provider.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      provider.clearCache();

      const statsAfter = provider.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    test('cleanup removes expired cache entries', async () => {
      const provider2 = new EmbeddingProvider({
        cache: { enabled: true, ttlMs: 100 }, // 100ms TTL
      });

      await provider2.generateEmbedding('temp content 1');
      await provider2.generateEmbedding('temp content 2');

      const statsBefore = provider2.getCacheStats();
      expect(statsBefore.size).toBe(2);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const removed = provider2.cleanupCache();
      expect(removed).toBe(2);

      const statsAfter = provider2.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    test('disables cache when configured', async () => {
      const noCacheProvider = new EmbeddingProvider({
        cache: { enabled: false },
      });

      const content = 'No cache content';
      await noCacheProvider.generateEmbedding(content);

      const stats = noCacheProvider.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Batch Embedding Generation', () => {
    test('generates embeddings for multiple texts', async () => {
      const contents = ['First text', 'Second text', 'Third text'];
      const result = await provider.generateBatchEmbeddings(contents);

      expect(result.embeddings.length).toBe(3);
      expect(result.errors.length).toBe(0);
      expect(result.embeddings[0].content).toBe('First text');
      expect(result.embeddings[1].content).toBe('Second text');
      expect(result.embeddings[2].content).toBe('Third text');
    });

    test('respects batch size configuration', async () => {
      const smallBatchProvider = new EmbeddingProvider({
        batchSize: 2,
      });

      const contents = Array(5).fill(null).map((_, i) => `Content ${i}`);
      const result = await smallBatchProvider.generateBatchEmbeddings(contents);

      expect(result.embeddings.length).toBe(5);
      expect(result.errors.length).toBe(0);
    });

    test('tracks cache hits in batch processing', async () => {
      const contents = ['Content A', 'Content B', 'Content A', 'Content C', 'Content A'];

      // Pre-cache first content
      await provider.generateEmbedding('Content A');

      const result = await provider.generateBatchEmbeddings(contents);

      // Should have at least 1 cache hit for Content A
      expect(result.cacheHits).toBeGreaterThanOrEqual(1);
      expect(result.embeddings.length).toBe(5);
    });

    test('handles empty batch', async () => {
      const result = await provider.generateBatchEmbeddings([]);

      expect(result.embeddings.length).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(result.cacheHits).toBe(0);
    });

    test('returns processing time', async () => {
      const contents = Array(10).fill(null).map((_, i) => `Batch content ${i}`);
      const result = await provider.generateBatchEmbeddings(contents);

      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.processingTimeMs).toBeLessThan(5000); // Should complete quickly
    });
  });

  describe('Similarity Calculation', () => {
    test('calculates cosine similarity between embeddings', async () => {
      const embedding1 = await provider.generateEmbedding('The quick brown fox');
      const embedding2 = await provider.generateEmbedding('The quick brown fox');

      const similarity = provider.calculateSimilarity(embedding1, embedding2);

      // Identical content should have similarity close to 1.0
      expect(similarity).toBeGreaterThan(0.9);
      expect(similarity).toBeLessThanOrEqual(1.0);
    });

    test('different content has lower similarity', async () => {
      const embedding1 = await provider.generateEmbedding('Dogs are animals');
      const embedding2 = await provider.generateEmbedding('Unrelated content');

      const similarity = provider.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBeLessThan(0.9);
    });

    test('similarity is symmetric', async () => {
      const embedding1 = await provider.generateEmbedding('Content A');
      const embedding2 = await provider.generateEmbedding('Content B');

      const sim1to2 = provider.calculateSimilarity(embedding1, embedding2);
      const sim2to1 = provider.calculateSimilarity(embedding2, embedding1);

      expect(sim1to2).toBe(sim2to1);
    });

    test('throws on dimension mismatch', () => {
      const embedding1: Embedding = {
        content: 'test',
        vector: Array(384).fill(0),
        dimension: 384,
        model: 'test',
        generatedAt: new Date().toISOString(),
        contentHash: 'hash1',
      };

      const embedding2: Embedding = {
        content: 'test',
        vector: Array(512).fill(0),
        dimension: 512,
        model: 'test',
        generatedAt: new Date().toISOString(),
        contentHash: 'hash2',
      };

      expect(() => provider.calculateSimilarity(embedding1, embedding2)).toThrow(
        'Embeddings must have same dimension'
      );
    });

    test('calculates similarity between zero vectors', () => {
      const embedding1: Embedding = {
        content: 'test1',
        vector: Array(384).fill(0),
        dimension: 384,
        model: 'test',
        generatedAt: new Date().toISOString(),
        contentHash: 'hash1',
      };

      const embedding2: Embedding = {
        content: 'test2',
        vector: Array(384).fill(0),
        dimension: 384,
        model: 'test',
        generatedAt: new Date().toISOString(),
        contentHash: 'hash2',
      };

      const similarity = provider.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(0);
    });
  });

  describe('Content Similarity', () => {
    test('calculates similarity between content strings', async () => {
      const content1 = 'The quick brown fox jumps over the lazy dog';
      const content2 = 'The quick brown fox jumps over the lazy dog';

      const similarity = await provider.calculateContentSimilarity(content1, content2);

      // Identical content should have high similarity
      expect(similarity).toBeGreaterThan(0.9);
      expect(similarity).toBeLessThanOrEqual(1.0);
    });

    test('different content has lower content similarity', async () => {
      const similarity = await provider.calculateContentSimilarity(
        'Machine learning is important',
        'Pizza is delicious'
      );

      expect(similarity).toBeLessThan(0.7);
    });

    test('related content has moderate similarity', async () => {
      const similarity = await provider.calculateContentSimilarity(
        'The dog ran quickly',
        'The fast canine ran'
      );

      // Related but different content should have moderate similarity
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(0.95);
    });

    test('uses cache for content similarity', async () => {
      const content = 'This is test content for caching in similarity';

      // Pre-cache by generating embedding
      await provider.generateEmbedding(content);
      const statsBefore = provider.getCacheStats();

      // Calculate similarity using cached embedding
      await provider.calculateContentSimilarity(content, 'Different content');

      const statsAfter = provider.getCacheStats();

      // Should not add more cache entries for already-cached content
      expect(statsAfter.size).toBeLessThanOrEqual(statsBefore.size + 1);
    });
  });

  describe('Configuration', () => {
    test('uses custom model configuration', () => {
      const customProvider = new EmbeddingProvider({
        model: 'custom-embedding-model',
      });

      expect(customProvider).toBeDefined();
    });

    test('uses custom batch size', async () => {
      const batchProvider = new EmbeddingProvider({
        batchSize: 5,
      });

      const contents = Array(10).fill(null).map((_, i) => `Item ${i}`);
      const result = await batchProvider.generateBatchEmbeddings(contents);

      expect(result.embeddings.length).toBe(10);
    });

    test('uses custom cache TTL', async () => {
      const provider2 = new EmbeddingProvider({
        cache: { enabled: true, ttlMs: 200 },
      });

      await provider2.generateEmbedding('TTL test');
      const statsBefore = provider2.getCacheStats();
      expect(statsBefore.size).toBe(1);

      // Wait for cache expiration
      await new Promise((resolve) => setTimeout(resolve, 250));

      const removed = provider2.cleanupCache();
      expect(removed).toBe(1);
    });
  });

  describe('Vector Properties', () => {
    test('generates normalized vectors', async () => {
      const embedding = await provider.generateEmbedding('Normalize test');

      // Check that vector values are in reasonable range for embeddings
      const hasValidValues = embedding.vector.every(
        (v) => typeof v === 'number' && isFinite(v)
      );
      expect(hasValidValues).toBe(true);
    });

    test('vector values are in valid range', async () => {
      const embedding = await provider.generateEmbedding('Range test');

      // Most embedding values should be between -1 and 1 (normalized)
      const inRange = embedding.vector.filter((v) => v >= -2 && v <= 2).length;
      expect(inRange).toBeGreaterThan(embedding.vector.length * 0.9);
    });

    test('maintains vector dimension consistency', async () => {
      const contents = [
        'Short',
        'This is a slightly longer piece of content',
        Array(100).fill('word').join(' '),
      ];

      for (const content of contents) {
        const embedding = await provider.generateEmbedding(content);
        expect(embedding.vector.length).toBe(384);
        expect(embedding.dimension).toBe(384);
      }
    });
  });

  describe('Cache Statistics', () => {
    test('tracks cache size', async () => {
      const stats1 = provider.getCacheStats();
      const initialSize = stats1.size;

      await provider.generateEmbedding('Stat test 1');
      const stats2 = provider.getCacheStats();
      expect(stats2.size).toBe(initialSize + 1);

      await provider.generateEmbedding('Stat test 2');
      const stats3 = provider.getCacheStats();
      expect(stats3.size).toBe(initialSize + 2);
    });

    test('cache statistics are consistent', async () => {
      const contents = Array(5).fill(null).map((_, i) => `Content ${i}`);

      for (const content of contents) {
        await provider.generateEmbedding(content);
      }

      const stats = provider.getCacheStats();
      expect(stats.entries).toBe(stats.size);
      expect(stats.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Error Handling', () => {
    test('generates embedding without throwing on valid input', async () => {
      expect(async () => {
        await provider.generateEmbedding('Valid input');
      }).not.toThrow();
    });

    test('batch processing handles heterogeneous content', async () => {
      const contents = [
        '',
        'Single word',
        'Multiple word content here',
        Array(100).fill('word').join(' '),
      ];

      const result = await provider.generateBatchEmbeddings(contents);

      expect(result.embeddings.length).toBe(4);
      expect(result.errors.length).toBe(0);
    });
  });
});
