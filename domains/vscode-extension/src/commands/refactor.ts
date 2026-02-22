import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function refactorCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger, range?: vscode.Range): Promise<void> {
  // If range provided (e.g. from CodeLens), select it first
  if (range && vscode.window.activeTextEditor) {
    vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.end);
  }

  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  if (!editorContext.selectedCode) {
    vscode.window.showInformationMessage('Please select the code you want to refactor.');
    return;
  }

  const instruction = await vscode.window.showInputBox({
    prompt: 'Refactor Code',
    placeHolder: 'Enter refactoring instructions (e.g., "Extract method", "Improve variable names")'
  });

  if (!instruction) {
    return;
  }

  const language = editorContext.languageId;
  const prompt = `Please refactor the following ${language} code based on these instructions: "${instruction}".\n\nProvide the refactored code and a brief explanation of changes.`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Refactoring code...',
    {
      prompt,
      context: editorContext.selectedCode,
      intent: 'REFACTOR',
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: `Refactor Request: ${instruction}`,
      model: response.model,
      cost: response.cost,
      content: response.content,
      contextCode: {
        language: language,
        code: editorContext.selectedCode,
      },
    });
  }
}