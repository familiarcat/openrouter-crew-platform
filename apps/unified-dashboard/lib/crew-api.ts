'use client';

import { CrewAPIClient, AuthContext } from '@openrouter-crew/crew-api-client';
import { getSupabase } from './supabase';

/**
 * Global CrewAPIClient instance
 */
let crewClient: CrewAPIClient | null = null;

/**
 * Get or create CrewAPIClient instance
 */
export function getCrewAPIClient(): CrewAPIClient {
  if (!crewClient) {
    const supabase = getSupabase();
    crewClient = new CrewAPIClient(supabase);
  }
  return crewClient;
}

/**
 * Get default auth context for the Web surface
 * Should be populated with actual user data from auth session
 */
export function getWebAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  return {
    user_id: overrides?.user_id || 'web-user',
    crew_id: overrides?.crew_id || 'default-crew',
    role: overrides?.role || 'member',
    surface: 'web',
    tenant_id: overrides?.tenant_id,
  };
}

/**
 * Memory API - High-level interface for React components
 */
export const crewMemoryAPI = {
  /**
   * Create a new memory
   */
  async create(
    content: string,
    type: 'story' | 'insight' | 'pattern' | 'lesson' | 'best-practice',
    options?: {
      tags?: string[];
      tier?: 'eternal' | 'standard' | 'temporary' | 'session';
      crewId?: string;
      userId?: string;
    }
  ) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.create_memory(
      {
        content,
        type,
        retention_tier: options?.tier,
        tags: options?.tags,
      },
      context
    );
  },

  /**
   * List memories with optional filtering
   */
  async list(options?: {
    filter?: string;
    limit?: number;
    policy?: 'default' | 'task-specific' | 'budget-constrained' | 'quality-focused';
    crewId?: string;
    userId?: string;
  }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.retrieve_memories(
      {
        crew_id: context.crew_id,
        filter: options?.filter,
        limit: options?.limit,
        policy: options?.policy,
      },
      context
    );
  },

  /**
   * Search memories
   */
  async search(query: string, options?: { limit?: number; crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.search_memories(
      {
        query,
        limit: options?.limit || 10,
      },
      context
    );
  },

  /**
   * Update a memory
   */
  async update(
    id: string,
    updates: {
      content?: string;
      metadata?: Record<string, unknown>;
    },
    options?: { crewId?: string; userId?: string }
  ) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.update_memory({ id, ...updates }, context);
  },

  /**
   * Delete a memory (soft delete by default)
   */
  async delete(id: string, permanent = false, options?: { crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.delete_memory({ id, permanent }, context);
  },

  /**
   * Restore a soft-deleted memory
   */
  async restore(id: string, options?: { crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.restore_memory({ id }, context);
  },

  /**
   * Explain why a memory was retrieved
   */
  async explain(memoryId: string, query: string, options?: { crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.explain_retrieval(memoryId, query, context);
  },

  /**
   * Get compliance status
   */
  async getComplianceStatus(options?: { period?: string; crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.compliance_status(
      {
        crew_id: context.crew_id,
        period: options?.period,
      },
      context
    );
  },

  /**
   * Get expiration forecast
   */
  async getExpirationForecast(options?: { crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.expiration_forecast(
      {
        crew_id: context.crew_id,
      },
      context
    );
  },

  /**
   * Export crew data
   */
  async export(format: 'json' | 'csv' = 'json', options?: { crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
      role: 'owner', // Export requires owner role
    });

    return client.export_crew_data(
      {
        crew_id: context.crew_id,
        format,
      },
      context
    );
  },

  /**
   * Execute a crew
   */
  async execute(input: string, options?: { budget?: number; crewId?: string; userId?: string }) {
    const client = getCrewAPIClient();
    const context = getWebAuthContext({
      crew_id: options?.crewId,
      user_id: options?.userId,
    });

    return client.execute_crew(
      {
        crew_id: context.crew_id,
        input,
        budget: options?.budget,
      },
      context
    );
  },

  /**
   * Get audit log
   */
  async getAuditLog(crewId?: string) {
    const client = getCrewAPIClient();
    return client.getAuditLog(crewId || 'default-crew');
  },
};

export default crewMemoryAPI;
