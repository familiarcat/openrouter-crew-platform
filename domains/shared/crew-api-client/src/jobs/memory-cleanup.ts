/**
 * Memory Cleanup Job
 * Scheduled maintenance job for memory decay and retention enforcement
 *
 * This job should run daily:
 * 1. Soft-delete memories with low confidence (<0.3)
 * 2. Hard-delete soft-deleted memories beyond recovery window
 * 3. Generate retention reports
 *
 * Can be triggered by:
 * - Cron job (daily at 2 AM)
 * - n8n scheduled workflow
 * - Manual API call
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CrewAPIClient } from '../CrewAPIClient';
import { MemoryDecayService } from '../services/memory-decay';
import { AuthContext } from '../types';

export interface CleanupJobConfig {
  /** List of crew IDs to clean up. If empty, cleans all. */
  crewIds?: string[];
  /** Dry run - don't actually delete, just report */
  dryRun?: boolean;
  /** Generate cleanup report */
  generateReport?: boolean;
  /** Maximum runtime in seconds */
  timeout?: number;
}

export interface CleanupJobResult {
  /** Status of the job */
  status: 'success' | 'partial' | 'failure';
  /** Number of memories soft-deleted (low confidence) */
  softDeletedCount: number;
  /** Number of memories hard-deleted (beyond recovery) */
  hardDeletedCount: number;
  /** Total memories processed */
  totalProcessed: number;
  /** Errors encountered */
  errors: string[];
  /** Retention reports by crew */
  reports: Record<string, any>;
  /** Timestamp of job execution */
  executedAt: string;
  /** Duration in milliseconds */
  durationMs: number;
}

export class MemoryCleanupJob {
  private supabase: SupabaseClient;
  private decayService: MemoryDecayService;
  private crewAPIClient: CrewAPIClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.decayService = new MemoryDecayService(supabase);
    this.crewAPIClient = new CrewAPIClient(supabase);
  }

  /**
   * Get all crew IDs that have memories
   */
  private async getAllCrewIds(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('crew_id');

    if (error) {
      throw new Error(`Failed to get crew IDs: ${error.message}`);
    }

    // Get unique crew IDs
    const uniqueCrewIds = new Set((data || []).map((row: any) => row.crew_id));
    return Array.from(uniqueCrewIds);
  }

  /**
   * Run the cleanup job
   */
  async run(config: CleanupJobConfig = {}): Promise<CleanupJobResult> {
    const startTime = Date.now();
    const result: CleanupJobResult = {
      status: 'success',
      softDeletedCount: 0,
      hardDeletedCount: 0,
      totalProcessed: 0,
      errors: [],
      reports: {},
      executedAt: new Date().toISOString(),
      durationMs: 0,
    };

    try {
      // Get crews to clean up
      const crewIds = config.crewIds || (await this.getAllCrewIds());

      if (crewIds.length === 0) {
        return result;
      }

      // System context for cleanup operations
      const systemContext: AuthContext = {
        user_id: 'system-cleanup',
        crew_id: 'system',
        role: 'owner',
        surface: 'n8n', // Cleanup triggered by scheduler (could be any surface)
      };

      // Process each crew
      for (const crewId of crewIds) {
        try {
          const crewContext = { ...systemContext, crew_id: crewId };

          if (config.dryRun) {
            // Dry run: just report what would be deleted
            const stats = await this.decayService.getRetentionStatistics(crewId);
            result.reports[crewId] = stats;
          } else {
            // Soft-delete low confidence memories
            const softDeleteCount = await this.decayService.softDeleteExpiredMemories(
              crewId,
              crewContext
            );
            result.softDeletedCount += softDeleteCount;

            // Hard-delete memories beyond recovery window
            const hardDeleteCount = await this.decayService.hardDeleteExpiredMemories(crewId);
            result.hardDeletedCount += hardDeleteCount;

            // Generate report if requested
            if (config.generateReport) {
              const stats = await this.decayService.getRetentionStatistics(crewId);
              result.reports[crewId] = {
                ...stats,
                softDeletedInThisRun: softDeleteCount,
                hardDeletedInThisRun: hardDeleteCount,
              };
            }
          }

          result.totalProcessed++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Crew ${crewId}: ${errorMsg}`);
          result.status = 'partial';
        }

        // Check timeout
        if (config.timeout && Date.now() - startTime > config.timeout * 1000) {
          result.errors.push(`Cleanup job timed out after ${config.timeout} seconds`);
          result.status = 'partial';
          break;
        }
      }

      // Final status
      if (result.errors.length > 0 && result.totalProcessed === 0) {
        result.status = 'failure';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.status = 'failure';
      result.errors.push(`Fatal error: ${errorMsg}`);
    } finally {
      result.durationMs = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Run cleanup for a specific crew (manual operation)
   */
  async cleanupCrew(crewId: string, dryRun = false): Promise<CleanupJobResult> {
    return this.run({
      crewIds: [crewId],
      dryRun,
      generateReport: true,
    });
  }

  /**
   * Run maintenance for all crews
   */
  async runMaintenance(): Promise<CleanupJobResult> {
    return this.run({
      generateReport: true,
      timeout: 300, // 5 minute timeout
    });
  }
}

/**
 * Export cleanup job for n8n workflow invocation
 */
export async function executeMemoryCleanup(
  supabaseUrl: string,
  supabaseKey: string,
  config: CleanupJobConfig = {}
): Promise<CleanupJobResult> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  const job = new MemoryCleanupJob(supabase);
  return job.run(config);
}
