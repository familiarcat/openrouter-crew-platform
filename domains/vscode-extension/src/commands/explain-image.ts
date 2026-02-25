import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { OutputLogger } from '../ui/output-logger.js';
import { selectImage, convertImageToBase64 } from '../utils/image-utils.js';

export async function explainImageCommand(
    commandExecutor: CommandExecutor,
    outputLogger: OutputLogger
): Promise<void> {
    const targetUri = await selectImage('Analyze Image');
    if (!targetUri) return;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'OpenRouter Crew: Analyzing image...',
        cancellable: false
    }, async () => {
        try {
            const base64Image = await convertImageToBase64(targetUri);

            const result = await commandExecutor.processImage(base64Image);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: 'Image Analysis',
                model: result.model,
                cost: result.costUSD,
                content: result.output
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Image analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}