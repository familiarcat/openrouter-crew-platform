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
export declare const DEFAULT_DECAY_POLICIES: Record<RetentionTier, MemoryDecayPolicy>;
export declare class MemoryDecayService {
    private supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Calculate confidence decay over time
     * Formula: confidence = initial * (1 - dailyDecayRate)^daysPassed
     */
    private calculateConfidenceDecay;
    /**
     * Get decay policy for retention tier
     */
    getDecayPolicy(tier: RetentionTier): MemoryDecayPolicy;
    /**
     * Calculate memory expiration date
     */
    calculateExpirationDate(createdAt: string, tier: RetentionTier): Date;
    /**
     * Calculate recovery deadline for soft-deleted memory
     */
    calculateRecoveryDeadline(deletedAt: string, tier: RetentionTier): Date;
    /**
     * Calculate current confidence for a memory
     */
    calculateCurrentConfidence(memory: Memory): number;
    /**
     * Get decay metrics for a memory
     */
    getDecayMetrics(memory: Memory): DecayMetrics;
    /**
     * Get reason for memory expiration
     */
    private getExpirationReason;
    /**
     * Find memories expiring soon
     */
    findExpiringMemories(crewId: string, daysUntilExpiration?: number): Promise<Memory[]>;
    /**
     * Find memories ready for hard deletion
     */
    findMemoriesReadyForHardDelete(crewId: string): Promise<Memory[]>;
    /**
     * Find memories with low confidence (ready to prune)
     */
    findLowConfidenceMemories(crewId: string, confidenceThreshold?: number): Promise<Memory[]>;
    /**
     * Soft-delete expired memories
     * Called by scheduled maintenance job
     */
    softDeleteExpiredMemories(crewId: string, context: AuthContext): Promise<number>;
    /**
     * Hard-delete memories beyond recovery window
     * Called by scheduled maintenance job (runs daily)
     */
    hardDeleteExpiredMemories(crewId: string): Promise<number>;
    /**
     * Get retention statistics for a crew
     */
    getRetentionStatistics(crewId: string): Promise<{
        totalMemories: number;
        activeMemories: number;
        softDeletedMemories: number;
        expiringIn7Days: number;
        expiringIn30Days: number;
        averageConfidence: number;
        memoryByTier: Record<RetentionTier, number>;
    }>;
}
//# sourceMappingURL=memory-decay.d.ts.map