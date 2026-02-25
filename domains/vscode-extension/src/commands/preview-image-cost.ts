import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { selectImage, convertImageToBase64 } from '../utils/image-utils.js';

export async function previewImageCostCommand(
    commandExecutor: CommandExecutor
): Promise<void> {
    const targetUri = await selectImage('Estimate Cost');
    if (!targetUri) return;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'OpenRouter Crew: Estimating image cost...',
        cancellable: false
    }, async () => {
        try {
            const base64Image = await convertImageToBase64(targetUri);

            const estimate = await commandExecutor.estimateImageCost(base64Image);

            vscode.window.showInformationMessage(
                `Estimated Cost: $${estimate.cost.toFixed(6)} (${estimate.model})`,
                { 
                    modal: true, 
                    detail: `Input Tokens: ${estimate.inputTokens}\nOutput Tokens: ${estimate.outputTokens}\nComplexity: ${estimate.complexity}` 
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Cost estimation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}