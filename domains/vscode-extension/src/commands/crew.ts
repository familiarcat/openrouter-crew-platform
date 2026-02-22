import * as vscode from 'vscode';
import { CLIExecutor } from '../services/cli-executor';
import { CrewTreeProvider } from '../ui/tree-views';
import { CrewAPIService } from '../services/crew-api-service';

export async function rosterCommand(crewService: CrewAPIService, crewProvider: CrewTreeProvider): Promise<void> {
  crewProvider.refresh();
  vscode.window.showInformationMessage('Refreshing crew roster...');
}

export async function consultCommand(cliExecutor: CLIExecutor): Promise<void> {
  const member = await vscode.window.showInputBox({
    placeHolder: 'Enter crew member name (e.g., picard, data, riker)',
    title: 'Consult Crew Member',
  });
  if (!member) return;

  const task = await vscode.window.showInputBox({
    placeHolder: 'Describe your task or question',
    title: `Consult ${member}`,
  });

  if (!task) return;

  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Consulting ${member}...`,
      cancellable: false
    }, async () => {
      const result = await cliExecutor.consultCrew(member, task);
      if (result.success) {
        vscode.window.showInformationMessage(`Response from ${member}: ${JSON.stringify(result.data)}`);
      } else {
        vscode.window.showErrorMessage(`Failed to consult ${member}: ${result.error}`);
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error: ${error}`);
  }
}