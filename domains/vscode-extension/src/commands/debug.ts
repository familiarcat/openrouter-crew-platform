import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function debugCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger): Promise<void> {
  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  const language = editorContext.languageId;
  // Prioritize selection, fallback to file content
  const codeToAnalyze = editorContext.selectedCode || editorContext.fileContent;
  const contextType = editorContext.selectedCode ? 'selected code' : 'current file';

  const prompt = `Analyze the following ${language} code for potential bugs, logical errors, and runtime issues.

Code context (${contextType}):
\`\`\`${language}
${codeToAnalyze}
\`\`\`

If you find any issues:
1. Explain the bug and why it occurs.
2. Provide a corrected version of the code.
3. Suggest prevention strategies.

If no bugs are found, confirm the code looks correct and suggest any defensive programming improvements.`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Debugging code...',
    {
      prompt,
      context: codeToAnalyze,
      intent: 'DEBUG',
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: `Debug Analysis (${language})`,
      model: response.model,
      cost: response.cost,
      content: response.content,
      contextCode: {
        language: language,
        code: codeToAnalyze,
      },
    });
  }
}