import * as vscode from 'vscode';
import { LLMRouter, LLMRequest, LLMResponse } from '../services/llm-router.js';

/**
 * A unified function to execute AI commands, handling progress UI and errors.
 * @param llmRouter The LLM router instance.
 * @param progressTitle The title to display in the progress notification.
 * @param llmRequest The request object for the LLM.
 * @returns The LLM response, or null if an error occurred.
 */
export async function executeAICommand(
  llmRouter: LLMRouter,
  progressTitle: string,
  llmRequest: LLMRequest
): Promise<LLMResponse | null> {
  let result: LLMResponse | null = null;
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: progressTitle,
        cancellable: false,
      },
      async () => {
        result = await llmRouter.route(llmRequest);
      }
    );
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`OpenRouter Crew Error: ${errorMessage}`);
    return null;
  }
}