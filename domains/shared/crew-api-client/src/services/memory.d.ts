/**
 * Memory Service
 * Advanced memory operations (search, retrieval policies, forecasting)
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { Memory, AuthContext, SearchMemoriesParams, ComplianceStatusParams, ExpirationForecastParams } from '../types';
export declare class MemoryService {
    private supabase;
    constructor(supabase: SupabaseClient);
    /**
     * Search memories using semantic similarity or text search
     */
    searchMemories(params: SearchMemoriesParams, context: AuthContext): Promise<Memory[]>;
    /**
     * Explain why a memory was retrieved
     */
    explainRetrieval(memory_id: string, query: string, context: AuthContext): Promise<{
        memory_id: string;
        relevance_score: number;
        match_reason: string;
        confidence: number;
    }>;
    /**
     * Get compliance status for a crew
     */
    getComplianceStatus(params: ComplianceStatusParams, context: AuthContext): Promise<{
        crew_id: string;
        period: string;
        total_memories: number;
        deleted_memories: number;
        recovery_window_days: number;
        gdpr_compliant: boolean;
    }>;
    /**
     * Forecast memory expiration
     */
    getExpirationForecast(params: ExpirationForecastParams, context: AuthContext): Promise<{
        crew_id: string;
        expiring_soon: number;
        expiring_30days: number;
        expiring_90days: number;
    }>;
    /**
     * Apply retrieval policy to memories
     */
    applyRetrievalPolicy(memories: Memory[], policy: 'default' | 'task-specific' | 'budget-constrained' | 'quality-focused'): Memory[];
    /**
     * Get recent memories for a crew
     */
    getRecentMemories(crewId: string, limit?: number): Promise<Memory[]>;
    /**
     * Calculate relevance between content and query
     */
    private calculateRelevance;
}
//# sourceMappingURL=memory.d.ts.map