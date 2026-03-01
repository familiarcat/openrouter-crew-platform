/**
 * Memory Reinforcer
 * Updates memory weights based on task outcomes (backpropagation-like learning)
 * Successful outcomes increase confidence; failures decrease it
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  OutcomeReport,
  MemoryServiceError,
} from './types';
import { MemoryGraph } from './memory-graph';
import { ContextEncoder } from './context-encoder';

/**
 * Delta adjustments per outcome
 */
const OUTCOME_DELTAS = {
  success: 0.05,     // +5% confidence on success
  failure: -0.10,    // -10% confidence on failure
  partial: 0.01,     // +1% confidence on partial success
};

export class MemoryReinforcer {
  constructor(
    private graph: MemoryGraph,
    private supabase: SupabaseClient<any>,
    _encoder: ContextEncoder
  ) {}

  /**
   * Reinforce memories based on task outcome
   * Updates confidence weights and strengthens edges between co-activated nodes
   */
  async reinforce(report: OutcomeReport): Promise<void> {
    const delta = OUTCOME_DELTAS[report.outcome];
    const nodes = report.activatedNodeIds;

    if (!nodes || nodes.length === 0) {
      return;
    }

    try {
      // 1. Update confidence for all activated nodes
      for (const nodeId of nodes) {
        await this.graph.updateNodeConfidence(nodeId, delta);
      }

      // 2. Strengthen edges between co-activated nodes
      for (let i = 0; i < nodes.length - 1; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          if (nodeA && nodeB) {
            try {
              await this.graph.upsertEdge(nodeA, nodeB);
              await this.graph.upsertEdge(nodeB, nodeA); // Bidirectional
            } catch (error) {
              // Continue if edge creation fails
              console.warn(`Failed to create edge between ${nodeA} and ${nodeB}:`, error);
            }
          }
        }
      }

      // 3. Record outcome in database
      await this.recordOutcome(report);

      // 4. Attempt pattern synthesis for successful outcomes
      if (report.outcome === 'success' && nodes.length >= 3) {
        try {
          await this.maybeSynthesizePattern(nodes, report.crewMember);
        } catch (error) {
          // Pattern synthesis is optional
          console.warn('Pattern synthesis failed:', error);
        }
      }
    } catch (error) {
      throw new MemoryServiceError('REINFORCEMENT_FAILED', 'Failed to reinforce memories', error);
    }
  }

  /**
   * Record outcome for audit trail
   */
  private async recordOutcome(report: OutcomeReport): Promise<void> {
    const outcomeData = {
      session_id: report.sessionId,
      activated_node_ids: report.activatedNodeIds,
      outcome: report.outcome,
      outcome_delta: report.outcomeDelta,
      crew_member: report.crewMember,
      metadata: report.metadata || {},
    };

    const { error } = await this.supabase
      .from('memory_outcomes')
      .insert([outcomeData]);

    if (error) {
      console.warn('Failed to record outcome:', error);
      // Don't throw - recording is optional
    }
  }

  /**
   * Pattern synthesis: detect common patterns from layer-1 observations
   * Creates a new layer-2 node summarizing the pattern
   *
   * Triggers when:
   * - Outcome is 'success'
   * - Multiple (>=3) layer-1 observations were co-activated
   */
  private async maybeSynthesizePattern(nodeIds: string[], crewMember: string | undefined): Promise<void> {
    if (nodeIds.length < 3) {
      return;
    }

    // Fetch the activated nodes
    const { data: nodes } = await this.supabase
      .from('memory_nodes')
      .select('*')
      .in('id', nodeIds)
      .eq('layer', 1);

    if (!nodes || nodes.length < 3) {
      return;
    }

    // Extract common keywords across all observations
    const allKeywords = new Set<string>();
    nodes.forEach((node) => {
      (node.context_keywords || []).forEach((kw: string) => allKeywords.add(kw));
    });

    if (allKeywords.size === 0) {
      return;
    }

    // Compute common tags
    const tagSets = nodes.map((n) => new Set(n.tags || []));
    const firstSet = tagSets[0];
    const commonTags = firstSet
      ? [...firstSet].filter((tag) => tagSets.every((set) => set.has(tag)))
      : [];

    // Generate pattern summary
    const contentSnippets = nodes
      .map((n) => (n.summary || n.content).slice(0, 100))
      .join(' | ');

    const patternContent = `Pattern from observations: ${contentSnippets.slice(0, 300)}`;
    const patternSummary = `Successful pattern: ${commonTags.join(', ') || 'co-activation of observations'}`;

    // Create layer-2 node
    try {
      await this.graph.insertNode({
        crewId: crewMember,
        layer: 2,
        content: patternContent,
        summary: patternSummary,
        tags: commonTags as string[],
        retentionTier: 'standard',
        contextKeywords: Array.from(allKeywords).slice(0, 10) as string[],
      });
    } catch (error) {
      console.warn('Failed to synthesize pattern:', error);
    }
  }
}
