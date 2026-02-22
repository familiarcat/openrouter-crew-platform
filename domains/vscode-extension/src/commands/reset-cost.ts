import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker';

export async function resetCostCommand(costTracker: CostTracker): Promise<void> {
  const selection = await vscode.window.showWarningMessage(
    'Are you sure you want to reset the daily cost tracking?',
    'Yes',
    'No'
  );

  if (selection === 'Yes') {
    await costTracker.resetDailyUsage();
    vscode.window.showInformationMessage('Daily cost tracking has been reset.');
  }
}