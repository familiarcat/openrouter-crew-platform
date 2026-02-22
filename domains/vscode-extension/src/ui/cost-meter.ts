import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker';

export class CostMeter implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposable: vscode.Disposable;

  constructor(private costTracker: CostTracker) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'openrouter-crew.showCostReport'; // A command to show more details

    const subscription = this.costTracker.onDidUpdateCost(() => this.update());
    this.disposable = vscode.Disposable.from(subscription, this.statusBarItem);

    this.update();
    this.statusBarItem.show();
  }

  private update(): void {
    const metrics = this.costTracker.getMetrics();
    const dailyBudget = this.costTracker.getDailyBudget();
    const percentage = dailyBudget > 0 ? (metrics.todayCost / dailyBudget) * 100 : 0;

    this.statusBarItem.text = `💰 $${metrics.todayCost.toFixed(2)} / $${dailyBudget.toFixed(2)}`;
    this.statusBarItem.tooltip = `OpenRouter Crew: Daily cost is ${percentage.toFixed(1)}% of your $${dailyBudget.toFixed(2)} budget. Click to see report.`;

    // Reset background color first
    this.statusBarItem.backgroundColor = undefined;

    if (percentage >= 90) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (percentage >= 75) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  public dispose(): void {
    this.disposable.dispose();
  }
}