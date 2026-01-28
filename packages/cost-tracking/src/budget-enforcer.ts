/**
 * Budget Enforcer (Subflow #5: Budget Enforcer)
 *
 * Blocks requests that exceed budget limits
 * Based on openrouter-ai-milestone pattern
 */

import { BudgetConfig } from './types';

export interface BudgetStatus {
  withinBudget: boolean;
  dailySpent: number;
  dailyLimit: number | null;
  monthlySpent: number;
  monthlyLimit: number | null;
  projectSpent: number;
  projectLimit: number | null;
}

export class BudgetEnforcer {
  private budgets: Map<string, BudgetConfig> = new Map();
  private dailySpending: Map<string, number> = new Map();
  private monthlySpending: Map<string, number> = new Map();
  private projectSpending: Map<string, number> = new Map();

  /**
   * Set budget for a project
   */
  setBudget(projectId: string, config: BudgetConfig): void {
    this.budgets.set(projectId, config);
  }

  /**
   * Check if request is within budget
   */
  checkBudget(projectId: string, estimatedCost: number): BudgetStatus {
    const config = this.budgets.get(projectId);
    if (!config) {
      // No budget configured, allow by default
      return {
        withinBudget: true,
        dailySpent: 0,
        dailyLimit: null,
        monthlySpent: 0,
        monthlyLimit: null,
        projectSpent: 0,
        projectLimit: null
      };
    }

    const dailySpent = this.dailySpending.get(projectId) || 0;
    const monthlySpent = this.monthlySpending.get(projectId) || 0;
    const projectSpent = this.projectSpending.get(projectId) || 0;

    let withinBudget = true;

    // Check per-request limit
    if (config.perRequestLimit && estimatedCost > config.perRequestLimit) {
      withinBudget = false;
    }

    // Check daily limit
    if (config.dailyLimit && dailySpent + estimatedCost > config.dailyLimit) {
      withinBudget = false;
    }

    // Check monthly limit
    if (config.monthlyLimit && monthlySpent + estimatedCost > config.monthlyLimit) {
      withinBudget = false;
    }

    // Check project limit
    if (config.projectLimit && projectSpent + estimatedCost > config.projectLimit) {
      withinBudget = false;
    }

    return {
      withinBudget,
      dailySpent,
      dailyLimit: config.dailyLimit || null,
      monthlySpent,
      monthlyLimit: config.monthlyLimit || null,
      projectSpent,
      projectLimit: config.projectLimit || null
    };
  }

  /**
   * Record actual spending
   */
  recordSpending(projectId: string, actualCost: number): void {
    // Update daily spending
    const dailySpent = this.dailySpending.get(projectId) || 0;
    this.dailySpending.set(projectId, dailySpent + actualCost);

    // Update monthly spending
    const monthlySpent = this.monthlySpending.get(projectId) || 0;
    this.monthlySpending.set(projectId, monthlySpent + actualCost);

    // Update project spending
    const projectSpent = this.projectSpending.get(projectId) || 0;
    this.projectSpending.set(projectId, projectSpent + actualCost);
  }

  /**
   * Reset daily spending (call this at midnight)
   */
  resetDailySpending(): void {
    this.dailySpending.clear();
  }

  /**
   * Reset monthly spending (call this at start of month)
   */
  resetMonthlySpending(): void {
    this.monthlySpending.clear();
  }

  /**
   * Get budget status for a project
   */
  getBudgetStatus(projectId: string): BudgetStatus {
    return this.checkBudget(projectId, 0);
  }
}

// Export singleton
export const budgetEnforcer = new BudgetEnforcer();
