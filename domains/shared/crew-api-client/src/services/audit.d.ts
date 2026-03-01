/**
 * Audit Logging Service
 * All operations are logged to immutable audit trail
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AuditLogEntry, Intent, Surface, AuthContext } from '../types';
export declare class AuditService {
    private supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Log an operation to the audit trail
     * This creates an immutable record of what happened
     */
    logOperation(context: AuthContext, intent: Intent, action: string, result: 'success' | 'failure', metadata: {
        cost: number;
        duration_ms: number;
        memory_ids?: string[];
        error?: string;
        [key: string]: unknown;
    }): Promise<AuditLogEntry>;
    /**
     * Get audit log entries for a crew
     */
    getAuditLog(crew_id: string, options?: {
        start_date?: string;
        end_date?: string;
        action?: string;
        surface?: Surface;
        limit?: number;
    }): Promise<AuditLogEntry[]>;
    /**
     * Generate audit report for a time period
     */
    generateReport(crew_id: string, start_date: string, end_date: string): Promise<{
        total_operations: number;
        successful: number;
        failed: number;
        total_cost: number;
        by_surface: Record<Surface, number>;
        by_action: Record<string, number>;
    }>;
}
//# sourceMappingURL=audit.d.ts.map