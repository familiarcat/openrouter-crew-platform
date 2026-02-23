import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function generateCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger
): Promise<void> {
    const prompt = await vscode.window.showInputBox({
        prompt: 'Generate Code',
        placeHolder: 'Describe the code you want to generate (e.g., "Create a React component for a user profile card")'
    });

    if (!prompt) {
        return;
    }

    // Get context to provide a language hint to the command executor
    const editorContext = contextProvider.getEditorContext();
    const language = editorContext?.languageId;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating code...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.generate(prompt, language);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: `Code Generation Request: ${prompt}`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Code generation failed: ${error.message}`);
        }
    });
}