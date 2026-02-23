import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function debugCommand(
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
    if (!context) {
        vscode.window.showWarningMessage('No code selected or file is empty');
        return;
    }

    const codeToAnalyze = context.selectedCode || context.fileContent;
    const filePath = editor.document.fileName;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Debugging code...',
        cancellable: false
    }, async () => {
        try {
            // We pass a general instruction as the "error" since we are doing a proactive debug analysis
            const result = await commandExecutor.debug(
                "Analyze this code for potential bugs, logical errors, and runtime issues.",
                { code: codeToAnalyze, file: filePath }
            );

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: `Debug Analysis (${context.languageId})`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToAnalyze
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Debug analysis failed: ${error.message}`);
        }
    });
}