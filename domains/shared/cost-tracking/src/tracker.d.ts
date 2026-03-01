/**
 * Usage Tracker (Subflow #7: Usage Logger)
 *
 * Tracks and persists LLM usage events
 * Based on openrouter-ai-milestone pattern
 */
import { UsageEvent } from './types';
import { LLMUsageEvent } from '@openrouter-crew/shared-schemas';
export interface TrackerConfig {
    supabaseUrl: string;
    supabaseKey: string;
    tableName?: string;
}
export declare class UsageTracker {
    private config;
    private events;
    constructor(config: TrackerConfig);
    /**
     * Track a usage event
     */
    track(event: Omit<UsageEvent, 'timestamp'>): Promise<void>;
    /**
     * Persist event to Supabase
     */
    private persistToSupabase;
    /**
     * Fetch recent events from Supabase
     */
    fetchEvents(limit?: number): Promise<LLMUsageEvent[]>;
    /**
     * Get recent events (from in-memory cache)
     */
    getRecentEvents(limit?: number): UsageEvent[];
    /**
     * Get events for a project
     */
    getProjectEvents(projectId: string): UsageEvent[];
    /**
     * Clear in-memory cache
     */
    clearCache(): void;
}
//# sourceMappingURL=tracker.d.ts.map