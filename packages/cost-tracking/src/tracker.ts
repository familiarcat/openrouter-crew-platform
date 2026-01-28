/**
 * Usage Tracker (Subflow #7: Usage Logger)
 *
 * Tracks and persists LLM usage events
 * Based on openrouter-ai-milestone pattern
 */

import { UsageEvent } from './types';

export interface TrackerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tableName?: string;
}

export class UsageTracker {
  private config: TrackerConfig;
  private events: UsageEvent[] = [];

  constructor(config: TrackerConfig) {
    this.config = {
      tableName: 'llm_usage_events',
      ...config
    };
  }

  /**
   * Track a usage event
   */
  async track(event: Omit<UsageEvent, 'timestamp'>): Promise<void> {
    const fullEvent: UsageEvent = {
      ...event,
      timestamp: new Date()
    };

    // Add to in-memory cache
    this.events.push(fullEvent);

    // Persist to Supabase
    try {
      await this.persistToSupabase(fullEvent);
    } catch (error) {
      console.error('Failed to persist usage event:', error);
      // Don't throw - we have it in memory
    }
  }

  /**
   * Persist event to Supabase
   */
  private async persistToSupabase(event: UsageEvent): Promise<void> {
    const response = await fetch(
      `${this.config.supabaseUrl}/rest/v1/${this.config.tableName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.config.supabaseKey,
          Authorization: `Bearer ${this.config.supabaseKey}`,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          project_id: event.projectId,
          workflow_id: event.workflowId,
          crew_member: event.crewMember,
          provider: event.provider,
          model: event.model,
          input_tokens: event.inputTokens,
          output_tokens: event.outputTokens,
          total_tokens: event.totalTokens,
          estimated_cost_usd: event.estimatedCost,
          actual_cost_usd: event.actualCost,
          routing_mode: event.routingMode,
          request_type: event.requestType,
          workflow: event.crewMember // For backward compatibility
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to persist: ${response.statusText}`);
    }
  }

  /**
   * Get recent events (from in-memory cache)
   */
  getRecentEvents(limit: number = 100): UsageEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events for a project
   */
  getProjectEvents(projectId: string): UsageEvent[] {
    return this.events.filter(e => e.projectId === projectId);
  }

  /**
   * Clear in-memory cache
   */
  clearCache(): void {
    this.events = [];
  }
}
