import * as assert from 'assert';
import * as vscode from 'vscode';
import { ChatPanel } from './ui/chat-panel.js';

suite('ChatPanel Test Suite', () => {
    let mockWebviewPanel: any;
    let receivedMessages: any[] = [];
    let mockCommandExecutor: any;
    let mockLLMRouter: any;
    let mockNLPProcessor: any;
    let mockContextBuilder: any;
    let mockToolRegistry: any;
    let mockCostTracker: any;

    setup(() => {
        receivedMessages = [];
        
        mockWebviewPanel = {
            webview: {
                html: '',
                onDidReceiveMessage: (callback: any) => {
                    mockWebviewPanel._postMessageToWebview = callback; 
                },
                postMessage: async (message: any) => {
                    receivedMessages.push(message);
                    return true;
                },
                asWebviewUri: (uri: any) => uri,
                options: {}
            },
            onDidDispose: () => {},
            reveal: () => {},
            dispose: () => {},
            viewType: 'openrouterCrewChat'
        };

        (vscode.window as any).createWebviewPanel = () => mockWebviewPanel;

        mockCommandExecutor = {
            executeTask: async () => ({
                output: 'Response from agent',
                model: 'test-model',
                cost: 0.001,
                executionTimeMs: 100
            })
        };

        mockLLMRouter = {
            route: async () => ({
                content: 'LLM Response',
                model: 'llm-model',
                costUSD: 0.0001
            })
        };

        mockNLPProcessor = {
            detectIntent: async () => ({
                intent: 'ASK',
                complexity: 'HIGH'
            })
        };

        mockContextBuilder = {
            buildContext: async () => 'context'
        };

        mockToolRegistry = {};
        mockCostTracker = {};
    });

    teardown(() => {
        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel.dispose();
        }
    });

    test('should handle user message and return response via CommandExecutor', async () => {
        ChatPanel.createOrShow(
            vscode.Uri.file('/'),
            mockLLMRouter,
            mockCostTracker,
            mockNLPProcessor,
            mockContextBuilder,
            mockToolRegistry,
            mockCommandExecutor,
            { extensionUri: vscode.Uri.file('/') } as any
        );

        // Simulate user message
        await mockWebviewPanel._postMessageToWebview({ command: 'sendMessage', text: 'Hello' });

        // Verify response
        const assistantMessage = receivedMessages.find(m => m.role === 'assistant');
        assert.ok(assistantMessage);
        assert.strictEqual(assistantMessage.text, 'Response from agent');
        assert.strictEqual(assistantMessage.meta.cost, 0.001);
    });
});