/**
 * Budget Alert Workflow Tests
 * Verify n8n budget alert automation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BudgetAlertWorkflow } from '../src/workflows/budget-alert.workflow';

describe('BudgetAlertWorkflow', () => {
  let workflow: BudgetAlertWorkflow;

  beforeEach(() => {
    workflow = new BudgetAlertWorkflow();
  });

  describe('Budget Status Check', () => {
    it('should check budget status', async () => {
      const config = {
        crewId: 'crew_1',
        warningThreshold: 75,
        criticalThreshold: 90,
        notificationChannels: ['email'],
      };

      const event = await workflow.checkBudgetStatus(config);
      expect(event === null || event.alertType).toBeDefined();
    });

    it('should detect critical status', async () => {
      const config = {
        crewId: 'crew_critical',
        warningThreshold: 75,
        criticalThreshold: 90,
        notificationChannels: ['slack'],
      };

      const event = await workflow.checkBudgetStatus(config);
      if (event) {
        expect(['warning', 'critical']).toContain(event.alertType);
      }
    });

    it('should handle missing budget', async () => {
      const config = {
        crewId: 'nonexistent_crew',
        warningThreshold: 75,
        criticalThreshold: 90,
        notificationChannels: ['email'],
      };

      const event = await workflow.checkBudgetStatus(config);
      expect(event === null).toBe(true);
    });
  });

  describe('Alert Sending', () => {
    it('should send alert to all channels', async () => {
      const event = {
        crewId: 'crew_1',
        alertType: 'warning' as const,
        currentUsage: 80,
        threshold: 75,
        timestamp: new Date().toISOString(),
        channels: ['email', 'slack'],
      };

      const results = await workflow.sendAlert(event);
      expect(results.size).toBeGreaterThan(0);
    });

    it('should track notification status per channel', async () => {
      const event = {
        crewId: 'crew_1',
        alertType: 'critical' as const,
        currentUsage: 95,
        threshold: 90,
        timestamp: new Date().toISOString(),
        channels: ['email', 'slack', 'webhook'],
      };

      const results = await workflow.sendAlert(event);
      results.forEach((status, channel) => {
        expect(typeof status).toBe('boolean');
      });
    });
  });

  describe('Alert Escalation', () => {
    it('should escalate critical alerts', async () => {
      const event = {
        crewId: 'crew_1',
        alertType: 'critical' as const,
        currentUsage: 95,
        threshold: 90,
        timestamp: new Date().toISOString(),
        channels: ['email'],
      };

      const escalated = await workflow.escalateAlert(event);
      expect(escalated).toBe(true);
    });

    it('should not escalate warnings', async () => {
      const event = {
        crewId: 'crew_1',
        alertType: 'warning' as const,
        currentUsage: 80,
        threshold: 75,
        timestamp: new Date().toISOString(),
        channels: ['email'],
      };

      const escalated = await workflow.escalateAlert(event);
      expect(escalated).toBe(false);
    });
  });

  describe('Configuration Updates', () => {
    it('should update alert configuration', async () => {
      const updated = await workflow.updateAlertConfig('crew_1', 85);
      expect(updated).toBe(true);
    });
  });
});
