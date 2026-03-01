import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router.js';
import { CostTracker } from '../services/cost-tracker.js';
import { NLPProcessor } from '../services/nlp-processor.js';
import { ContextBuilder } from '../services/context-builder.js';
import { ToolRegistry } from '../services/tool-registry.js';
import { CommandExecutor } from '../commands/command-executor.js';

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    public static readonly viewType = 'openrouterCrewChat';
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

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'sendMessage':
                        await this.handleUserMessage(message.text);
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
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
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

    private _update() {
        this._panel.webview.html = this._getHtmlForWebview();
    }

    private _getHtmlForWebview() {
        // Placeholder for the actual HTML content loading
        return `<!DOCTYPE html><html><body>OpenRouter Crew Chat</body></html>`;
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
}