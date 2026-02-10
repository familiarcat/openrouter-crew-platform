/**
 * n8n Workflow Integration Tests
 * Verify interactions between different n8n workflows
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostManagementWorkflow } from '../src/workflows/cost-management.workflow';
import { AnalyticsTriggerWorkflow } from '../src/workflows/analytics-trigger.workflow';
import { MemoryArchivalWorkflow } from '../src/workflows/memory-archival.workflow';
import { BudgetAlertWorkflow } from '../src/workflows/budget-alert.workflow';

describe('n8n Workflow Integration', () => {
  let costWorkflow: CostManagementWorkflow;
  let analyticsWorkflow: AnalyticsTriggerWorkflow;
  let archivalWorkflow: MemoryArchivalWorkflow;
  let alertWorkflow: BudgetAlertWorkflow;

  beforeEach(() => {
    costWorkflow = new CostManagementWorkflow();
    analyticsWorkflow = new AnalyticsTriggerWorkflow();
    archivalWorkflow = new MemoryArchivalWorkflow();
    alertWorkflow = new BudgetAlertWorkflow();
  });

  describe('Complete Workflow Chain', () => {
    it('should execute full cost management pipeline', async () => {
      // Step 1: Check cost
      const costResult = await costWorkflow.executeCostCheck({
        crewId: 'crew_1',
        checkInterval: 60,
        alertThreshold: 80,
      });

      expect(costResult).toBeDefined();
      expect(costResult.crewId).toBe('crew_1');

      // Step 2: Check if alert needed
      const alertEvent = await alertWorkflow.checkBudgetStatus({
        crewId: 'crew_1',
        warningThreshold: 75,
        criticalThreshold: 90,
        notificationChannels: ['email'],
      });

      if (alertEvent) {
        // Step 3: Send alert
        const alertResults = await alertWorkflow.sendAlert(alertEvent);
        expect(alertResults.size).toBeGreaterThan(0);
      }
    });

    it('should integrate cost and analytics workflows', async () => {
      // Get cost data
      const costConfig = {
        crewId: 'crew_1',
        checkInterval: 60,
        alertThreshold: 80,
      };
      const costResult = await costWorkflow.executeCostCheck(costConfig);

      // Get analytics data
      const analyticsConfig = {
        crewId: 'crew_1',
        analysisType: 'daily' as const,
        topicCount: 5,
      };
      const analyticsResult = await analyticsWorkflow.executeAnalysis(analyticsConfig);

      // Both should complete successfully
      expect(costResult).toBeDefined();
      expect(analyticsResult).toBeDefined();
      expect(costResult.crewId).toBe(analyticsResult.crewId);
    });

    it('should chain analytics to archival workflow', async () => {
      // Generate analytics
      const analyticsResult = await analyticsWorkflow.executeAnalysis({
        crewId: 'crew_1',
        analysisType: 'monthly' as const,
        topicCount: 5,
      });

      expect(analyticsResult.insights.length).toBeGreaterThan(0);

      // Then archive based on recommendations
      const archivalResult = await archivalWorkflow.executeArchival('crew_1', 90);
      expect(archivalResult.archived).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling Across Workflows', () => {
    it('should handle failures gracefully in pipeline', async () => {
      // Try with invalid crew
      const costResult = await costWorkflow.executeCostCheck({
        crewId: 'invalid_crew_id',
        checkInterval: 60,
        alertThreshold: 80,
      });

      // Should still return result with defaults
      expect(costResult.crewId).toBe('invalid_crew_id');
      expect(costResult.percentUsed).toBe(0);
    });

    it('should isolate failures between workflows', async () => {
      // Cost workflow with missing budget
      const costResult = await costWorkflow.executeCostCheck({
        crewId: 'nonexistent',
        checkInterval: 60,
        alertThreshold: 80,
      });

      // Analytics should still work
      const analyticsResult = await analyticsWorkflow.executeAnalysis({
        crewId: 'crew_1',
        analysisType: 'daily' as const,
        topicCount: 3,
      });

      expect(analyticsResult).toBeDefined();
    });
  });

  describe('Data Flow Validation', () => {
    it('should maintain data consistency across workflows', async () => {
      const crewId = 'crew_test';

      // All workflows should reference same crew
      const costResult = await costWorkflow.executeCostCheck({
        crewId,
        checkInterval: 60,
        alertThreshold: 80,
      });

      const analyticsResult = await analyticsWorkflow.executeAnalysis({
        crewId,
        analysisType: 'daily' as const,
        topicCount: 3,
      });

      const archivalResult = await archivalWorkflow.executeArchival(crewId, 90);

      // All should process same crew
      expect(costResult.crewId).toBe(crewId);
      expect(analyticsResult.crewId).toBe(crewId);
    });
  });

  describe('Workflow Scheduling Scenarios', () => {
    it('should handle daily cost checks', async () => {
      const result = await costWorkflow.executeCostCheck({
        crewId: 'crew_1',
        checkInterval: 1440, // daily in minutes
        alertThreshold: 80,
      });

      expect(result.timestamp).toBeDefined();
    });

    it('should handle weekly analytics', async () => {
      const result = await analyticsWorkflow.executeAnalysis({
        crewId: 'crew_1',
        analysisType: 'weekly' as const,
        topicCount: 5,
      });

      expect(result.period).toBe('weekly');
    });

    it('should handle monthly archival', async () => {
      const result = await archivalWorkflow.executeArchival('crew_1', 30);
      expect(result.archived).toBeGreaterThanOrEqual(0);
    });
  });
});
