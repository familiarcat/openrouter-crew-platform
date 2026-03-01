/**
 * Memory Analytics Service
 * Tracks access patterns, analyzes topics, and provides insights
 */
export class MemoryAnalyticsService {
    accessHistory = new Map();
    topicIndex = new Map();
    insights = [];
    /**
     * Record an access to a memory
     */
    recordAccess(memoryId, accessDate = new Date()) {
        if (!this.accessHistory.has(memoryId)) {
            this.accessHistory.set(memoryId, []);
        }
        const history = this.accessHistory.get(memoryId);
        history.push(accessDate);
    }
    /**
    * Extract topics from memory content using keyword analysis
    */
    extractTopics(content) {
        // Simple keyword extraction - in production would use NLP
        const keywords = [
            'performance', 'optimization', 'bug', 'feature', 'architecture',
            'security', 'deployment', 'database', 'api', 'testing',
            'authentication', 'cache', 'memory', 'storage', 'monitoring',
            'analytics', 'integration', 'framework', 'library', 'pattern'
        ];
        const found = [];
        const lowerContent = content.toLowerCase();
        for (const keyword of keywords) {
            if (lowerContent.includes(keyword)) {
                found.push(keyword);
            }
        }
        return found.length > 0 ? found : ['general'];
    }
    /**
     * Index memory topics for trend analysis
     */
    indexMemoryTopics(memory) {
        const topics = this.extractTopics(memory.content);
        for (const topic of topics) {
            if (!this.topicIndex.has(topic)) {
                this.topicIndex.set(topic, []);
            }
            const memoryList = this.topicIndex.get(topic);
            if (!memoryList.includes(memory.id)) {
                memoryList.push(memory.id);
            }
        }
    }
    /**
     * Get access pattern for a memory
     */
    getAccessPattern(memoryId, baseMemory) {
        const history = this.accessHistory.get(memoryId);
        if (!history || history.length === 0) {
            if (baseMemory) {
                return {
                    memoryId,
                    accessCount: baseMemory.access_count || 0,
                    lastAccessed: new Date(baseMemory.last_accessed),
                    firstAccessed: new Date(baseMemory.created_at),
                    accessFrequency: 0,
                    accessTrend: 'stable',
                };
            }
            return undefined;
        }
        const sorted = [...history].sort((a, b) => a.getTime() - b.getTime());
        const firstAccessed = sorted[0];
        const lastAccessed = sorted[sorted.length - 1];
        const daysDiff = (lastAccessed.getTime() - firstAccessed.getTime()) / (1000 * 60 * 60 * 24);
        const accessFrequency = daysDiff > 0 ? history.length / daysDiff : history.length;
        // Determine trend based on recent access pattern
        let accessTrend = 'stable';
        if (history.length >= 3) {
            const mid = Math.floor(history.length / 2);
            const recentAccesses = history.length - mid;
            const olderAccesses = mid;
            if (recentAccesses > olderAccesses * 1.2) {
                accessTrend = 'increasing';
            }
            else if (recentAccesses < olderAccesses * 0.8) {
                accessTrend = 'decreasing';
            }
        }
        return {
            memoryId,
            accessCount: history.length,
            lastAccessed,
            firstAccessed,
            accessFrequency,
            accessTrend,
        };
    }
    /**
     * Analyze topic trends
     */
    analyzeTopicTrends(memories) {
        const topicStats = new Map();
        for (const memory of memories) {
            const topics = this.extractTopics(memory.content);
            for (const topic of topics) {
                if (!topicStats.has(topic)) {
                    topicStats.set(topic, { frequency: 0, memoryIds: [], confidences: [] });
                }
                const stats = topicStats.get(topic);
                stats.frequency += 1;
                stats.memoryIds.push(memory.id);
                stats.confidences.push(memory.confidence_level);
            }
        }
        const topics = [];
        for (const [topicName, stats] of topicStats.entries()) {
            const avgConfidence = stats.confidences.reduce((a, b) => a + b, 0) / stats.confidences.length;
            // Simple trend detection - in production would use time-series analysis
            const trend = stats.frequency >= 5 ? 'stable' : stats.frequency >= 3 ? 'emerging' : 'declining';
            topics.push({
                topic: topicName,
                frequency: stats.frequency,
                relatedMemories: stats.memoryIds,
                avgConfidence,
                trend,
            });
        }
        return topics.sort((a, b) => b.frequency - a.frequency);
    }
    /**
     * Calculate confidence decay over time
     */
    calculateConfidenceDecay(memory) {
        const createdDate = new Date(memory.created_at);
        const daysSinceCreation = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        // Confidence decays at ~0.05 per day if not accessed
        const baseDecayRate = 0.05;
        const accessBonus = Math.min(memory.access_count * 0.01, 0.3); // Access reduces decay
        const decayRate = Math.max(baseDecayRate - accessBonus, 0.01);
        const expectedDecay = daysSinceCreation * decayRate;
        const currentConfidence = Math.max(memory.confidence_level - expectedDecay, 0);
        const daysToZero = currentConfidence > 0 ? currentConfidence / decayRate : 0;
        return {
            memoryId: memory.id,
            initialConfidence: memory.confidence_level,
            currentConfidence,
            decayRate,
            daysToZero,
        };
    }
    /**
     * Generate insights from analytics
     */
    generateInsights(memories) {
        const newInsights = [];
        const decayingMemories = [];
        const lowConfidenceMemories = [];
        const unaccessed = [];
        for (const memory of memories) {
            const decay = this.calculateConfidenceDecay(memory);
            if (decay.currentConfidence < 0.5 && memory.confidence_level >= 0.8) {
                decayingMemories.push(memory.id);
            }
            if (memory.confidence_level < 0.4) {
                lowConfidenceMemories.push(memory.id);
            }
            const daysSinceAccess = (new Date().getTime() - new Date(memory.last_accessed).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceAccess > 30 && memory.access_count < 2) {
                unaccessed.push(memory.id);
            }
        }
        if (decayingMemories.length > 0) {
            newInsights.push({
                type: 'warning',
                title: 'Confidence Decay Detected',
                description: `${decayingMemories.length} memories have decayed significantly since creation`,
                affected: decayingMemories,
                recommendation: 'Review and refresh high-value memories to maintain accuracy',
            });
        }
        if (lowConfidenceMemories.length > 0) {
            newInsights.push({
                type: 'info',
                title: 'Low Confidence Memories',
                description: `${lowConfidenceMemories.length} memories have low confidence levels`,
                affected: lowConfidenceMemories,
                recommendation: 'Consider verifying or consolidating low-confidence memories',
            });
        }
        if (unaccessed.length > 0) {
            newInsights.push({
                type: 'opportunity',
                title: 'Stale Memories Identified',
                description: `${unaccessed.length} memories haven't been accessed recently`,
                affected: unaccessed,
                recommendation: 'Archive or consolidate rarely-accessed memories to improve system efficiency',
            });
        }
        const typeDistribution = this.analyzeTypeDistribution(memories);
        if (Object.values(typeDistribution).some(v => v === 0)) {
            newInsights.push({
                type: 'info',
                title: 'Unbalanced Memory Types',
                description: 'Some memory types are underutilized',
                affected: [],
                recommendation: 'Consider creating memories of missing types to improve coverage',
            });
        }
        if (newInsights.length === 0) {
            newInsights.push({
                type: 'info',
                title: 'Healthy Memory System',
                description: 'No critical issues detected',
                affected: [],
                recommendation: 'Continue monitoring for optimal performance',
            });
        }
        this.insights = newInsights;
        return newInsights;
    }
    /**
     * Analyze memory type distribution
     */
    analyzeTypeDistribution(memories) {
        const types = ['story', 'insight', 'pattern', 'lesson', 'best-practice'];
        const distribution = {
            story: 0,
            insight: 0,
            pattern: 0,
            lesson: 0,
            'best-practice': 0,
        };
        for (const memory of memories) {
            distribution[memory.type] += 1;
        }
        return distribution;
    }
    /**
     * Analyze retention tier distribution
     */
    analyzeRetentionDistribution(memories) {
        return {
            eternalCount: memories.filter(m => m.retention_tier === 'eternal').length,
            standardCount: memories.filter(m => m.retention_tier === 'standard').length,
            temporaryCount: memories.filter(m => m.retention_tier === 'temporary').length,
            sessionCount: memories.filter(m => m.retention_tier === 'session').length,
        };
    }
    /**
     * Generate complete analytics report
     */
    generateAnalytics(crewId, memories) {
        const accessPatterns = memories
            .map(m => this.getAccessPattern(m.id, m))
            .filter((p) => p !== undefined);
        const topTopics = this.analyzeTopicTrends(memories).slice(0, 10);
        const confidenceDecays = memories.map(m => this.calculateConfidenceDecay(m));
        const insights = this.generateInsights(memories);
        const typeDistribution = this.analyzeTypeDistribution(memories);
        const retentionMetrics = this.analyzeRetentionDistribution(memories);
        return {
            crewId,
            totalMemories: memories.length,
            accessPatterns,
            topTopics,
            confidenceDecays,
            insights,
            typeDistribution,
            retentionMetrics,
        };
    }
    /**
     * Get memory recommendation score
     */
    getRecommendationScore(memory) {
        let score = 0;
        // Base confidence score
        score += memory.confidence_level * 40;
        // Access frequency bonus
        score += Math.min(memory.access_count, 10) * 5;
        // Retention tier bonus
        const tierBonus = {
            'eternal': 20,
            'standard': 10,
            'temporary': 5,
            'session': 0,
        };
        score += tierBonus[memory.retention_tier] || 0;
        // Recent access bonus
        const daysSinceAccess = (new Date().getTime() - new Date(memory.last_accessed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceAccess < 7) {
            score += 15;
        }
        else if (daysSinceAccess < 30) {
            score += 10;
        }
        // Tag complexity bonus
        score += Math.min(memory.tags.length, 5) * 2;
        return Math.min(score, 100);
    }
    /**
     * Get top recommended memories
     */
    getTopRecommendations(memories, limit = 10) {
        return memories
            .map(m => ({
            memory: m,
            recommendationScore: this.getRecommendationScore(m),
        }))
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);
    }
    /**
     * Get insights
     */
    getInsights() {
        return [...this.insights];
    }
    /**
     * Clear analytics data
     */
    clearData() {
        this.accessHistory.clear();
        this.topicIndex.clear();
        this.insights = [];
    }
}
//# sourceMappingURL=memory-analytics.js.map