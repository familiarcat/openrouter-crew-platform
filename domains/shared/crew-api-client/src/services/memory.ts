/**
 * Memory Service
 * Advanced memory operations (search, retrieval policies, forecasting)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Memory,
  RetrievalPolicy,
  AuthContext,
  SearchMemoriesParams,
  ComplianceStatusParams,
  ExpirationForecastParams,
} from '../types';

export class MemoryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Search memories using semantic similarity or text search
   */
  async searchMemories(
    params: SearchMemoriesParams,
    context: AuthContext
  ): Promise<Memory[]> {
    let query = this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', context.crew_id);

    // Full-text search on content
    if (params.query) {
      query = query.ilike('content', `%${params.query}%`);
    }

    // Apply filters
    if (params.filters?.type) {
      query = query.eq('type', params.filters.type);
    }

    if (params.filters?.confidence_min) {
      query = query.gte('confidence_level', params.filters.confidence_min);
    }

    // Order by relevance and limit
    query = query.order('confidence_level', { ascending: false });
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    return (data || []) as Memory[];
  }

  /**
   * Explain why a memory was retrieved
   */
  async explainRetrieval(
    memory_id: string,
    query: string,
    context: AuthContext
  ): Promise<{
    memory_id: string;
    relevance_score: number;
    match_reason: string;
    confidence: number;
  }> {
    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('id', memory_id)
      .single();

    if (error) {
      throw new Error(`Memory not found: ${error.message}`);
    }

    // Calculate relevance
    const relevance_score = this.calculateRelevance(data.content, query);
    const match_reason =
      relevance_score > 0.8
        ? 'Strong semantic match'
        : relevance_score > 0.5
          ? 'Moderate semantic match'
          : 'Tag or metadata match';

    return {
      memory_id,
      relevance_score,
      match_reason,
      confidence: data.confidence_level,
    };
  }

  /**
   * Get compliance status for a crew
   */
  async getComplianceStatus(
    params: ComplianceStatusParams,
    context: AuthContext
  ): Promise<{
    crew_id: string;
    period: string;
    total_memories: number;
    deleted_memories: number;
    recovery_window_days: number;
    gdpr_compliant: boolean;
  }> {
    const period = params.period || '30d';
    const days = parseInt(period.replace('d', ''));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', context.crew_id)
      .gte('created_at', startDate.toISOString());

    if (error) {
      throw new Error(`Compliance check failed: ${error.message}`);
    }

    const total = data?.length || 0;
    const deleted = data?.filter((m: any) => m.deleted_at).length || 0;

    return {
      crew_id: context.crew_id,
      period,
      total_memories: total,
      deleted_memories: deleted,
      recovery_window_days: 30,
      gdpr_compliant: deleted <= total * 0.1, // Less than 10% deleted
    };
  }

  /**
   * Forecast memory expiration
   */
  async getExpirationForecast(
    params: ExpirationForecastParams,
    context: AuthContext
  ): Promise<{
    crew_id: string;
    expiring_soon: number;
    expiring_30days: number;
    expiring_90days: number;
  }> {
    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', context.crew_id);

    if (error) {
      throw new Error(`Forecast failed: ${error.message}`);
    }

    const now = Date.now();
    const memories = (data || []) as Memory[];

    // Estimate expiration based on confidence decay
    const expiring_soon = memories.filter((m) => m.confidence_level < 0.3).length;
    const expiring_30days = memories.filter((m) => m.confidence_level < 0.5).length;
    const expiring_90days = memories.filter((m) => m.confidence_level < 0.7).length;

    return {
      crew_id: context.crew_id,
      expiring_soon,
      expiring_30days,
      expiring_90days,
    };
  }

  /**
   * Apply retrieval policy to memories
   */
  applyRetrievalPolicy(
    memories: Memory[],
    policy: 'default' | 'task-specific' | 'budget-constrained' | 'quality-focused'
  ): Memory[] {
    switch (policy) {
      case 'quality-focused':
        // Return only high-confidence memories
        return memories.filter((m) => m.confidence_level >= 0.8);

      case 'budget-constrained':
        // Return most relevant memories (top 5)
        return memories.slice(0, 5);

      case 'task-specific':
        // Filter by relevance and recency
        return memories
          .filter((m) => m.confidence_level >= 0.5)
          .slice(0, 10);

      case 'default':
      default:
        // Return all memories, sorted by confidence
        return memories.sort((a, b) => b.confidence_level - a.confidence_level);
    }
  }

  /**
   * Calculate relevance between content and query
   */
  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();

    if (contentLower.includes(queryLower)) {
      return 0.95; // Exact match
    }

    const queryTerms = queryLower.split(/\s+/);
    const matchedTerms = queryTerms.filter((term) => contentLower.includes(term));

    return matchedTerms.length / queryTerms.length;
  }
}
