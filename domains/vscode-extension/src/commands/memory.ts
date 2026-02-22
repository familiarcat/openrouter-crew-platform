import * as vscode from 'vscode';
import { CrewAPIService } from '../services/crew-api-service';

interface MemoryQuickPickItem extends vscode.QuickPickItem {
    label: string;
    description?: string;
    detail?: string;
    memory: any; // The full memory object
}

export async function createMemoryCommand(crewService: CrewAPIService): Promise<void> {
  const content = await vscode.window.showInputBox({
    placeHolder: 'Memory content',
    title: 'Create Memory',
    prompt: 'Enter the information you want the crew to remember'
  });

  if (!content) return;

  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Creating memory...',
      cancellable: false
    }, async () => {
      await crewService.createMemory(content);
      // Success message is handled within createMemory
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating memory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function searchMemoryCommand(crewService: CrewAPIService): Promise<void> {
  const query = await vscode.window.showInputBox({
    placeHolder: 'Search query',
    title: 'Search Memories',
  });

  if (!query) return;

  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Searching memories...',
      cancellable: false
    }, async () => {
      await crewService.searchMemories(query);
      // Results display is handled within searchMemories via output channel
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error searching memories: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function complianceCheckCommand(crewService: CrewAPIService): Promise<void> {
    // This delegates to the service which handles the UI/Output
    await crewService.getComplianceStatus();
}