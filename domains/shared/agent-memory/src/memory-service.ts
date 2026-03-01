/**
 * Memory Service
 * Main facade for the Agent Memory Weighted Interpolation System
 * Coordinates all components: graph, interpolator, reinforcer, decay, prompt builder
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MemoryInsertOptions,
  MemoryRetrievalOptions,
  MemoryRetrievalResult,
  OutcomeReport,
  MemoryServiceError,
  PromptBuilderOptions,
} from './types';
import { MemoryGraph } from './memory-graph';
import { MemoryInterpolator } from './interpolator';
import { MemoryReinforcer } from './reinforcer';
import { DecayManager } from './decay-manager';
import { PromptBuilder } from './prompt-builder';
import { ContextEncoder } from './context-encoder';

export class MemoryService {
  private graph: MemoryGraph;
  private interpolator: MemoryInterpolator;
  private reinforcer: MemoryReinforcer;
  private decay: DecayManager;
  private promptBuilder: PromptBuilder;
  private encoder: ContextEncoder;

  constructor(private supabase: SupabaseClient<any>) {
    // Initialize all components
    this.encoder = new ContextEncoder();
    this.graph = new MemoryGraph(supabase);
    this.interpolator = new MemoryInterpolator(this.graph, this.encoder, supabase);
    this.reinforcer = new MemoryReinforcer(this.graph, supabase, this.encoder);
    this.decay = new DecayManager(supabase);
    this.promptBuilder = new PromptBuilder();
  }

  // ===== MEMORY CRUD =====

  /**
   * Store a new memory observation
   */
  async store(opts: MemoryInsertOptions) {
    try {
      return await this.graph.insertNode(opts);
    } catch (error) {
      throw new MemoryServiceError('STORE_FAILED', 'Failed to store memory', error);
    }
  }

  /**
   * Retrieve memories relevant to a context
   * Returns memories + formatted prompt section + context ID
   */
  async retrieve(opts: MemoryRetrievalOptions): Promise<MemoryRetrievalResult> {
    try {
      const memories = await this.interpolator.retrieve(opts);

      const promptSection = this.promptBuilder.build(
        memories,
        { maxMemories: 10, includeConfidence: true } as PromptBuilderOptions
      );

      return {
        memories,
        promptSection,
        contextId: memories[0]?.node.id || '',
      };
    } catch (error) {
      throw new MemoryServiceError('RETRIEVE_FAILED', 'Failed to retrieve memories', error);
    }
  }

  /**
   * Report outcome of a task
   * Updates memory weights and strengthens co-activated edges
   */
  async reportOutcome(report: OutcomeReport): Promise<void> {
    try {
      await this.reinforcer.reinforce(report);
    } catch (error) {
      throw new MemoryServiceError('OUTCOME_FAILED', 'Failed to report outcome', error);
    }
  }

  // ===== MAINTENANCE =====

  /**
   * Apply decay to memories
   * Updates confidence weights based on time since activation
   */
  async runDecay(crewId?: string): Promise<number> {
    try {
      return await this.decay.applyDecay(crewId);
    } catch (error) {
      throw new MemoryServiceError('DECAY_FAILED', 'Failed to apply decay', error);
    }
  }

  /**
   * Hard-delete memories past their recovery window
   */
  async hardDeleteExpired(): Promise<number> {
    try {
      return await this.decay.hardDeleteExpired();
    } catch (error) {
      throw new MemoryServiceError('DELETE_FAILED', 'Failed to delete expired memories', error);
    }
  }

  /**
   * Restore a soft-deleted memory
   */
  async restoreMemory(memoryId: string): Promise<void> {
    try {
      await this.decay.restoreNode(memoryId);
    } catch (error) {
      throw new MemoryServiceError('RESTORE_FAILED', 'Failed to restore memory', error);
    }
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Enrich a crew request with memory context
   * Prepends memory context to the message
   */
  async enrichCrewRequest(request: {
    projectId: string;
    crewMember: string;
    message: string;
    [key: string]: any;
  }): Promise<{
    enrichedMessage: string;
    contextId: string;
    memoryCount: number;
  }> {
    try {
      const result = await this.retrieve({
        projectId: request.projectId,
        context: request.message,
        requestingCrewId: request.crewMember,
        maxResults: 10,
      });

      const enrichedMessage = result.promptSection
        ? `${result.promptSection}\n\nRequest: ${request.message}`
        : request.message;

      return {
        enrichedMessage,
        contextId: result.contextId,
        memoryCount: result.memories.length,
      };
    } catch (error) {
      console.warn('Failed to enrich crew request with memories:', error);
      // Return original message if enrichment fails
      return {
        enrichedMessage: request.message,
        contextId: '',
        memoryCount: 0,
      };
    }
  }

  /**
   * Get a verbose report of memories (for debugging)
   */
  async getDebugReport(projectId: string): Promise<string> {
    try {
      const { data: nodes } = await this.supabase
        .from('memory_nodes')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

      if (!nodes || nodes.length === 0) {
        return 'No memories in project';
      }

      const lines: string[] = [];
      lines.push('=== MEMORY SERVICE DEBUG REPORT ===');
      lines.push(`Project ID: ${projectId}`);
      lines.push(`Total memories: ${nodes.length}`);
      lines.push('');

      // Group by layer
      const byLayer: { [key: number]: any[] } = {};
      for (const node of nodes) {
        if (!byLayer[node.layer]) {
          byLayer[node.layer] = [];
        }
        const layer = byLayer[node.layer];
        if (layer) {
          layer.push(node);
        }
      }

      for (const layer of [1, 2, 3, 4]) {
        const layerMemories = byLayer[layer] ?? [];
        lines.push(`Layer ${layer}: ${layerMemories.length} memories`);

        const byTier: { [key: string]: any[] } = {};
        for (const mem of layerMemories) {
          if (!byTier[mem.retention_tier]) {
            byTier[mem.retention_tier] = [];
          }
          const tier = byTier[mem.retention_tier];
          if (tier) {
            tier.push(mem);
          }
        }

        for (const [tier, mems] of Object.entries(byTier)) {
          if (mems && mems.length > 0) {
            const avgConfidence = mems.reduce((s, m) => s + m.confidence_weight, 0) / mems.length;
            lines.push(`  ${tier}: ${mems.length} (avg confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
          }
        }
      }

      // Edge stats
      const { data: edges } = await this.supabase
        .from('memory_edges')
        .select('*')
        .in(
          'source_id',
          nodes.map((n) => n.id)
        );

      if (edges && edges.length > 0) {
        const avgWeight = edges.reduce((s, e) => s + e.weight, 0) / edges.length;
        lines.push(`\nEdges: ${edges.length} (avg weight: ${(avgWeight * 100).toFixed(1)}%)`);
      }

      lines.push('=== END REPORT ===');
      return lines.join('\n');
    } catch (error) {
      return `Debug report failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Export memories as JSON for backup/analysis
   */
  async exportMemories(projectId: string): Promise<{
    nodes: any[];
    edges: any[];
    exportedAt: string;
  }> {
    try {
      const { data: nodes } = await this.supabase
        .from('memory_nodes')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

      const nodeIds = nodes?.map((n) => n.id) || [];
      let edges: any[] = [];

      if (nodeIds.length > 0) {
        const { data: edgeData } = await this.supabase
          .from('memory_edges')
          .select('*')
          .in('source_id', nodeIds);
        edges = edgeData || [];
      }

      return {
        nodes: nodes || [],
        edges,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new MemoryServiceError('EXPORT_FAILED', 'Failed to export memories', error);
    }
  }
}

/**
 * Factory function for creating a Memory Service instance
 */
export const createMemoryService = (supabase: SupabaseClient) => new MemoryService(supabase);
