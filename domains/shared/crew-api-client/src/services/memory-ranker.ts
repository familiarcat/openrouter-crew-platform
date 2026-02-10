/**
 * Memory Ranker Service
 * Intelligently ranks memories based on relevance, recency, confidence, and context
 *
 * Ranking strategies:
 * - Semantic: Ranked by embedding similarity to query
 * - Temporal: Recent memories weighted higher
 * - Contextual: Adjust weights based on operation context
 * - Adaptive: Learn from retrieval success history
 * - Cost-aware: Select highest-value memories within budget
 */

import { Memory } from '../types';
import { EmbeddingProvider, Embedding } from './embedding-provider';

export interface RankedMemory {
  /** Memory object */
  memory: Memory;
  /** Overall relevance score (0-1) */
  relevanceScore: number;
  /** Individual score components */
  scores: {
    semantic: number;
    recency: number;
    confidence: number;
    context: number;
    adaptive: number;
  };
  /** Estimated API cost if used */
  estimatedCost: number;
  /** Rank position */
  rank: number;
}

export interface RankingConfig {
  /** Weights for different factors (must sum to 1.0) */
  weights?: {
    semantic?: number; // Default 0.4
    recency?: number; // Default 0.2
    confidence?: number; // Default 0.2
    context?: number; // Default 0.15
    adaptive?: number; // Default 0.05
  };
  /** Cost per token for API calls */
  costPerToken?: number;
  /** Maximum total budget in cost units */
  maxBudget?: number;
  /** How much to weight success history (0-1) */
  adaptiveWeight?: number;
  /** Exponential decay for recency (higher = faster decay) */
  decayFactor?: number;
}

/**
 * Memory Ranker Service
 * Ranks memories by relevance and other factors
 */
export class MemoryRankerService {
  private embeddingProvider: EmbeddingProvider;
  private config: Required<RankingConfig>;
  private successHistory: Map<string, number> = new Map();

  constructor(embeddingProvider: EmbeddingProvider, config: RankingConfig = {}) {
    this.embeddingProvider = embeddingProvider;

    // Normalize weights
    const weights = config.weights || {};
    const defaultWeights = {
      semantic: 0.4,
      recency: 0.2,
      confidence: 0.2,
      context: 0.15,
      adaptive: 0.05,
    };

    const finalWeights = { ...defaultWeights, ...weights };
    const totalWeight = Object.values(finalWeights).reduce((a, b) => a + b, 0);

    this.config = {
      weights: {
        semantic: finalWeights.semantic / totalWeight,
        recency: finalWeights.recency / totalWeight,
        confidence: finalWeights.confidence / totalWeight,
        context: finalWeights.context / totalWeight,
        adaptive: finalWeights.adaptive / totalWeight,
      },
      costPerToken: config.costPerToken || 0.01,
      maxBudget: config.maxBudget || 10000,
      adaptiveWeight: config.adaptiveWeight || 0.5,
      decayFactor: config.decayFactor || 0.05,
    };
  }

  /**
   * Rank memories by relevance to query
   */
  async rankMemories(
    query: string,
    memories: Memory[],
    context?: Record<string, unknown>
  ): Promise<RankedMemory[]> {
    if (memories.length === 0) return [];

    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.generateEmbedding(query);

    // Generate embeddings for all memories
    const contents = memories.map((m) => m.content);
    const embeddingResult = await this.embeddingProvider.generateBatchEmbeddings(
      contents
    );

    // Rank each memory
    const ranked: RankedMemory[] = [];

    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      const embedding = embeddingResult.embeddings[i];

      const scores = {
        semantic: this.embeddingProvider.calculateSimilarity(queryEmbedding, embedding),
        recency: this.calculateRecency(memory),
        confidence: memory.confidence_level,
        context: this.calculateContextFit(memory, context),
        adaptive: this.getAdaptiveScore(memory.id),
      };

      const w = this.config.weights;
      const relevanceScore =
        scores.semantic * w.semantic! +
        scores.recency * w.recency! +
        scores.confidence * w.confidence! +
        scores.context * w.context! +
        scores.adaptive * w.adaptive!;

      ranked.push({
        memory,
        relevanceScore,
        scores,
        estimatedCost: this.estimateCost(memory),
        rank: 0, // Will be set after sorting
      });
    }

    // Sort by relevance score descending
    ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Assign ranks
    ranked.forEach((r, index) => {
      r.rank = index + 1;
    });

    return ranked;
  }

  /**
   * Calculate recency score for a memory
   */
  private calculateRecency(memory: Memory): number {
    const now = Date.now();
    const lastAccess = new Date(memory.last_accessed).getTime();
    const ageInDays = (now - lastAccess) / (1000 * 60 * 60 * 24);

    // Exponential decay: newer memories score higher
    return Math.exp(-this.config.decayFactor * ageInDays);
  }

  /**
   * Calculate how well memory fits the context
   */
  private calculateContextFit(memory: Memory, context?: Record<string, unknown>): number {
    if (!context) return 0.5; // Neutral score if no context

    let score = 0.5; // Base score

    // Check if memory type matches context operation
    if (context.operation && memory.type) {
      if (context.operation === 'story' && memory.type === 'story') score += 0.2;
      if (context.operation === 'insight' && memory.type === 'insight') score += 0.2;
    }

    // Check if memory tags match context tags
    if (context.tags && Array.isArray(context.tags) && memory.tags) {
      const contextTags = context.tags as string[];
      const matchCount = memory.tags.filter((t) => contextTags.includes(t)).length;
      score += Math.min(0.3, matchCount * 0.1);
    }

    // Check retention tier alignment
    if (context.importance) {
      const tierScore = this.getTierScore(memory.retention_tier, context.importance as string);
      score += tierScore * 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Get adaptive score based on retrieval history
   */
  private getAdaptiveScore(memoryId: string): number {
    const history = this.successHistory.get(memoryId) || 0;
    // Score between 0-1, increases with success
    return Math.min(1, history * this.config.adaptiveWeight);
  }

  /**
   * Record successful memory retrieval for adaptive ranking
   */
  recordSuccess(memoryId: string): void {
    const current = this.successHistory.get(memoryId) || 0;
    this.successHistory.set(memoryId, Math.min(1, current + 0.1));
  }

  /**
   * Record failed memory retrieval
   */
  recordFailure(memoryId: string): void {
    const current = this.successHistory.get(memoryId) || 0;
    this.successHistory.set(memoryId, Math.max(0, current - 0.05));
  }

  /**
   * Select memories within budget constraint
   */
  selectWithinBudget(ranked: RankedMemory[], maxCount?: number): RankedMemory[] {
    const selected: RankedMemory[] = [];
    let totalCost = 0;

    for (const item of ranked) {
      if (maxCount && selected.length >= maxCount) break;
      if (totalCost + item.estimatedCost <= this.config.maxBudget) {
        selected.push(item);
        totalCost += item.estimatedCost;
      }
    }

    return selected;
  }

  /**
   * Estimate API cost for a memory
   */
  private estimateCost(memory: Memory): number {
    // Rough estimate: cost increases with content size
    const tokens = Math.ceil(memory.content.length / 4); // Approximate tokenization
    return tokens * this.config.costPerToken;
  }

  /**
   * Get score based on tier and importance
   */
  private getTierScore(tier: Memory['retention_tier'], importance: string): number {
    const tierScores: Record<string, Record<string, number>> = {
      eternal: { high: 1.0, medium: 0.8, low: 0.6 },
      standard: { high: 0.8, medium: 0.6, low: 0.4 },
      temporary: { high: 0.6, medium: 0.4, low: 0.2 },
      session: { high: 0.4, medium: 0.2, low: 0.1 },
    };

    return tierScores[tier]?.[importance] || 0.5;
  }

  /**
   * Re-rank memories with custom weights
   */
  rerank(
    ranked: RankedMemory[],
    newWeights: Partial<RankingConfig['weights']>
  ): RankedMemory[] {
    const weights = { ...this.config.weights, ...newWeights };
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    // Normalize weights
    const normalized = {
      semantic: weights.semantic! / totalWeight,
      recency: weights.recency! / totalWeight,
      confidence: weights.confidence! / totalWeight,
      context: weights.context! / totalWeight,
      adaptive: weights.adaptive! / totalWeight,
    };

    // Recalculate scores
    const reranked = ranked.map((item) => ({
      ...item,
      relevanceScore:
        item.scores.semantic * normalized.semantic +
        item.scores.recency * normalized.recency +
        item.scores.confidence * normalized.confidence +
        item.scores.context * normalized.context +
        item.scores.adaptive * normalized.adaptive,
    }));

    // Re-sort by new relevance
    reranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Update ranks
    reranked.forEach((r, index) => {
      r.rank = index + 1;
    });

    return reranked;
  }

  /**
   * Get diversity analysis of ranked results
   */
  analyzeDiversity(ranked: RankedMemory[]): {
    tagCoverage: string[];
    topicDiversity: number;
    typeDistribution: Record<string, number>;
    ageProportion: Record<string, number>;
  } {
    // Tag coverage
    const allTags = new Set<string>();
    ranked.forEach((r) => r.memory.tags?.forEach((t) => allTags.add(t)));

    // Type distribution
    const typeCount: Record<string, number> = {};
    ranked.forEach((r) => {
      typeCount[r.memory.type] = (typeCount[r.memory.type] || 0) + 1;
    });

    // Age distribution
    const now = Date.now();
    const ageGroups: Record<string, number> = {
      'recent_7d': 0,
      'recent_30d': 0,
      'recent_1y': 0,
      'old': 0,
    };

    ranked.forEach((r) => {
      const ageMs = now - new Date(r.memory.last_accessed).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays <= 7) ageGroups['recent_7d']++;
      else if (ageDays <= 30) ageGroups['recent_30d']++;
      else if (ageDays <= 365) ageGroups['recent_1y']++;
      else ageGroups['old']++;
    });

    const total = ranked.length;

    return {
      tagCoverage: Array.from(allTags),
      topicDiversity: allTags.size / Math.max(1, ranked.length),
      typeDistribution: typeCount,
      ageProportion: {
        recent_7d: ageGroups['recent_7d'] / total,
        recent_30d: ageGroups['recent_30d'] / total,
        recent_1y: ageGroups['recent_1y'] / total,
        old: ageGroups['old'] / total,
      },
    };
  }

  /**
   * Get ranking statistics
   */
  getRankingStats(ranked: RankedMemory[]): {
    avgRelevance: number;
    maxRelevance: number;
    minRelevance: number;
    totalCost: number;
    avgCost: number;
  } {
    if (ranked.length === 0) {
      return { avgRelevance: 0, maxRelevance: 0, minRelevance: 0, totalCost: 0, avgCost: 0 };
    }

    const relevances = ranked.map((r) => r.relevanceScore);
    const totalCost = ranked.reduce((sum, r) => sum + r.estimatedCost, 0);

    return {
      avgRelevance: relevances.reduce((a, b) => a + b, 0) / ranked.length,
      maxRelevance: Math.max(...relevances),
      minRelevance: Math.min(...relevances),
      totalCost,
      avgCost: totalCost / ranked.length,
    };
  }
}
