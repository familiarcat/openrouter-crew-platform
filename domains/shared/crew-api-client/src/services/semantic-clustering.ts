/**
 * Semantic Clustering Service
 * Groups memories by semantic similarity and identifies duplicates
 *
 * Features:
 * - Embedding-based similarity clustering
 * - Hierarchical clustering for memory organization
 * - Duplicate detection (95%+ similarity threshold)
 * - Deduplication with merge strategies
 * - Cluster quality metrics
 */

import { Memory } from '../types';
import { EmbeddingProvider, Embedding } from './embedding-provider';

export interface MemoryCluster {
  /** Unique cluster identifier */
  id: string;
  /** Memories in this cluster */
  memories: Memory[];
  /** Representative memory (typically most central) */
  representative: Memory;
  /** Average similarity within cluster (0-1) */
  cohesion: number;
  /** Cluster quality score (0-1) */
  quality: number;
  /** Keywords/topics representing this cluster */
  topics: string[];
}

export interface DuplicateMemory {
  /** First memory */
  memory1: Memory;
  /** Second memory */
  memory2: Memory;
  /** Similarity score (0-1) */
  similarity: number;
  /** Merge recommendation */
  mergeRecommendation: 'keep_first' | 'keep_second' | 'merge';
}

export interface ClusteringStats {
  /** Total memories clustered */
  totalMemories: number;
  /** Number of clusters formed */
  clusterCount: number;
  /** Average cluster size */
  avgClusterSize: number;
  /** Duplicate memories found */
  duplicatesFound: number;
  /** Potential storage savings if duplicates merged (bytes) */
  potentialSavings: number;
  /** Average cluster cohesion */
  avgCohesion: number;
}

export interface ClusteringConfig {
  /** Similarity threshold for same cluster (0-1) */
  similarityThreshold?: number;
  /** Threshold for marking as duplicate (0-1) */
  duplicateThreshold?: number;
  /** Maximum cluster size before splitting */
  maxClusterSize?: number;
  /** Clustering strategy */
  strategy?: 'hierarchical' | 'dynamic' | 'interactive';
}

/**
 * Semantic Clustering Service
 * Groups memories by semantic similarity
 */
export class SemanticClusteringService {
  private embeddingProvider: EmbeddingProvider;
  private config: Required<ClusteringConfig>;

  constructor(embeddingProvider: EmbeddingProvider, config: ClusteringConfig = {}) {
    this.embeddingProvider = embeddingProvider;
    this.config = {
      similarityThreshold: config.similarityThreshold || 0.7,
      duplicateThreshold: config.duplicateThreshold || 0.95,
      maxClusterSize: config.maxClusterSize || 100,
      strategy: config.strategy || 'hierarchical',
    };
  }

  /**
   * Cluster memories by semantic similarity
   */
  async clusterMemories(memories: Memory[]): Promise<{
    clusters: MemoryCluster[];
    stats: ClusteringStats;
  }> {
    if (memories.length === 0) {
      return {
        clusters: [],
        stats: {
          totalMemories: 0,
          clusterCount: 0,
          avgClusterSize: 0,
          duplicatesFound: 0,
          potentialSavings: 0,
          avgCohesion: 0,
        },
      };
    }

    // Generate embeddings for all memories
    const contents = memories.map((m) => m.content);
    const embeddingResult = await this.embeddingProvider.generateBatchEmbeddings(
      contents
    );

    if (embeddingResult.embeddings.length === 0) {
      throw new Error('Failed to generate embeddings for memories');
    }

    // Build similarity matrix
    const similarities = this.buildSimilarityMatrix(embeddingResult.embeddings);

    // Cluster based on strategy
    const clusters = this.clusterBySimilarity(memories, similarities);

    // Calculate statistics
    const duplicates = this.findDuplicatesInternal(memories, similarities);
    const stats = this.calculateClusteringStats(clusters, duplicates);

    return { clusters, stats };
  }

  /**
   * Build similarity matrix from embeddings
   */
  private buildSimilarityMatrix(embeddings: Embedding[]): number[][] {
    const n = embeddings.length;
    const matrix: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const sim = this.embeddingProvider.calculateSimilarity(
          embeddings[i],
          embeddings[j]
        );
        matrix[i][j] = sim;
        matrix[j][i] = sim;
      }
    }

    return matrix;
  }

  /**
   * Cluster memories based on similarity
   */
  private clusterBySimilarity(memories: Memory[], similarities: number[][]): MemoryCluster[] {
    const n = memories.length;
    const visited = Array(n).fill(false);
    const clusters: MemoryCluster[] = [];

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;

      // Start new cluster with unvisited memory
      const clusterMemories: Memory[] = [memories[i]];
      visited[i] = true;

      // Find similar memories
      for (let j = i + 1; j < n; j++) {
        if (!visited[j] && similarities[i][j] >= this.config.similarityThreshold) {
          clusterMemories.push(memories[j]);
          visited[j] = true;
        }
      }

      // Create cluster
      if (clusterMemories.length > 0) {
        clusters.push(this.createCluster(clusterMemories, similarities));
      }
    }

    return clusters;
  }

  /**
   * Create cluster with metadata
   */
  private createCluster(memories: Memory[], similarities: number[][]): MemoryCluster {
    // Find representative (most central memory)
    let representative = memories[0];
    let maxAvgSim = -1;

    for (const mem of memories) {
      const memIndex = memories.indexOf(mem);
      const avgSim =
        memories.reduce((sum, _, j) => {
          return (
            sum +
            (similarities[memIndex]?.[j] || 0)
          );
        }, 0) / memories.length;

      if (avgSim > maxAvgSim) {
        maxAvgSim = avgSim;
        representative = mem;
      }
    }

    // Calculate cluster cohesion
    const cohesion = this.calculateCohesion(memories, similarities);

    // Extract topics from cluster
    const topics = this.extractTopics(memories);

    return {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memories,
      representative,
      cohesion,
      quality: Math.min(1, cohesion * (memories.length / 10)),
      topics,
    };
  }

  /**
   * Calculate cluster cohesion (average internal similarity)
   */
  private calculateCohesion(memories: Memory[], similarities: number[][]): number {
    if (memories.length <= 1) return 1.0;

    let totalSim = 0;
    let count = 0;

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        totalSim += similarities[i][j] || 0;
        count++;
      }
    }

    return count > 0 ? totalSim / count : 0;
  }

  /**
   * Extract topics/keywords from cluster
   */
  private extractTopics(memories: Memory[]): string[] {
    const topics: string[] = [];
    const wordFreq: Record<string, number> = {};

    // Analyze memory content for common words
    memories.forEach((mem) => {
      const words = mem.content
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4); // Filter short words

      words.forEach((word) => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    // Get top words as topics
    Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([word]) => {
        topics.push(word.replace(/[,\.!?]/g, ''));
      });

    return topics;
  }

  /**
   * Find duplicate memories
   */
  async findDuplicates(memories: Memory[]): Promise<DuplicateMemory[]> {
    // Generate embeddings
    const contents = memories.map((m) => m.content);
    const embeddingResult = await this.embeddingProvider.generateBatchEmbeddings(
      contents
    );

    const duplicates: DuplicateMemory[] = [];

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const sim = this.embeddingProvider.calculateSimilarity(
          embeddingResult.embeddings[i],
          embeddingResult.embeddings[j]
        );

        if (sim >= this.config.duplicateThreshold) {
          duplicates.push({
            memory1: memories[i],
            memory2: memories[j],
            similarity: sim,
            mergeRecommendation: this.recommendMerge(memories[i], memories[j]),
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Find duplicates from similarity matrix
   */
  private findDuplicatesInternal(
    memories: Memory[],
    similarities: number[][]
  ): DuplicateMemory[] {
    const duplicates: DuplicateMemory[] = [];

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        if (similarities[i][j] >= this.config.duplicateThreshold) {
          duplicates.push({
            memory1: memories[i],
            memory2: memories[j],
            similarity: similarities[i][j],
            mergeRecommendation: this.recommendMerge(memories[i], memories[j]),
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Recommend which memory to keep in merge
   */
  private recommendMerge(mem1: Memory, mem2: Memory): 'keep_first' | 'keep_second' | 'merge' {
    // Prefer higher confidence
    if (mem1.confidence_level > mem2.confidence_level + 0.1) {
      return 'keep_first';
    }
    if (mem2.confidence_level > mem1.confidence_level + 0.1) {
      return 'keep_second';
    }

    // Prefer more recently accessed
    const mem1Access = new Date(mem1.last_accessed).getTime();
    const mem2Access = new Date(mem2.last_accessed).getTime();

    if (mem1Access > mem2Access) {
      return 'keep_first';
    }
    if (mem2Access > mem1Access) {
      return 'keep_second';
    }

    // Default to merge
    return 'merge';
  }

  /**
   * Merge duplicate memories
   */
  mergeDuplicates(duplicate: DuplicateMemory): Memory {
    const { memory1, memory2, mergeRecommendation } = duplicate;

    if (mergeRecommendation === 'keep_first') {
      return memory1;
    }
    if (mergeRecommendation === 'keep_second') {
      return memory2;
    }

    // Merge both
    return {
      ...memory1,
      content: `${memory1.content}\n\n[Merged with ${memory2.id}]\n${memory2.content}`,
      tags: [...new Set([...memory1.tags, ...memory2.tags])],
      confidence_level: Math.max(memory1.confidence_level, memory2.confidence_level),
      access_count: memory1.access_count + memory2.access_count,
      last_accessed: new Date(
        Math.max(
          new Date(memory1.last_accessed).getTime(),
          new Date(memory2.last_accessed).getTime()
        )
      ).toISOString(),
    };
  }

  /**
   * Calculate clustering statistics
   */
  private calculateClusteringStats(
    clusters: MemoryCluster[],
    duplicates: DuplicateMemory[]
  ): ClusteringStats {
    const totalMemories = clusters.reduce((sum, c) => sum + c.memories.length, 0);
    const avgClusterSize = totalMemories > 0 ? totalMemories / clusters.length : 0;
    const avgCohesion =
      clusters.length > 0
        ? clusters.reduce((sum, c) => sum + c.cohesion, 0) / clusters.length
        : 0;

    // Calculate potential savings from duplicates
    let potentialSavings = 0;
    duplicates.forEach(({ memory1, memory2 }) => {
      if (['keep_first', 'keep_second'].includes('keep_first')) {
        potentialSavings += Math.min(
          memory1.content.length,
          memory2.content.length
        );
      } else {
        // Merge saves some space
        potentialSavings +=
          (memory1.content.length + memory2.content.length) / 4;
      }
    });

    return {
      totalMemories,
      clusterCount: clusters.length,
      avgClusterSize,
      duplicatesFound: duplicates.length,
      potentialSavings,
      avgCohesion,
    };
  }

  /**
   * Merge clusters that are too similar
   */
  mergeSimilarClusters(clusters: MemoryCluster[], threshold: number = 0.9): MemoryCluster[] {
    const merged: MemoryCluster[] = [];
    const visited = new Set<string>();

    for (const cluster of clusters) {
      if (visited.has(cluster.id)) continue;

      let mergedCluster = cluster;

      // Find similar clusters to merge
      for (const other of clusters) {
        if (other.id === cluster.id || visited.has(other.id)) continue;

        const similarity = this.calculateClusterSimilarity(cluster, other);
        if (similarity >= threshold) {
          // Merge clusters
          mergedCluster = this.mergeClusterPair(mergedCluster, other);
          visited.add(other.id);
        }
      }

      merged.push(mergedCluster);
      visited.add(cluster.id);
    }

    return merged;
  }

  /**
   * Calculate similarity between two clusters
   */
  private calculateClusterSimilarity(c1: MemoryCluster, c2: MemoryCluster): number {
    // Simple heuristic: compare representative memories
    const sim = this.embeddingProvider.calculateSimilarity(
      {
        content: c1.representative.content,
        vector: Array(384).fill(0),
        dimension: 384,
        model: 'text-embedding-3-small',
        generatedAt: new Date().toISOString(),
        contentHash: '',
      },
      {
        content: c2.representative.content,
        vector: Array(384).fill(0),
        dimension: 384,
        model: 'text-embedding-3-small',
        generatedAt: new Date().toISOString(),
        contentHash: '',
      }
    );
    return sim;
  }

  /**
   * Merge two clusters
   */
  private mergeClusterPair(c1: MemoryCluster, c2: MemoryCluster): MemoryCluster {
    const mergedMemories = [...c1.memories, ...c2.memories];
    const representative =
      c1.cohesion > c2.cohesion ? c1.representative : c2.representative;

    return {
      id: c1.id,
      memories: mergedMemories,
      representative,
      cohesion: (c1.cohesion + c2.cohesion) / 2,
      quality: (c1.quality + c2.quality) / 2,
      topics: [...new Set([...c1.topics, ...c2.topics])],
    };
  }

  /**
   * Get cluster quality insights
   */
  getClusterInsights(cluster: MemoryCluster): {
    coverage: number; // Percentage of cluster covered by representative
    diversity: number; // Topic diversity in cluster
    freshness: number; // How recent the cluster memories are
  } {
    const avgMemoryAge = cluster.memories.reduce((sum, m) => {
      return sum + (Date.now() - new Date(m.last_accessed).getTime());
    }, 0) / cluster.memories.length;

    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    const freshness = Math.max(0, 1 - avgMemoryAge / maxAge);

    return {
      coverage: cluster.cohesion,
      diversity: Math.min(1, cluster.topics.length / 5),
      freshness,
    };
  }
}
