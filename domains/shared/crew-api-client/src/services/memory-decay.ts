/**
 * Memory Decay Service
 * Manages memory lifecycle: confidence decay, retention policies, expiration
 *
 * Memory Lifecycle:
 * 1. Created with confidence_level = 0.95 (high confidence)
 * 2. Decays over time based on retention_tier
 * 3. Auto-expires when confidence < 0.3 or expires_at reached
 * 4. Soft-deleted (recoverable for 30 days)
 * 5. Hard-deleted after recovery window
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Memory, RetentionTier, AuthContext } from '../types';

export interface MemoryDecayPolicy {
  /** Daily confidence decay rate (0-1) */
  dailyDecayRate: number;
  /** Number of days before auto-expiration */
  retentionDays: number;
  /** Minimum confidence to keep active */
  minConfidence: number;
  /** Soft-delete recovery window in days */
  recoveryWindowDays: number;
}

export interface DecayMetrics {
  /** Memory ID */
  id: string;
  /** Current confidence level */
  currentConfidence: number;
  /** Days since creation */
  daysSinceCreated: number;
  /** Estimated days until expiration */
  daysUntilExpiration: number;
  /** Whether memory is expired */
  isExpired: boolean;
  /** Expiration reason */
  expirationReason?: string;
}

/**
 * Decay policies by retention tier
 */
export const DEFAULT_DECAY_POLICIES: Record<RetentionTier, MemoryDecayPolicy> = {
  eternal: {
    dailyDecayRate: 0.0001, // Very slow decay (~1 year to reach 0.3)
    retentionDays: 3650, // 10 years
    minConfidence: 0.1,
    recoveryWindowDays: 90,
  },
  standard: {
    dailyDecayRate: 0.001, // Moderate decay (~3 months to reach 0.3)
    retentionDays: 90,
    minConfidence: 0.3,
    recoveryWindowDays: 30,
  },
  temporary: {
    dailyDecayRate: 0.01, // Fast decay (~30 days to reach 0.3)
    retentionDays: 30,
    minConfidence: 0.3,
    recoveryWindowDays: 7,
  },
  session: {
    dailyDecayRate: 0.1, // Very fast decay (~3 days to reach 0.3)
    retentionDays: 3,
    minConfidence: 0.2,
    recoveryWindowDays: 1,
  },
};

export class MemoryDecayService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Calculate confidence decay over time
   * Formula: confidence = initial * (1 - dailyDecayRate)^daysPassed
   */
  private calculateConfidenceDecay(
    initialConfidence: number,
    daysPassed: number,
    dailyDecayRate: number
  ): number {
    // Exponential decay
    const decayedConfidence = initialConfidence * Math.pow(1 - dailyDecayRate, daysPassed);
    // Floor at 0
    return Math.max(0, decayedConfidence);
  }

  /**
   * Get decay policy for retention tier
   */
  getDecayPolicy(tier: RetentionTier): MemoryDecayPolicy {
    return DEFAULT_DECAY_POLICIES[tier];
  }

  /**
   * Calculate memory expiration date
   */
  calculateExpirationDate(createdAt: string, tier: RetentionTier): Date {
    const policy = this.getDecayPolicy(tier);
    const created = new Date(createdAt);
    const expiresAt = new Date(created);
    expiresAt.setDate(expiresAt.getDate() + policy.retentionDays);
    return expiresAt;
  }

  /**
   * Calculate recovery deadline for soft-deleted memory
   */
  calculateRecoveryDeadline(deletedAt: string, tier: RetentionTier): Date {
    const policy = this.getDecayPolicy(tier);
    const deleted = new Date(deletedAt);
    const deadline = new Date(deleted);
    deadline.setDate(deadline.getDate() + policy.recoveryWindowDays);
    return deadline;
  }

  /**
   * Calculate current confidence for a memory
   */
  calculateCurrentConfidence(memory: Memory): number {
    const created = new Date(memory.created_at);
    const now = new Date();
    const daysPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    const policy = this.getDecayPolicy(memory.retention_tier);
    return this.calculateConfidenceDecay(
      memory.confidence_level,
      daysPassed,
      policy.dailyDecayRate
    );
  }

  /**
   * Get decay metrics for a memory
   */
  getDecayMetrics(memory: Memory): DecayMetrics {
    const policy = this.getDecayPolicy(memory.retention_tier);
    const created = new Date(memory.created_at);
    const now = new Date();
    const daysPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    const currentConfidence = this.calculateCurrentConfidence(memory);

    // Calculate days until expiration (when confidence reaches minConfidence)
    let daysUntilExpiration: number;
    if (currentConfidence <= policy.minConfidence) {
      daysUntilExpiration = 0;
    } else {
      // Solve: minConfidence = current * (1 - rate)^x
      // x = log(minConfidence / current) / log(1 - rate)
      const daysToThreshold =
        Math.log(policy.minConfidence / currentConfidence) / Math.log(1 - policy.dailyDecayRate);
      daysUntilExpiration = Math.max(0, daysToThreshold);
    }

    const isExpired =
      currentConfidence <= policy.minConfidence ||
      daysPassed > policy.retentionDays ||
      (memory.deleted_at != null && // Soft-deleted beyond recovery window
        new Date().getTime() - new Date(memory.deleted_at).getTime() >
          policy.recoveryWindowDays * 24 * 60 * 60 * 1000);

    return {
      id: memory.id,
      currentConfidence,
      daysSinceCreated: Math.round(daysPassed),
      daysUntilExpiration: Math.round(daysUntilExpiration),
      isExpired,
      expirationReason: this.getExpirationReason(memory, currentConfidence, daysPassed, policy),
    };
  }

  /**
   * Get reason for memory expiration
   */
  private getExpirationReason(
    memory: Memory,
    currentConfidence: number,
    daysPassed: number,
    policy: MemoryDecayPolicy
  ): string | undefined {
    if (currentConfidence <= policy.minConfidence) {
      return `Confidence decay below threshold (${currentConfidence.toFixed(2)} < ${policy.minConfidence})`;
    }
    if (daysPassed > policy.retentionDays) {
      return `Retention period exceeded (${Math.round(daysPassed)} days > ${policy.retentionDays} days)`;
    }
    if (memory.deleted_at) {
      const daysSinceDeleted =
        (new Date().getTime() - new Date(memory.deleted_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDeleted > policy.recoveryWindowDays) {
        return `Soft-delete recovery window expired (${Math.round(daysSinceDeleted)} days > ${policy.recoveryWindowDays} days)`;
      }
    }
    return undefined;
  }

  /**
   * Find memories expiring soon
   */
  async findExpiringMemories(
    crewId: string,
    daysUntilExpiration: number = 7
  ): Promise<Memory[]> {
    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', crewId)
      .is('deleted_at', null); // Only non-deleted memories

    if (error) {
      throw new Error(`Failed to find expiring memories: ${error.message}`);
    }

    const memories = (data || []) as Memory[];
    const expiringMemories: Memory[] = [];

    for (const memory of memories) {
      const metrics = this.getDecayMetrics(memory);
      if (
        metrics.daysUntilExpiration > 0 &&
        metrics.daysUntilExpiration <= daysUntilExpiration
      ) {
        expiringMemories.push(memory);
      }
    }

    return expiringMemories;
  }

  /**
   * Find memories ready for hard deletion
   */
  async findMemoriesReadyForHardDelete(crewId: string): Promise<Memory[]> {
    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', crewId)
      .not('deleted_at', 'is', null); // Only soft-deleted memories

    if (error) {
      throw new Error(`Failed to find memories for hard delete: ${error.message}`);
    }

    const memories = (data || []) as Memory[];
    const readyForDelete: Memory[] = [];

    for (const memory of memories) {
      const policy = this.getDecayPolicy(memory.retention_tier);
      if (memory.deleted_at) {
        const daysSinceDeleted =
          (new Date().getTime() - new Date(memory.deleted_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDeleted > policy.recoveryWindowDays) {
          readyForDelete.push(memory);
        }
      }
    }

    return readyForDelete;
  }

  /**
   * Find memories with low confidence (ready to prune)
   */
  async findLowConfidenceMemories(
    crewId: string,
    confidenceThreshold: number = 0.3
  ): Promise<Memory[]> {
    const { data, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', crewId)
      .is('deleted_at', null)
      .lt('confidence_level', confidenceThreshold);

    if (error) {
      throw new Error(`Failed to find low confidence memories: ${error.message}`);
    }

    return (data || []) as Memory[];
  }

  /**
   * Soft-delete expired memories
   * Called by scheduled maintenance job
   */
  async softDeleteExpiredMemories(crewId: string, context: AuthContext): Promise<number> {
    const { data: expiredMemories, error: queryError } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', crewId)
      .is('deleted_at', null)
      .lte('confidence_level', 0.3);

    if (queryError) {
      throw new Error(`Failed to query expired memories: ${queryError.message}`);
    }

    const memories = (expiredMemories || []) as Memory[];
    let deletedCount = 0;

    for (const memory of memories) {
      const { error: deleteError } = await this.supabase
        .from('crew_memory_vectors')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', memory.id);

      if (!deleteError) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Hard-delete memories beyond recovery window
   * Called by scheduled maintenance job (runs daily)
   */
  async hardDeleteExpiredMemories(crewId: string): Promise<number> {
    const readyForDelete = await this.findMemoriesReadyForHardDelete(crewId);
    let deletedCount = 0;

    for (const memory of readyForDelete) {
      const { error } = await this.supabase
        .from('crew_memory_vectors')
        .delete()
        .eq('id', memory.id);

      if (!error) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get retention statistics for a crew
   */
  async getRetentionStatistics(crewId: string): Promise<{
    totalMemories: number;
    activeMemories: number;
    softDeletedMemories: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    averageConfidence: number;
    memoryByTier: Record<RetentionTier, number>;
  }> {
    const { data: allMemories, error } = await this.supabase
      .from('crew_memory_vectors')
      .select('*')
      .eq('crew_id', crewId);

    if (error) {
      throw new Error(`Failed to get retention statistics: ${error.message}`);
    }

    const memories = (allMemories || []) as Memory[];
    const activeMemories = memories.filter((m) => !m.deleted_at);
    const softDeletedMemories = memories.filter((m) => m.deleted_at);

    let expiringIn7Days = 0;
    let expiringIn30Days = 0;
    let totalConfidence = 0;

    for (const memory of activeMemories) {
      const metrics = this.getDecayMetrics(memory);
      if (metrics.daysUntilExpiration > 0 && metrics.daysUntilExpiration <= 7) {
        expiringIn7Days++;
      }
      if (metrics.daysUntilExpiration > 0 && metrics.daysUntilExpiration <= 30) {
        expiringIn30Days++;
      }
      totalConfidence += metrics.currentConfidence;
    }

    const memoryByTier: Record<RetentionTier, number> = {
      eternal: 0,
      standard: 0,
      temporary: 0,
      session: 0,
    };

    for (const memory of activeMemories) {
      memoryByTier[memory.retention_tier]++;
    }

    return {
      totalMemories: memories.length,
      activeMemories: activeMemories.length,
      softDeletedMemories: softDeletedMemories.length,
      expiringIn7Days,
      expiringIn30Days,
      averageConfidence: activeMemories.length > 0 ? totalConfidence / activeMemories.length : 0,
      memoryByTier,
    };
  }
}
