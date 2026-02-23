import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker.js';

export class CostMeter implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposable: vscode.Disposable;

  constructor(private costTracker: CostTracker) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'openrouter-crew.showCostReport'; // A command to show more details

    const interval = setInterval(() => this.update(), 60000); // Poll every 60 seconds
    this.disposable = vscode.Disposable.from({ dispose: () => clearInterval(interval) }, this.statusBarItem);

    this.update();
    this.statusBarItem.show();
  }

  private async update(): Promise<void> {
    try {
      const metrics = await this.costTracker.getCostMetrics('daily');
      const dailyCost = metrics.totalCost;
      const dailyBudget = metrics.budgetLimit;
      const percentage = dailyBudget > 0 ? (dailyCost / dailyBudget) * 100 : 0;

      this.statusBarItem.text = `💰 $${dailyCost.toFixed(2)} / $${dailyBudget.toFixed(2)}`;
      this.statusBarItem.tooltip = `OpenRouter Crew: Daily cost is ${percentage.toFixed(1)}% of your $${dailyBudget.toFixed(2)} budget. Click to see report.`;

      // Reset background color first
      this.statusBarItem.backgroundColor = undefined;

      if (percentage >= 90) {
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
      } else if (percentage >= 75) {
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      }
    } catch (error) {
        console.error("Failed to update cost meter", error);
        this.statusBarItem.text = `💰 Cost Error`;
        this.statusBarItem.tooltip = `Could not fetch cost metrics: ${error}`;
    }
  }

  public dispose(): void {
    this.disposable.dispose();
  }
}