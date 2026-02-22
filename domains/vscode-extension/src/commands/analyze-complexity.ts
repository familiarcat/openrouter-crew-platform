import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';

export async function analyzeComplexityCommand(llmRouter: LLMRouter, contextProvider: ContextProvider): Promise<void> {
  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  const text = editorContext.selectedCode || editorContext.fileContent;
  
  // We don't specify an intent here to let the router estimate based purely on content
  const complexity = llmRouter.estimateComplexity({
    prompt: text,
    context: editorContext.selectedCode ? undefined : 'Full file content'
  });

  vscode.window.showInformationMessage(`OpenRouter Crew: Text Complexity is ${complexity}`);
}