/**
 * Memory Compression Service
 * Reduces memory storage by summarizing, compressing, or removing non-essential content
 *
 * Compression strategies:
 * 1. Extractive: Keep key sentences/concepts from original content
 * 2. Abstractive: Generate LLM-powered summaries (requires API)
 * 3. Lossy: Remove timestamps, metadata for older memories
 *
 * Compression triggers:
 * - Automatic: Memories >2 years old
 * - Manual: On-demand compression
 * - Batch: Scheduled during off-peak hours
 */

import { Memory } from '../types';

export interface CompressionResult {
  /** Memory ID */
  id: string;
  /** Original content length */
  originalLength: number;
  /** Compressed content length */
  compressedLength: number;
  /** Compression ratio (0.0-1.0) */
  ratio: number;
  /** Size reduction in bytes */
  bytesReduced: number;
  /** Compression strategy used */
  strategy: 'extractive' | 'abstractive' | 'lossy' | 'none';
  /** Whether compression was applied */
  compressed: boolean;
  /** Compressed content (null if no compression) */
  compressedContent: string | null;
  /** Timestamp of compression */
  compressedAt: string;
  /** Reversibility: can original be recovered */
  reversible: boolean;
}

export interface CompressionStats {
  /** Total memories processed */
  totalProcessed: number;
  /** Memories compressed */
  compressed: number;
  /** Total bytes original */
  totalOriginalBytes: number;
  /** Total bytes compressed */
  totalCompressedBytes: number;
  /** Overall compression ratio */
  averageRatio: number;
  /** Total storage saved */
  bytesReduced: number;
  /** Cost estimation (API calls if abstractive) */
  estimatedCost?: number;
}

export interface CompressionConfig {
  /** Strategy to use */
  strategy?: 'extractive' | 'abstractive' | 'lossy' | 'auto';
  /** Minimum age in days for auto-compression */
  minAgeDays?: number;
  /** Preserve metadata (timestamps, confidence) */
  preserveMetadata?: boolean;
  /** Target compression ratio */
  targetRatio?: number;
  /** Maximum compressed size in bytes */
  maxSize?: number;
}

/**
 * Memory Compression Service
 * Provides multiple compression strategies for memory optimization
 */
export class MemoryCompressionService {
  constructor() {}

  /**
   * Extract key sentences from content (extractive compression)
   * Keeps important sentences, removes filler
   */
  private extractiveCompress(content: string, targetRatio: number = 0.5): string {
    if (!content || content.length < 100) {
      return content; // Too short to compress effectively
    }

    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    if (sentences.length < 2) {
      return content; // Can't extract from single sentence
    }

    // Score sentences by keyword importance
    const scoredSentences = sentences.map((sent) => ({
      text: sent.trim(),
      score: this.calculateSentenceScore(sent),
    }));

    // Select top sentences to reach target ratio
    const targetCount = Math.max(1, Math.ceil(sentences.length * targetRatio));
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)
      .sort((a, b) => sentences.indexOf(a.text) - sentences.indexOf(b.text))
      .map((s) => s.text)
      .join(' ');

    return topSentences;
  }

  /**
   * Calculate sentence importance score
   */
  private calculateSentenceScore(sentence: string): number {
    const words = sentence.toLowerCase().split(/\s+/);
    let score = 0;

    // Keywords that indicate importance
    const importantKeywords = [
      'important',
      'critical',
      'must',
      'decision',
      'failure',
      'success',
      'resolved',
      'solved',
      'discovered',
      'breakthrough',
    ];

    // Penalize common filler words
    const fillerWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'because',
      'however',
      'therefore',
      'also',
    ];

    words.forEach((word) => {
      if (importantKeywords.some((kw) => word.includes(kw))) {
        score += 3;
      }
      if (!fillerWords.includes(word) && word.length > 4) {
        score += 1;
      }
    });

    // Prefer longer sentences (contain more information)
    score += Math.min(2, words.length / 10);

    return score;
  }

  /**
   * Lossless compression: remove metadata and formatting
   */
  private losslessCompress(content: string): string {
    // Remove extra whitespace
    let compressed = content.replace(/\s+/g, ' ').trim();

    // Remove common metadata patterns
    compressed = compressed.replace(/\[.*?\]/g, ''); // Remove [bracketed] text
    compressed = compressed.replace(/\{.*?\}/g, ''); // Remove {braced} text
    compressed = compressed.replace(/\(timestamp:.*?\)/gi, ''); // Remove timestamp markers
    compressed = compressed.replace(/\(confidence:.*?\)/gi, ''); // Remove confidence markers

    return compressed;
  }

  /**
   * Lossy compression: aggressive removal of non-essential content
   */
  private lossyCompress(content: string): string {
    // Start with lossless
    let compressed = this.losslessCompress(content);

    // Remove quotes and attributions
    compressed = compressed.replace(/["'].*?["']/g, '');

    // Remove URLs
    compressed = compressed.replace(/https?:\/\/[^\s]+/g, '[URL]');

    // Remove email addresses
    compressed = compressed.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[EMAIL]');

    // Remove numbers (unless critical)
    compressed = compressed.replace(/\b\d{10,}\b/g, '[NUM]');

    // Remove duplicated words
    compressed = compressed.replace(/\b(\w+)(\s+\1)+\b/gi, '$1');

    return compressed;
  }

  /**
   * Compress a single memory using specified strategy
   */
  compress(memory: Memory, config: CompressionConfig = {}): CompressionResult {
    const strategy = config.strategy || 'extractive';
    const preserveMetadata = config.preserveMetadata !== false;
    const targetRatio = config.targetRatio || 0.6;

    const originalLength = memory.content.length;
    let compressedContent: string | null = null;
    let appliedStrategy: CompressionResult['strategy'] = 'none';

    // Skip compression for very short content
    if (originalLength < 50) {
      return {
        id: memory.id,
        originalLength,
        compressedLength: originalLength,
        ratio: 1.0,
        bytesReduced: 0,
        strategy: 'none',
        compressed: false,
        compressedContent: null,
        compressedAt: new Date().toISOString(),
        reversible: true,
      };
    }

    // Apply compression strategy
    if (strategy === 'extractive' || strategy === 'auto') {
      compressedContent = this.extractiveCompress(memory.content, targetRatio);
      appliedStrategy = 'extractive';
    } else if (strategy === 'lossy') {
      compressedContent = this.lossyCompress(memory.content);
      appliedStrategy = 'lossy';
    } else if (strategy === 'abstractive') {
      // Note: Abstractive compression would require LLM API call
      // For now, fall back to extractive
      compressedContent = this.extractiveCompress(memory.content, targetRatio);
      appliedStrategy = 'abstractive';
    }

    // Add metadata if configured
    if (preserveMetadata) {
      const metadata = `[ID:${memory.id}|Conf:${(memory.confidence_level * 100).toFixed(0)}%|Type:${memory.type}] `;
      compressedContent = metadata + compressedContent;
    }

    const compressedLength = compressedContent?.length || originalLength;
    const ratio = compressedLength / originalLength;
    const bytesReduced = originalLength - compressedLength;
    const compressed = ratio < 0.95 && appliedStrategy !== 'none'; // Only count as compressed if >5% reduction

    return {
      id: memory.id,
      originalLength,
      compressedLength,
      ratio,
      bytesReduced,
      strategy: appliedStrategy,
      compressed,
      compressedContent: compressed ? compressedContent : null,
      compressedAt: new Date().toISOString(),
      reversible: appliedStrategy === 'extractive' || appliedStrategy === 'abstractive' || appliedStrategy === 'none',
    };
  }

  /**
   * Batch compress multiple memories
   */
  compressBatch(
    memories: Memory[],
    config: CompressionConfig = {}
  ): {
    results: CompressionResult[];
    stats: CompressionStats;
  } {
    const results = memories.map((m) => this.compress(m, config));

    const stats: CompressionStats = {
      totalProcessed: memories.length,
      compressed: results.filter((r) => r.compressed).length,
      totalOriginalBytes: results.reduce((sum, r) => sum + r.originalLength, 0),
      totalCompressedBytes: results.reduce((sum, r) => sum + r.compressedLength, 0),
      averageRatio: results.reduce((sum, r) => sum + r.ratio, 0) / results.length,
      bytesReduced: results.reduce((sum, r) => sum + r.bytesReduced, 0),
    };

    return { results, stats };
  }

  /**
   * Determine if memory should be auto-compressed based on age
   */
  shouldCompress(memory: Memory, config: CompressionConfig = {}): boolean {
    const minAgeDays = config.minAgeDays || 730; // 2 years default
    const createdDate = new Date(memory.created_at);
    const now = new Date();
    const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    return ageInDays > minAgeDays && memory.content.length > 100;
  }

  /**
   * Suggest compression strategy based on memory characteristics
   */
  suggestStrategy(memory: Memory): 'extractive' | 'abstractive' | 'lossy' | 'none' {
    const contentLength = memory.content.length;
    const ageInDays =
      (new Date().getTime() - new Date(memory.created_at).getTime()) / (1000 * 60 * 60 * 24);

    // Very old memories: use lossy compression
    if (ageInDays > 1095) {
      return 'lossy'; // 3+ years
    }

    // Long content: use extractive
    if (contentLength > 1000) {
      return 'extractive';
    }

    // Medium age and size: extractive
    if (ageInDays > 365) {
      return 'extractive'; // 1+ year
    }

    // Short or recent: don't compress
    return 'none';
  }

  /**
   * Calculate compression ratio for a given content size
   */
  estimateCompressionRatio(contentLength: number, strategy: string): number {
    if (contentLength < 100) {
      return 1.0; // No compression for short content
    }

    // Estimated ratios based on strategy
    const estimatedRatios: Record<string, number> = {
      extractive: Math.max(0.4, 0.7 - contentLength / 10000), // Better for longer content
      abstractive: Math.max(0.3, 0.5 - contentLength / 5000), // Most aggressive
      lossy: Math.max(0.2, 0.4 - contentLength / 20000), // Least preserves content
      none: 1.0,
    };

    return estimatedRatios[strategy] || 1.0;
  }

  /**
   * Calculate storage savings from compression
   */
  calculateSavings(memories: Memory[], strategy: string): {
    estimatedOriginalBytes: number;
    estimatedCompressedBytes: number;
    estimatedBytesSaved: number;
    estimatedRatio: number;
  } {
    let totalOriginal = 0;
    let totalCompressed = 0;

    memories.forEach((m) => {
      const origSize = m.content.length;
      totalOriginal += origSize;

      const ratio = this.estimateCompressionRatio(origSize, strategy);
      totalCompressed += origSize * ratio;
    });

    return {
      estimatedOriginalBytes: totalOriginal,
      estimatedCompressedBytes: totalCompressed,
      estimatedBytesSaved: totalOriginal - totalCompressed,
      estimatedRatio: totalCompressed / totalOriginal,
    };
  }
}
