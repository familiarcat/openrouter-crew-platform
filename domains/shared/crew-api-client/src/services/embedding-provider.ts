/**
 * Embedding Provider
 * Generates embeddings for memories using external API or local models
 *
 * Strategies:
 * 1. OpenRouter API: Access to various embedding models
 * 2. Local embeddings: @xenova/transformers (optional fallback)
 * 3. Cache: Avoid redundant API calls for same content
 */

export interface EmbeddingConfig {
  /** API provider: 'openrouter' or 'local' */
  provider?: 'openrouter' | 'local';
  /** Model to use for embeddings */
  model?: string;
  /** API key for external providers */
  apiKey?: string;
  /** Batch size for batch embeddings */
  batchSize?: number;
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttlMs?: number;
  };
}

export interface Embedding {
  /** Content that was embedded */
  content: string;
  /** Vector representation */
  vector: number[];
  /** Dimension of vector */
  dimension: number;
  /** Model used */
  model: string;
  /** Timestamp of generation */
  generatedAt: string;
  /** Content hash for caching */
  contentHash: string;
}

export interface EmbeddingBatchResult {
  /** Successfully generated embeddings */
  embeddings: Embedding[];
  /** Failed items with errors */
  errors: Array<{ content: string; error: string }>;
  /** Total time in ms */
  processingTimeMs: number;
  /** Cache hit count */
  cacheHits: number;
}

/**
 * Simple in-memory cache for embeddings
 */
interface CacheEntry {
  embedding: Embedding;
  timestamp: number;
}

/**
 * Embedding Provider Service
 * Handles generation and caching of embeddings
 */
export class EmbeddingProvider {
  private config: Required<EmbeddingConfig>;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(config: EmbeddingConfig = {}) {
    this.config = {
      provider: config.provider || 'openrouter',
      model: config.model || 'text-embedding-3-small',
      apiKey: config.apiKey || '',
      batchSize: config.batchSize || 10,
      cache: {
        enabled: config.cache?.enabled !== false,
        ttlMs: config.cache?.ttlMs || 24 * 60 * 60 * 1000, // 24 hours
      },
    };
  }

  /**
   * Generate simple hash of content for caching
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if cached embedding is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < (this.config.cache.ttlMs || 24 * 60 * 60 * 1000);
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(content: string): Promise<Embedding> {
    const contentHash = this.hashContent(content);

    // Check cache
    if (this.config.cache.enabled) {
      const cached = this.cache.get(contentHash);
      if (cached && this.isCacheValid(cached)) {
        return cached.embedding;
      }
    }

    // Generate embedding
    const embedding = await this.generateEmbeddingInternal(content, contentHash);

    // Cache result
    if (this.config.cache.enabled) {
      this.cache.set(contentHash, {
        embedding,
        timestamp: Date.now(),
      });
    }

    return embedding;
  }

  /**
   * Generate embedding (internal implementation)
   * NOTE: This is a mock implementation. Real implementation would call external API.
   */
  private async generateEmbeddingInternal(content: string, contentHash: string): Promise<Embedding> {
    // Mock implementation: generate a deterministic but pseudo-random vector based on content
    // In production, this would call OpenRouter API or local transformer model

    // For testing purposes, create a consistent vector from content hash
    const words = content.toLowerCase().split(/\s+/);
    const vector: number[] = [];

    // Generate 384-dimensional embedding (text-embedding-3-small size)
    for (let i = 0; i < 384; i++) {
      // Deterministic pseudo-random based on content and dimension
      let seed = contentHash.charCodeAt(i % contentHash.length);
      seed += words.length * (i + 1);

      // Simulate normalized vector components
      const normalized = ((seed % 1000) / 1000 - 0.5) * 2;
      vector.push(normalized);
    }

    return {
      content,
      vector,
      dimension: vector.length,
      model: this.config.model,
      generatedAt: new Date().toISOString(),
      contentHash,
    };
  }

  /**
   * Generate embeddings for multiple texts (with batching)
   */
  async generateBatchEmbeddings(contents: string[]): Promise<EmbeddingBatchResult> {
    const startTime = Date.now();
    const embeddings: Embedding[] = [];
    const errors: Array<{ content: string; error: string }> = [];
    let cacheHits = 0;

    // Check cache first
    const uncachedContents = contents.filter((content) => {
      const hash = this.hashContent(content);
      const cached = this.cache.get(hash);

      if (cached && this.isCacheValid(cached) && this.config.cache.enabled) {
        embeddings.push(cached.embedding);
        cacheHits++;
        return false; // Already cached
      }
      return true; // Needs to be generated
    });

    // Generate embeddings for uncached content
    for (let i = 0; i < uncachedContents.length; i += this.config.batchSize) {
      const batch = uncachedContents.slice(i, i + this.config.batchSize);

      for (const content of batch) {
        try {
          const embedding = await this.generateEmbedding(content);
          embeddings.push(embedding);
        } catch (error) {
          errors.push({
            content,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Add small delay between batches to avoid rate limiting
      if (i + this.config.batchSize < uncachedContents.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return {
      embeddings,
      errors,
      processingTimeMs: Date.now() - startTime,
      cacheHits,
    };
  }

  /**
   * Calculate similarity between two embeddings (cosine similarity)
   */
  calculateSimilarity(embedding1: Embedding, embedding2: Embedding): number {
    if (embedding1.dimension !== embedding2.dimension) {
      throw new Error('Embeddings must have same dimension');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.vector.length; i++) {
      const v1 = embedding1.vector[i];
      const v2 = embedding2.vector[i];

      dotProduct += v1 * v2;
      magnitude1 += v1 * v1;
      magnitude2 += v2 * v2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Calculate similarity between content strings (generates embeddings if needed)
   */
  async calculateContentSimilarity(content1: string, content2: string): Promise<number> {
    const emb1 = await this.generateEmbedding(content1);
    const emb2 = await this.generateEmbedding(content2);
    return this.calculateSimilarity(emb1, emb2);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: number;
  } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > (this.config.cache.ttlMs || 24 * 60 * 60 * 1000)) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}
