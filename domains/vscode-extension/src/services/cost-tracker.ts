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
    complexity?: string;
    latencyScore?: number;
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

    private getStorageKey(period: 'daily' | 'monthly', projectId?: string): string {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1;
        const day = now.getUTCDate();
        
        const projectSuffix = projectId ? `.${projectId}` : '';
        
        if (period === 'daily') {
            return `${this.COST_KEY_PREFIX}daily.${year}-${month}-${day}${projectSuffix}`;
        }
        return `${this.COST_KEY_PREFIX}monthly.${year}-${month}${projectSuffix}`;
    }

    public async recordUsage(cost: number, metadata?: Partial<UsageRecord>): Promise<void> {
        const dailyKey = this.getStorageKey('daily');
        const monthlyKey = this.getStorageKey('monthly');

        const currentDailyCost = this.context.globalState.get<number>(dailyKey) || 0;
        const currentMonthlyCost = this.context.globalState.get<number>(monthlyKey) || 0;

        await this.context.globalState.update(dailyKey, currentDailyCost + cost);
        await this.context.globalState.update(monthlyKey, currentMonthlyCost + cost);

        // Persist history record
        const history = this.getLocalHistory();
        history.push({
            timestamp: new Date().toISOString(),
            costUSD: cost,
            cost: cost,
            model: metadata?.model || 'unknown',
            tokens: metadata?.tokens || 0,
            ...metadata
        });

        // Cap history at 1000 entries to maintain performance
        await this.context.globalState.update(this.COST_KEY_PREFIX + 'history', history.slice(-1000));

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
        return this.context.globalState.get<UsageRecord[]>(this.COST_KEY_PREFIX + 'history') || [];
    }

    public getTrendData(days: number = 7): { date: string; cost: number }[] {
        const history = this.getLocalHistory();
        const trend = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const dayCost = history
                .filter(r => r.timestamp.startsWith(dateStr))
                .reduce((sum, r) => sum + r.costUSD, 0);
            
            trend.push({ 
                date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), 
                cost: dayCost 
            });
        }
        return trend;
    }

    /**
     * DATA'S PREDICTIVE FORECAST:
     * Predicts the cost of the next mission based on the average of the last 50 transactions.
     */
    public predictMissionCost(): number {
        const history = this.getLocalHistory();
        if (history.length === 0) return 0;

        const recent = history.slice(-50);
        const avgCost = recent.reduce((sum, r) => sum + r.costUSD, 0) / recent.length;
        
        // Apply a complexity variance factor (1.2x) for safety
        const prediction = avgCost * 1.2;
        console.log(`📊 Data: Next mission forecasted at $${prediction.toFixed(5)}`);
        return prediction;
    }

    dispose() {
        this._onDidCostUpdate.dispose();
    }
}