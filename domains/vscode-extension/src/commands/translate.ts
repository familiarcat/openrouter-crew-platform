import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function translateCommand(
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
        vscode.window.showInformationMessage('Please select the code containing comments to translate.');
        return;
    }

    const languages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 
        'Portuguese', 'Japanese', 'Chinese (Simplified)', 'Korean', 'Russian'
    ];

    const selectedLanguage = await vscode.window.showQuickPick(languages, {
        placeHolder: 'Select target language for comments',
        title: 'Translate Comments'
    });

    if (!selectedLanguage) return;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Translating comments to ${selectedLanguage}...`,
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.translate(context.selectedCode!, selectedLanguage);

            if (!result.success) {
                throw new Error(result.output);
            }

            const translatedCode = commandExecutor.extractCode(result.output, true);

            if (translatedCode) {
                await editor.edit(editBuilder => {
                    editBuilder.replace(context.selectionRange, translatedCode);
                });
            } else {
                vscode.window.showWarningMessage('No code block found in translation response.');
            }

            outputLogger.logExchange({
                title: `Translate Comments to ${selectedLanguage}`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: context.selectedCode!
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}