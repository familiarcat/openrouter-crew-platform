import * as vscode from 'vscode';
import { LLMResponse } from '../services/llm-router.js';

/**
 * Structure View
 * Displays project structure analysis in a rich webview.
 */
export class StructureView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Show the structure analysis results
   */
  public show(analysis: LLMResponse) {
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
    }

    this.panel.webview.html = this.getHtmlContent(analysis);
  }

  private getHtmlContent(analysis: LLMResponse): string {
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
    <div class="meta">
        <strong>Model:</strong> ${analysis.model} | 
        <strong>Cost:</strong> $${analysis.costUSD.toFixed(6)}
    </div>
    <div class="content">
        ${contentHtml}
    </div>
</body>
</html>`;
  }
}