import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function testCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context || !context.selectedCode) {
        vscode.window.showInformationMessage('Please select the code you want to generate tests for.');
        return;
    }

    const filePath = editor.document.fileName;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating tests...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.generateTests(context.selectedCode!, filePath);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: `Unit Test Generation (${context.languageId})`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: context.selectedCode!
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Test generation failed: ${error.message}`);
        }
    });
}