import * as vscode from 'vscode';
import type { Intent, ExtendedIntent } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { CostEstimator } from '../services/cost-estimator';

export async function previewCostCommand(
  contextProvider: ContextProvider,
  costEstimator: CostEstimator
): Promise<void> {
  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  const text = editorContext.selectedCode || editorContext.fileContent;

  // Select Intent
  const intent = await vscode.window.showQuickPick(
    ['REVIEW', 'REFACTOR', 'EXPLAIN', 'OPTIMIZE', 'DEBUG', 'TEST', 'DOCUMENT'] as Intent[],
    { placeHolder: 'Select command to estimate cost for' }
  );

  if (!intent) return;

  // Use the CostEstimator service to get the full estimate
  const { cost, model, inputTokens, outputTokens, complexity } = costEstimator.estimateRequestCost(text, intent as ExtendedIntent);

  // Show Preview
  const action = await vscode.window.showInformationMessage(
    `Cost Preview for ${intent}\nModel: ${model}\nComplexity: ${complexity}\nEst. Cost: $${cost.toFixed(6)}\nTokens: ~${inputTokens} in / ~${outputTokens} out`,
    { modal: true },
    'Run Command',
    'Cancel'
  );

  if (action === 'Run Command') {
    const commandMap: Record<string, string> = {
        'REVIEW': 'openrouter-crew.review',
        'REFACTOR': 'openrouter-crew.refactor',
        'EXPLAIN': 'openrouter-crew.explain',
        'OPTIMIZE': 'openrouter-crew.optimize',
        'DEBUG': 'openrouter-crew.debug',
        'TEST': 'openrouter-crew.test',
        'DOCUMENT': 'openrouter-crew.document'
    };
    
    const cmd = commandMap[intent];
    if (cmd) {
        vscode.commands.executeCommand(cmd);
    }
  }
}