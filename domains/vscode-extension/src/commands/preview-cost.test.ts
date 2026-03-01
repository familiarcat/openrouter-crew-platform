import * as assert from 'assert';
import * as vscode from 'vscode';
import { previewCostCommand } from './preview-cost.js';
import { CommandTestContext } from './command-test-utils.js';

suite('Preview Cost Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should estimate cost for selected code', async () => {
        // Mock selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'const x = 1;',
            fileContent: 'const x = 1;',
            languageId: 'typescript',
            selectionRange: new vscode.Range(0, 0, 0, 10),
            fileName: '/test/file.ts'
        });

        // Mock estimator
        testContext.costEstimator.estimateRequestCost = (request: any, model: string) => {
            return 0.0005;
        };

        // Mock info message
        let infoMessage = '';
        (vscode.window as any).showInformationMessage = async (msg: string) => {
            infoMessage = msg;
        };

        await previewCostCommand(testContext.contextProvider, testContext.costEstimator);

        assert.ok(infoMessage.includes('$0.000500'));
        assert.ok(infoMessage.includes('openai/gpt-4o'));
    });

    test('should warn if no code selected', async () => {
        // Mock no selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: '',
            fileContent: 'file content',
            languageId: 'typescript',
            selectionRange: new vscode.Range(0, 0, 0, 0),
            fileName: '/test/file.ts'
        });

        let warningMessage = '';
        (vscode.window as any).showWarningMessage = async (msg: string) => {
            warningMessage = msg;
        };

        await previewCostCommand(testContext.contextProvider, testContext.costEstimator);

        assert.strictEqual(warningMessage, 'Please select code to preview cost.');
    });

    test('should handle errors gracefully', async () => {
        // Mock selection
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'code',
            fileContent: 'code',
            languageId: 'typescript',
            selectionRange: new vscode.Range(0, 0, 0, 10),
            fileName: '/test/file.ts'
        });

        testContext.costEstimator.estimateRequestCost = () => {
            throw new Error('Estimation error');
        };

        let errorMessage = '';
        (vscode.window as any).showErrorMessage = async (msg: string) => { errorMessage = msg; };

        await previewCostCommand(testContext.contextProvider, testContext.costEstimator);
        assert.ok(errorMessage.includes('Estimation error'));
    });
});