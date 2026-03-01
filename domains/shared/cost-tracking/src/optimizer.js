import { ModelRouter } from './model-router';
import { CostCalculator } from './cost-calculator';
export class CostOptimizer {
    modelRouter;
    costCalculator;
    constructor() {
        this.modelRouter = new ModelRouter();
        this.costCalculator = new CostCalculator();
    }
    /**
     * Analyze usage events to find cost optimization opportunities
     */
    async analyzeUsage(events) {
        const suggestions = [];
        if (!events || events.length === 0) {
            return suggestions;
        }
        // 1. Analyze Model Selection Efficiency
        const modelSwitchSuggestions = await this.analyzeModelSelection(events);
        suggestions.push(...modelSwitchSuggestions);
        // 2. Analyze Batching Opportunities (placeholder logic for now)
        const batchingSuggestions = this.analyzeBatching(events);
        suggestions.push(...batchingSuggestions);
        // 3. Analyze Caching Opportunities (placeholder logic for now)
        const cachingSuggestions = this.analyzeCaching(events);
        suggestions.push(...cachingSuggestions);
        return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }
    /**
     * Identify opportunities to switch to cheaper models
     */
    async analyzeModelSelection(events) {
        const suggestions = [];
        // Group events by model and task type (if available in metadata, otherwise treat as generic)
        const groupedEvents = this.groupEventsByModel(events);
        for (const [modelId, modelEvents] of Object.entries(groupedEvents)) {
            // Skip if model is already the cheapest viable option (e.g., Gemini Flash)
            if (modelId.includes('gemini-flash'))
                continue;
            const avgInputTokens = this.calculateAverage(modelEvents.map(e => e.input_tokens || 0));
            const avgOutputTokens = this.calculateAverage(modelEvents.map(e => e.output_tokens || 0));
            const totalCost = modelEvents.reduce((sum, e) => sum + (e.estimated_cost_usd || 0), 0);
            // Heuristic: If average tokens are low, task might be simple enough for a cheaper model
            // This is a simplification; real logic would need task complexity metadata
            let suggestedModelId = null;
            // If using a premium model for small tasks
            if (this.isPremiumModel(modelId) && avgInputTokens < 1000 && avgOutputTokens < 500) {
                // Suggest Standard tier
                suggestedModelId = 'anthropic/claude-3.5-sonnet';
            }
            // If using a standard model for very small tasks
            if (this.isStandardModel(modelId) && avgInputTokens < 500 && avgOutputTokens < 200) {
                // Suggest Budget tier
                suggestedModelId = 'google/gemini-flash-1.5';
            }
            if (suggestedModelId && suggestedModelId !== modelId) {
                // Calculate potential savings
                const projectedCost = await this.calculateProjectedCost(suggestedModelId, modelEvents);
                const savings = totalCost - projectedCost;
                if (savings > 0.01) { // Only suggest if savings are non-trivial
                    suggestions.push({
                        id: `switch-${modelId}-to-${suggestedModelId}-${Date.now()}`,
                        type: 'model_switch',
                        description: `Switch from ${modelId} to ${suggestedModelId} for smaller tasks.`,
                        potentialSavings: savings,
                        impact: savings > 1.0 ? 'high' : 'medium',
                        action: `Update default model configuration to ${suggestedModelId}`,
                        context: {
                            currentModel: modelId,
                            suggestedModel: suggestedModelId,
                            averageTokens: avgInputTokens + avgOutputTokens
                        }
                    });
                }
            }
        }
        return suggestions;
    }
    /**
     * Identify opportunities to batch small requests
     */
    analyzeBatching(events) {
        const suggestions = [];
        // Group events by project and task type to find batching candidates
        // We look for high frequency of small requests within short time windows
        const projectEvents = this.groupEventsByProject(events);
        for (const [projectId, pEvents] of Object.entries(projectEvents)) {
            // Filter for small requests (e.g., < 500 tokens total)
            const smallRequests = pEvents.filter(e => (e.total_tokens || 0) < 500);
            if (smallRequests.length < 5)
                continue;
            // Sort by timestamp
            smallRequests.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            // Check for bursts: multiple requests within 1 minute
            let burstCount = 0;
            let burstStart = new Date(smallRequests[0].created_at).getTime();
            for (let i = 1; i < smallRequests.length; i++) {
                const current = new Date(smallRequests[i].created_at).getTime();
                if (current - burstStart < 60000) { // 1 minute window
                    burstCount++;
                }
                else {
                    // Reset window
                    burstStart = current;
                    burstCount = 0;
                }
                if (burstCount >= 5) {
                    // Found a burst of 5+ small requests in 1 minute
                    suggestions.push({
                        id: `batch-project-${projectId}-${Date.now()}`,
                        type: 'batching',
                        description: `High frequency of small requests detected for project ${projectId}. Consider batching these into fewer API calls.`,
                        potentialSavings: 0.0, // Hard to estimate exact $ savings without knowing provider overhead, but efficiency gain is high
                        impact: 'medium',
                        action: `Implement request batching for project ${projectId}`,
                        context: {
                            taskType: 'small-requests',
                            averageTokens: this.calculateAverage(smallRequests.map(e => e.total_tokens || 0))
                        }
                    });
                    break; // One suggestion per project is enough
                }
            }
        }
        return suggestions;
    }
    /**
     * Identify opportunities to cache repeated similar queries
     */
    analyzeCaching(events) {
        const suggestions = [];
        // Group events by project to find caching candidates within each project
        const projectEvents = this.groupEventsByProject(events);
        for (const [projectId, pEvents] of Object.entries(projectEvents)) {
            // We need request content to detect duplicates, but LLMUsageEvent might not have it.
            // If we don't have content, we can look for high frequency of identical token counts as a proxy.
            // A more robust signature would use a hash of the prompt content if available.
            const signatureCounts = {};
            for (const event of pEvents) {
                const signature = `${event.model}-${event.crew_member}-${event.input_tokens}-${event.output_tokens}`;
                if (!signatureCounts[signature]) {
                    signatureCounts[signature] = { count: 0, cost: 0, totalTokens: event.total_tokens || 0, firstEventId: event.id };
                }
                signatureCounts[signature].count++;
                signatureCounts[signature].cost += (event.estimated_cost_usd || 0);
            }
            // Find signatures with high repetition
            for (const [signature, stats] of Object.entries(signatureCounts)) {
                if (stats.count >= 3) { // If we have 3+ identical requests
                    // Caching could save (N-1) * cost per request
                    const potentialSavings = stats.cost * ((stats.count - 1) / stats.count);
                    if (potentialSavings > 0.05) { // Only suggest if savings are meaningful
                        suggestions.push({
                            id: `cache-${stats.firstEventId}`,
                            type: 'caching',
                            description: `Detected ${stats.count} identical requests in project ${projectId}. Implementing caching could save costs.`,
                            potentialSavings: potentialSavings,
                            impact: potentialSavings > 1.0 ? 'high' : 'medium',
                            action: `Enable semantic caching for project ${projectId}`,
                            context: {
                                taskType: 'repeated-queries',
                                averageTokens: stats.totalTokens
                            }
                        });
                    }
                }
            }
        }
        return suggestions;
    }
    groupEventsByModel(events) {
        return events.reduce((acc, event) => {
            const model = event.model || 'unknown';
            if (!acc[model]) {
                acc[model] = [];
            }
            acc[model].push(event);
            return acc;
        }, {});
    }
    groupEventsByProject(events) {
        return events.reduce((acc, event) => {
            const projectId = event.project_id || 'unknown';
            if (!acc[projectId]) {
                acc[projectId] = [];
            }
            acc[projectId].push(event);
            return acc;
        }, {});
    }
    calculateAverage(numbers) {
        if (numbers.length === 0)
            return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    isPremiumModel(modelId) {
        return modelId.includes('opus') || modelId.includes('gpt-4-turbo');
    }
    isStandardModel(modelId) {
        return modelId.includes('sonnet') || modelId.includes('gpt-4o');
    }
    async calculateProjectedCost(modelId, events) {
        let total = 0;
        for (const event of events) {
            const cost = await this.costCalculator.calculateActualCost(modelId, event.input_tokens || 0, event.output_tokens || 0);
            total += cost;
        }
        return total;
    }
    /**
     * Aggregate total costs from a list of events
     */
    calculateTotalCost(events) {
        return events.reduce((sum, e) => sum + (e.estimated_cost_usd || 0), 0);
    }
    /**
     * Breakdown costs by project
     */
    costByProject(events) {
        return events.reduce((acc, e) => {
            const projectId = e.project_id || 'unknown';
            acc[projectId] = (acc[projectId] || 0) + (e.estimated_cost_usd || 0);
            return acc;
        }, {});
    }
    /**
     * Breakdown costs by crew member
     */
    costByCrewMember(events) {
        return events.reduce((acc, e) => {
            const crew = e.crew_member || 'unknown';
            acc[crew] = (acc[crew] || 0) + (e.estimated_cost_usd || 0);
            return acc;
        }, {});
    }
}
export const costOptimizer = new CostOptimizer();
//# sourceMappingURL=optimizer.js.map