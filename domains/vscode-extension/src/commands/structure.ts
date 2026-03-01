import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { OutputLogger } from '../ui/output-logger.js';
import { StructureView } from '../ui/structure-view.js';
import { LLMResponse } from '../services/llm-router.js';

export async function structureCommand(
    commandExecutor: CommandExecutor,
    outputLogger: OutputLogger,
    structureView: StructureView
): Promise<void> {
    const focus = await vscode.window.showInputBox({
        prompt: 'Project Structure Analysis',
        placeHolder: 'Optional: Specify a focus area or question (e.g., "review the services directory")'
    });

    // If the user cancels, focus is undefined. If they enter only whitespace, treat it as no focus.
    const trimmedFocus = focus?.trim() ? focus.trim() : undefined;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'OpenRouter Crew: Analyzing project structure...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.structure(trimmedFocus);

            if (!result || !result.content) {
                throw new Error("Failed to generate structure analysis");
            }
            
            structureView.show(result);

            outputLogger.logExchange({
                title: 'Project Structure Analysis',
                model: result.model,
                cost: result.costUSD,
                content: result.content,
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Structure analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}