import * as vscode from 'vscode';
import { AgentExecutionResult } from '../services/types';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';
import { BridgeController, FleetDeck } from './bridge-controller';

/**
 * Treatment Plan View
 * Displays Dr. Crusher's diagnostic results in a specialized "Sickbay" interface.
 */
export class TreatmentPlanView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private context: vscode.ExtensionContext, 
    private agentNetwork: AgentNetworkService, 
    private costTracker: CostTracker
  ) {}

  /**
   * Show the diagnostic treatment plan
   */
  public async show(result: AgentExecutionResult) {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'openrouterCrewTreatmentPlan',
        'Dr. Crusher: Treatment Plan',
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
    this.panel.webview.html = this.getHtmlContent(result, costMetrics);
  }

  private getHtmlContent(result: AgentExecutionResult, costMetrics: any): string {
    let budgetAlertClass = '';
    if (costMetrics.percentUsed > 95) budgetAlertClass = 'alert-red';
    else if (costMetrics.percentUsed > 70) budgetAlertClass = 'alert-yellow';

    // Convert markdown-like content to simple HTML for display
    const contentHtml = result.output
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
    <title>Dr. Crusher's Treatment Plan</title>
    <style>
        :root {
            --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
            --color-bg-secondary: var(--vscode-editor-inactiveSelectionBackground, #252526);
            --color-bg-tertiary: var(--vscode-sideBar-background, #2d2d30);
            --color-text-primary: var(--vscode-editor-foreground, #cccccc);
            --color-text-secondary: var(--vscode-descriptionForeground, #858585);
            --color-border: var(--vscode-widget-border, #3e3e42);
            --color-primary-500: var(--vscode-textLink-foreground, #3b82f6);
            --color-success: #10b981;
        }

        body { font-family: var(--vscode-font-family); padding: 20px; color: var(--color-text-primary); background-color: var(--color-bg-primary); }
        .fleet-nav { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid var(--color-border); padding-bottom: 15px; }
        .nav-item { padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid transparent; transition: all 0.2s ease; }
        .nav-item.active { background: var(--color-primary-500); color: white; border-color: var(--color-primary-500); }
        .nav-arrow { opacity: 0.5; font-size: 1.2em; display: flex; align-items: center; }
        h1, h2, h3 { color: var(--color-success); }
        .meta { margin-bottom: 20px; padding: 10px; background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 5px; font-size: 0.9em; }
        code { background-color: var(--vscode-textBlockQuote-background); padding: 2px 4px; border-radius: 3px; }
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

    <h1>🩺 Dr. Crusher's Treatment Plan</h1>
    <div class="meta">
        <strong>Diagnostic Model:</strong> ${result.model} | 
        <strong>Cost:</strong> $${result.cost.toFixed(6)}
    </div>
    <div class="content">${contentHtml}</div>

    <script>
        const vscode = acquireVsCodeApi();
        function nav(deck) { vscode.postMessage({ command: 'navigate', deck: deck }); }
    </script>
</body>
</html>`;
  }
}