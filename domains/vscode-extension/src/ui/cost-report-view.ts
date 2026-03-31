import * as vscode from 'vscode';
import { CostTracker, UsageRecord, CostMetrics } from '../services/cost-tracker.js';
import { TextEncoder } from 'util';

export class CostReportView {
  private panel: vscode.WebviewPanel | undefined;
  private filterStartDate: Date | undefined;
  private filterEndDate: Date | undefined;

  constructor(private context: vscode.ExtensionContext, private costTracker: CostTracker) {}

  public async show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'openrouterCrewCostReport',
        'Cost Report',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [this.context.extensionUri],
        }
      );

      this.panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'exportCSV':
              this.exportToCSV();
              return;
            case 'exportJSON':
              vscode.commands.executeCommand('openrouter-crew.exportCostReportJson');
              return;
            case 'filterDateRange':
              this.filterStartDate = message.startDate ? new Date(message.startDate) : undefined;
              this.filterEndDate = message.endDate ? new Date(message.endDate) : undefined;
              this.updateView();
              return;
          }
        },
        undefined,
        this.context.subscriptions
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    this.updateView();
  }

  private async updateView() {
    if (!this.panel) return;
    const history = this.costTracker.getLocalHistory();
    const dailyMetrics = await this.costTracker.getCostMetrics('daily');
    const monthlyMetrics = await this.costTracker.getCostMetrics('monthly');
    this.panel.webview.html = this.getHtmlContent(dailyMetrics, monthlyMetrics, history);
  }

  private async exportToCSV() {
    const history = this.getFilteredHistory(this.costTracker.getLocalHistory());
    if (history.length === 0) {
      vscode.window.showInformationMessage('No cost history to export.');
      return;
    }

    const header = 'Timestamp,Command,Intent,Model,Prompt Length,Execution Time (ms),Cost (USD),Cached';
    const rows = history.map(tx =>
      `"${new Date(tx.timestamp).toISOString()}","${tx.command}","${tx.intent || ''}","${tx.model}",${tx.promptLength},${tx.executionTimeMs},${tx.costUSD},${tx.cached}`
    );
    const csvContent = [header, ...rows].join('\n');

    const uri = await vscode.window.showSaveDialog({
      filters: {
        'CSV Files': ['csv']
      },
      defaultUri: vscode.Uri.file('cost-report.csv'),
      saveLabel: 'Export'
    });

    if (uri) {
      try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(csvContent));
        vscode.window.showInformationMessage('Cost report exported successfully.');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to export cost report: ${error}`);
      }
    }
  }

  private getFilteredHistory(history: UsageRecord[]): UsageRecord[] {
    if (!this.filterStartDate && !this.filterEndDate) return history;

    return history.filter(tx => {
      const txDate = new Date(tx.timestamp);
      if (this.filterStartDate && txDate < this.filterStartDate) return false;
      if (this.filterEndDate) {
        const end = new Date(this.filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });
  }

  private getHtmlContent(dailyMetrics: CostMetrics, monthlyMetrics: CostMetrics, history: UsageRecord[]): string {
    const filteredHistory = this.getFilteredHistory(history);
    const historyRows = filteredHistory.slice().reverse().slice(0, 50).map(tx => `
      <tr>
        <td>${new Date(tx.timestamp).toLocaleString()}</td>
        <td>${tx.command}</td>
        <td>${tx.intent || 'N/A'}</td>
        <td>${tx.model}${tx.cached ? ' (cached)' : ''}</td>
        <td>$${tx.costUSD.toFixed(6)}</td>
        <td>${tx.executionTimeMs} ms</td>
      </tr>
    `).join('');

    const historyData = JSON.stringify(filteredHistory);

    let filterSummary = '';
    if (this.filterStartDate || this.filterEndDate) {
        const start = this.filterStartDate ? this.filterStartDate.toLocaleDateString() : 'Beginning';
        const end = this.filterEndDate ? this.filterEndDate.toLocaleDateString() : 'Now';
        filterSummary = `<div style="margin-bottom: 15px; padding: 10px; background-color: var(--vscode-textBlockQuote-background); border-left: 4px solid var(--vscode-textBlockQuote-border);">
            <strong>Filtered View:</strong> Showing transactions from ${start} to ${end}
        </div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cost Report</title>
    <script>
        // Note: Chart.js is included at the end of the body
        const vscode = acquireVsCodeApi();
        function exportCSV() {
            vscode.postMessage({ command: 'exportCSV' });
        }
        function exportJSON() {
            vscode.postMessage({ command: 'exportJSON' });
        }
        function applyFilter() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            vscode.postMessage({ command: 'filterDateRange', startDate, endDate });
        }
        function resetFilter() {
            vscode.postMessage({ command: 'filterDateRange', startDate: null, endDate: null });
        }
    </script>
    <style>
        :root {
            /* Universal Dark Theme Variable Mapping */
            --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
            --color-bg-secondary: var(--vscode-editor-inactiveSelectionBackground, #252526);
            --color-text-primary: var(--vscode-editor-foreground, #cccccc);
            --color-text-secondary: var(--vscode-descriptionForeground, #858585);
            --color-border: var(--vscode-widget-border, #3e3e42);
            --color-primary-500: var(--vscode-textLink-foreground, #3b82f6);
            --color-button-bg: var(--vscode-button-background, #3b82f6);
            --color-button-hover: var(--vscode-button-hoverBackground, #2563eb);
            --color-success: #10b981;
        }

        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--color-text-primary);
            background-color: var(--color-bg-primary);
        }
        h1, h2 {
            color: var(--color-primary-500);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background-color: var(--color-bg-secondary);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            border: 1px solid var(--color-border);
        }
        .chart-container {
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--color-bg-secondary);
            border-radius: 5px;
            border: 1px solid var(--color-border);
        }
        .metric-value {
            font-size: 1.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9em;
        }
        th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid var(--color-border);
        }
        th {
            background-color: var(--color-bg-secondary);
        }
        tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .action-button {
            background-color: var(--color-button-bg);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            margin-top: 8px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 0.9em;
        }
        .action-button:hover {
            background-color: var(--color-button-hover);
        }
    </style>
</head>
<body>
    <h1>💰 Cost Report</h1>
    ${filterSummary}
    
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-label">Today's Cost</div>
            <div class="metric-value">$${dailyMetrics.totalCost.toFixed(4)}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Month to Date</div>
            <div class="metric-value">$${monthlyMetrics.totalCost.toFixed(4)}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Remaining Budget</div>
            <div class="metric-value">$${monthlyMetrics.remaining.toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Total Requests</div>
            <div class="metric-value">${filteredHistory.length}</div>
        </div>
    </div>

    <div class="chart-container">
        <h2>Cost Trend (Last 30 Days)</h2>
        <canvas id="costTrendChart"></canvas>
    </div>

    <div class="chart-container" style="display: flex; gap: 10px; align-items: center;">
        <label>From: <input type="date" id="startDate" value="${this.filterStartDate ? this.filterStartDate.toISOString().split('T')[0] : ''}" style="background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px;"></label>
        <label>To: <input type="date" id="endDate" value="${this.filterEndDate ? this.filterEndDate.toISOString().split('T')[0] : ''}" style="background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px;"></label>
        <button class="action-button" onclick="applyFilter()">Filter</button>
        <button class="action-button" onclick="resetFilter()">Reset</button>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Recent Transactions</h2>
        <div style="display: flex; gap: 8px;">
            <button class="action-button" onclick="exportJSON()">Export JSON</button>
            <button class="action-button" onclick="exportCSV()">Export CSV</button>
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>Command</th>
                <th>Intent</th>
                <th>Model</th>
                <th>Cost</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
            ${historyRows}
        </tbody>
    </table>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        const historyData = ${historyData};
        const ctx = document.getElementById('costTrendChart').getContext('2d');

        // Process data for the chart: group costs by day
        const dailyCosts = historyData.reduce((acc, tx) => {
            const date = new Date(tx.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
            acc[date] = (acc[date] || 0) + tx.costUSD;
            return acc;
        }, {});

        const sortedDates = Object.keys(dailyCosts).sort((a, b) => new Date(a) - new Date(b));
        
        const labels = sortedDates.map(date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const data = sortedDates.map(date => dailyCosts[date]);

                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim() || '#4bc0c0';

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Cost (USD)',
                    data: data,
                            borderColor: primaryColor,
                            backgroundColor: primaryColor + '33',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                                ticks: { color: 'var(--color-text-primary)' },
                                grid: { color: 'var(--color-border)' }
                    },
                    x: {
                                ticks: { color: 'var(--color-text-primary)' },
                                grid: { color: 'var(--color-border)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                                    color: 'var(--color-text-primary)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }
}