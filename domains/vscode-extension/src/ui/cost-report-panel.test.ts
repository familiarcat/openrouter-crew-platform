import * as assert from 'assert';
import * as vscode from 'vscode';
import { CostReportPanel } from './cost-report-panel.js';

suite('CostReportPanel Test Suite', () => {
    let mockExtensionUri: vscode.Uri;
    let mockCostTracker: any;
    let mockWebviewPanel: any;

    setup(() => {
        mockExtensionUri = vscode.Uri.file('/mock/extension');
        mockCostTracker = {
            getCostMetrics: async () => ({
                totalCost: 10,
                budget: 100,
                remaining: 90,
                percentUsed: 10
            }),
            getLocalHistory: () => [],
            onDidCostUpdate: (callback: any) => { return { dispose: () => {} }; }
        };
        mockWebviewPanel = {
            webview: {
                html: '',
                onDidReceiveMessage: () => {},
                asWebviewUri: (uri: any) => uri
            },
            onDidDispose: () => {},
            reveal: () => {},
            dispose: () => {}
        };
        (vscode.window as any).createWebviewPanel = () => mockWebviewPanel;
        (vscode.Uri as any).joinPath = (...args: any[]) => vscode.Uri.file(args.join('/'));
    });

    teardown(() => {
        if (CostReportPanel.currentPanel) {
            CostReportPanel.currentPanel.dispose();
        }
    });

    test('createOrShow creates a new panel', () => {
        CostReportPanel.createOrShow(mockExtensionUri, mockCostTracker);
        assert.ok(CostReportPanel.currentPanel);
    });

    test('panel updates with cost metrics', async () => {
        CostReportPanel.createOrShow(mockExtensionUri, mockCostTracker);
        // Wait for async update
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.ok(mockWebviewPanel.webview.html.includes("Today's Cost"));
        assert.ok(mockWebviewPanel.webview.html.includes('$10.0000'));
    });
});