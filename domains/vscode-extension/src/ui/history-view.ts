import * as vscode from 'vscode';
import { CostTracker, UsageRecord } from '../services/cost-tracker.js';

export class HistoryView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext, private costTracker: CostTracker) {}

  public async show() {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'openrouterCrewHistory',
        'Interaction History',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [this.context.extensionUri],
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });
    }

    const history = this.costTracker.getLocalHistory();
    this.panel.webview.html = this.getHtmlContent(history);
  }

  private getHtmlContent(history: UsageRecord[]): string {
    const rows = history.slice().reverse().map(tx => `
      <div class="history-item">
        <div class="header">
          <span class="intent">${tx.intent || tx.command}</span>
          <span class="time">${new Date(tx.timestamp).toLocaleString()}</span>
        </div>
        <div class="details">
          <div class="detail-item">
            <span class="label">Model:</span>
            <span class="value">${tx.model}${tx.cached ? ' (cached)' : ''}</span>
          </div>
          <div class="detail-item">
            <span class="label">Cost:</span>
            <span class="value">$${tx.costUSD.toFixed(6)}</span>
          </div>
          <div class="detail-item">
            <span class="label">Duration:</span>
            <span class="value">${tx.executionTimeMs} ms</span>
          </div>
          <div class="detail-item">
            <span class="label">Prompt Length:</span>
            <span class="value">${tx.promptLength} chars</span>
          </div>
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interaction History</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            color: var(--vscode-textLink-foreground);
            margin-bottom: 20px;
        }
        .history-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .history-item {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 5px;
            padding: 10px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: bold;
        }
        .intent {
            color: var(--vscode-textLink-foreground);
            text-transform: uppercase;
            font-size: 0.9em;
        }
        .time {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .details {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            font-size: 0.9em;
        }
        .detail-item {
            display: flex;
            gap: 5px;
        }
        .label {
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <h1>📜 Interaction History</h1>
    <div class="history-list">
        ${rows || '<p>No history available.</p>'}
    </div>
</body>
</html>`;
  }
}