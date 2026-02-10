/**
 * n8n Budget Alert Automation
 * Automated budget monitoring and alert notifications
 */

import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

interface AlertConfig {
  crewId: string;
  warningThreshold: number;
  criticalThreshold: number;
  notificationChannels: string[];
}

interface AlertEvent {
  crewId: string;
  alertType: 'warning' | 'critical';
  currentUsage: number;
  threshold: number;
  timestamp: string;
  channels: string[];
}

export class BudgetAlertWorkflow {
  private costService: CostOptimizationService;

  constructor() {
    this.costService = new CostOptimizationService();
  }

  async checkBudgetStatus(config: AlertConfig): Promise<AlertEvent | null> {
    const budget = this.costService.getBudget(config.crewId);

    if (!budget) {
      return null;
    }

    const percentUsed = budget.percentUsed || 0;

    if (percentUsed >= config.criticalThreshold) {
      return {
        crewId: config.crewId,
        alertType: 'critical',
        currentUsage: percentUsed,
        threshold: config.criticalThreshold,
        timestamp: new Date().toISOString(),
        channels: config.notificationChannels,
      };
    }

    if (percentUsed >= config.warningThreshold) {
      return {
        crewId: config.crewId,
        alertType: 'warning',
        currentUsage: percentUsed,
        threshold: config.warningThreshold,
        timestamp: new Date().toISOString(),
        channels: config.notificationChannels,
      };
    }

    return null;
  }

  async sendAlert(event: AlertEvent): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const channel of event.channels) {
      results.set(channel, await this.notifyChannel(channel, event));
    }

    return results;
  }

  private async notifyChannel(channel: string, event: AlertEvent): Promise<boolean> {
    try {
      // In real workflow, this would send to actual channels
      const message =
        event.alertType === 'critical'
          ? `🔴 CRITICAL: ${event.crewId} at ${event.currentUsage}% budget`
          : `🟡 WARNING: ${event.crewId} at ${event.currentUsage}% budget`;

      console.log(`[${channel}] ${message}`);
      return true;
    } catch (error) {
      console.error(`Failed to notify ${channel}:`, error);
      return false;
    }
  }

  async escalateAlert(event: AlertEvent): Promise<boolean> {
    if (event.alertType !== 'critical') {
      return false;
    }

    // In real workflow, escalate to managers/admins
    console.log(`🚨 ESCALATING: Critical budget alert for ${event.crewId}`);
    return true;
  }

  async updateAlertConfig(crewId: string, newThreshold: number): Promise<boolean> {
    try {
      // Would persist new threshold configuration
      return true;
    } catch (error) {
      console.error('Failed to update alert config:', error);
      return false;
    }
  }
}
