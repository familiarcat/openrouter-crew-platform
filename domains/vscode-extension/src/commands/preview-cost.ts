import * as vscode from 'vscode';
import { ContextProvider } from '../services/context-provider.js';
import { CostEstimator } from '../services/cost-estimator.js';

export async function previewCostCommand(contextProvider: ContextProvider, costEstimator: CostEstimator): Promise<void> {
    try {
        const editorContext = contextProvider.getEditorContext();
        if (!editorContext || !editorContext.selectedCode) {
            vscode.window.showWarningMessage('Please select code to preview cost.');
            return;
        }

        const estimate = costEstimator.estimateRequestCost(editorContext.selectedCode, 'GENERATE');
        
        vscode.window.showInformationMessage(
            `Estimated Cost: $${estimate.cost.toFixed(6)} (${estimate.model})`,
            { modal: true, detail: `Input Tokens: ${estimate.inputTokens}\nOutput Tokens: ${estimate.outputTokens}\nComplexity: ${estimate.complexity}` }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to preview cost: ${error instanceof Error ? error.message : String(error)}`);
    }
}