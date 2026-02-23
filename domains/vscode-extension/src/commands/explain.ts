import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function explainCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context) {
        vscode.window.showWarningMessage('No code selected or file is empty');
        return;
    }

    const codeToExplain = context.selectedCode || context.fileContent;
    const filePath = editor.document.fileName;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Explaining code...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.explain(codeToExplain, filePath);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: 'Code Explanation',
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToExplain
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Explanation failed: ${error.message}`);
        }
    });
}