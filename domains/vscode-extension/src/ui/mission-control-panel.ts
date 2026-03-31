import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network.js';
import { CostTracker } from '../services/cost-tracker.js';

export class MissionControlPanel {
    public static currentPanel: MissionControlPanel | undefined;
    public static readonly viewType = 'openrouterCrew.missionControl';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        private readonly extensionUri: vscode.Uri,
        private agentNetwork: AgentNetworkService,
        private costTracker: CostTracker
    ) {
        this._panel = panel;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Subscribing to real-time cost updates
        this.costTracker.onDidCostUpdate(() => {
            this._update();
        }, null, this._disposables);
    }

    public static createOrShow(extensionUri: vscode.Uri, agentNetwork: AgentNetworkService, costTracker: CostTracker) {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        if (MissionControlPanel.currentPanel) {
            MissionControlPanel.currentPanel._panel.reveal(column);
            MissionControlPanel.currentPanel._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            MissionControlPanel.viewType,
            'Mission Control',
            column,
            { enableScripts: true, localResourceRoots: [extensionUri] }
        );

        MissionControlPanel.currentPanel = new MissionControlPanel(panel, extensionUri, agentNetwork, costTracker);
    }

    private async _update() {
        const config = vscode.workspace.getConfiguration('openrouter-crew');
        const projectId = config.get<string>('projectId') || 'default-project';
        const brief = await this.agentNetwork.getActiveMissionBrief(projectId);
        const costMetrics = await this.costTracker.getCostMetrics('daily');
        const trendData = this.costTracker.getTrendData(7);

        this._panel.webview.html = this._getHtmlForWebview(projectId, brief, costMetrics, trendData);
    }

    public dispose() {
        MissionControlPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _getHtmlForWebview(projectId: string, brief: any, costMetrics: any, trendData: any[]) {
        const status = brief ? 'ACTIVE' : 'IDLE';
        const timestamp = brief?.timestamp ? new Date(brief.timestamp).toLocaleString() : 'N/A';
        const chartData = JSON.stringify(costMetrics);
        const trendDataJson = JSON.stringify(trendData);
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-editor-foreground); }
                .card { background: var(--vscode-editor-inactiveSelectionBackground); border: 1px solid var(--vscode-widget-border); padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold; margin-bottom: 10px; }
                .badge.active { background: #13c313; color: white; }
                .badge.idle { background: #666; color: white; }
                h2 { color: var(--vscode-textLink-foreground); margin-top: 0; }
                .label { font-size: 0.8em; opacity: 0.7; text-transform: uppercase; margin-top: 10px; }
                .value { font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 3px; overflow-x: auto; white-space: pre-wrap; margin-top: 5px; border: 1px solid var(--vscode-panel-border); }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
                .charts-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-top: 15px; }
                .chart-container { height: 120px; position: relative; }
                .chart-label { text-align: center; font-size: 0.8em; opacity: 0.8; margin-top: 5px; }
            </style>
        </head>
        <body>
            <h1>🖖 Mission Control</h1>
            <div class="card">
                <div class="badge ${status.toLowerCase()}">${status}</div>
                <h2>Project: ${projectId}</h2>
                
                <div class="meta-grid">
                    <div>
                        <div class="label">Last Synced</div>
                        <div>${timestamp}</div>
                    </div>
                    <div>
                        <div class="label">Assigned Agent</div>
                        <div>${brief?.agentId || 'None'}</div>
                    </div>
                </div>

                ${brief ? `
                    <div class="label">Refined Mission Brief</div>
                    <div class="value">${brief.refinedPrompt}</div>

                    <div class="label">Active Agent Persona</div>
                    <div class="value">${brief.agentPersona}</div>
                    
                    <div class="label">Recommended Model</div>
                    <div class="value">${brief.selectedModel}</div>
                ` : `
                    <p>No active mission found in Redis for this project. Start a chat to architect a new mission.</p>
                `}
            </div>

            <div class="card">
                <h2>💰 Latinum Telemetry</h2>
                <div class="charts-grid">
                    <div>
                        <div class="label">Daily Spend</div>
                        <div class="chart-container">
                            <canvas id="costChart"></canvas>
                        </div>
                        <div class="chart-label">$${costMetrics.totalCost.toFixed(4)} / $${costMetrics.budget.toFixed(2)}</div>
                    </div>
                    <div>
                        <div class="label">7-Day Trend</div>
                        <div class="chart-container">
                            <canvas id="trendChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <button onclick="refresh()" style="background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 16px; cursor: pointer; border-radius: 2px;">
                Refresh Telemetry
            </button>

            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                const vscode = acquireVsCodeApi();
                function refresh() {
                    location.reload();
                }

                const data = ${chartData};
                const trend = ${trendDataJson};

                const ctx = document.getElementById('costChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Used', 'Remaining'],
                        datasets: [{
                            data: [data.totalCost, Math.max(0, data.remaining)],
                            backgroundColor: ['#569cd6', '#333333'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        cutout: '70%',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });

                const trendCtx = document.getElementById('trendChart').getContext('2d');
                new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: trend.map(t => t.date),
                        datasets: [{
                            label: 'Cost',
                            data: trend.map(t => t.cost),
                            borderColor: '#569cd6',
                            backgroundColor: 'rgba(86, 156, 214, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { display: false, beginAtZero: true },
                            x: { 
                                grid: { display: false, drawBorder: false },
                                ticks: { font: { size: 9 }, color: '#9a9a9a' }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>`;
    }
}