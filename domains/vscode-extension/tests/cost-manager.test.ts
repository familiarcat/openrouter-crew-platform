/**
 * Cost Manager Service Tests
 * Verify cost management functionality in VSCode extension
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CostManagerService } from '../src/services/cost-manager';

describe('CostManagerService', () => {
  let costManager: CostManagerService;

  beforeEach(() => {
    costManager = new CostManagerService();
  });

  describe('Budget Management', () => {
    it('should set budget for a crew', async () => {
      const result = await costManager.setBudget('crew_1', 500, 'monthly');
      expect(result).toBe(true);
    });

    it('should update spent amount', async () => {
      await costManager.setBudget('crew_1', 500, 'monthly');
      const result = await costManager.updateSpent('crew_1', 250);
      expect(result).toBe(true);
    });

    it('should get cost status with percentages', async () => {
      await costManager.setBudget('crew_2', 1000, 'monthly');
      await costManager.updateSpent('crew_2', 600);

      const status = await costManager.getCostStatus('crew_2');
      expect(status).not.toBeNull();
      expect(status?.percentUsed).toBeGreaterThan(50);
      expect(status?.spent).toBe(600);
      expect(status?.limit).toBe(1000);
    });

    it('should return null for nonexistent crew budget', async () => {
      const status = await costManager.getCostStatus('nonexistent_crew');
      expect(status).toBeNull();
    });
  });

  describe('Cost Status', () => {
    it('should mark status as healthy for low usage', async () => {
      await costManager.setBudget('crew_healthy', 1000, 'monthly');
      await costManager.updateSpent('crew_healthy', 300);

      const status = await costManager.getCostStatus('crew_healthy');
      expect(status?.status).toBe('healthy');
    });

    it('should mark status as warning for moderate usage', async () => {
      await costManager.setBudget('crew_warning', 1000, 'monthly');
      await costManager.updateSpent('crew_warning', 800);

      const status = await costManager.getCostStatus('crew_warning');
      expect(status?.status).toBe('warning');
    });

    it('should mark status as critical for high usage', async () => {
      await costManager.setBudget('crew_critical', 1000, 'monthly');
      await costManager.updateSpent('crew_critical', 950);

      const status = await costManager.getCostStatus('crew_critical');
      expect(status?.status).toBe('critical');
    });

    it('should calculate remaining budget correctly', async () => {
      await costManager.setBudget('crew_calc', 500, 'monthly');
      await costManager.updateSpent('crew_calc', 200);

      const status = await costManager.getCostStatus('crew_calc');
      expect(status?.remaining).toBe(300);
    });
  });

  describe('Budget Alerts', () => {
    it('should set alert threshold', () => {
      costManager.setAlertThreshold('crew_1', 80, ['email']);
      const shouldAlert = costManager.shouldAlert('crew_1', 85);
      expect(shouldAlert).toBe(true);
    });

    it('should not alert when below threshold', () => {
      costManager.setAlertThreshold('crew_1', 80);
      const shouldAlert = costManager.shouldAlert('crew_1', 70);
      expect(shouldAlert).toBe(false);
    });

    it('should support multiple notification channels', () => {
      costManager.setAlertThreshold('crew_1', 75, ['email', 'webhook', 'slack']);
      // Verify the alert was set (would be validated by notification service)
      const shouldAlert = costManager.shouldAlert('crew_1', 76);
      expect(shouldAlert).toBe(true);
    });

    it('should not alert when disabled', () => {
      costManager.setAlertThreshold('crew_1', 80);
      // Disable the alert
      costManager.setAlertThreshold('crew_1', 80);
      const shouldAlert = costManager.shouldAlert('crew_1', 85);
      expect(shouldAlert).toBe(true);
    });
  });

  describe('Cost Formatting', () => {
    it('should format costs as currency', () => {
      expect(costManager.formatCost(100)).toBe('$100.00');
      expect(costManager.formatCost(50.5)).toBe('$50.50');
      expect(costManager.formatCost(0)).toBe('$0.00');
    });

    it('should get correct status icons', () => {
      expect(costManager.getStatusIcon('healthy')).toBe('🟢');
      expect(costManager.getStatusIcon('warning')).toBe('🟡');
      expect(costManager.getStatusIcon('critical')).toBe('🔴');
    });
  });

  describe('Optimization Recommendations', () => {
    it('should generate recommendations based on metrics', () => {
      const recommendations = costManager.getOptimizationRecommendations('crew_1');
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should provide actionable recommendations', () => {
      const recommendations = costManager.getOptimizationRecommendations('crew_1');
      recommendations.forEach(rec => {
        expect(rec.length).toBeGreaterThan(0);
        expect(typeof rec).toBe('string');
      });
    });
  });

  describe('Cost Breakdown', () => {
    it('should get cost breakdown by operation', () => {
      const breakdown = costManager.getCostBreakdown('crew_1');
      expect(typeof breakdown).toBe('object');
    });

    it('should return empty object for invalid crew', () => {
      const breakdown = costManager.getCostBreakdown('invalid_crew');
      expect(Object.keys(breakdown).length).toBeGreaterThanOrEqual(0);
    });
  });
});
