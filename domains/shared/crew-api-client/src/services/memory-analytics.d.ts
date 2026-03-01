/**
 * Memory Analytics Service
 * Tracks access patterns, analyzes topics, and provides insights
 */
import { Memory, MemoryType } from '../types';
export interface AccessPattern {
    memoryId: string;
    accessCount: number;
    lastAccessed: Date;
    firstAccessed: Date;
    accessFrequency: number;
    accessTrend: 'increasing' | 'decreasing' | 'stable';
}
export interface TopicAnalysis {
    topic: string;
    frequency: number;
    relatedMemories: string[];
    avgConfidence: number;
    trend: 'emerging' | 'stable' | 'declining';
}
export interface ConfidenceDecay {
    memoryId: string;
    initialConfidence: number;
    currentConfidence: number;
    decayRate: number;
    daysToZero: number;
}
export interface AnalyticsInsight {
    type: 'opportunity' | 'warning' | 'info';
    title: string;
    description: string;
    affected: string[];
    recommendation: string;
}
export interface MemoryAnalytics {
    crewId: string;
    totalMemories: number;
    accessPatterns: AccessPattern[];
    topTopics: TopicAnalysis[];
    confidenceDecays: ConfidenceDecay[];
    insights: AnalyticsInsight[];
    typeDistribution: Record<MemoryType, number>;
    retentionMetrics: {
        eternalCount: number;
        standardCount: number;
        temporaryCount: number;
        sessionCount: number;
    };
}
export declare class MemoryAnalyticsService {
    private accessHistory;
    private topicIndex;
    private insights;
    /**
     * Record an access to a memory
     */
    recordAccess(memoryId: string, accessDate?: Date): void;
    /**
    * Extract topics from memory content using keyword analysis
    */
    private extractTopics;
    /**
     * Index memory topics for trend analysis
     */
    indexMemoryTopics(memory: Memory): void;
    /**
     * Get access pattern for a memory
     */
    getAccessPattern(memoryId: string, baseMemory?: Memory): AccessPattern | undefined;
    /**
     * Analyze topic trends
     */
    analyzeTopicTrends(memories: Memory[]): TopicAnalysis[];
    /**
     * Calculate confidence decay over time
     */
    calculateConfidenceDecay(memory: Memory): ConfidenceDecay;
    /**
     * Generate insights from analytics
     */
    generateInsights(memories: Memory[]): AnalyticsInsight[];
    /**
     * Analyze memory type distribution
     */
    private analyzeTypeDistribution;
    /**
     * Analyze retention tier distribution
     */
    private analyzeRetentionDistribution;
    /**
     * Generate complete analytics report
     */
    generateAnalytics(crewId: string, memories: Memory[]): MemoryAnalytics;
    /**
     * Get memory recommendation score
     */
    getRecommendationScore(memory: Memory): number;
    /**
     * Get top recommended memories
     */
    getTopRecommendations(memories: Memory[], limit?: number): Array<{
        memory: Memory;
        recommendationScore: number;
    }>;
    /**
     * Get insights
     */
    getInsights(): AnalyticsInsight[];
    /**
     * Clear analytics data
     */
    clearData(): void;
}
//# sourceMappingURL=memory-analytics.d.ts.map