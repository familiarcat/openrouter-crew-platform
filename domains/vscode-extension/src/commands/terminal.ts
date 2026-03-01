import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { TerminalManager } from '../services/terminal-manager.js';
import { OutputLogger } from '../ui/output-logger.js';
import { ChatPanel } from '../ui/chat-panel.js';

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

  const prompt = `Generate a terminal command to: ${input.trim()}

Provide the command in a code block and briefly explain what it does.`;

  // Ensure Chat Panel is open and send the request
  await vscode.commands.executeCommand('openrouter-crew.chat');
  if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.ask(prompt);
  } else {
      vscode.window.showErrorMessage('Failed to open Chat Panel.');
  }
}