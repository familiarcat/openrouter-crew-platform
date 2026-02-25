import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function generateCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger
): Promise<void> {
    const quickPickItems = [
        { label: 'Generic Code', detail: 'Generate any code based on a description.' },
        { label: 'React Component', detail: 'Create a functional component with props and state.' },
        { label: 'API Endpoint', detail: 'Generate a REST or GraphQL endpoint.' },
        { label: 'Database Model', detail: 'Create a schema or entity definition.' },
        { label: 'Utility Function', detail: 'Create a helper function.' }
    ];

    const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select what to generate',
        title: 'Generate Code'
    });

    if (!selected) return;

    let promptPrefix = '';
    let placeHolder = 'Describe the code you want to generate...';

    if (selected.label !== 'Generic Code') {
        promptPrefix = `Create a ${selected.label}: `;
        placeHolder = `Describe the ${selected.label.toLowerCase()} details...`;
    }

    const input = await vscode.window.showInputBox({
        prompt: `Generate ${selected.label}`,
        placeHolder
    });

    if (input === undefined) {
        // User cancelled the input box
        return;
    }

    const prompt = promptPrefix + input;

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
        } catch (error) {
            vscode.window.showErrorMessage(`Code generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}