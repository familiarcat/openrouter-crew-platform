/**
 * Decay Manager
 * Applies confidence decay over time based on retention tier
 * Exponential decay: confidence = confidence * (1 - decayRate * days)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { RetentionTier, MemoryServiceError } from './types';

/**
 * Decay rates per retention tier (% per day)
 * eternal: 0.01% / day (essentially permanent)
 * standard: 0.1% / day
 * temporary: 1% / day
 * session: 10% / day
 */
const DECAY_RATES: Record<RetentionTier, number> = {
  eternal: 0.0001,
  standard: 0.001,
  temporary: 0.01,
  session: 0.1,
};

/**
 * Confidence thresholds for deletion
 * Below this threshold, memories can be hard-deleted
 */
const CONFIDENCE_DELETE_THRESHOLD = 0.01;

export class DecayManager {
  constructor(private supabase: SupabaseClient<any>) {}

  /**
   * Apply decay to all memories for a crew member
   * Returns count of updated nodes
   */
  async applyDecay(crewId?: string): Promise<number> {
    const now = new Date();
    let query = this.supabase.from('memory_nodes').select('id, confidence_weight, retention_tier, last_activated_at').is('deleted_at', null);

    if (crewId) {
      query = query.eq('crew_id', crewId);
    }

    const { data: nodes, error } = await query;

    if (error) {
      throw new MemoryServiceError('FETCH_NODES_FAILED', 'Failed to fetch nodes for decay', error);
    }

    if (!nodes || nodes.length === 0) {
      return 0;
    }

    let updatedCount = 0;

    for (const node of nodes) {
      const lastActivated = node.last_activated_at
        ? new Date(node.last_activated_at)
        : new Date(0);
      const daysSinceActivation = (now.getTime() - lastActivated.getTime()) / (1000 * 60 * 60 * 24);

      const decayRate = DECAY_RATES[node.retention_tier as RetentionTier] || DECAY_RATES.standard;
      const newConfidence = Math.max(0, node.confidence_weight * (1 - decayRate * daysSinceActivation));

      // Soft-delete if confidence falls below threshold AND retention tier is temporary/session
      if (newConfidence < CONFIDENCE_DELETE_THRESHOLD && ['temporary', 'session'].includes(node.retention_tier)) {
        await this.softDeleteNode(node.id);
        updatedCount++;
      } else if (newConfidence !== node.confidence_weight) {
        // Update confidence
        const { error: updateError } = await this.supabase
          .from('memory_nodes')
          .update({
            confidence_weight: newConfidence,
            updated_at: new Date().toISOString(),
          })
          .eq('id', node.id);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  /**
   * Hard-delete nodes that have been soft-deleted for longer than the recovery window
   * Recovery windows:
   * - eternal: never deleted
   * - standard: 90 days
   * - temporary: 30 days
   * - session: 7 days
   */
  async hardDeleteExpired(): Promise<number> {
    const now = new Date();
    const deletionTargets: string[] = [];

    // Query soft-deleted nodes
    const { data: nodes } = await this.supabase
      .from('memory_nodes')
      .select('id, retention_tier, deleted_at')
      .not('deleted_at', 'is', null);

    if (!nodes) {
      return 0;
    }

    for (const node of nodes) {
      const recoveryDays = this.getRecoveryWindow(node.retention_tier as RetentionTier);
      const deletedAt = new Date(node.deleted_at);
      const daysSinceDelete = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDelete > recoveryDays) {
        deletionTargets.push(node.id);
      }
    }

    if (deletionTargets.length === 0) {
      return 0;
    }

    const { error } = await this.supabase
      .from('memory_nodes')
      .delete()
      .in('id', deletionTargets);

    if (error) {
      throw new MemoryServiceError('HARD_DELETE_FAILED', 'Failed to hard-delete expired nodes', error);
    }

    return deletionTargets.length;
  }

  /**
   * Restore a soft-deleted node (within recovery window)
   */
  async restoreNode(nodeId: string): Promise<void> {
    const { error } = await this.supabase
      .from('memory_nodes')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', nodeId);

    if (error) {
      throw new MemoryServiceError('RESTORE_FAILED', 'Failed to restore node', error);
    }
  }

  /**
   * Soft-delete a node
   */
  private async softDeleteNode(nodeId: string): Promise<void> {
    const { error } = await this.supabase
      .from('memory_nodes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId);

    if (error) {
      console.warn(`Failed to soft-delete node ${nodeId}:`, error);
    }
  }

  /**
   * Get recovery window in days for a retention tier
   */
  private getRecoveryWindow(tier: RetentionTier): number {
    const windows: Record<RetentionTier, number> = {
      eternal: 365 * 100, // 100 years - essentially forever
      standard: 90,       // 90 days
      temporary: 30,      // 30 days
      session: 7,         // 7 days
    };
    return windows[tier] || windows.standard;
  }
}
