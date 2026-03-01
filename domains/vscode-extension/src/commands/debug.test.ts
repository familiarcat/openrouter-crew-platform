import * as assert from 'assert';
import * as vscode from 'vscode';
import { debugCommand } from './debug.js';
import { CommandTestContext } from './command-test-utils.js';
import { ChatPanel } from '../ui/chat-panel.js';

suite('Debug Command Test Suite', () => {
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

    test('should debug selected code directly', async () => {
        // Mock selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'broken code',
            fileContent: 'broken code',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        // Mock no diagnostics
        (vscode.languages as any).getDiagnostics = () => [];

        await debugCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Analyze this code for potential bugs'));
        assert.ok(askedPrompt.includes('broken code'));
    });

    test('should offer diagnostic selection if available and no selection', async () => {
        // Mock no selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'file content',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        // Mock diagnostics
        const diagnostic = {
            message: 'Syntax error',
            range: new vscode.Range(0, 0, 0, 10),
            severity: vscode.DiagnosticSeverity.Error,
            source: 'ts'
        };
        (vscode.languages as any).getDiagnostics = () => [diagnostic];

        // Mock QuickPick selection
        testContext.mockQuickPick({ 
            label: '$(error) Syntax error', 
            diagnostic: diagnostic 
        });

        await debugCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(askedPrompt);
        assert.ok(askedPrompt.includes('Syntax error'));
    });
});