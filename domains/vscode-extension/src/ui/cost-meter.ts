import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker.js';

export class CostMeter implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];
  private interval: NodeJS.Timeout | undefined;

  constructor(private costTracker: CostTracker) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'openrouter-crew.showCostReport'; // A command to show more details
    this.disposables.push(this.statusBarItem);

    // Start polling only if window is focused
    if (vscode.window.state.focused) {
        this.startPolling();
    }

    // Listen for window focus changes to pause/resume polling
    this.disposables.push(
        vscode.window.onDidChangeWindowState(state => {
            if (state.focused) {
                this.startPolling();
                this.update(); // Immediate update on focus
            } else {
                this.stopPolling();
            }
        })
    );

    // Also update when cost changes (push-based)
    this.disposables.push(this.costTracker.onDidCostUpdate(() => this.update()));

    this.update();
    this.statusBarItem.show();
  }

  private async update(): Promise<void> {
    try {
      const metrics = await this.costTracker.getCostMetrics('daily');
      const dailyCost = metrics.totalCost;
      const dailyBudget = metrics.budget;
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

  private startPolling() {
      if (!this.interval) {
          this.interval = setInterval(() => this.update(), 60000); // Poll every 60 seconds
      }
  }

  private stopPolling() {
      if (this.interval) {
          clearInterval(this.interval);
          this.interval = undefined;
      }
  }

  public dispose(): void {
    this.stopPolling();
    this.disposables.forEach(d => d.dispose());
  }
}