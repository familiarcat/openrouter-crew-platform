import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { CostTracker } from '../services/cost-tracker';
import { NLPProcessor } from '../services/nlp-processor';
import { ContextBuilder } from '../services/context-builder';
import { ToolRegistry } from '../services/tool-registry';
import { CommandExecutor } from '../commands/command-executor';

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  public static readonly viewType = 'openrouterCrew.chatPanel';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private llmRouter: LLMRouter,
    private costTracker: CostTracker,
    private nlpProcessor: NLPProcessor,
    private contextBuilder: ContextBuilder,
    private toolRegistry: ToolRegistry,
    private commandExecutor: CommandExecutor,
    private context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

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
            await this.handleUserMessage(message.text);
            return;
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder,
    toolRegistry: ToolRegistry,
    commandExecutor: CommandExecutor,
    context: vscode.ExtensionContext
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
      'OpenRouter Crew',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'out/webview')
        ],
        retainContextWhenHidden: true
      }
    );

    ChatPanel.currentPanel = new ChatPanel(
      panel,
      extensionUri,
      llmRouter,
      costTracker,
      nlpProcessor,
      contextBuilder,
      toolRegistry,
      commandExecutor,
      context
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder,
    toolRegistry: ToolRegistry,
    commandExecutor: CommandExecutor,
    context: vscode.ExtensionContext
  ) {
    ChatPanel.currentPanel = new ChatPanel(
      panel,
      extensionUri,
      llmRouter,
      costTracker,
      nlpProcessor,
      contextBuilder,
      toolRegistry,
      commandExecutor,
      context
    );
  }

  public async ask(prompt: string) {
      // Send prompt to webview to display it immediately
      this._panel.webview.postMessage({ command: 'addMessage', role: 'user', text: prompt });
      await this.handleUserMessage(prompt);
  }

  private async handleUserMessage(text: string) {
    try {
        const intent = await this.nlpProcessor.detectIntent(text);
        const context = await this.contextBuilder.buildContext(text);
        
        let responseContent = '';
        let cost = 0;
        let model = '';

        // Optimization: Use LLMRouter directly for simple questions to save overhead
        if (intent.intent === 'ASK' && intent.complexity === 'LOW') {
             const response = await this.llmRouter.route({
                prompt: text,
                intent: 'ASK',
                complexity: 'LOW'
             });
             responseContent = response.content;
             cost = response.costUSD;
             model = response.model;
        } else {
            // Use CommandExecutor (Agent Network) for complex tasks
            const result = await this.commandExecutor.executeTask(text, { 
                intent: intent.intent, 
                complexity: intent.complexity,
                context 
            });
            responseContent = result.output;
            cost = result.cost;
            model = result.model;
        }

        this._panel.webview.postMessage({ 
            command: 'addMessage', 
            role: 'assistant', 
            text: responseContent,
            meta: { cost, model }
        });

    } catch (error) {
        this._panel.webview.postMessage({ 
            command: 'addMessage', 
            role: 'system', 
            text: `Error: ${error instanceof Error ? error.message : String(error)}` 
        });
    }
  }

  public dispose() {
    ChatPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenRouter Crew Chat</title>
        <style>
            :root {
                --container-padding: 20px;
            }
            body {
                margin: 0;
                padding: 0;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                font-family: var(--vscode-font-family);
                display: flex;
                flex-direction: column;
                height: 100vh;
                overflow: hidden;
            }
            #chat-container {
                flex: 1;
                overflow-y: auto;
                padding: var(--container-padding);
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .message {
                display: flex;
                flex-direction: column;
                max-width: 85%;
                padding: 8px 12px;
                border-radius: 6px;
                line-height: 1.4;
                word-wrap: break-word;
                font-size: var(--vscode-editor-font-size);
            }
            .message.user {
                align-self: flex-end;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            .message.assistant {
                align-self: flex-start;
                background-color: var(--vscode-editor-inactiveSelectionBackground);
                border: 1px solid var(--vscode-widget-border);
            }
            .message.system {
                align-self: center;
                font-style: italic;
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
            }
            .meta {
                font-size: 0.75em;
                margin-top: 4px;
                opacity: 0.7;
                text-align: right;
            }
            #input-container {
                padding: var(--container-padding);
                background-color: var(--vscode-editor-background);
                border-top: 1px solid var(--vscode-widget-border);
                display: flex;
                gap: 10px;
            }
            #message-input {
                flex: 1;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 8px;
                border-radius: 2px;
                resize: none;
                font-family: inherit;
                min-height: 24px;
                max-height: 150px;
            }
            #message-input:focus {
                outline: 1px solid var(--vscode-focusBorder);
            }
            #send-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 2px;
                cursor: pointer;
            }
            #send-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            pre {
                background-color: var(--vscode-textBlockQuote-background);
                padding: 8px;
                border-radius: 4px;
                overflow-x: auto;
            }
            code {
                font-family: var(--vscode-editor-font-family);
            }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <div class="message system">Welcome to OpenRouter Crew! How can I help you today?</div>
        </div>
        <div id="input-container">
            <textarea id="message-input" rows="1" placeholder="Ask a question or describe a task..."></textarea>
            <button id="send-button">Send</button>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            const chatContainer = document.getElementById('chat-container');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');

            messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });

            function addMessage(role, text, meta) {
                const div = document.createElement('div');
                div.className = 'message ' + role;
                
                let formatted = text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                
                formatted = formatted.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
                formatted = formatted.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
                formatted = formatted.replace(/\\n/g, '<br>');

                div.innerHTML = formatted;

                if (meta) {
                    const metaDiv = document.createElement('div');
                    metaDiv.className = 'meta';
                    let metaText = '';
                    if (meta.model) metaText += meta.model + ' ';
                    if (meta.cost) metaText += '($' + Number(meta.cost).toFixed(5) + ')';
                    metaDiv.textContent = metaText;
                    div.appendChild(metaDiv);
                }

                chatContainer.appendChild(div);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            function sendMessage() {
                const text = messageInput.value.trim();
                if (text) {
                    vscode.postMessage({ command: 'sendMessage', text: text });
                    messageInput.value = '';
                    messageInput.style.height = 'auto';
                }
            }

            sendButton.addEventListener('click', sendMessage);
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'addMessage':
                        addMessage(message.role, message.text, message.meta);
                        break;
                }
            });
        </script>
    </body>
    </html>`;
  }
}