import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { OutputLogger } from '../ui/output-logger.js';
import { StructureView } from '../ui/structure-view.js';

export async function structureCommand(
    commandExecutor: CommandExecutor,
    outputLogger: OutputLogger,
    structureView: StructureView
): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'OpenRouter Crew: Analyzing project structure...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.structure();

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
        } catch (error: any) {
            vscode.window.showErrorMessage(`Structure analysis failed: ${error.message}`);
        }
    });
}