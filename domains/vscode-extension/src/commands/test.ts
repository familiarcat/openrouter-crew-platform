import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function testCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger): Promise<void> {
  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  if (!editorContext.selectedCode) {
    vscode.window.showInformationMessage('Please select the code you want to generate tests for.');
    return;
  }

  const language = editorContext.languageId;
  const prompt = `Generate comprehensive unit tests for the following ${language} code.
  
  Requirements:
  1. Use a popular testing framework for ${language} (e.g., Jest for TypeScript/JavaScript, pytest for Python).
  2. Cover happy paths, edge cases, and error handling.
  3. Provide the complete test file content.`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Generating tests...',
    {
      prompt,
      context: editorContext.selectedCode,
      intent: 'TEST',
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: `Unit Test Generation (Language: ${language})`,
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