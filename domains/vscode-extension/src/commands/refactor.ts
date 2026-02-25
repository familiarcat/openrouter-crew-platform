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

    const quickPickItems = [
        { label: 'Improve readability and clarity', detail: 'Focus on variable names, comments, and structure.' },
        { label: 'Reduce complexity', detail: 'Simplify logic, break down large functions.' },
        { label: 'Add type hints', detail: 'Ensure all variables, parameters, and returns are typed.' },
        { label: 'Convert to async/await', detail: 'Modernize promise-based code.' },
        { label: 'Custom instruction...', detail: 'Enter your own refactoring prompt.' }
    ];

    const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select a refactoring goal or enter a custom one',
        title: 'Refactor Code'
    });

    if (!selected) return;

    let instruction = selected.label;
    if (instruction === 'Custom instruction...') {
        const customInstruction = await vscode.window.showInputBox({
            prompt: 'Custom Refactoring Instruction',
            placeHolder: 'e.g., "Extract the loop into a separate function"'
        });
        if (!customInstruction) {
            // User cancelled the input box
            return;
        }
        instruction = customInstruction;
    }

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

            // Extract code from the result to make it apply-able
            const refactoredCode = commandExecutor.extractCode(result.output, true);

            const logData: any = {
                title: `Refactor Request: ${instruction}`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: context.selectedCode!
                }
            };

            if (refactoredCode) {
                await editor.edit(editBuilder => {
                    editBuilder.replace(context.selectionRange, refactoredCode);
                });

                logData.applyCommand = {
                    command: 'openrouter-crew.applyRefactoring',
                    args: [refactoredCode, context.selectionRange]
                };
            } else {
                vscode.window.showWarningMessage('No code block found in refactoring response.');
            }
            outputLogger.logExchange(logData);
        } catch (error) {
            vscode.window.showErrorMessage(`Refactoring failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}