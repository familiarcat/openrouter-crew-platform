/**
 * Admin Service
 * Administrative operations (export, import, prune, audit reporting)
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthContext } from '../types';
export declare class AdminService {
    private supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Export crew data
     */
    exportCrewData(crew_id: string, format: 'json' | 'csv', context: AuthContext): Promise<string>;
    /**
     * Import crew data
     */
    importCrewData(file: Buffer | string, crew_id: string, merge: boolean, context: AuthContext): Promise<{
        imported: number;
        errors: string[];
    }>;
    /**
     * Prune expired memories
     */
    pruneExpiredMemories(crew_id: string, dry_run?: boolean, context?: AuthContext): Promise<{
        pruned: number;
        reason: string;
    }>;
    /**
     * Generate audit report
     */
    generateAuditReport(crew_id: string, start_date: string, end_date: string, context: AuthContext): Promise<{
        crew_id: string;
        period: {
            start: string;
            end: string;
        };
        total_operations: number;
        by_operation: Record<string, number>;
        total_cost: number;
        summary: string;
    }>;
}
//# sourceMappingURL=admin.d.ts.map