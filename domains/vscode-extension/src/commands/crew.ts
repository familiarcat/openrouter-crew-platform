import * as vscode from 'vscode';
import { CrewTreeProvider } from '../ui/tree-views.js';
import { CrewAPIService } from '../services/crew-api-service.js';

export async function rosterCommand(crewService: CrewAPIService, crewProvider: CrewTreeProvider): Promise<void> {
  crewProvider.refresh();
  vscode.window.showInformationMessage('Refreshing crew roster...');
}

export async function consultCommand(crewService: CrewAPIService): Promise<void> {
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
  
  await crewService.consultCrew(member, task);
  // Result display is handled in consultCrew
}