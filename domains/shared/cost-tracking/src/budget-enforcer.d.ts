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
export declare class BudgetEnforcer {
    private budgets;
    private dailySpending;
    private monthlySpending;
    private projectSpending;
    /**
     * Set budget for a project
     */
    setBudget(projectId: string, config: BudgetConfig): void;
    /**
     * Check if request is within budget
     */
    checkBudget(projectId: string, estimatedCost: number): BudgetStatus;
    /**
     * Record actual spending
     */
    recordSpending(projectId: string, actualCost: number): void;
    /**
     * Reset daily spending (call this at midnight)
     */
    resetDailySpending(): void;
    /**
     * Reset monthly spending (call this at start of month)
     */
    resetMonthlySpending(): void;
    /**
     * Get budget status for a project
     */
    getBudgetStatus(projectId: string): BudgetStatus;
    /**
     * Returns true if budget consumption is above threshold
     */
    isDailyBudgetConstrained(projectId: string, threshold?: number): boolean;
}
export declare const budgetEnforcer: BudgetEnforcer;
//# sourceMappingURL=budget-enforcer.d.ts.map