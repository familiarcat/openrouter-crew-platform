import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { ChatPanel } from '../ui/chat-panel';
import { executeAICommand } from './command-runner';
import { ContextBuilder } from '../services/context-builder';

/**
 * Manages the singleton Chat Webview Panel.
 */
class ChatView {
    public static currentPanel: ChatView | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly chatModel: ChatPanel;
    private disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private llmRouter: LLMRouter,
        private contextProvider: ContextProvider,
        private contextBuilder: ContextBuilder
    ) {
        this.panel = panel;
        this.chatModel = new ChatPanel();

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.html = this.chatModel.generateHTML();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'executeCommand') {
                    await this.handleUserMessage(message.text);
                }
            },
            null,
            this.disposables
        );
    }

    public static createOrShow(
        extensionUri: vscode.Uri,
        llmRouter: LLMRouter,
        contextProvider: ContextProvider,
        contextBuilder: ContextBuilder
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (ChatView.currentPanel) {
            ChatView.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'openrouterCrewChat',
            'Crew Chat',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
            }
        );

        ChatView.currentPanel = new ChatView(panel, extensionUri, llmRouter, contextProvider, contextBuilder);
    }

    private async handleUserMessage(prompt: string) {
        this.chatModel.addMessage('user', prompt);

        const contextString = await this.contextBuilder.buildContext(prompt);

        const response = await executeAICommand(this.llmRouter, 'Thinking...', {
            prompt,
            context: contextString,
            intent: 'ASK',
        });

        if (response) {
            const assistantMessage = this.chatModel.addMessage('assistant', response.content, { model: response.model, cost: response.cost });
            this.panel.webview.postMessage({ command: 'addMessage', ...assistantMessage });
        } else {
            const errorMessage = this.chatModel.addMessage('assistant', 'Sorry, an error occurred while processing your request.');
            this.panel.webview.postMessage({ command: 'addMessage', ...errorMessage });
        }
    }

    public dispose() {
        ChatView.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

export function chatCommand(context: vscode.ExtensionContext, llmRouter: LLMRouter, contextProvider: ContextProvider, contextBuilder: ContextBuilder) {
    ChatView.createOrShow(context.extensionUri, llmRouter, contextProvider, contextBuilder);
}