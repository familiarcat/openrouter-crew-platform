import * as vscode from 'vscode';
import { CostTracker } from '../services/cost-tracker.js';
import { TextEncoder } from 'util';

export async function exportCostReportJsonCommand(costTracker: CostTracker): Promise<void> {
  const history = costTracker.getLocalHistory();
  if (history.length === 0) {
    vscode.window.showInformationMessage('No cost history to export.');
    return;
  }

  const uri = await vscode.window.showSaveDialog({
    filters: {
      'JSON Files': ['json']
    },
    defaultUri: vscode.Uri.file('cost-report.json'),
    saveLabel: 'Export JSON'
  });

  if (uri) {
    try {
      const jsonContent = JSON.stringify(history, null, 2);
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(uri, encoder.encode(jsonContent));
      vscode.window.showInformationMessage('Cost report exported successfully (JSON).');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to export cost report: ${error}`);
    }
  }
}