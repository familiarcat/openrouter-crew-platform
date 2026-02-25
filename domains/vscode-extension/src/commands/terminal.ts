import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { TerminalManager } from '../services/terminal-manager.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function terminalCommand(
  commandExecutor: CommandExecutor,
  terminalManager: TerminalManager,
  outputLogger: OutputLogger
): Promise<void> {
  const input = await vscode.window.showInputBox({
    prompt: 'Terminal Command',
    placeHolder: 'Describe the command to run (e.g., "Install dependencies", "List all TS files")',
  });

  if (!input || !input.trim()) return;

  await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'OpenRouter Crew: Generating command...',
      cancellable: false
  }, async () => {
      try {
          const result = await commandExecutor.terminal(input.trim());
          if (!result.success) {
              throw new Error(result.output);
          }

          const command = commandExecutor.extractCode(result.output, true);

          if (command) {
              await terminalManager.executeCommand(command, input.trim());
          } else {
              vscode.window.showWarningMessage('No command found in response.');
          }

          outputLogger.logExchange({
              title: 'Terminal Command Generation',
              model: result.model,
              cost: result.costUSD,
              content: result.output,
              contextCode: { language: 'bash', code: command || '' }
          });

      } catch (error) {
          vscode.window.showErrorMessage(`Terminal command failed: ${error instanceof Error ? error.message : String(error)}`);
      }
  });
}