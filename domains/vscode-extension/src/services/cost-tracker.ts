import * as vscode from 'vscode';
import { CostCalculator } from '@openrouter-crew/shared-cost-tracking';

export interface CostMetrics {
    totalCost: number;
    remaining: number;
    percentUsed: number;
    budget: number;
}

export interface UsageRecord {
    timestamp: string;
    cost: number;
    model: string;
    tokens: number;
    command?: string;
    intent?: string;
    promptLength?: number;
    executionTimeMs?: number;
    costUSD: number;
    cached?: boolean;
}

export class CostTracker implements vscode.Disposable {
    private context: vscode.ExtensionContext;
    private readonly COST_KEY_PREFIX = 'openrouter-crew.cost.';
    private _onDidCostUpdate = new vscode.EventEmitter<void>();
    public readonly onDidCostUpdate = this._onDidCostUpdate.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private getStorageKey(period: 'daily' | 'monthly'): string {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1;
        const day = now.getUTCDate();
        
        if (period === 'daily') {
            return `${this.COST_KEY_PREFIX}daily.${year}-${month}-${day}`;
        }
        return `${this.COST_KEY_PREFIX}monthly.${year}-${month}`;
    }

    public async recordUsage(cost: number): Promise<void> {
        const dailyKey = this.getStorageKey('daily');
        const monthlyKey = this.getStorageKey('monthly');

        const currentDailyCost = this.context.globalState.get<number>(dailyKey) || 0;
        const currentMonthlyCost = this.context.globalState.get<number>(monthlyKey) || 0;

        await this.context.globalState.update(dailyKey, currentDailyCost + cost);
        await this.context.globalState.update(monthlyKey, currentMonthlyCost + cost);
        this._onDidCostUpdate.fire();
    }

    public estimateCost(inputTokens: number, outputTokens: number, model: string): number {
        return CostCalculator.calculateActualCost(model, inputTokens, outputTokens);
    }

    public async getCostMetrics(period: 'daily' | 'monthly'): Promise<CostMetrics> {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const budget = config.get<number>(`budget.${period}`) || (period === 'daily' ? 1.0 : 10.0);
        
        const storageKey = this.getStorageKey(period);
        const totalCost = this.context.globalState.get<number>(storageKey) || 0;
        
        const remaining = Math.max(0, budget - totalCost);
        const percentUsed = budget > 0 ? (totalCost / budget) * 100 : 0;

        return { totalCost, remaining, percentUsed, budget };
    }

    public async checkBudget(estimatedCost: number): Promise<{ allowed: boolean; reason?: string }> {
        const dailyMetrics = await this.getCostMetrics('daily');
        if (dailyMetrics.totalCost + estimatedCost > dailyMetrics.budget) {
            return { allowed: false, reason: `Daily budget of $${dailyMetrics.budget.toFixed(2)} would be exceeded.` };
        }

        const monthlyMetrics = await this.getCostMetrics('monthly');
        if (monthlyMetrics.totalCost + estimatedCost > monthlyMetrics.budget) {
            return { allowed: false, reason: `Monthly budget of $${monthlyMetrics.budget.toFixed(2)} would be exceeded.` };
        }

        return { allowed: true };
    }

    public async resetCost(period: 'daily' | 'monthly'): Promise<void> {
        const storageKey = this.getStorageKey(period);
        await this.context.globalState.update(storageKey, 0);
        this._onDidCostUpdate.fire();
    }

    public async resetDailyUsage(): Promise<void> {
        await this.resetCost('daily');
    }

    public getLocalHistory(): UsageRecord[] {
        // TODO: Implement actual history persistence. For now returning empty to satisfy interface.
        return [];
    }

    dispose() {
        this._onDidCostUpdate.dispose();
    }
}