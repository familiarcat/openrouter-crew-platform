import * as assert from 'assert';
import * as vscode from 'vscode';
import { debugCommand } from './debug.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Debug Command Test Suite', () => {
    let testContext: CommandTestContext;
    let originalGetDiagnostics: any;

    setup(() => {
        testContext = new CommandTestContext();
        originalGetDiagnostics = vscode.languages.getDiagnostics;
    });

    teardown(() => {
        testContext.restore();
        (vscode.languages as any).getDiagnostics = originalGetDiagnostics;
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

        let capturedError = '';
        testContext.commandExecutor.debug = async (error: string, context: any) => {
            capturedError = error;
            return { success: true, output: 'Fix', model: 'test', costUSD: 0 };
        };

        await debugCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.strictEqual(capturedError, 'Analyze this code for potential bugs, logical errors, and runtime issues.');
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

        let capturedError = '';
        testContext.commandExecutor.debug = async (error: string, context: any) => {
            capturedError = error;
            return { success: true, output: 'Fix', model: 'test', costUSD: 0 };
        };

        await debugCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.ok(capturedError.includes('Syntax error'));
    });
});