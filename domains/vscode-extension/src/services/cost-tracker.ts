import * as vscode from 'vscode';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UsageRecord {
  timestamp: number;
  command: string;
  promptLength: number;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  cached: boolean;
  intent?: string;
}

export interface CostMetrics {
  totalCost: number;
  budgetLimit: number;
  remaining: number;
  percentUsed: number;
  averagePerDay: number;
  byModel: Record<string, number>;
  byCommand: Record<string, number>;
}

export interface BudgetConfig {
  limit: number;
  period: 'daily' | 'weekly' | 'monthly';
  alertThreshold: number; // 0.0 to 1.0 (e.g. 0.8 for 80%)
}

export class CostTracker implements vscode.Disposable {
  private context: vscode.ExtensionContext;
  private supabase: SupabaseClient | null = null;
  
  private readonly KEY_USAGE_HISTORY = 'openrouter-crew.cost.history';
  private readonly KEY_BUDGET_CONFIG = 'openrouter-crew.cost.budget';
  
  private readonly DEFAULT_BUDGET: BudgetConfig = {
    limit: 10.0,
    period: 'monthly',
    alertThreshold: 0.8
  };

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initSupabase();
  }

  private initSupabase() {
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const url = config.get<string>('supabaseUrl');
    const key = config.get<string>('supabaseAnonKey');
    
    if (url && key) {
      try {
        this.supabase = createClient(url, key);
      } catch (e) {
        console.error('Failed to initialize Supabase client for cost tracking:', e);
      }
    }
  }

  public async getBudgetConfig(): Promise<BudgetConfig> {
    const config = this.context.globalState.get<BudgetConfig>(this.KEY_BUDGET_CONFIG);
    return config || this.DEFAULT_BUDGET;
  }

  public async setBudgetConfig(config: BudgetConfig): Promise<void> {
    await this.context.globalState.update(this.KEY_BUDGET_CONFIG, config);
  }

  public async recordUsage(record: UsageRecord): Promise<void> {
    // 1. Save locally
    const history = this.getLocalHistory();
    history.push(record);
    
    // Prune history (keep last 90 days)
    const prunedHistory = this.pruneHistory(history);
    await this.context.globalState.update(this.KEY_USAGE_HISTORY, prunedHistory);

    // 2. Sync to Supabase if available
    if (this.supabase) {
      this.syncToSupabase(record).catch(err => console.error('Failed to sync cost to Supabase:', err));
    }

    // 3. Check budget alerts
    await this.checkAndAlertBudget();
  }

  public getLocalHistory(): UsageRecord[] {
    return this.context.globalState.get<UsageRecord[]>(this.KEY_USAGE_HISTORY) || [];
  }

  private pruneHistory(history: UsageRecord[]): UsageRecord[] {
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days
    return history.filter(r => r.timestamp > cutoff);
  }

  private async syncToSupabase(record: UsageRecord) {
    if (!this.supabase) return;
    
    // Assumes 'extension_usage_logs' table exists in Supabase
    const { error } = await this.supabase.from('extension_usage_logs').insert({
      timestamp: new Date(record.timestamp).toISOString(),
      command: record.command,
      model: record.model,
      cost_usd: record.costUSD,
      execution_time_ms: record.executionTimeMs,
      cached: record.cached,
      intent: record.intent,
      metadata: { prompt_length: record.promptLength }
    });

    if (error) throw error;
  }

  public async getCostMetrics(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<CostMetrics> {
    const history = this.getLocalHistory();
    const budget = await this.getBudgetConfig();
    
    const now = Date.now();
    let startTime = 0;
    let days = 30;
    
    switch (period) {
      case 'daily':
        startTime = now - (24 * 60 * 60 * 1000);
        days = 1;
        break;
      case 'weekly':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        days = 7;
        break;
      case 'monthly':
      default:
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        days = 30;
        break;
    }

    const periodRecords = history.filter(r => r.timestamp >= startTime);
    const totalCost = periodRecords.reduce((sum, r) => sum + r.costUSD, 0);
    
    const byModel: Record<string, number> = {};
    const byCommand: Record<string, number> = {};

    periodRecords.forEach(r => {
      byModel[r.model] = (byModel[r.model] || 0) + r.costUSD;
      byCommand[r.command] = (byCommand[r.command] || 0) + r.costUSD;
    });

    // Normalize budget limit to the requested period if needed
    let effectiveLimit = budget.limit;
    if (budget.period !== period) {
      const budgetDays = budget.period === 'daily' ? 1 : (budget.period === 'weekly' ? 7 : 30);
      const dailyBudget = budget.limit / budgetDays;
      effectiveLimit = dailyBudget * days;
    }

    return {
      totalCost,
      budgetLimit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - totalCost),
      percentUsed: (totalCost / effectiveLimit) * 100,
      averagePerDay: totalCost / days,
      byModel,
      byCommand
    };
  }

  public async checkBudget(estimatedCost: number): Promise<{ allowed: boolean; reason?: string }> {
    const budget = await this.getBudgetConfig();
    // Check against the configured period metrics
    const metrics = await this.getCostMetrics(budget.period);
    
    if (metrics.totalCost + estimatedCost > budget.limit) {
      return { 
        allowed: false, 
        reason: `Budget limit of $${budget.limit.toFixed(2)} exceeded. Current usage: $${metrics.totalCost.toFixed(4)}` 
      };
    }

    return { allowed: true };
  }

  private async checkAndAlertBudget() {
    const budget = await this.getBudgetConfig();
    const metrics = await this.getCostMetrics(budget.period);
    
    if (metrics.percentUsed >= (budget.alertThreshold * 100)) {
      const msg = `OpenRouter Crew: Budget usage at ${metrics.percentUsed.toFixed(1)}% ($${metrics.totalCost.toFixed(2)} / $${budget.limit.toFixed(2)})`;
      if (metrics.percentUsed >= 100) {
        vscode.window.showErrorMessage(msg);
      } else {
        vscode.window.showWarningMessage(msg);
      }
    }
  }

  public async getModelDistribution(): Promise<{model: string, cost: number, count: number}[]> {
    const history = this.getLocalHistory();
    const map = new Map<string, {cost: number, count: number}>();
    
    history.forEach(r => {
      const current = map.get(r.model) || { cost: 0, count: 0 };
      map.set(r.model, { cost: current.cost + r.costUSD, count: current.count + 1 });
    });
    
    return Array.from(map.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.cost - a.cost);
  }

  /**
   * Estimates the cost of a hypothetical request based on token counts and model.
   * @param inputTokens The number of input tokens.
   * @param outputTokens The number of output tokens.
   * @param model The model identifier string.
   * @returns The estimated cost in USD.
   */
  public estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    let cost = 0;
    // Pricing per 1M tokens (Input/Output)
    // Claude 3.5 Sonnet: $3 / $15
    // Claude 3 Opus: $15 / $75
    // Claude 3 Haiku: $0.25 / $1.25
    // Gemini Flash: $0.075 / $0.30
    if (model.includes('claude-3-sonnet')) {
      cost = (inputTokens * 3 + outputTokens * 15) / 1000000;
    } else if (model.includes('claude-3-opus')) {
      cost = (inputTokens * 15 + outputTokens * 75) / 1000000;
    } else if (model.includes('claude-3-haiku')) {
      cost = (inputTokens * 0.25 + outputTokens * 1.25) / 1000000;
    } else if (model.includes('gemini')) {
      cost = (inputTokens * 0.075 + outputTokens * 0.30) / 1000000;
    } else if (model.includes('gpt-4')) {
      cost = (inputTokens * 10 + outputTokens * 30) / 1000000;
    } else if (model.includes('claude')) { // Fallback for other Claude models
      cost = (inputTokens * 3 + outputTokens * 15) / 1000000;
    }
    return cost;
  }

  /**
   * Resets the daily usage history.
   */
  public async resetDailyUsage(): Promise<void> {
    await this.context.globalState.update(this.KEY_USAGE_HISTORY, []);
  }

  public dispose(): void {
    // Cleanup if needed
  }
}