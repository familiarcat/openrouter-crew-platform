/**
 * Cost Meter Status Bar
 *
 * Displays real-time cost metrics in the VSCode status bar
 * Shows: Today's cost, remaining budget, and warning indicators
 */

import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';

export class CostMeterStatusBar {
  statusBarItem: vscode.StatusBarItem;
  private cliExecutor: CLIExecutor;
  private todayCost: number = 0;
  private budget: number = 100;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(cliExecutor: CLIExecutor) {
    this.cliExecutor = cliExecutor;

    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'openrouter-crew.cost.report';
    this.statusBarItem.tooltip = 'Click to view cost report';

    // Initial update
    this.update();

    // Setup auto-update
    this.startAutoUpdate();
  }

  /**
   * Update the status bar with current cost data
   */
  async update(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('openrouter-crew');
      this.budget = config.get<number>('budgetLimit', 100);

      // Fetch cost report for today
      const result = await this.cliExecutor.getCostReport(1);

      if (result.success && result.data) {
        this.todayCost = result.data.summary?.total || 0;
      }

      this.updateDisplay();
    } catch (error) {
      // Silently fail - don't interrupt the user
    }
  }

  /**
   * Update the visual display
   */
  private updateDisplay(): void {
    const remaining = this.budget - this.todayCost;
    const percentUsed = (this.todayCost / this.budget) * 100;

    let icon = '💰';
    let color = undefined;

    if (percentUsed >= 90) {
      icon = '🔴'; // Red - critical
      color = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (percentUsed >= 75) {
      icon = '🟡'; // Yellow - warning
      color = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else if (percentUsed >= 50) {
      icon = '🟢'; // Green - good
    }

    const text = `${icon} $${this.todayCost.toFixed(2)} / $${this.budget.toFixed(2)} (${percentUsed.toFixed(0)}%)`;

    this.statusBarItem.text = text;
    this.statusBarItem.backgroundColor = color;
    this.statusBarItem.show();
  }

  /**
   * Start auto-update timer
   */
  private startAutoUpdate(): void {
    const config = vscode.workspace.getConfiguration('openrouter-crew');
    const interval = config.get<number>('refreshInterval', 5000);

    this.updateInterval = setInterval(() => {
      this.update();
    }, interval);
  }

  /**
   * Stop auto-update
   */
  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.statusBarItem.dispose();
  }
}
