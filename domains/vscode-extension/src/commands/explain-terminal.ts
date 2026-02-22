import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function explainTerminalCommand(llmRouter: LLMRouter, outputLogger: OutputLogger): Promise<void> {
  // Attempt to read from clipboard as a convenience for "last error"
  let initialValue = '';
  try {
    initialValue = await vscode.env.clipboard.readText();
    // If clipboard is excessively large, avoid pre-filling to prevent UI lag
    if (initialValue.length > 5000) {
      initialValue = '';
    }
  } catch {
    // Ignore clipboard access errors
  }

  const errorText = await vscode.window.showInputBox({
    prompt: 'Explain Terminal Error',
    placeHolder: 'Paste the error message from your terminal',
    value: initialValue,
    ignoreFocusOut: true
  });

  if (!errorText) {
    return;
  }

  const prompt = `Analyze this terminal error and provide a solution:

\`\`\`
${errorText}
\`\`\`

1. What is the error?
2. How to fix it? (Provide command if possible)
`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Analyzing error...',
    {
      prompt,
      intent: 'DEBUG',
      complexity: 'MEDIUM'
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: 'Terminal Error Analysis',
      model: response.model,
      cost: response.cost,
      content: response.content
    });
  }
}