/**
 * Audit Logging Service
 * All operations are logged to immutable audit trail
 */

import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuditLogEntry, Intent, Surface, AuthContext } from '../types';

export class AuditService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Log an operation to the audit trail
   * This creates an immutable record of what happened
   */
  async logOperation(
    context: AuthContext,
    intent: Intent,
    action: string,
    result: 'success' | 'failure',
    metadata: {
      cost: number;
      duration_ms: number;
      memory_ids?: string[];
      error?: string;
      [key: string]: unknown;
    }
  ): Promise<AuditLogEntry> {
    const { cost, duration_ms, memory_ids, error: metadataError, ...extraMetadata } = metadata;
    const entry: AuditLogEntry = {
      id: uuidv4(),
      user_id: context.user_id,
      crew_id: context.crew_id,
      surface: context.surface,
      intent,
      action,
      result,
      error: metadataError as string | undefined,
      metadata: {
        cost,
        duration_ms,
        memory_ids,
        ...extraMetadata,
      },
      created_at: new Date().toISOString(),
    };

    // Insert into audit log (immutable trigger prevents modification)
    const { error } = await this.supabase
      .from('crew_memory_access_log')
      .insert({
        id: entry.id,
        user_id: entry.user_id,
        crew_id: entry.crew_id,
        surface: entry.surface,
        intent: JSON.stringify(entry.intent),
        action: entry.action,
        result: entry.result,
        error: entry.error,
        cost_estimate: metadata.cost,
        duration_ms: metadata.duration_ms,
        memory_ids: metadata.memory_ids,
        created_at: entry.created_at,
      });

    if (error) {
      console.error('Failed to log operation:', error);
      // Don't throw - logging should not fail operations
      // But do log the error
    }

    return entry;
  }

  /**
   * Get audit log entries for a crew
   */
  async getAuditLog(
    crew_id: string,
    options?: {
      start_date?: string;
      end_date?: string;
      action?: string;
      surface?: Surface;
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    let query = this.supabase
      .from('crew_memory_access_log')
      .select('*')
      .eq('crew_id', crew_id);

    if (options?.start_date) {
      query = query.gte('created_at', options.start_date);
    }

    if (options?.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.surface) {
      query = query.eq('surface', options.surface);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve audit log: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      crew_id: row.crew_id,
      surface: row.surface,
      intent: typeof row.intent === 'string' ? JSON.parse(row.intent) : row.intent,
      action: row.action,
      result: row.result,
      error: row.error,
      metadata: {
        cost: row.cost_estimate,
        duration_ms: row.duration_ms,
        memory_ids: row.memory_ids,
      },
      created_at: row.created_at,
    }));
  }

  /**
   * Generate audit report for a time period
   */
  async generateReport(
    crew_id: string,
    start_date: string,
    end_date: string
  ): Promise<{
    total_operations: number;
    successful: number;
    failed: number;
    total_cost: number;
    by_surface: Record<Surface, number>;
    by_action: Record<string, number>;
  }> {
    const entries = await this.getAuditLog(crew_id, {
      start_date,
      end_date,
    });

    const report = {
      total_operations: entries.length,
      successful: entries.filter((e) => e.result === 'success').length,
      failed: entries.filter((e) => e.result === 'failure').length,
      total_cost: entries.reduce((sum, e) => sum + e.metadata.cost, 0),
      by_surface: {} as Record<Surface, number>,
      by_action: {} as Record<string, number>,
    };

    // Count by surface
    entries.forEach((entry) => {
      report.by_surface[entry.surface] = (report.by_surface[entry.surface] || 0) + 1;
    });

    // Count by action
    entries.forEach((entry) => {
      report.by_action[entry.action] = (report.by_action[entry.action] || 0) + 1;
    });

    return report;
  }
}
