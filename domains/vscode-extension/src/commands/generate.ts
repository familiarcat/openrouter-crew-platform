import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function generateCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger): Promise<void> {
  const prompt = await vscode.window.showInputBox({
    prompt: 'Generate Code',
    placeHolder: 'Describe the code you want to generate (e.g., "Create a React component for a user profile card")'
  });

  if (!prompt) {
    return;
  }

  // Get context if available to help with language/style matching
  const editorContext = contextProvider.getEditorContext();
  const contextString = editorContext ? contextProvider.buildContextString(editorContext) : undefined;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Generating code...',
    {
      prompt,
      context: contextString,
      intent: 'GENERATE',
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: `Code Generation Request: ${prompt}`,
      model: response.model,
      cost: response.cost,
      content: response.content,
    });
  }
}