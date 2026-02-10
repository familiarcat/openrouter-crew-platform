/**
 * Analytics Trigger Workflow Tests
 * Verify n8n analytics automation workflows
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AnalyticsTriggerWorkflow } from '../src/workflows/analytics-trigger.workflow';

describe('AnalyticsTriggerWorkflow', () => {
  let workflow: AnalyticsTriggerWorkflow;

  beforeEach(() => {
    workflow = new AnalyticsTriggerWorkflow();
  });

  describe('Analytics Analysis Execution', () => {
    it('should execute analytics analysis workflow', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'daily' as const,
        topicCount: 5,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result).toBeDefined();
      expect(result.crewId).toBe('crew_1');
      expect(result.period).toBe('daily');
    });

    it('should analyze daily metrics', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'daily' as const,
        topicCount: 3,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result.totalMemories).toBeGreaterThan(0);
      expect(result.averageConfidence).toBeGreaterThan(0);
      expect(result.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('should generate insights', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'weekly' as const,
        topicCount: 4,
      };

      const result = await workflow.executeAnalysis(config);

      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should identify top topics', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'monthly' as const,
        topicCount: 5,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result.topTopics.length).toBeLessThanOrEqual(5);
      expect(result.topTopics.length).toBeGreaterThan(0);
    });

    it('should include timestamp', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'daily' as const,
        topicCount: 3,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle weekly analysis', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'weekly' as const,
        topicCount: 5,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result.period).toBe('weekly');
    });

    it('should handle monthly analysis', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'monthly' as const,
        topicCount: 5,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result.period).toBe('monthly');
    });

    it('should respect topic count limit', async () => {
      const config = {
        crewId: 'crew_1',
        analysisType: 'daily' as const,
        topicCount: 2,
      };

      const result = await workflow.executeAnalysis(config);

      expect(result.topTopics.length).toBeLessThanOrEqual(config.topicCount);
    });
  });

  describe('Report Sending', () => {
    it('should send analytics report', async () => {
      const result = {
        crewId: 'crew_1',
        period: 'daily' as const,
        totalMemories: 1500,
        topTopics: ['Topic1', 'Topic2'],
        averageConfidence: 0.85,
        insights: ['Insight 1'],
        timestamp: new Date().toISOString(),
      };

      const sent = await workflow.sendAnalyticsReport(result, 'slack');

      expect(sent).toBe(true);
    });

    it('should handle report sending errors', async () => {
      const result = {
        crewId: 'crew_1',
        period: 'daily' as const,
        totalMemories: 1500,
        topTopics: ['Topic1'],
        averageConfidence: 0.85,
        insights: [],
        timestamp: new Date().toISOString(),
      };

      const sent = await workflow.sendAnalyticsReport(result, '');

      expect(sent).toBe(false);
    });
  });

  describe('Trend Detection', () => {
    it('should detect trending topics', () => {
      const trends = workflow.detectTrends([]);

      expect(trends).toBeInstanceOf(Map);
      expect(trends.size).toBeGreaterThan(0);
    });

    it('should provide trend scores', () => {
      const trends = workflow.detectTrends([]);

      trends.forEach((score, topic) => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThan(0);
      });
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate recommendations', () => {
      const result = {
        crewId: 'crew_1',
        period: 'daily' as const,
        totalMemories: 1500,
        topTopics: ['Topic1', 'Topic2', 'Topic3', 'Topic4', 'Topic5', 'Topic6'],
        averageConfidence: 0.85,
        insights: [],
        timestamp: new Date().toISOString(),
      };

      const recommendations = workflow.generateRecommendations(result);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend topic consolidation for many topics', () => {
      const result = {
        crewId: 'crew_1',
        period: 'daily' as const,
        totalMemories: 1500,
        topTopics: Array(6).fill('Topic'),
        averageConfidence: 0.85,
        insights: [],
        timestamp: new Date().toISOString(),
      };

      const recommendations = workflow.generateRecommendations(result);

      expect(recommendations.some(r => r.includes('consolidat'))).toBe(true);
    });

    it('should recommend review for low confidence', () => {
      const result = {
        crewId: 'crew_1',
        period: 'daily' as const,
        totalMemories: 1500,
        topTopics: ['Topic1'],
        averageConfidence: 0.7,
        insights: [],
        timestamp: new Date().toISOString(),
      };

      const recommendations = workflow.generateRecommendations(result);

      expect(recommendations.some(r => r.includes('low-confidence'))).toBe(true);
    });
  });
});
