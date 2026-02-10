/**
 * Cost Management Workflow Tests
 * Verify n8n cost automation workflows
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CostManagementWorkflow } from '../src/workflows/cost-management.workflow';

describe('CostManagementWorkflow', () => {
  let workflow: CostManagementWorkflow;

  beforeEach(() => {
    workflow = new CostManagementWorkflow();
  });

  describe('Cost Check Execution', () => {
    it('should execute cost check workflow', async () => {
      const config = {
        crewId: 'crew_1',
        checkInterval: 60,
        alertThreshold: 80,
      };

      const result = await workflow.executeCostCheck(config);

      expect(result).toBeDefined();
      expect(result.crewId).toBe('crew_1');
      expect(typeof result.currentCost).toBe('number');
      expect(typeof result.percentUsed).toBe('number');
    });

    it('should detect when alert threshold is exceeded', async () => {
      const config = {
        crewId: 'crew_high_usage',
        checkInterval: 60,
        alertThreshold: 75,
      };

      const result = await workflow.executeCostCheck(config);

      expect(result.shouldAlert).toBe(typeof result.shouldAlert === 'boolean');
    });

    it('should provide recommendations', async () => {
      const config = {
        crewId: 'crew_1',
        checkInterval: 60,
        alertThreshold: 80,
      };

      const result = await workflow.executeCostCheck(config);

      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should include timestamp in result', async () => {
      const config = {
        crewId: 'crew_1',
        checkInterval: 60,
        alertThreshold: 80,
      };

      const result = await workflow.executeCostCheck(config);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle missing budget gracefully', async () => {
      const config = {
        crewId: 'nonexistent_crew',
        checkInterval: 60,
        alertThreshold: 80,
      };

      const result = await workflow.executeCostCheck(config);

      expect(result.crewId).toBe('nonexistent_crew');
      expect(result.currentCost).toBe(0);
      expect(result.shouldAlert).toBe(false);
    });
  });

  describe('Cost Alert Triggering', () => {
    it('should trigger alert when threshold exceeded', async () => {
      const result = {
        crewId: 'crew_1',
        currentCost: 850,
        budget: 1000,
        percentUsed: 85,
        shouldAlert: true,
        recommendations: [],
        timestamp: new Date().toISOString(),
      };

      const alerted = await workflow.triggerCostAlert(result);

      expect(alerted).toBe(true);
    });

    it('should not trigger alert when below threshold', async () => {
      const result = {
        crewId: 'crew_1',
        currentCost: 500,
        budget: 1000,
        percentUsed: 50,
        shouldAlert: false,
        recommendations: [],
        timestamp: new Date().toISOString(),
      };

      const alerted = await workflow.triggerCostAlert(result);

      expect(alerted).toBe(false);
    });
  });

  describe('Optimization Application', () => {
    it('should apply optimizations', async () => {
      const actions = await workflow.applyOptimizations('crew_1');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should include compression optimization', async () => {
      const actions = await workflow.applyOptimizations('crew_1');

      expect(actions).toContain('compression_enabled');
    });

    it('should include cache optimization', async () => {
      const actions = await workflow.applyOptimizations('crew_1');

      expect(actions).toContain('cache_optimized');
    });

    it('should include batch processing optimization', async () => {
      const actions = await workflow.applyOptimizations('crew_1');

      expect(actions).toContain('batch_processing_enabled');
    });
  });

  describe('Report Generation', () => {
    it('should generate cost report', () => {
      const report = workflow.generateCostReport('crew_1');

      expect(report).toBeDefined();
      expect(report.crewId).toBe('crew_1');
      expect(report.date).toBeDefined();
      expect(report.budget).toBeDefined();
      expect(report.spent).toBeDefined();
    });

    it('should include breakdown in report', () => {
      const report = workflow.generateCostReport('crew_1');

      expect(report.breakdown).toBeDefined();
      expect(typeof report.breakdown).toBe('object');
    });

    it('should include recommendations in report', () => {
      const report = workflow.generateCostReport('crew_1');

      expect(report.recommendations).toBeDefined();
    });
  });
});
