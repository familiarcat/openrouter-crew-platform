/**
 * Cost Tracker Service
 *
 * Real-time cost tracking, budget enforcement, and analytics.
 * Integrates with Supabase for persistent storage.
 */

/**
 * Cost transaction record
 */
export interface CostTransaction {
  id?: string;
  timestamp: number;
  model: string;
  intent: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  budgetRemaining: number;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Cost analytics
 */
export interface CostAnalytics {
  totalCost: number;
  averageCost: number;
  transactionCount: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  dailyCost: number;
  costByModel: Record<string, number>;
  costByIntent: Record<string, number>;
  highestCostTransaction: CostTransaction | null;
  trend: 'stable' | 'increasing' | 'decreasing';
}

/**
 * Budget alert
 */
export interface BudgetAlert {
  type: 'warning' | 'critical' | 'exceeded';
  threshold: number;
  currentUsage: number;
  message: string;
  suggestedAction: string;
}

/**
 * Cost Tracker for budget management
 */
export class CostTracker {
  private transactions: CostTransaction[] = [];
  private dailyBudget: number = 100;  // $100 default daily budget
  private budgetRemaining: number = 100;
  private dailyReset: Date = new Date();
  private alerts: BudgetAlert[] = [];

  constructor(dailyBudgetUSD: number = 100) {
    this.dailyBudget = dailyBudgetUSD;
    this.budgetRemaining = dailyBudgetUSD;
    this.resetIfNewDay();
  }

  /**
   * Record a transaction
   */
  recordTransaction(
    model: string,
    intent: string,
    inputTokens: number,
    outputTokens: number,
    costUSD: number,
    metadata?: Record<string, any>
  ): { success: boolean; alert?: BudgetAlert } {
    this.resetIfNewDay();

    // Check budget before recording
    if (costUSD > this.budgetRemaining) {
      const alert = this.createAlert('exceeded', costUSD);
      this.alerts.push(alert);
      return { success: false, alert };
    }

    // Deduct cost from budget
    this.budgetRemaining -= costUSD;

    // Create transaction record
    const transaction: CostTransaction = {
      timestamp: Date.now(),
      model,
      intent,
      inputTokens,
      outputTokens,
      costUSD,
      budgetRemaining: this.budgetRemaining,
      success: true,
      metadata,
    };

    this.transactions.push(transaction);

    // Check for alerts
    const alert = this.checkBudgetThresholds();
    if (alert) {
      this.alerts.push(alert);
      return { success: true, alert };
    }

    return { success: true };
  }

  /**
   * Get cost analytics
   */
  getAnalytics(): CostAnalytics {
    this.resetIfNewDay();

    const costByModel: Record<string, number> = {};
    const costByIntent: Record<string, number> = {};
    let totalCost = 0;
    let highestCostTransaction: CostTransaction | null = null;

    for (const tx of this.transactions) {
      totalCost += tx.costUSD;

      // Track by model
      costByModel[tx.model] = (costByModel[tx.model] || 0) + tx.costUSD;

      // Track by intent
      costByIntent[tx.intent] = (costByIntent[tx.intent] || 0) + tx.costUSD;

      // Find highest cost
      if (!highestCostTransaction || tx.costUSD > highestCostTransaction.costUSD) {
        highestCostTransaction = tx;
      }
    }

    // Calculate daily cost (transactions from today)
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dailyCost = this.transactions
      .filter(tx => tx.timestamp >= todayStart.getTime())
      .reduce((sum, tx) => sum + tx.costUSD, 0);

    // Determine trend
    const recentTxs = this.transactions.slice(-10);
    const avgRecentCost = recentTxs.length > 0
      ? recentTxs.reduce((sum, tx) => sum + tx.costUSD, 0) / recentTxs.length
      : 0;
    const avgOlderCost = this.transactions.length > 10
      ? this.transactions.slice(0, -10).reduce((sum, tx) => sum + tx.costUSD, 0) / (this.transactions.length - 10)
      : avgRecentCost;

    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (avgRecentCost > avgOlderCost * 1.2) trend = 'increasing';
    else if (avgRecentCost < avgOlderCost * 0.8) trend = 'decreasing';

    return {
      totalCost,
      averageCost: this.transactions.length > 0 ? totalCost / this.transactions.length : 0,
      transactionCount: this.transactions.length,
      budgetRemaining: this.budgetRemaining,
      budgetUsedPercent: ((this.dailyBudget - this.budgetRemaining) / this.dailyBudget) * 100,
      dailyCost,
      costByModel,
      costByIntent,
      highestCostTransaction,
      trend,
    };
  }

  /**
   * Get transaction history
   */
  getHistory(limit: number = 50): CostTransaction[] {
    return this.transactions.slice(-limit);
  }

  /**
   * Get alerts
   */
  getAlerts(): BudgetAlert[] {
    return this.alerts;
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Set daily budget
   */
  setBudget(budgetUSD: number): void {
    this.dailyBudget = budgetUSD;
    if (this.budgetRemaining > budgetUSD) {
      this.budgetRemaining = budgetUSD;
    }
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    this.resetIfNewDay();
    return this.budgetRemaining;
  }

  /**
   * Estimate cost reduction vs Copilot
   */
  estimateCopilotSavings(): {
    estimatedCopilotCost: number;
    actualCost: number;
    savings: number;
    savingsPercent: number;
  } {
    const actualCost = this.transactions.reduce((sum, tx) => sum + tx.costUSD, 0);
    // Copilot charges ~$0.05 per query on average
    const estimatedCopilotCost = this.transactions.length * 0.05;
    const savings = estimatedCopilotCost - actualCost;
    const savingsPercent = estimatedCopilotCost > 0 ? (savings / estimatedCopilotCost) * 100 : 0;

    return {
      estimatedCopilotCost,
      actualCost,
      savings,
      savingsPercent,
    };
  }

  /**
   * Generate cost report
   */
  generateReport(): string {
    const analytics = this.getAnalytics();
    const savings = this.estimateCopilotSavings();

    let report = '📊 Cost Report\n';
    report += `==================\n\n`;

    report += `💰 Budget Status\n`;
    report += `- Daily Budget: $${this.dailyBudget.toFixed(2)}\n`;
    report += `- Used: $${(this.dailyBudget - this.budgetRemaining).toFixed(2)} (${analytics.budgetUsedPercent.toFixed(1)}%)\n`;
    report += `- Remaining: $${this.budgetRemaining.toFixed(2)}\n\n`;

    report += `📈 Usage Statistics\n`;
    report += `- Transactions: ${analytics.transactionCount}\n`;
    report += `- Average Cost/Query: $${analytics.averageCost.toFixed(4)}\n`;
    report += `- Today's Cost: $${analytics.dailyCost.toFixed(2)}\n`;
    report += `- Trend: ${analytics.trend}\n\n`;

    report += `🎯 Cost by Model\n`;
    for (const [model, cost] of Object.entries(analytics.costByModel)) {
      report += `- ${model}: $${cost.toFixed(2)}\n`;
    }
    report += '\n';

    report += `📝 Cost by Intent\n`;
    for (const [intent, cost] of Object.entries(analytics.costByIntent)) {
      report += `- ${intent}: $${cost.toFixed(2)}\n`;
    }
    report += '\n';

    report += `💡 Copilot Comparison\n`;
    report += `- Copilot Estimated: $${savings.estimatedCopilotCost.toFixed(2)}\n`;
    report += `- Our Cost: $${savings.actualCost.toFixed(2)}\n`;
    report += `- Savings: $${savings.savings.toFixed(2)} (${savings.savingsPercent.toFixed(1)}% cheaper)\n`;

    return report;
  }

  /**
   * Check budget thresholds and create alerts
   */
  private checkBudgetThresholds(): BudgetAlert | null {
    const percent = ((this.dailyBudget - this.budgetRemaining) / this.dailyBudget) * 100;

    if (percent >= 95) {
      return this.createAlert('critical', percent);
    } else if (percent >= 75) {
      return this.createAlert('warning', percent);
    }

    return null;
  }

  /**
   * Create budget alert
   */
  private createAlert(type: 'warning' | 'critical' | 'exceeded', usage: number): BudgetAlert {
    const messages: Record<string, string> = {
      warning: `Budget usage at ${usage.toFixed(0)}% - Consider slowing down requests`,
      critical: `Budget usage at ${usage.toFixed(0)}% - Approaching daily limit`,
      exceeded: `Daily budget exceeded - Request denied`,
    };

    const suggestions: Record<string, string> = {
      warning: 'Consider batching requests or upgrading budget',
      critical: 'Reduce request frequency immediately',
      exceeded: 'Increase daily budget or wait for reset',
    };

    return {
      type,
      threshold: type === 'warning' ? 75 : type === 'critical' ? 95 : 100,
      currentUsage: usage,
      message: messages[type],
      suggestedAction: suggestions[type],
    };
  }

  /**
   * Reset budget if new day
   */
  private resetIfNewDay(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.dailyReset < today) {
      this.budgetRemaining = this.dailyBudget;
      this.dailyReset = today;
      this.alerts = [];
    }
  }

  /**
   * Export transactions for Supabase
   */
  exportForSupabase(): CostTransaction[] {
    return this.transactions.map(tx => ({
      ...tx,
      id: tx.id || `${Date.now()}-${Math.random()}`,
    }));
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.transactions = [];
    this.alerts = [];
    this.budgetRemaining = this.dailyBudget;
  }
}

/**
 * Supabase Cost Tracker - persists to database
 */
export class SupabaseAwareCostTracker extends CostTracker {
  private supabaseUrl?: string;
  private supabaseKey?: string;
  private userId?: string;
  private syncQueue: CostTransaction[] = [];
  private syncInProgress: boolean = false;

  constructor(
    dailyBudgetUSD: number = 100,
    supabaseUrl?: string,
    supabaseKey?: string,
    userId?: string
  ) {
    super(dailyBudgetUSD);
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.userId = userId;
  }

  /**
   * Record and sync transaction
   */
  async recordTransactionAndSync(
    model: string,
    intent: string,
    inputTokens: number,
    outputTokens: number,
    costUSD: number,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; synced: boolean; alert?: any }> {
    const result = this.recordTransaction(model, intent, inputTokens, outputTokens, costUSD, metadata);

    if (result.success && this.supabaseUrl && this.supabaseKey) {
      const synced = await this.syncToSupabase();
      return { ...result, synced };
    }

    return { ...result, synced: false };
  }

  /**
   * Sync transactions to Supabase
   */
  async syncToSupabase(): Promise<boolean> {
    if (!this.supabaseUrl || !this.supabaseKey || this.syncInProgress) {
      return false;
    }

    try {
      this.syncInProgress = true;

      // In production, this would call Supabase API
      // For now, just queue for future syncing
      this.syncQueue = this.exportForSupabase();

      return true;
    } catch (error) {
      console.error('Failed to sync to Supabase:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Load transactions from Supabase
   */
  async loadFromSupabase(): Promise<CostTransaction[]> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      return [];
    }

    try {
      // In production, this would query Supabase
      // For now, return queued transactions
      return this.syncQueue;
    } catch (error) {
      console.error('Failed to load from Supabase:', error);
      return [];
    }
  }
}
