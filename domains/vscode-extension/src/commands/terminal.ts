import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';

export async function terminalCommand(
  commandExecutor: CommandExecutor
): Promise<void> {
  const input = await vscode.window.showInputBox({
    prompt: 'Terminal Command',
    placeHolder: 'Describe the command to run (e.g., "Install dependencies", "List all TS files")',
  });

  if (!input) return;

  await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'OpenRouter Crew: Generating command...',
      cancellable: false
  }, async () => {
      try {
          const result = await commandExecutor.terminal(input);
          if (!result.success) {
              throw new Error(result.output);
          }
          // The command is executed within the executor, so no further action is needed here.
      } catch (error: any) {
          vscode.window.showErrorMessage(`Terminal command failed: ${error.message}`);
      }
  });
}