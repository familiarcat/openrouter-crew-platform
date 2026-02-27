import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker';

export class CostReportPanel {
    public static currentPanel: CostReportPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _costTracker: CostTracker;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, costTracker: CostTracker) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (CostReportPanel.currentPanel) {
            CostReportPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'openrouterCrewCostReport',
            'Cost & Budget Report',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        CostReportPanel.currentPanel = new CostReportPanel(panel, extensionUri, costTracker);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, costTracker: CostTracker) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._costTracker = costTracker;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Refresh the panel if it's open when costs are updated
        this._costTracker.onDidCostUpdate(() => {
            this._update();
        }, null, this._disposables);
    }

    public dispose() {
        CostReportPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = await this._getHtmlForWebview(webview);
    }

    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const daily = await this._costTracker.getCostMetrics('daily');
        const monthly = await this._costTracker.getCostMetrics('monthly');

        const toCurrency = (value: number) => `$${value.toFixed(2)}`;

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cost & Budget Report</title>
            <style>
                body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); padding: 20px; }
                h1 { color: var(--vscode-textLink-foreground); border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 10px; }
                .report-container { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                .card { background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-widget-border); border-radius: 5px; padding: 15px; }
                .card h2 { margin-top: 0; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 8px; }
                .metric { display: flex; justify-content: space-between; padding: 8px 0; }
                .metric-label { font-weight: bold; }
                .progress-bar-container { width: 100%; background-color: var(--vscode-input-background); border-radius: 4px; overflow: hidden; margin-top: 10px; }
                .progress-bar { height: 10px; background-color: var(--vscode-progressBar-background); }
            </style>
        </head>
        <body>
            <h1>OpenRouter Crew - Cost Report</h1>
            <div class="report-container">
                <div class="card">
                    <h2>Daily Budget</h2>
                    <div class="metric">
                        <span class="metric-label">Total Spent:</span>
                        <span>${toCurrency(daily.totalCost)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Budget:</span>
                        <span>${toCurrency(daily.budget)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Remaining:</span>
                        <span>${toCurrency(daily.remaining)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Usage:</span>
                        <span>${daily.percentUsed.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${daily.percentUsed}%; background-color: var(--vscode-charts-blue);"></div>
                    </div>
                </div>
                <div class="card">
                    <h2>Monthly Budget</h2>
                    <div class="metric">
                        <span class="metric-label">Total Spent:</span>
                        <span>${toCurrency(monthly.totalCost)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Budget:</span>
                        <span>${toCurrency(monthly.budget)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Remaining:</span>
                        <span>${toCurrency(monthly.remaining)}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Usage:</span>
                        <span>${monthly.percentUsed.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${monthly.percentUsed}%; background-color: var(--vscode-charts-purple);"></div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    }
}