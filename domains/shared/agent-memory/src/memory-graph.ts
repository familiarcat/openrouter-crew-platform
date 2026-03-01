/**
 * Memory Graph
 * CRUD operations on memory_nodes and memory_edges in Supabase
 * Implements the distributed memory graph structure
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MemoryNode,
  MemoryEdge,
  MemoryInsertOptions,
  MemoryLayer,
  MemoryServiceError,
} from './types';

/**
 * Weight calculation formula for edges
 * As co-activation count increases, weight increases but with diminishing returns
 */
function calculateEdgeWeight(coActivationCount: number): number {
  // Formula: min(1.0, (count / 10) * 0.8 + 0.2)
  // At count=1: 0.1*0.8 + 0.2 = 0.28
  // At count=10: 1.0*0.8 + 0.2 = 1.0 (capped)
  return Math.min(1.0, (Math.min(coActivationCount, 10) / 10) * 0.8 + 0.2);
}

export class MemoryGraph {
  constructor(private supabase: SupabaseClient<any>) {}

  /**
   * Insert a new memory node
   */
  async insertNode(opts: MemoryInsertOptions): Promise<MemoryNode> {
    const nodeData = {
      crew_id: opts.crewId,
      project_id: opts.projectId,
      layer: opts.layer,
      content: opts.content,
      summary: opts.summary,
      tags: opts.tags || [],
      retention_tier: opts.retentionTier || 'standard',
      confidence_weight: 1.0,
      activation_count: 0,
      context_keywords: opts.contextKeywords || [],
      legacy_memory_id: opts.legacyMemoryId,
      expires_at: opts.retentionTier === 'session'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        : null,
    };

    const { data, error } = await this.supabase
      .from('memory_nodes')
      .insert([nodeData])
      .select()
      .single();

    if (error) {
      throw new MemoryServiceError('INSERT_NODE_FAILED', 'Failed to insert memory node', error);
    }

    return this.mapDbNodeToMemoryNode(data);
  }

  /**
   * Get memory nodes with optional filters
   */
  async getNodes(
    projectId: string,
    filters?: {
      keywords?: string[];
      layer?: MemoryLayer;
      minConfidence?: number;
      includeExpired?: boolean;
    }
  ): Promise<MemoryNode[]> {
    let query = this.supabase
      .from('memory_nodes')
      .select('*')
      .eq('project_id', projectId);

    // Exclude soft-deleted unless requested
    if (!filters?.includeExpired) {
      query = query.is('deleted_at', null);
    }

    // Filter by layer
    if (filters?.layer) {
      query = query.eq('layer', filters.layer);
    }

    // Filter by minimum confidence
    if (filters?.minConfidence !== undefined) {
      query = query.gte('confidence_weight', filters.minConfidence);
    }

    // Filter by keywords (any keyword match)
    if (filters?.keywords && filters.keywords.length > 0) {
      const keywordFilters = filters.keywords
        .map((kw) => `context_keywords.cs.{"${kw}"}`)
        .join(',');
      // Use full-text search
      query = query.or(keywordFilters);
    }

    const { data, error } = await query.order('confidence_weight', { ascending: false });

    if (error) {
      throw new MemoryServiceError('FETCH_NODES_FAILED', 'Failed to fetch memory nodes', error);
    }

    return data.map((row) => this.mapDbNodeToMemoryNode(row));
  }

  /**
   * Update confidence weight of a node
   * Increments by delta (can be positive or negative)
   */
  async updateNodeConfidence(nodeId: string, delta: number): Promise<void> {
    const { data: current } = await this.supabase
      .from('memory_nodes')
      .select('confidence_weight')
      .eq('id', nodeId)
      .single();

    if (!current) {
      throw new MemoryServiceError('NODE_NOT_FOUND', `Memory node ${nodeId} not found`);
    }

    const newWeight = Math.max(0.01, Math.min(1.0, current.confidence_weight + delta));

    const { error } = await this.supabase
      .from('memory_nodes')
      .update({
        confidence_weight: newWeight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId);

    if (error) {
      throw new MemoryServiceError('UPDATE_CONFIDENCE_FAILED', 'Failed to update node confidence', error);
    }
  }

  /**
   * Mark a node as activated (increment activation_count and update timestamp)
   */
  async markActivated(nodeId: string): Promise<void> {
    const { error } = await this.supabase
      .from('memory_nodes')
      .update({
        activation_count: this.supabase.rpc('increment', { row_id: nodeId, column: 'activation_count' }),
        last_activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', nodeId);

    if (error) {
      // Fallback to fetch, increment locally, and update
      const { data: node } = await this.supabase
        .from('memory_nodes')
        .select('activation_count')
        .eq('id', nodeId)
        .single();

      if (node) {
        await this.supabase
          .from('memory_nodes')
          .update({
            activation_count: node.activation_count + 1,
            last_activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', nodeId);
      }
    }
  }

  /**
   * Upsert an edge between two nodes
   * Creates edge if not exists; increments co_activation_count and recalculates weight if exists
   */
  async upsertEdge(sourceId: string, targetId: string): Promise<MemoryEdge> {
    // Prevent self-loops
    if (sourceId === targetId) {
      throw new MemoryServiceError('INVALID_EDGE', 'Cannot create edge from node to itself');
    }

    // Try to get existing edge
    const { data: existing } = await this.supabase
      .from('memory_edges')
      .select('*')
      .eq('source_id', sourceId)
      .eq('target_id', targetId)
      .single();

    if (existing) {
      // Update: increment count and recalculate weight
      const newCount = existing.co_activation_count + 1;
      const newWeight = calculateEdgeWeight(newCount);

      const { data, error } = await this.supabase
        .from('memory_edges')
        .update({
          co_activation_count: newCount,
          weight: newWeight,
          last_co_activated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new MemoryServiceError('UPDATE_EDGE_FAILED', 'Failed to update memory edge', error);
      }

      return this.mapDbEdgeToMemoryEdge(data);
    } else {
      // Create: new edge with initial weight
      const edgeData = {
        source_id: sourceId,
        target_id: targetId,
        weight: calculateEdgeWeight(1),
        co_activation_count: 1,
        last_co_activated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('memory_edges')
        .insert([edgeData])
        .select()
        .single();

      if (error) {
        throw new MemoryServiceError('CREATE_EDGE_FAILED', 'Failed to create memory edge', error);
      }

      return this.mapDbEdgeToMemoryEdge(data);
    }
  }

  /**
   * Get neighbors of a node (nodes connected by edges with weight >= minWeight)
   */
  async getNeighbors(
    nodeId: string,
    minWeight = 0.1
  ): Promise<Array<{ node: MemoryNode; edge: MemoryEdge }>> {
    // Get outgoing edges
    const { data: edges, error } = await this.supabase
      .from('memory_edges')
      .select('*')
      .eq('source_id', nodeId)
      .gte('weight', minWeight)
      .order('weight', { ascending: false });

    if (error) {
      throw new MemoryServiceError('FETCH_EDGES_FAILED', 'Failed to fetch edges', error);
    }

    const neighbors: Array<{ node: MemoryNode; edge: MemoryEdge }> = [];

    for (const dbEdge of edges || []) {
      const { data: targetNode } = await this.supabase
        .from('memory_nodes')
        .select('*')
        .eq('id', dbEdge.target_id)
        .single();

      if (targetNode) {
        neighbors.push({
          node: this.mapDbNodeToMemoryNode(targetNode),
          edge: this.mapDbEdgeToMemoryEdge(dbEdge),
        });
      }
    }

    return neighbors;
  }

  /**
   * Delete nodes that have expired
   */
  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();

    const { data } = await this.supabase
      .from('memory_nodes')
      .select('id')
      .lt('expires_at', now)
      .is('deleted_at', null);

    if (!data || data.length === 0) {
      return 0;
    }

    const ids = data.map((row) => row.id);

    const { error } = await this.supabase
      .from('memory_nodes')
      .update({ deleted_at: now })
      .in('id', ids);

    if (error) {
      throw new MemoryServiceError('DELETE_EXPIRED_FAILED', 'Failed to delete expired nodes', error);
    }

    return ids.length;
  }

  /**
   * Soft-delete a node
   */
  async softDeleteNode(nodeId: string): Promise<void> {
    const { error } = await this.supabase
      .from('memory_nodes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', nodeId);

    if (error) {
      throw new MemoryServiceError('SOFT_DELETE_FAILED', 'Failed to soft-delete node', error);
    }
  }

  // --- Helper functions ---

  private mapDbNodeToMemoryNode(row: any): MemoryNode {
    return {
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      crewId: row.crew_id,
      projectId: row.project_id,
      layer: row.layer,
      content: row.content,
      summary: row.summary,
      tags: row.tags || [],
      retentionTier: row.retention_tier,
      confidenceWeight: row.confidence_weight,
      activationCount: row.activation_count,
      lastActivatedAt: row.last_activated_at ? new Date(row.last_activated_at) : undefined,
      contextKeywords: row.context_keywords || [],
      legacyMemoryId: row.legacy_memory_id,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : undefined,
    };
  }

  private mapDbEdgeToMemoryEdge(row: any): MemoryEdge {
    return {
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      weight: row.weight,
      coActivationCount: row.co_activation_count,
      lastCoActivatedAt: new Date(row.last_co_activated_at),
    };
  }
}
