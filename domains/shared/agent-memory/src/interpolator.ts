/**
 * Memory Interpolator
 * Given a context, retrieves and ranks memories by relevance
 * Uses keyword overlap, graph proximity, and confidence weighting
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MemoryRetrievalOptions,
  WeightedMemory,
} from './types';
import { MemoryGraph } from './memory-graph';
import { ContextEncoder } from './context-encoder';

export class MemoryInterpolator {
  constructor(
    private graph: MemoryGraph,
    private encoder: ContextEncoder,
    private supabase: SupabaseClient<any>
  ) {}

  /**
   * Retrieve and rank memories relevant to a context
   * Returns top-N memories with relevance scores
   */
  async retrieve(opts: MemoryRetrievalOptions): Promise<WeightedMemory[]> {
    const maxResults = opts.maxResults || 10;
    const minConfidence = opts.minConfidence || 0.1;

    // 1. Encode incoming context
    const encoded = this.encoder.encode(opts.context);

    // 2. Fetch candidate nodes from Supabase
    const candidates = await this.graph.getNodes(opts.projectId, {
      keywords: encoded.keywords,
      layer: opts.layers?.[0],
      minConfidence,
      includeExpired: opts.includeExpired,
    });

    if (candidates.length === 0) {
      return [];
    }

    // 3. Score each candidate
    const scored = candidates.map((node) => {
      const keywordOverlap = this.encoder.similarity(
        encoded,
        {
          keywords: node.contextKeywords,
          intent: encoded.intent,
          domainTags: [],
          contextHash: '',
          summary: node.summary || '',
        }
      );

      // Recency bonus: decay over time
      const lastActivated = node.lastActivatedAt
        ? Date.now() - new Date(node.lastActivatedAt).getTime()
        : Infinity;
      const daysSinceActivation = lastActivated / (1000 * 60 * 60 * 24);
      const recencyBonus = Math.exp(-daysSinceActivation / 7); // 7-day half-life

      // Combined score
      const relevanceScore = Math.min(
        1.0,
        keywordOverlap * 0.5 + node.confidenceWeight * 0.3 + recencyBonus * 0.2
      );

      return {
        node,
        relevanceScore,
        edgeWeight: 0, // will be set by graph traversal
      };
    });

    // 4. Graph traversal: for top-N candidates, load their high-weight neighbors
    const topCandidates = scored.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);

    const withNeighbors: WeightedMemory[] = [...scored];

    for (const candidate of topCandidates) {
      try {
        const neighbors = await this.graph.getNeighbors(candidate.node.id, 0.3);

        for (const { node: neighborNode, edge } of neighbors) {
          // Check if neighbor already in results
          const existing = withNeighbors.find((m) => m.node.id === neighborNode.id);

          if (existing) {
            // Update if edge weight improves score
            existing.edgeWeight = Math.max(existing.edgeWeight, edge.weight);
          } else {
            // Add neighbor with edge weight boost
            const neighborScore = candidate.relevanceScore * 0.8 * edge.weight;
            withNeighbors.push({
              node: neighborNode,
              relevanceScore: neighborScore,
              edgeWeight: edge.weight,
            });
          }
        }
      } catch (error) {
        // Skip neighbors if lookup fails
        console.warn(`Failed to fetch neighbors for ${candidate.node.id}:`, error);
      }
    }

    // 5. Rank and deduplicate
    const final = withNeighbors
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    // 6. Record activation in memory_contexts
    await this.recordContext(
      opts.projectId || 'unknown',
      opts.requestingCrewId || 'unknown',
      final,
      encoded.contextHash
    );

    return final;
  }

  /**
   * Record the context and activated memories for later outcome reporting
   */
  private async recordContext(
    _projectId: string,
    crewId: string,
    memories: WeightedMemory[],
    contextHash: string
  ): Promise<string> {
    const contextData = {
      session_id: this.generateSessionId(),
      crew_id: crewId,
      context_hash: contextHash,
      activated_node_ids: memories.map((m) => m.node.id),
      activation_weights: memories.map((m) => m.relevanceScore),
      used_in_prompt: false,
    };

    const { data, error } = await this.supabase
      .from('memory_contexts')
      .insert([contextData])
      .select('id')
      .single();

    if (error) {
      console.warn('Failed to record context:', error);
      return ''; // Return empty ID if recording fails
    }

    return data?.id || '';
  }

  /**
   * Generate a session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
