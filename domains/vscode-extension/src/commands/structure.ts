import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { OutputLogger } from '../ui/output-logger.js';
import { StructureView } from '../ui/structure-view.js';

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

            if (!result.success) {
                throw new Error(result.output);
            }
            
            // The structureView.show method expects an object with `content`.
            // We create a compatible object from our CommandResult.
            const viewResponse = {
                content: result.output,
                model: result.model,
                cost: result.costUSD,
                executionTimeMs: result.executionTimeMs,
            };

            structureView.show(viewResponse);

            outputLogger.logExchange({
                title: 'Project Structure Analysis',
                model: result.model,
                cost: result.costUSD,
                content: result.output,
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Structure analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}