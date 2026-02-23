import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function refactorCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger,
    range?: vscode.Range
): Promise<void> {
    // If range provided (e.g. from CodeLens), select it first
    if (range && vscode.window.activeTextEditor) {
        vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.end);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context || !context.selectedCode) {
        vscode.window.showInformationMessage('Please select the code you want to refactor.');
        return;
    }

    const instruction = await vscode.window.showInputBox({
        prompt: 'Refactor Code',
        placeHolder: 'Enter refactoring instructions (e.g., "Extract method", "Improve variable names")'
    });

    if (!instruction) return;

    const filePath = editor.document.fileName;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Refactoring code...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.refactor(context.selectedCode!, filePath, instruction);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: `Refactor Request: ${instruction}`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: context.selectedCode!
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Refactoring failed: ${error.message}`);
        }
    });
}