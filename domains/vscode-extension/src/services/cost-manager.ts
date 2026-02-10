/**
 * Cost Manager Service
 * Manages cost tracking, budgets, and alerts in VSCode extension
 */

import * as vscode from 'vscode';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

interface CostStatus {
  crewId: string;
  spent: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface BudgetAlert {
  crewId: string;
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
}

export class CostManagerService {
  private costService: CostOptimizationService;
  private budgetAlerts: Map<string, BudgetAlert> = new Map();

  constructor() {
    this.costService = new CostOptimizationService();
  }

  /**
   * Get current cost status for a crew
   */
  async getCostStatus(crewId: string): Promise<CostStatus | null> {
    try {
      const budget = this.costService.getBudget(crewId);
      if (!budget) {
        return null;
      }

      const percentUsed = budget.percentUsed || 0;
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (percentUsed >= 90) status = 'critical';
      else if (percentUsed >= 75) status = 'warning';

      return {
        crewId,
        spent: budget.spent || 0,
        limit: budget.limit || 0,
        remaining: budget.remaining || 0,
        percentUsed,
        status,
      };
    } catch (error) {
      console.error('Failed to get cost status:', error);
      return null;
    }
  }

  /**
   * Set budget for a crew
   */
  async setBudget(crewId: string, amount: number, period: 'daily' | 'weekly' | 'monthly'): Promise<boolean> {
    try {
      this.costService.setBudget(crewId, amount, period);
      return true;
    } catch (error) {
      console.error('Failed to set budget:', error);
      return false;
    }
  }

  /**
   * Update spent amount for a crew
   */
  async updateSpent(crewId: string, amount: number): Promise<boolean> {
    try {
      this.costService.updateBudget(crewId, amount);
      return true;
    } catch (error) {
      console.error('Failed to update spent amount:', error);
      return false;
    }
  }

  /**
   * Set budget alert threshold
   */
  setAlertThreshold(crewId: string, threshold: number, channels: string[] = []): void {
    this.budgetAlerts.set(crewId, {
      crewId,
      threshold,
      enabled: true,
      notificationChannels: channels,
    });
  }

  /**
   * Check if cost status triggers an alert
   */
  shouldAlert(crewId: string, percentUsed: number): boolean {
    const alert = this.budgetAlerts.get(crewId);
    if (!alert || !alert.enabled) return false;
    return percentUsed >= alert.threshold;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(crewId: string): string[] {
    const recommendations: string[] = [];
    const status = this.costService.getOptimizationMetrics(crewId);

    if (status.cacheHitRate < 0.5) {
      recommendations.push('Increase cache TTL for better hit rates');
    }

    if (status.batchSavings < 0.2) {
      recommendations.push('Enable batch processing for cost reduction');
    }

    if (status.costReductionRatio < 0.3) {
      recommendations.push('Consider compression to reduce storage costs');
    }

    return recommendations;
  }

  /**
   * Get cost breakdown
   */
  getCostBreakdown(crewId: string): Record<string, number> {
    try {
      return this.costService.getCostBreakdown(crewId);
    } catch (error) {
      console.error('Failed to get cost breakdown:', error);
      return {};
    }
  }

  /**
   * Format cost as currency string
   */
  formatCost(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Get status icon based on cost status
   */
  getStatusIcon(status: 'healthy' | 'warning' | 'critical'): string {
    switch (status) {
      case 'healthy':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'critical':
        return '🔴';
    }
  }
}
