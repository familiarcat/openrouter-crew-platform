import * as assert from 'assert';
import * as vscode from 'vscode';
import { quickFixCommand } from './quick-fix.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Quick Fix Command Test Suite', () => {
    let testContext: CommandTestContext;
    let originalGetDiagnostics: any;
    let askedPrompt: string | undefined;

    setup(() => {
        testContext = new CommandTestContext();
        originalGetDiagnostics = vscode.languages.getDiagnostics;
        askedPrompt = undefined;
        // Mock ChatPanel
        ChatPanel.currentPanel = {
            ask: async (prompt: string) => {
                askedPrompt = prompt;
            }
        } as any;
    });

    teardown(() => {
        testContext.restore();
        (vscode.languages as any).getDiagnostics = originalGetDiagnostics;
        ChatPanel.currentPanel = undefined;
    });

    test('should apply fix for single diagnostic', async () => {
        const diagnostic = {
            message: 'Missing semicolon',
            range: new vscode.Range(0, 0, 0, 10),
            severity: vscode.DiagnosticSeverity.Error,
            source: 'ts'
        };
        (vscode.languages as any).getDiagnostics = () => [diagnostic];

        // Mock selection intersecting diagnostic
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'code',
            selectionRange: new vscode.Range(0, 0, 0, 5),
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        await quickFixCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Missing semicolon'));
    });

    test('should allow selection for multiple diagnostics', async () => {
        const d1 = { message: 'Error 1', range: new vscode.Range(0, 0, 0, 5), severity: 0 };
        const d2 = { message: 'Error 2', range: new vscode.Range(1, 0, 1, 5), severity: 0 };
        (vscode.languages as any).getDiagnostics = () => [d1, d2];

        // Mock selection not intersecting (uses closest logic, but here we test the picker)
        // Actually logic says: if relevantDiagnostics.length > 0 use them, else sort by distance.
        // If sorted list > 1, show picker.
        
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            selectionRange: new vscode.Range(10, 0, 10, 0), // Far away
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        testContext.mockQuickPick({ label: 'Error 1', diagnostic: d1 });

        await quickFixCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Error 1'));
    });
});