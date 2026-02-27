import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router.js';
import { CostTracker } from '../services/cost-tracker.js';
import { NLPProcessor } from '../services/nlp-processor.js';
import { ContextBuilder } from '../services/context-builder.js';
import { ToolRegistry } from '../services/tool-registry.js';

export class ChatPanel {
    public static readonly viewType = 'openrouterCrewChat';
    public static currentPanel: ChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private _llmRouter: LLMRouter;
    private _costTracker: CostTracker;
    private _nlpProcessor: NLPProcessor;
    private _contextBuilder: ContextBuilder;
    private _toolRegistry: ToolRegistry;
    public readonly profile = { name: 'ChatPanel' };
    private _context: vscode.ExtensionContext;
    private _conversationHistory: any[] = [];
    private _abortController: AbortController | undefined;
    private static readonly HISTORY_KEY = 'openrouter-crew.chatHistory';

    public static createOrShow(
        extensionUri: vscode.Uri,
        llmRouter: LLMRouter,
        costTracker: CostTracker,
        nlpProcessor: NLPProcessor,
        contextBuilder: ContextBuilder,
        toolRegistry: ToolRegistry,
        context: vscode.ExtensionContext
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ChatPanel.viewType,
            'OpenRouter Crew Chat',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media'), vscode.Uri.joinPath(extensionUri, 'out')]
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder, toolRegistry, context);
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        llmRouter: LLMRouter,
        costTracker: CostTracker,
        nlpProcessor: NLPProcessor,
        contextBuilder: ContextBuilder,
        toolRegistry: ToolRegistry,
        context: vscode.ExtensionContext
    ) {
        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, llmRouter, costTracker, nlpProcessor, contextBuilder, toolRegistry, context);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        llmRouter: LLMRouter,
        costTracker: CostTracker,
        nlpProcessor: NLPProcessor,
        contextBuilder: ContextBuilder,
        toolRegistry: ToolRegistry,
        context: vscode.ExtensionContext
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._llmRouter = llmRouter;
        this._costTracker = costTracker;
        this._nlpProcessor = nlpProcessor;
        this._contextBuilder = contextBuilder;
        this._toolRegistry = toolRegistry;
        this._context = context;

        this._update();

        this._loadHistory();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'sendMessage':
                        await this.handleUserMessage(message.text);
                        return;
                    case 'clearHistory':
                        this._conversationHistory = [];
                        await this._saveHistory();
                        this._panel.webview.postMessage({ command: 'historyCleared' });
                        return;
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'regenerate':
                        await this._handleRegenerate();
                        return;
                    case 'stopGenerating':
                        this._stopGenerating();
                        return;
                    case 'retry':
                        await this._handleRetry();
                        return;
                    case 'applyCode':
                        await this._handleApplyCode(message.text);
                        return;
                    case 'saveCode':
                        await this._handleSaveCode(message.text);
                        return;
                    case 'diffCode':
                        await this._handleDiffCode(message.text);
                        return;
                    case 'copySession':
                        await this._handleCopySession();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private _loadHistory() {
        this._conversationHistory = this._context.globalState.get<any[]>(ChatPanel.HISTORY_KEY) || [];
        if (this._conversationHistory.length > 0) {
            this._panel.webview.postMessage({ command: 'restoreHistory', history: this._conversationHistory });
        }
    }

    private async _saveHistory() {
        await this._context.globalState.update(ChatPanel.HISTORY_KEY, this._conversationHistory);
    }

    public async ask(text: string) {
        // Ensure panel is visible
        this._panel.reveal();
        
        // Show user message in UI
        this._panel.webview.postMessage({ command: 'userMessage', text });
        
        // Process
        await this.handleUserMessage(text);
    }

    private _stopGenerating() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = undefined;
        }
    }

    private async _handleApplyCode(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, code);
            });
            vscode.window.showInformationMessage('Code applied to editor.');
        } else {
            vscode.window.showErrorMessage('No active editor to apply code.');
        }
    }

    private async _handleSaveCode(code: string) {
        const uri = await vscode.window.showSaveDialog({
            saveLabel: 'Save Code',
            title: 'Save Generated Code'
        });

        if (uri) {
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(uri, encoder.encode(code));
            await vscode.window.showTextDocument(uri);
            vscode.window.showInformationMessage(`Code saved to ${uri.fsPath}`);
        }
    }

    private async _handleDiffCode(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor to compare with.');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const languageId = editor.document.languageId;

        try {
            const docLeft = await vscode.workspace.openTextDocument({ content: selectedText, language: languageId });
            const docRight = await vscode.workspace.openTextDocument({ content: code, language: languageId });

            await vscode.commands.executeCommand('vscode.diff', docLeft.uri, docRight.uri, 'Current Selection ↔ Generated Code');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open diff view: ${error}`);
        }
    }

    private async _handleCopySession() {
        try {
            const sessionText = this._conversationHistory.map(msg => {
                const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
                let content = msg.content || '';
                if (msg.tool_calls) {
                    content += `\n[Tool Calls: ${JSON.stringify(msg.tool_calls)}]`;
                }
                return `### ${role}\n${content}\n`;
            }).join('\n');

            await vscode.env.clipboard.writeText(sessionText);
            vscode.window.showInformationMessage('Chat session copied to clipboard.');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to copy session.');
        }
    }

    private async handleUserMessage(text: string) {
        this._conversationHistory.push({ role: 'user', content: text });
        await this._saveHistory();
        await this._processResponse(text);
    }

    private async _handleRegenerate() {
        // Remove last assistant message if present
        if (this._conversationHistory.length > 0 && this._conversationHistory[this._conversationHistory.length - 1].role === 'assistant') {
            this._conversationHistory.pop();
        }
        
        // Find last user message
        let lastUserText = '';
        for (let i = this._conversationHistory.length - 1; i >= 0; i--) {
            if (this._conversationHistory[i].role === 'user') {
                lastUserText = this._conversationHistory[i].content;
                break;
            }
        }

        if (lastUserText) {
            await this._saveHistory();
            this._panel.webview.postMessage({ command: 'removeLastAssistantMessage' });
            await this._processResponse(lastUserText);
        }
    }

    private async _handleRetry() {
        await this._handleRegenerate();
    }

    private async _processResponse(text: string) {
        if (this._abortController) {
            this._abortController.abort();
        }
        this._abortController = new AbortController();
        const signal = this._abortController.signal;

        this._panel.webview.postMessage({ command: 'showThinking' });

        try {
            const MAX_TURNS = 5; // Prevent infinite loops
            let turns = 0;

            while (turns < MAX_TURNS) {
                if (signal.aborted) throw new Error('Aborted');
                turns++;

                const contextString = await this._contextBuilder.buildContext(text);
                const messages = [
                    { role: 'system', content: 'You are a helpful AI assistant integrated into VSCode. Use the provided context to answer questions. You can use tools.' },
                    ...this._conversationHistory,
                    { role: 'system', content: `CONTEXT:\n${contextString}` }
                ];

                const response = await this._llmRouter.route({
                    messages: messages,
                    hint: 'quality',
                    tools: this._toolRegistry.getToolDefinitions()
                }, signal);

                // Case 1: Assistant provides a direct answer
                if (response.content) {
                    this._conversationHistory.push({ role: 'assistant', content: response.content });
                    await this._saveHistory();
                    this._panel.webview.postMessage({ command: 'addResponse', text: response.content });
                    break; // Exit loop
                }

                // Case 2: Assistant wants to use tools
                if (response.tool_calls && response.tool_calls.length > 0) {
                    this._conversationHistory.push({ role: 'assistant', tool_calls: response.tool_calls });

                    for (const toolCall of response.tool_calls) {
                        this._panel.webview.postMessage({ command: 'showToolUse', toolName: toolCall.function.name });
                        const result = await this._toolRegistry.executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments), this as any);
                        this._conversationHistory.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                            content: JSON.stringify(result)
                        });
                    }
                    await this._saveHistory();
                    continue; // Continue loop to send tool output back to LLM
                }
                
                // Case 3: No content and no tool calls
                this._panel.webview.postMessage({ command: 'addResponse', text: 'I received a response, but it was empty.' });
                break; // Exit loop
            }

            if (turns >= MAX_TURNS) {
                this._panel.webview.postMessage({ command: 'addResponse', text: 'Sorry, I seem to be stuck in a loop.' });
            }
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted') {
                this._panel.webview.postMessage({ command: 'addResponse', text: 'Generation stopped.', isError: true });
            } else {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                vscode.window.showErrorMessage(`Chat Error: ${errorMessage}`);
                this._panel.webview.postMessage({ command: 'addResponse', text: `Sorry, an error occurred: ${errorMessage}`, isError: true });
            }
        } finally {
            this._abortController = undefined;
            this._panel.webview.postMessage({ command: 'hideThinking' });
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
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OpenRouter Crew Chat</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 0; margin: 0; color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); }
                .chat-container { display: flex; flex-direction: column; height: 100vh; }
                .messages { flex: 1; overflow-y: auto; padding: 10px; }
                .input-area { display: flex; gap: 10px; padding: 10px; border-top: 1px solid var(--vscode-widget-border); }
                input { flex: 1; padding: 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
                button { padding: 8px 15px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; border-radius: 4px; }
                button:hover { background: var(--vscode-button-hoverBackground); }
                button:disabled { background: var(--vscode-button-secondaryBackground); cursor: not-allowed; }
                .message { margin-bottom: 10px; padding: 8px 12px; border-radius: 8px; max-width: 80%; }
                .message.user { background-color: var(--vscode-list-activeSelectionBackground); align-self: flex-end; margin-left: auto; }
                .message.assistant { background-color: var(--vscode-editorWidget-background); align-self: flex-start; }
                .message strong { color: var(--vscode-textLink-foreground); }
                .thinking { text-align: center; padding: 10px; font-style: italic; opacity: 0.7; }
                .stop-btn { background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); padding: 4px 8px; margin-left: 10px; cursor: pointer; font-size: 0.9em; border-radius: 2px; }
                .stop-btn:hover { background-color: var(--vscode-button-secondaryHoverBackground); }
                .tool-use { font-style: italic; opacity: 0.8; background-color: var(--vscode-editorWidget-background); align-self: center; font-size: 0.9em; padding: 4px 8px; margin: 5px auto; }
                .error-message { border-left: 3px solid var(--vscode-errorForeground); }
                .header { display: flex; justify-content: flex-end; padding: 5px 10px; border-bottom: 1px solid var(--vscode-widget-border); }
                .icon-btn { background: none; border: none; cursor: pointer; color: var(--vscode-foreground); opacity: 0.7; padding: 4px; }
                .icon-btn:hover { opacity: 1; background-color: var(--vscode-toolbar-hoverBackground); border-radius: 4px; }
                
                /* Code Block Styles */
                .code-block { background: var(--vscode-textBlockQuote-background); border: 1px solid var(--vscode-textBlockQuote-border); border-radius: 4px; margin: 10px 0; position: relative; overflow: hidden; }
                .code-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 10px; background: var(--vscode-editor-inactiveSelectionBackground); border-bottom: 1px solid var(--vscode-textBlockQuote-border); }
                .code-lang { font-family: var(--vscode-editor-font-family); font-size: 0.85em; font-weight: bold; opacity: 0.8; }
                .copy-btn { background: none; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; font-size: 0.85em; padding: 2px 6px; border-radius: 2px; }
                .copy-btn:hover { background-color: var(--vscode-toolbar-hoverBackground); }
                .code-actions { display: flex; gap: 5px; }
                .message-actions { display: flex; justify-content: flex-end; margin-top: 5px; opacity: 0.7; }
                .message-actions:hover { opacity: 1; }
                pre { margin: 0; padding: 10px; overflow-x: auto; font-family: var(--vscode-editor-font-family); font-size: 0.9em; }
                code { font-family: var(--vscode-editor-font-family); }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <div class="header">
                    <button id="clearBtn" class="icon-btn" title="Clear History">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11 1.75V3h2.25c.966 0 1.75.784 1.75 1.75V14.25c0 .966-.784 1.75-1.75 1.75H2.75C1.784 16 .966 15.216.966 14.25V4.75C.966 3.784 1.75 3 2.75 3H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zm-5 0v1.25h4V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25zM2.75 4.5a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V4.75a.25.25 0 0 0-.25-.25H2.75z"/></svg>
                    </button>
                    <button id="copyBtn" class="icon-btn" title="Copy Session">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 3.414L13.586 5A2 2 0 0 1 14 6.414V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4zm2 0v10h6V6.5H10.5a.5.5 0 0 1-.5-.5V4H6z"/><path d="M2 6v7a3 3 0 0 0 3 3h5v-1H5a2 2 0 0 1-2-2V6H2z"/></svg>
                    </button>
                </div>
                <div class="messages" id="messages">
                    <div class="message assistant"><strong>System:</strong> Welcome to OpenRouter Crew Chat! How can I help you today?</div>
                </div>
                <div class="thinking" id="thinking" style="display: none;">
                    <span>Thinking...</span>
                    <button id="stopBtn" class="stop-btn">Stop Generating</button>
                </div>
                <div class="input-area">
                    <input type="text" id="messageInput" placeholder="Ask your crew..." />
                    <button id="sendBtn">Send</button>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const sendBtn = document.getElementById('sendBtn');
                const clearBtn = document.getElementById('clearBtn');
                const copyBtn = document.getElementById('copyBtn');
                const stopBtn = document.getElementById('stopBtn');
                const input = document.getElementById('messageInput');
                const messagesContainer = document.getElementById('messages');
                const thinkingIndicator = document.getElementById('thinking');

                function sendMessage() {
                    const text = input.value;
                    if (text) {
                        const p = document.createElement('div');
                        p.className = 'message user';
                        p.innerHTML = '<strong>You:</strong> ' + text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        messagesContainer.appendChild(p);
                        input.value = '';
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;

                        vscode.postMessage({
                            command: 'sendMessage',
                            text: text
                        });
                    }
                }

                sendBtn.addEventListener('click', sendMessage);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMessage();
                });

                clearBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'clearHistory' });
                });

                copyBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'copySession' });
                });

                stopBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'stopGenerating' });
                });

                // Copy Code Function
                window.copyCode = function(btn) {
                    const codeBlock = btn.closest('.code-block');
                    const rawCode = codeBlock.querySelector('.raw-code').value;
                    navigator.clipboard.writeText(rawCode).then(() => {
                        const originalText = btn.innerText;
                        btn.innerText = 'Copied!';
                        setTimeout(() => btn.innerText = originalText, 2000);
                    });
                };

                window.applyCode = function(btn) {
                    const codeBlock = btn.closest('.code-block');
                    const rawCode = codeBlock.querySelector('.raw-code').value;
                    vscode.postMessage({
                        command: 'applyCode',
                        text: rawCode
                    });
                };

                window.saveCode = function(btn) {
                    const codeBlock = btn.closest('.code-block');
                    const rawCode = codeBlock.querySelector('.raw-code').value;
                    vscode.postMessage({
                        command: 'saveCode',
                        text: rawCode
                    });
                };

                window.diffCode = function(btn) {
                    const codeBlock = btn.closest('.code-block');
                    const rawCode = codeBlock.querySelector('.raw-code').value;
                    vscode.postMessage({
                        command: 'diffCode',
                        text: rawCode
                    });
                };

                function formatMessage(text) {
                    // Split by code blocks
                    const parts = text.split(/(\`\`\`[\\s\\S]*?\`\`\`)/g);
                    return parts.map(part => {
                        if (part.startsWith('\`\`\`') && part.endsWith('\`\`\`')) {
                            const match = part.match(/\`\`\`(\\w+)?\\n?([\\s\\S]*?)\`\`\`/);
                            if (match) {
                                const lang = match[1] || 'text';
                                const code = match[2];
                                const escapedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                                return '<div class="code-block">' +
                                    '<div class="code-header">' +
                                        '<span class="code-lang">' + lang + '</span>' +
                                        '<div class="code-actions">' +
                                            '<button class="copy-btn" onclick="copyCode(this)">Copy</button>' +
                                            '<button class="copy-btn" onclick="applyCode(this)">Apply</button>' +
                                            '<button class="copy-btn" onclick="diffCode(this)">Diff</button>' +
                                            '<button class="copy-btn" onclick="saveCode(this)">Save</button>' +
                                        '</div>' +
                                    '</div>' +
                                    '<pre><code>' + escapedCode + '</code></pre>' +
                                    '<textarea style="display:none" class="raw-code">' + code + '</textarea>' +
                                '</div>';
                            }
                            return part;
                        } else {
                            let formatted = part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            formatted = formatted.replace(/\\*\\*([^*]+?)\\*\\*/g, '<strong>$1</strong>');
                            formatted = formatted.replace(/\\x60([^\\x60]+)\\x60/g, '<code>$1</code>');
                            return formatted.replace(/\\n/g, '<br>');
                        }
                    }).join('');
                }

                function appendUserMessage(text) {
                    const p = document.createElement('div');
                    p.className = 'message user';
                    p.innerHTML = '<strong>You:</strong> ' + text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    messagesContainer.appendChild(p);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'addResponse':
                            const assistantMsg = document.createElement('div');
                            assistantMsg.className = 'message assistant';
                            if (message.isError) {
                                assistantMsg.classList.add('error-message');
                            }
                            const formattedText = formatMessage(message.text);
                            assistantMsg.innerHTML = '<strong>Crew:</strong> ' + formattedText; 
                            
                            // Add Actions
                            const actions = document.createElement('div');
                            actions.className = 'message-actions';
                            
                            if (message.isError) {
                                const retryBtn = document.createElement('button');
                                retryBtn.className = 'icon-btn';
                                retryBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg> Retry';
                                retryBtn.title = 'Retry request';
                                retryBtn.onclick = () => { vscode.postMessage({ command: 'retry' }); };
                                actions.appendChild(retryBtn);
                            } else {
                                const regenBtn = document.createElement('button');
                                regenBtn.className = 'icon-btn';
                                regenBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 1h-7a.5.5 0 0 0-.5.5v3.5h-1a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-3.5h1a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5zm-7 10.5v-6h3v1h-2v5h-1zm3.5-3v-3h3v3h-3zm3.5 3v-2.5h-1v-1h1a.5.5 0 0 0 .5-.5v-3h1v7h-1.5z"/></svg> Regenerate';
                                regenBtn.title = 'Regenerate response';
                                regenBtn.onclick = () => { vscode.postMessage({ command: 'regenerate' }); };
                                actions.appendChild(regenBtn);
                            }
                            assistantMsg.appendChild(actions);

                            messagesContainer.appendChild(assistantMsg);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            break;
                        case 'showThinking':
                            thinkingIndicator.style.display = 'block';
                            sendBtn.disabled = true;
                            input.disabled = true;
                            break;
                        case 'hideThinking':
                            thinkingIndicator.style.display = 'none';
                            sendBtn.disabled = false;
                            input.disabled = false;
                            input.focus();
                            break;
                        case 'restoreHistory':
                            messagesContainer.innerHTML = '<div class="message assistant"><strong>System:</strong> Welcome back! Loading your conversation...</div>';
                            message.history.forEach((msg, index) => {
                                if (msg.role === 'user') {
                                    const p = document.createElement('div');
                                    p.className = 'message user';
                                    p.innerHTML = '<strong>You:</strong> ' + msg.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                                    messagesContainer.appendChild(p);
                                } else if (msg.role === 'assistant' && msg.content) {
                                    const p = document.createElement('div');
                                    p.className = 'message assistant';
                                    p.innerHTML = '<strong>Crew:</strong> ' + formatMessage(msg.content);
                                    
                                    // Only add Regenerate button to the last message if it's from the assistant
                                    if (index === message.history.length - 1) {
                                        const actions = document.createElement('div');
                                        actions.className = 'message-actions';
                                        const regenBtn = document.createElement('button');
                                        regenBtn.className = 'icon-btn';
                                        regenBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.5 1h-7a.5.5 0 0 0-.5.5v3.5h-1a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-3.5h1a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5zm-7 10.5v-6h3v1h-2v5h-1zm3.5-3v-3h3v3h-3zm3.5 3v-2.5h-1v-1h1a.5.5 0 0 0 .5-.5v-3h1v7h-1.5z"/></svg> Regenerate';
                                        regenBtn.title = 'Regenerate response';
                                        regenBtn.onclick = () => { vscode.postMessage({ command: 'regenerate' }); };
                                        actions.appendChild(regenBtn);
                                        p.appendChild(actions);
                                    }

                                    messagesContainer.appendChild(p);
                                }
                            });
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            break;
                        case 'showToolUse':
                            const toolMsg = document.createElement('div');
                            toolMsg.className = 'message tool-use';
                            toolMsg.innerHTML = \`Using tool: <strong>\${message.toolName}</strong>...\`;
                            messagesContainer.appendChild(toolMsg);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            break;
                        case 'historyCleared':
                            messagesContainer.innerHTML = '<div class="message assistant"><strong>System:</strong> History cleared.</div>';
                            break;
                        case 'userMessage':
                            appendUserMessage(message.text);
                            break;
                        case 'removeLastAssistantMessage':
                            const messages = messagesContainer.querySelectorAll('.message.assistant');
                            if (messages.length > 0) {
                                messages[messages.length - 1].remove();
                            }
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}