/**
 * Usage Tracker (Subflow #7: Usage Logger)
 *
 * Tracks and persists LLM usage events
 * Based on openrouter-ai-milestone pattern
 */
export class UsageTracker {
    config;
    events = [];
    constructor(config) {
        this.config = {
            tableName: 'llm_usage_events',
            ...config
        };
    }
    /**
     * Track a usage event
     */
    async track(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date()
        };
        // Add to in-memory cache
        this.events.push(fullEvent);
        // Persist to Supabase
        try {
            await this.persistToSupabase(fullEvent);
        }
        catch (error) {
            console.error('Failed to persist usage event:', error);
            // Don't throw - we have it in memory
        }
    }
    /**
     * Persist event to Supabase
     */
    async persistToSupabase(event) {
        const response = await fetch(`${this.config.supabaseUrl}/rest/v1/${this.config.tableName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: this.config.supabaseKey,
                Authorization: `Bearer ${this.config.supabaseKey}`,
                Prefer: 'return=minimal'
            },
            body: JSON.stringify({
                project_id: event.projectId,
                workflow_id: event.workflowId,
                crew_member: event.crewMember,
                provider: event.provider,
                model: event.model,
                input_tokens: event.inputTokens,
                output_tokens: event.outputTokens,
                total_tokens: event.totalTokens,
                estimated_cost_usd: event.estimatedCost,
                actual_cost_usd: event.actualCost,
                routing_mode: event.routingMode,
                request_type: event.requestType,
                workflow: event.crewMember // For backward compatibility
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to persist: ${response.statusText}`);
        }
    }
    /**
     * Fetch recent events from Supabase
     */
    async fetchEvents(limit = 1000) {
        const response = await fetch(`${this.config.supabaseUrl}/rest/v1/${this.config.tableName}?select=*&order=created_at.desc&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.config.supabaseKey,
                'Authorization': `Bearer ${this.config.supabaseKey}`,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch usage events: ${response.statusText}`);
        }
        const data = await response.json();
        // The data from Supabase is in snake_case, which matches the LLMUsageEvent type.
        // The optimizer expects this format.
        const events = data;
        // Note: We are not updating the in-memory `this.events` cache here because it has a
        // different type (camelCase `UsageEvent`). This fetch is a direct-to-consumer method
        // for analysis, which correctly uses the snake_case schema from the database.
        return events;
    }
    /**
     * Get recent events (from in-memory cache)
     */
    getRecentEvents(limit = 100) {
        return this.events.slice(-limit);
    }
    /**
     * Get events for a project
     */
    getProjectEvents(projectId) {
        return this.events.filter(e => e.projectId === projectId);
    }
    /**
     * Clear in-memory cache
     */
    clearCache() {
        this.events = [];
    }
}
//# sourceMappingURL=tracker.js.map