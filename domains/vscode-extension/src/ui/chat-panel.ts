import * as vscode from 'vscode';
import { CommandExecutor } from '../commands/command-executor.js';

/**
 * Manages the Webview UI for the Chat Panel
 */
export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _executor: CommandExecutor;
  private _abortController: AbortController | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, executor: CommandExecutor) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._executor = executor;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'sendMessage':
            await this._handleUserMessage(message.text);
            return;
          case 'stopGeneration':
            if (this._abortController) {
              this._abortController.abort();
              this._abortController = undefined;
            }
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, executor: CommandExecutor) {
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
      'openrouterCrewChat',
      'OpenRouter Crew',
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our extension's `webview` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview')]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, executor);
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = undefined;
    }

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _handleUserMessage(text: string) {
    this._abortController = new AbortController();
    // 1. Send user message back to UI to display immediately
    this._panel.webview.postMessage({ command: 'addMessage', role: 'user', text });
    this._panel.webview.postMessage({ command: 'setLoading', value: true });

    try {
      // 2. Execute task via CommandExecutor. This returns the final string result.
      // The executor also logs the full exchange to the 'OpenRouter Crew' output channel.
      const result = await this._executor.executeTask(text, undefined, this._abortController.signal); 
      
      this._panel.webview.postMessage({ command: 'setLoading', value: false });
      this._panel.webview.postMessage({ 
        command: 'addMessage', 
        role: 'assistant', 
        text: result.output,
        meta: {
            model: result.model,
            cost: result.cost,
            time: result.executionTimeMs
        }
      });

    } catch (error: any) {
      this._panel.webview.postMessage({ command: 'setLoading', value: false });
      
      if (error.name === 'AbortError' || error.message === 'Aborted') {
        this._panel.webview.postMessage({ 
          command: 'addMessage', 
          role: 'assistant', 
          text: '🛑 Generation stopped by user.' 
        });
      } else {
        this._panel.webview.postMessage({ 
          command: 'addMessage', 
          role: 'assistant', 
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          isError: true,
          retryText: text
        });
      }
    } finally {
      this._abortController = undefined;
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
    const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'webview', 'reset.css');
    const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'webview', 'chat.css');

    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    // Read HTML content from disk would be better, but for now we inline the template structure
    // and inject the URIs.
    // Note: In a real extension, reading from a separate .html file is cleaner.
    // For this scaffold, we will assume the existence of the files in the `webview/` folder 
    // and load them, or construct the HTML string here. 
    // To keep it simple and self-contained in this class for now:
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <title>OpenRouter Crew Chat</title>
    </head>
    <body>
        <div id="chat-container">
            <div id="header">
                <span>OpenRouter Crew</span>
                <button id="clear-button" title="Clear Chat">Clear</button>
            </div>
            <div id="messages"></div>
            <div id="input-area">
                <textarea id="message-input" placeholder="Ask anything... (Cmd+Enter to send)"></textarea>
                <button id="send-button">Send</button>
            </div>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
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