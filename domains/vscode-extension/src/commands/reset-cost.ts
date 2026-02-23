import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker.js';

export async function resetCostCommand(costTracker: CostTracker): Promise<void> {
    await costTracker.resetDailyUsage();
    vscode.window.showInformationMessage('Daily cost tracker has been reset.');
}