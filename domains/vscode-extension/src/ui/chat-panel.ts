import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LLMRouter } from '../services/llm-router.js';
import { CostTracker } from '../services/cost-tracker.js';
import { NLPProcessor } from '../services/nlp-processor.js';
import { ContextBuilder } from '../services/context-builder.js';

/**
 * Chat Panel Controller
 */
export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  public static readonly viewType = 'openRouterCrewChat';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _llmRouter: LLMRouter;
  private readonly _costTracker: CostTracker;
  private readonly _nlpProcessor: NLPProcessor;
  private readonly _contextBuilder: ContextBuilder;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ChatPanel.viewType,
      'OpenRouter Crew Chat',
      column || vscode.ViewColumn.Beside,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `webview` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview')]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder);
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder
  ) {
    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._llmRouter = llmRouter;
    this._costTracker = costTracker;
    this._nlpProcessor = nlpProcessor;
    this._contextBuilder = contextBuilder;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'sendMessage':
            // Fire and forget; error handling is inside the async method
            this._handleUserMessage(message.text);
            return;
          case 'applyRefactoring':
            // Execute the apply refactoring command with arguments from the webview
            vscode.commands.executeCommand('openrouter-crew.applyRefactoring', message.code, message.range);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private async _handleUserMessage(text: string) {
    this._panel.webview.postMessage({ command: 'showLoading' });

    try {
      const nlpAnalysis = this._nlpProcessor.analyze(text);
      const contextString = await this._contextBuilder.buildContext(text);

      const response = await this._llmRouter.route({
        prompt: text,
        context: contextString,
        intent: nlpAnalysis.intent.intent,
        complexity: nlpAnalysis.complexity,
      });

      this._panel.webview.postMessage({
        command: 'receiveMessage',
        text: response.content,
        role: 'assistant',
        meta: {
          model: response.model,
          cost: response.costUSD,
          executionTimeMs: response.executionTimeMs,
        },
      });
    } catch (error) {
      this._panel.webview.postMessage({
        command: 'receiveMessage',
        text: `Sorry, an error occurred: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        meta: { model: 'error-handler', cost: 0 },
      });
    }
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'chat.js');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Local path to css styles
    const stylePathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'chat.css');
    const styleUri = webview.asWebviewUri(stylePathOnDisk);

    // Local path to html template
    const htmlPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'webview', 'chat.html');
    let htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    // Replace placeholders
    htmlContent = htmlContent.replace(/\${nonce}/g, nonce);
    htmlContent = htmlContent.replace(/\${webview.cspSource}/g, webview.cspSource);
    htmlContent = htmlContent.replace(/\${scriptUri}/g, scriptUri.toString());
    htmlContent = htmlContent.replace(/\${styleUri}/g, styleUri.toString());

    return htmlContent;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
