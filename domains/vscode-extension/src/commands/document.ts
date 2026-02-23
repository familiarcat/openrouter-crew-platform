import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function documentCommand(
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
        vscode.window.showInformationMessage('Please select a function or class to document.');
        return;
    }

    const codeToDocument = context.selectedCode;
    const selectionRange = context.selectionRange;
    const filePath = editor.document.fileName;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating documentation...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.document(codeToDocument, filePath);

            if (!result.success) {
                throw new Error(result.output);
            }

            await editor.edit(editBuilder => {
                editBuilder.replace(selectionRange, result.output);
            });
            await vscode.commands.executeCommand('editor.action.formatSelection');

            outputLogger.logExchange({
                title: `Documentation Generation (${context.languageId})`,
                model: result.model,
                cost: result.costUSD,
                content: 'Documentation applied to the editor.',
                contextCode: {
                    language: context.languageId,
                    code: codeToDocument,
                },
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Documentation generation failed: ${error.message}`);
        }
    });
}