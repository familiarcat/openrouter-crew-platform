import * as assert from 'assert';
import * as vscode from 'vscode';
import { applyRefactoringCommand } from './apply-refactoring.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Apply Refactoring Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should apply code to explicit range', async () => {
        const newCode = 'const x = 2;';
        const range = { 
            start: { line: 0, character: 0 }, 
            end: { line: 0, character: 10 } 
        };

        let appliedCode = '';
        let appliedRange: vscode.Range | undefined;

        // Mock active editor edit
        (vscode.window.activeTextEditor as any).edit = async (callback: any) => {
            const editBuilder = {
                replace: (r: vscode.Range, c: string) => {
                    appliedRange = r;
                    appliedCode = c;
                }
            };
            callback(editBuilder);
            return true;
        };

        await applyRefactoringCommand(newCode, range);

        assert.strictEqual(appliedCode, newCode);
        assert.ok(appliedRange);
        assert.strictEqual(appliedRange.start.line, 0);
        assert.strictEqual(appliedRange.end.line, 0);
    });

    test('should fail gracefully if no editor active', async () => {
        (vscode.window as any).activeTextEditor = undefined;
        
        let errorMessage = '';
        (vscode.window as any).showErrorMessage = async (msg: string) => { errorMessage = msg; };

        await applyRefactoringCommand('code');

        assert.strictEqual(errorMessage, 'No active editor to apply changes.');
    });
});