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

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'undo':
                        const success = await this.agentNetwork.restoreFromBuffer(message.filePath);
                        if (success) {
                            vscode.window.showInformationMessage(`Successfully restored ${message.filePath} from O'Brien's transporter buffer.`);
                            this._update();
                        } else {
                            vscode.window.showErrorMessage(`Failed to restore ${message.filePath}.`);
                        }
                        break;
                    case 'reinitialize':
                        vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: "🔧 Geordi: Re-initializing warp field...",
                            cancellable: false
                        }, async () => {
                            const terminal = vscode.window.createTerminal('Fleet Infrastructure');
                            terminal.show();
                            terminal.sendText('pnpm local:infra:up');
                            return new Promise(resolve => setTimeout(resolve, 5000));
                        });
                        break;
                    case 'refresh':
                        this._update();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, agentNetwork: AgentNetworkService, costTracker: CostTracker, column?: vscode.ViewColumn) {
        const targetColumn = column || vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        if (MissionControlPanel.currentPanel) {
            MissionControlPanel.currentPanel._panel.reveal(targetColumn);
            MissionControlPanel.currentPanel._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            MissionControlPanel.viewType,
            'Mission Control',
            targetColumn,
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
        const bufferedFiles = await this.agentNetwork.getBufferedFiles();
        const dockerStatus = await this.agentNetwork.getDockerStatus();

        this._panel.webview.html = this._getHtmlForWebview(projectId, brief, costMetrics, trendData, bufferedFiles, dockerStatus);
    }

    public dispose() {
        MissionControlPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _getHtmlForWebview(projectId: string, brief: any, costMetrics: any, trendData: any[], bufferedFiles: string[], dockerStatus: any[]) {
        const status = brief ? 'ACTIVE' : 'IDLE';
        const timestamp = brief?.timestamp ? new Date(brief.timestamp).toLocaleString() : 'N/A';
        const chartData = JSON.stringify(costMetrics);
        const trendDataJson = JSON.stringify(trendData);
        
        let budgetAlertClass = 'alert-green';
        if (costMetrics.percentUsed > 95) budgetAlertClass = 'alert-red';
        else if (costMetrics.percentUsed > 70) budgetAlertClass = 'alert-yellow';

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                :root {
                    /* Universal Dark Theme Variable Mapping */
                    --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
                    --color-bg-secondary: var(--vscode-editor-inactiveSelectionBackground, #252526);
                    --color-bg-tertiary: var(--vscode-sideBar-background, #2d2d30);
                    --color-text-primary: var(--vscode-editor-foreground, #cccccc);
                    --color-text-secondary: var(--vscode-descriptionForeground, #858585);
                    --color-border: var(--vscode-widget-border, #3e3e42);
                    --color-primary-500: var(--vscode-textLink-foreground, #3b82f6);
                    --color-success: #10b981;
                    --color-warning: #f59e0b;
                    --color-error: #ef4444;
                }

                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px; 
                    color: var(--color-text-primary);
                    background-color: var(--color-bg-primary);
                }
                .card { background: var(--color-bg-secondary); border: 1px solid var(--color-border); padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; font-weight: bold; margin-bottom: 10px; }
                .badge.active { background: var(--color-success); color: white; }
                .badge.idle { background: #666; color: white; }
                h2 { color: var(--color-primary-500); margin-top: 0; }
                .label { font-size: 0.8em; color: var(--color-text-secondary); text-transform: uppercase; margin-top: 10px; }
                .value { font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 3px; overflow-x: auto; white-space: pre-wrap; margin-top: 5px; border: 1px solid var(--color-border); }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
                .charts-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-top: 15px; }
                .chart-container { height: 120px; position: relative; }
                .chart-label { text-align: center; font-size: 0.8em; opacity: 0.8; margin-top: 5px; }
                .status-dot { height: 8px; width: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
                .status-healthy { background-color: var(--color-success); }
                .status-unhealthy { background-color: var(--color-error); }
                .docker-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; margin-bottom: 4px; }
                .buffer-list { margin-top: 10px; }
                .buffer-item { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    background: var(--color-bg-tertiary); 
                    padding: 8px; 
                    border-radius: 3px; 
                    margin-bottom: 5px;
                    border: 1px solid var(--color-border);
                }
                .file-path { font-family: var(--vscode-editor-font-family); font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
                .undo-button { 
                    background: var(--vscode-button-secondaryBackground); 
                    color: var(--vscode-button-secondaryForeground); 
                    border: none; 
                    padding: 4px 8px; 
                    cursor: pointer; 
                    border-radius: 2px;
                    font-size: 0.8em;
                }
                .undo-button:hover { background: var(--vscode-button-secondaryHoverBackground); }
                .budget-alert {
                    padding: 8px 12px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                    font-weight: bold;
                    text-align: center;
                }
                .alert-green { background-color: var(--color-success); color: white; }
                .alert-yellow { background-color: var(--color-warning); color: black; }
                .alert-red { background-color: var(--color-error); color: white; }

                /* Pedagogical Navigation System */
                .fleet-nav { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid var(--color-border); padding-bottom: 15px; }
                .nav-item { 
                    padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold;
                    background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid transparent;
                    transition: all 0.2s ease;
                }
                .nav-item:hover { background: var(--color-bg-secondary); border-color: var(--color-primary-500); }
                .nav-item.active { background: var(--color-primary-500); color: white; border-color: var(--color-primary-500); }
                .nav-step { display: flex; align-items: center; gap: 5px; }
                .nav-arrow { opacity: 0.5; font-size: 1.2em; }
                .fleet-nav.alert-yellow { border-bottom: 2px solid var(--color-warning); }
                .fleet-nav.alert-red { border-bottom: 2px solid var(--color-error); }
            </style>
        </head>
        <body>
            <div class="fleet-nav ${budgetAlertClass}">
                <div class="nav-item" onclick="nav('STRATEGY')">1. STRATEGY</div>
                <div class="nav-arrow">→</div>
                <div class="nav-item active" onclick="nav('COMMAND')">2. COMMAND</div>
                <div class="nav-arrow">→</div>
                <div class="nav-item" onclick="nav('AUDIT')">3. AUDIT</div>
            </div>

            <h1 style="display: flex; align-items: center; gap: 10px;">
                <span>🖖 Mission Control</span>
                <span style="font-size: 0.5em; opacity: 0.6; font-weight: normal;">[COMMAND DECK]</span>
            </h1>

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
                <h2>🛰️ O'Brien's Transporter Buffer</h2>
                <div class="label">Buffered Changes (1 hour retention)</div>
                ${bufferedFiles.length > 0 ? `
                    <div class="buffer-list">
                        ${bufferedFiles.map(file => `
                            <div class="buffer-item">
                                <span class="file-path" title="${file}">${file}</span>
                                <button class="undo-button" onclick="undo('${file}')">Restore</button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p>Buffer is empty. No recent changes to undo.</p>
                `}
            </div>

            <div class="card">
                <h2>🔋 Warp Field Status</h2>
                <div class="label">Container Health (Real-time)</div>
                <div style="margin-top: 10px;">
                    ${dockerStatus.length > 0 ? dockerStatus.map(s => `
                        <div class="docker-item">
                            <span><span class="status-dot ${s.healthy ? 'status-healthy' : 'status-unhealthy'}"></span> ${s.name}</span>
                            <span style="opacity: 0.7; font-size: 0.85em;">${s.status}</span>
                        </div>
                    `).join('') : '<p>No active containers found.</p>'}
                </div>
                <button class="undo-button" onclick="reinitialize()" style="margin-top: 10px; width: 100%;">Re-initialize Warp Field</button>
            </div>

            <div class="budget-alert ${budgetAlertClass}">
                Daily Budget Status: ${costMetrics.percentUsed.toFixed(1)}% Used
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
                    vscode.postMessage({ command: 'refresh' });
                }

                function nav(deck) {
                    vscode.postMessage({ command: 'navigate', deck: deck });
                }

                function undo(filePath) {
                    vscode.postMessage({ command: 'undo', filePath: filePath });
                }

                function reinitialize() {
                    vscode.postMessage({ command: 'reinitialize' });
                }

                const data = ${chartData};
                const trend = ${trendDataJson};
                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim() || '#569cd6';

                const ctx = document.getElementById('costChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Used', 'Remaining'],
                        datasets: [{
                            data: [data.totalCost, Math.max(0, data.remaining)],
                            backgroundColor: [primaryColor, '#333333'],
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
                            borderColor: primaryColor,
                            backgroundColor: primaryColor + '33', // 20% alpha
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