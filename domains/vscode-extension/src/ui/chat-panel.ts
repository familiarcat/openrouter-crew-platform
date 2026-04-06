import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { CostTracker } from '../services/cost-tracker';
import { NLPProcessor } from '../services/nlp-processor';
import { ContextBuilder } from '../services/context-builder';
import { ToolRegistry } from '../services/tool-registry';
import { CommandExecutor } from '../commands/command-executor';
import { PromptManager } from '@openrouter-crew/agent-orchestration';
import { BridgeController, FleetDeck } from './bridge-controller';
import { AgentNetworkService } from '../services/agent-network';

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  public static readonly viewType = 'openrouterCrew.chatPanel';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private agentNetwork: AgentNetworkService,
    private llmRouter: LLMRouter,
    private costTracker: CostTracker,
    private nlpProcessor: NLPProcessor,
    private contextBuilder: ContextBuilder,
    private toolRegistry: ToolRegistry,
    private commandExecutor: CommandExecutor,
    private promptManager: PromptManager,
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
          case 'navigate':
            const bridge = BridgeController.getInstance(this.context, this.agentNetwork, this.costTracker);
            bridge.navigateToDeck(message.deck as FleetDeck);
            break;
          case 'sendMessage':
            await this.handleUserMessage(message.text);
            return;
          case 'applyCode':
            let targetPath = message.path;
            const activeEditor = vscode.window.activeTextEditor;

            if (!targetPath && activeEditor) {
                targetPath = activeEditor.document.uri.fsPath;
            }

            if (targetPath) {
                await vscode.commands.executeCommand('openrouter-crew.propose-change', targetPath, message.code);
            } else {
                vscode.window.showErrorMessage('Please specify a file path or open a target file to apply these changes.');
            }
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
    agentNetwork: AgentNetworkService,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder,
    toolRegistry: ToolRegistry,
    commandExecutor: CommandExecutor,
    promptManager: PromptManager,
    context: vscode.ExtensionContext,
    column?: vscode.ViewColumn
  ) {
    const targetColumn = column || (vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined);

    // If we already have a panel, show it.
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(targetColumn);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ChatPanel.viewType,
      'OpenRouter Crew',
      targetColumn || vscode.ViewColumn.One,
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
      agentNetwork,
      llmRouter,
      costTracker,
      nlpProcessor,
      contextBuilder,
      toolRegistry,
      commandExecutor,
      promptManager,
      context
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    agentNetwork: AgentNetworkService,
    llmRouter: LLMRouter,
    costTracker: CostTracker,
    nlpProcessor: NLPProcessor,
    contextBuilder: ContextBuilder,
    toolRegistry: ToolRegistry,
    commandExecutor: CommandExecutor,
    promptManager: PromptManager,
    context: vscode.ExtensionContext
  ) {
    ChatPanel.currentPanel = new ChatPanel(
      panel,
      extensionUri,
      agentNetwork,
      llmRouter,
      costTracker,
      nlpProcessor,
      contextBuilder,
      toolRegistry,
      commandExecutor,
      promptManager,
      context
    );
  }

  public async ask(prompt: string) {
      // Send prompt to webview to display it immediately
      this._panel.webview.postMessage({ command: 'addMessage', role: 'user', text: prompt });
      await this.handleUserMessage(prompt);
  }

  public addMessage(message: { role: string; text: string; meta?: any }) {
    this._panel.webview.postMessage({ command: 'addMessage', ...message });
  }

  private async handleUserMessage(text: string) {
    try {
        const config = vscode.workspace.getConfiguration('openrouter-crew');
        const projectId = config.get<string>('projectId') || 'default-project';

        // Step 1: Centralized Prompt Refinement (The "Universal" pass)
        // This uses local Ollama to architect the technical brief at $0 cost
        this._panel.webview.postMessage({ command: 'updateStatus', text: 'Architecting mission brief...' });
        const brief = await this.promptManager.architectMission(text, projectId);

        // Admiral's Directive: Automatically trigger deep file context for HIGH complexity tasks
        const context = await this.contextBuilder.buildContext(text, brief.complexity === 'HIGH' ? 16000 : 8000);
        
        let responseContent = '';
        let cost = 0;
        let responseModel = brief.selectedModel;

        if (brief.complexity === 'LOW') {
             const response = await this.llmRouter.route({
                prompt: `${brief.agentPersona}\n\n${brief.refinedPrompt}`,
                intent: 'ASK',
                complexity: 'LOW'
             });
             responseContent = response.content;
             cost = response.costUSD;
        } else {
            this._panel.webview.postMessage({ command: 'updateStatus', text: `Engaging ${brief.agentId}...` });

            // Use the refined, persona-aligned prompt for execution
            // Use the refined, persona-aligned prompt for high-complexity code editing
            const result = await this.commandExecutor.executeTask(brief.refinedPrompt, { 
                agentId: brief.agentId, 
                complexity: brief.complexity,
                context,
                systemPrompt: brief.agentPersona // Ensure agent has context
            });
            responseContent = result.output;
            cost = (result as any).costUSD || (result as any).cost;
            responseModel = result.model || responseModel;
        }

        this._panel.webview.postMessage({ command: 'updateStatus', text: 'Transmission complete.' });
        this._panel.webview.postMessage({ 
            command: 'addMessage', 
            role: 'assistant', 
            text: responseContent,
            meta: { cost, model: responseModel }
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

  private async _update() {
    const costMetrics = await this.costTracker.getCostMetrics('daily');
    this._panel.webview.html = this._getHtmlForWebview(costMetrics);
  }

  private _getHtmlForWebview(costMetrics: any) {
    let budgetAlertClass = '';
    if (costMetrics.percentUsed > 95) budgetAlertClass = 'alert-red';
    else if (costMetrics.percentUsed > 70) budgetAlertClass = 'alert-yellow';

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenRouter Crew Chat</title>
        <style>
            :root {
                --container-padding: 20px;
                /* Universal Dark Theme Variable Mapping */
                --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
                --color-bg-secondary: var(--vscode-editor-inactiveSelectionBackground, #252526);
                --color-text-primary: var(--vscode-editor-foreground, #cccccc);
                --color-text-secondary: var(--vscode-descriptionForeground, #858585);
                --color-border: var(--vscode-widget-border, #3e3e42);
                --color-primary-500: var(--vscode-button-background, #3b82f6);
                --color-primary-600: var(--vscode-button-hoverBackground, #2563eb);
                --color-success: #10b981;
                --color-warning: #f59e0b;
                --color-error: #ef4444;
            }

            /* Pedagogical Navigation System */
            .fleet-nav { display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid var(--color-border); padding: 10px 20px; background: var(--color-bg-primary); }
            .nav-item { 
                padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold;
                background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid transparent;
                transition: all 0.2s ease;
            }
            .nav-item:hover { background: var(--color-bg-secondary); border-color: var(--color-primary-500); }
            .nav-item.active { background: var(--color-primary-500); color: white; border-color: var(--color-primary-500); }
            .nav-arrow { opacity: 0.5; font-size: 1.1em; display: flex; align-items: center; }
            .fleet-nav.alert-yellow { border-bottom: 2px solid var(--color-warning); }
            .fleet-nav.alert-red { border-bottom: 2px solid var(--color-error); }

            body {
                margin: 0;
                padding: 0;
                color: var(--color-text-primary);
                background-color: var(--color-bg-primary);
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
                background-color: var(--color-primary-500);
                color: var(--vscode-button-foreground);
            }
            .message.assistant {
                align-self: flex-start;
                background-color: var(--color-bg-secondary);
                border: 1px solid var(--color-border);
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
                background-color: var(--color-bg-primary);
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
                background-color: var(--color-primary-500);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 2px;
                cursor: pointer;
            }
            #send-button:hover {
                background-color: var(--color-primary-600);
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
        <div class="fleet-nav ${budgetAlertClass}">
            <div class="nav-item" onclick="nav('STRATEGY')">1. STRATEGY</div>
            <div class="nav-arrow">→</div>
            <div class="nav-item active" onclick="nav('COMMAND')">2. COMMAND</div>
            <div class="nav-arrow">→</div>
            <div class="nav-item" onclick="nav('AUDIT')">3. AUDIT</div>
        </div>

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
                
                // Detect code blocks and inject "Propose Change" action button
                const codeBlockRegex = /\`\`\`([\w]*)\n?([\s\S]*?)\`\`\`/g;
                formatted = formatted.replace(codeBlockRegex, (match, lang, code, offset) => {
                    // Extract a file path hint from the text immediately preceding the code block
                    const precedingText = text.substring(Math.max(0, offset - 150), offset);
                    const fileHintMatch = precedingText.match(/(?:file|in|update|modify|for)\s*[:\s]*\`?([\w\.\-\/]+\.\w+)\`?/i);
                    const pathHint = fileHintMatch ? fileHintMatch[1] : '';
                    const displayPath = pathHint ? ' (' + pathHint.split('/').pop() + ')' : '';

                    // Unescape entities for the raw code payload, then fix encoding for UTF-8 support
                    const rawCode = code.trim()
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                    const encodedCode = Buffer.from(rawCode).toString('base64');
                    
                    return \`<div class="code-container">
                        <div class="code-header">
                            <span>\\\${lang || 'code'}</span>
                            <button class="apply-btn" onclick="applyCode('\\\${encodedCode}', '\\\${pathHint}')">Propose Change\\\${displayPath}</button>
                        </div>
                        <pre><code>\\\${code}</code></pre>
                    </div>\`;
                });

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

            function applyCode(encodedCode, pathHint) {
                const code = Buffer.from(encodedCode, 'base64').toString('utf-8');
                vscode.postMessage({ command: 'applyCode', code: code, path: pathHint });
            }

            function nav(deck) {
                vscode.postMessage({ command: 'navigate', deck: deck });
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