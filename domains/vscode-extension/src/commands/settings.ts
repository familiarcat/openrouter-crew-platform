import * as vscode from 'vscode';

export async function settingsCommand(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.openSettings', 'openrouterCrew');
}