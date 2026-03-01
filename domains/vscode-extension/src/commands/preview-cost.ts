import * as vscode from 'vscode';
import { ContextProvider } from '../services/context-provider.js';
import { CostEstimator } from '../services/cost-estimator.js';
import { LLMRequest } from '../services/llm-router.js';

export async function previewCostCommand(contextProvider: ContextProvider, costEstimator: CostEstimator): Promise<void> {
    try {
        const editorContext = contextProvider.getEditorContext();
        if (!editorContext || (!editorContext.selectedCode && !editorContext.fileContent)) {
            vscode.window.showWarningMessage('Please select code to preview cost.');
            return;
        }

        const modelForEstimation = 'openai/gpt-4o'; // Use a default high-quality model for estimation
        const codeToEstimate = editorContext.selectedCode || editorContext.fileContent;
        const request: LLMRequest = {
            prompt: `GENERATE: ${codeToEstimate}`, // Create a mock request
            files: [{
                path: editorContext.fileName,
                content: codeToEstimate,
                language: editorContext.languageId
            }]
        };

        const estimatedCost = costEstimator.estimateRequestCost(request, modelForEstimation);
        
        vscode.window.showInformationMessage(
            `Estimated Cost for '${modelForEstimation}': $${estimatedCost.toFixed(6)}`,
            { modal: true }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to preview cost: ${error instanceof Error ? error.message : String(error)}`);
    }
}