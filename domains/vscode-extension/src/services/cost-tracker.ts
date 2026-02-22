import * as vscode from 'vscode';

export interface CostTransaction {
  timestamp: number;
  model: string;
  intent: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  complexity?: string;
}

export interface CostMetrics {
  todayCost: number;
  thisMonthCost: number;
  remainingBudget: number;
  requestCount: number;
  averageCost: number;
  rateLimitHits: number;
}

export class CostTracker implements vscode.Disposable {
  private context: vscode.ExtensionContext;
  private _onDidUpdateCost = new vscode.EventEmitter<void>();
  public readonly onDidUpdateCost = this._onDidUpdateCost.event;
  private disposable: vscode.Disposable;
  private transactions: CostTransaction[] = [];
  private rateLimitHits: { timestamp: number }[] = [];

  private static readonly KEY_DAILY_USAGE = 'openrouter-crew.dailyUsage';
  private static readonly KEY_LAST_RESET = 'openrouter-crew.lastResetDate';
  private static readonly KEY_MONTHLY_USAGE = 'openrouter-crew.monthlyUsage';
  private static readonly KEY_LAST_MONTH_RESET = 'openrouter-crew.lastMonthResetDate';
  private static readonly KEY_FILTER_START = 'openrouter-crew.filterStartDate';
  private static readonly KEY_FILTER_END = 'openrouter-crew.filterEndDate';

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.checkAndResetDaily();
    this.checkAndResetMonthly();

    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('openrouter-crew.budget.daily')) {
        this._onDidUpdateCost.fire();
      }
    });

    this.disposable = vscode.Disposable.from(configListener);
  }

  private checkAndResetDaily() {
    const lastReset = this.context.globalState.get<string>(CostTracker.KEY_LAST_RESET);
    const today = new Date().toDateString();

    if (lastReset !== today) {
      this.resetDailyUsage(true);
    }
  }

  private checkAndResetMonthly() {
    const lastReset = this.context.globalState.get<string>(CostTracker.KEY_LAST_MONTH_RESET);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (lastReset !== currentMonth) {
      this.resetMonthlyUsage(true);
    }
  }

  public async recordTransaction(model: string, intent: string, inputTokens: number, outputTokens: number, cost: number, complexity?: string): Promise<void> {
    const tx: CostTransaction = {
      timestamp: Date.now(),
      model,
      intent,
      inputTokens,
      outputTokens,
      costUSD: cost,
      complexity: complexity || 'UNKNOWN'
    };
    this.transactions.push(tx);
    await this.trackCost(cost);
  }

  public async recordRateLimitHit(): Promise<void> {
    this.rateLimitHits.push({ timestamp: Date.now() });
    this._onDidUpdateCost.fire(); // Refresh views
  }

  public async clearRateLimitHistory(): Promise<void> {
    this.rateLimitHits = [];
    this._onDidUpdateCost.fire();
  }

  public async trackCost(amount: number): Promise<void> {
    this.checkAndResetDaily();
    this.checkAndResetMonthly();
    
    const current = this.getDailyUsage();
    await this.context.globalState.update(CostTracker.KEY_DAILY_USAGE, current + amount);

    const currentMonthly = this.getMonthlyUsage();
    await this.context.globalState.update(CostTracker.KEY_MONTHLY_USAGE, currentMonthly + amount);

    this._onDidUpdateCost.fire();
  }

  public getDailyUsage(): number {
    return this.context.globalState.get<number>(CostTracker.KEY_DAILY_USAGE) || 0;
  }

  public getMonthlyUsage(): number {
    return this.context.globalState.get<number>(CostTracker.KEY_MONTHLY_USAGE) || 0;
  }

  public async resetDailyUsage(isAutoReset: boolean = false): Promise<void> {
    await this.context.globalState.update(CostTracker.KEY_DAILY_USAGE, 0);
    
    if (isAutoReset) {
      await this.context.globalState.update(CostTracker.KEY_LAST_RESET, new Date().toDateString());
    }
    
    this._onDidUpdateCost.fire();
  }

  public async resetMonthlyUsage(isAutoReset: boolean = false): Promise<void> {
    await this.context.globalState.update(CostTracker.KEY_MONTHLY_USAGE, 0);
    
    if (isAutoReset) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await this.context.globalState.update(CostTracker.KEY_LAST_MONTH_RESET, currentMonth);
    }
    
    this._onDidUpdateCost.fire();
  }

  public getDailyBudget(): number {
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    return config.get<number>('budget.daily') || 1.00;
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

  public getFilterState(): { startDate: Date | undefined; endDate: Date | undefined } {
    const start = this.context.globalState.get<string>(CostTracker.KEY_FILTER_START);
    const end = this.context.globalState.get<string>(CostTracker.KEY_FILTER_END);
    return {
      startDate: start ? new Date(start) : undefined,
      endDate: end ? new Date(end) : undefined
    };
  }

  public async updateFilterState(startDate: Date | undefined, endDate: Date | undefined): Promise<void> {
    await this.context.globalState.update(CostTracker.KEY_FILTER_START, startDate?.toISOString());
    await this.context.globalState.update(CostTracker.KEY_FILTER_END, endDate?.toISOString());
  }

  public getHistory(): CostTransaction[] {
    return this.transactions;
  }

  public getMetrics(): CostMetrics {
    const dailyUsage = this.getDailyUsage();
    const monthlyUsage = this.getMonthlyUsage();
    const dailyBudget = this.getDailyBudget();
    return {
      todayCost: dailyUsage,
      thisMonthCost: monthlyUsage,
      remainingBudget: Math.max(0, dailyBudget - dailyUsage),
      requestCount: this.transactions.length,
      averageCost: this.transactions.length > 0 ? dailyUsage / this.transactions.length : 0,
      rateLimitHits: this.rateLimitHits.length,
    };
  }

  public dispose(): void {
    this.disposable.dispose();
  }
}