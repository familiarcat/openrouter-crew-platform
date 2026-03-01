import * as assert from 'assert';
import * as vscode from 'vscode';
import { WelcomePanel } from './welcome-panel.js';

suite('WelcomePanel Test Suite', () => {
    let mockWebviewPanel: any;
    let mockConfig: any;
    let showInfoMessageStub: any;
    let showErrorMessageStub: any;
    let originalFetch: any;

    setup(() => {
        // Mock WebviewPanel
        mockWebviewPanel = {
            webview: {
                html: '',
                onDidReceiveMessage: (callback: any) => {
                    mockWebviewPanel._postMessageToWebview = callback; 
                },
                asWebviewUri: (uri: any) => uri,
                options: {}
            },
            onDidDispose: () => {},
            reveal: () => {},
            dispose: () => {
                WelcomePanel.currentPanel = undefined;
            },
            viewType: 'openrouterCrewWelcome'
        };

        (vscode.window as any).createWebviewPanel = () => mockWebviewPanel;
        (vscode.Uri as any).joinPath = (...args: any[]) => vscode.Uri.file(args.join('/'));

        // Mock Configuration
        mockConfig = {
            update: async () => {}
        };
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        // Mock Window messages
        showInfoMessageStub = (vscode.window as any).showInformationMessage = async () => {};
        showErrorMessageStub = (vscode.window as any).showErrorMessage = async () => {};

        // Mock global fetch
        originalFetch = global.fetch;
    });

    teardown(() => {
        if (WelcomePanel.currentPanel) {
            WelcomePanel.currentPanel.dispose();
        }
        global.fetch = originalFetch;
    });

    test('createOrShow creates a new panel', () => {
        WelcomePanel.createOrShow(vscode.Uri.file('/'));
        assert.ok(WelcomePanel.currentPanel);
    });

    test('saveSettings updates configuration', async () => {
        WelcomePanel.createOrShow(vscode.Uri.file('/'));
        
        let updatedKeys: string[] = [];
        mockConfig.update = async (key: string, value: any) => {
            updatedKeys.push(key);
        };

        await mockWebviewPanel._postMessageToWebview({ 
            command: 'saveSettings', 
            settings: { 
                apiKey: 'test-key',
                supabaseUrl: 'https://test.supabase.co'
            } 
        });

        assert.ok(updatedKeys.includes('apiKey'));
        assert.ok(updatedKeys.includes('supabaseUrl'));
    });

    test('testConnection handles success', async () => {
        WelcomePanel.createOrShow(vscode.Uri.file('/'));

        // Mock successful fetch
        global.fetch = async () => ({
            ok: true,
            json: async () => ({})
        } as any);

        let infoMessage = '';
        (vscode.window as any).showInformationMessage = async (msg: string) => {
            infoMessage = msg;
        };

        await mockWebviewPanel._postMessageToWebview({ 
            command: 'testConnection', 
            apiKey: 'valid-key' 
        });

        assert.ok(infoMessage.includes('Connection Successful'));
    });

    test('testConnection handles failure', async () => {
        WelcomePanel.createOrShow(vscode.Uri.file('/'));

        // Mock failed fetch
        global.fetch = async () => ({
            ok: false,
            statusText: 'Unauthorized'
        } as any);

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = async (msg: string) => {
            errorMessage = msg;
        };

        await mockWebviewPanel._postMessageToWebview({ 
            command: 'testConnection', 
            apiKey: 'invalid-key' 
        });

        assert.ok(errorMessage.includes('Connection Failed'));
    });
});