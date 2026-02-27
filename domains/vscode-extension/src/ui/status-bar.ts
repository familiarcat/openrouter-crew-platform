import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker';

export class CostStatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private costTracker: CostTracker;
    private disposables: vscode.Disposable[] = [];

    constructor(costTracker: CostTracker) {
        this.costTracker = costTracker;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'openrouter-crew.cost.report';
        this.disposables.push(this.statusBarItem);

        // Subscribe to updates
        this.disposables.push(
            this.costTracker.onDidCostUpdate(() => this.update())
        );

        // Initial update
        this.update();
        this.statusBarItem.show();
    }

    private async update() {
        const metrics = await this.costTracker.getCostMetrics('daily');
        
        const percent = metrics.percentUsed.toFixed(1);
        const used = metrics.totalCost.toFixed(2);
        const budget = metrics.budget.toFixed(2);

        this.statusBarItem.text = `$(credit-card) $${used} / $${budget} (${percent}%)`;
        
        // Color coding based on budget usage
        if (metrics.percentUsed >= 90) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else if (metrics.percentUsed >= 75) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            this.statusBarItem.backgroundColor = undefined; // Default
        }

        this.statusBarItem.tooltip = new vscode.MarkdownString(
            `**Daily Budget**\n\n` +
            `Used: $${used}\n` +
            `Budget: $${budget}\n` +
            `Remaining: $${metrics.remaining.toFixed(2)}\n` +
            `\nClick to see full report`
        );
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }
}