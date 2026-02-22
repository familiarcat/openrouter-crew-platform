import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function optimizeCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger): Promise<void> {
  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  const codeToAnalyze = editorContext.selectedCode || editorContext.fileContent;
  if (!codeToAnalyze) {
    vscode.window.showInformationMessage('Please select code or open a file to optimize.');
    return;
  }
  const contextType = editorContext.selectedCode ? 'selected code' : 'current file';

  const language = editorContext.languageId;
  const prompt = `Analyze the following ${language} code for performance optimizations.

Code context (${contextType}):
\`\`\`${language}
${codeToAnalyze}
\`\`\`

Please provide:
1. A detailed analysis of any performance bottlenecks (e.g., inefficient loops, memory allocation, slow algorithms).
2. An optimized version of the code.
3. An explanation of the improvements and their performance impact.`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Optimizing code...',
    {
      prompt,
      context: codeToAnalyze,
      intent: 'OPTIMIZE',
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: `Optimization Analysis (${language})`,
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