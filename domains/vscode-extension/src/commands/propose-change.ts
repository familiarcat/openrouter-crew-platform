import * as vscode from 'vscode';
import { ProposeChangeTool } from '../services/propose-change-tool';

/**
 * Command handler for proposing file changes.
 * This provides the glue between the VSCode UI and the ProposeChangeTool service.
 */
export function registerProposeChangeCommand(context: vscode.ExtensionContext) {
  const proposeChangeTool = new ProposeChangeTool();

  const disposable = vscode.commands.registerCommand(
    'openrouter-crew.propose-change',
    async (filePath: string, newContent: string) => {
      // Execute the proposal with Dark Forest validation and diff view
      await proposeChangeTool.propose(filePath, newContent);
    }
  );

  context.subscriptions.push(disposable);
}