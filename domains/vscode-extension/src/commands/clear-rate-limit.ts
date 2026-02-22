import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker';

export async function clearRateLimitCommand(costTracker: CostTracker): Promise<void> {
  const selection = await vscode.window.showWarningMessage(
    'Are you sure you want to clear the rate limit history?',
    'Yes',
    'No'
  );

  if (selection === 'Yes') {
    await costTracker.clearRateLimitHistory();
    vscode.window.showInformationMessage('Rate limit history has been cleared.');
  }
}