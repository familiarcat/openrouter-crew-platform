import * as vscode from 'vscode';
import { LLMResponse } from '../services/llm-router.js';
import { BridgeController, FleetDeck } from './bridge-controller';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';

/**
 * Structure View
 * Displays project structure analysis in a rich webview.
 */
export class StructureView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext, private agentNetwork: AgentNetworkService, private costTracker: CostTracker) {}

  /**
   * Show the structure analysis results
   */
  public async show(analysis: LLMResponse) {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'openrouterCrewStructure',
        'Project Structure Analysis',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [this.context.extensionUri],
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      this.panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'navigate') {
          const bridge = BridgeController.getInstance(this.context, this.agentNetwork, this.costTracker);
          bridge.navigateToDeck(message.deck as FleetDeck);
        }
      });
    }

    const costMetrics = await this.costTracker.getCostMetrics('daily');
    this.panel.webview.html = this.getHtmlContent(analysis, costMetrics);
  }

  private getHtmlContent(analysis: LLMResponse, costMetrics: any): string {
    let budgetAlertClass = '';
    if (costMetrics.percentUsed > 95) budgetAlertClass = 'alert-red';
    else if (costMetrics.percentUsed > 70) budgetAlertClass = 'alert-yellow';

    // Convert markdown-like content to simple HTML for display
    // In a real app, we'd use a markdown parser
    const contentHtml = analysis.content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Structure Analysis</title>
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
        }

        /* Pedagogical Navigation System */
        .fleet-nav { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid var(--color-border); padding-bottom: 15px; }
        .nav-item { 
            padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold;
            background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid transparent;
            transition: all 0.2s ease;
        }
        .nav-item:hover { background: var(--color-bg-secondary); border-color: var(--color-primary-500); }
        .nav-item.active { background: var(--color-primary-500); color: white; border-color: var(--color-primary-500); }
        .nav-arrow { opacity: 0.5; font-size: 1.2em; display: flex; align-items: center; }
        .fleet-nav.alert-yellow { border-bottom: 2px solid #f59e0b; }
        .fleet-nav.alert-red { border-bottom: 2px solid #ef4444; }

        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--color-text-primary);
            background-color: var(--color-bg-primary);
        }
        h1, h2, h3 {
            color: var(--color-primary-500);
        }
        code {
            background-color: var(--vscode-textBlockQuote-background);
            padding: 2px 4px;
            border-radius: 3px;
        }
        .meta {
            margin-bottom: 20px;
            padding: 10px;
            background-color: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: 5px;
            font-size: 0.9em;
        }
        .actions {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--color-border);
        }
        button {
            background-color: var(--color-button-bg);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--color-button-hover);
        }
    </style>
</head>
<body>
    <div class="fleet-nav ${budgetAlertClass}">
        <div class="nav-item" onclick="nav('STRATEGY')">1. STRATEGY</div>
        <div class="nav-arrow">→</div>
        <div class="nav-item" onclick="nav('COMMAND')">2. COMMAND</div>
        <div class="nav-arrow">→</div>
        <div class="nav-item active" onclick="nav('AUDIT')">3. AUDIT</div>
    </div>

    <div class="meta">
        <strong>Model:</strong> ${analysis.model} | 
        <strong>Cost:</strong> $${analysis.costUSD.toFixed(6)}
    </div>
    <div class="content">
        ${contentHtml}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        function nav(deck) {
            vscode.postMessage({ command: 'navigate', deck: deck });
        }
    </script>
</body>
</html>`;
  }
}