import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { TerminalManager } from '../services/terminal-manager';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function terminalCommand(
  llmRouter: LLMRouter,
  terminalManager: TerminalManager,
  outputLogger: OutputLogger
): Promise<void> {
  const input = await vscode.window.showInputBox({
    prompt: 'Terminal Command',
    placeHolder: 'Describe the command to run (e.g., "Install dependencies", "List all TS files")',
  });

  if (!input) {
    return;
  }

  const prompt = `Generate a shell command for the following request: "${input}".

  Requirements:
  1. Return ONLY the command(s) to be executed.
  2. Do not use markdown formatting (no backticks).
  3. Do not provide explanations.
  4. If multiple commands are needed, chain them appropriately (&& or ;).
  5. Assume a standard Linux/macOS environment (bash/zsh) unless specified otherwise.
  `;

  const response = await executeAICommand(llmRouter, 'OpenRouter Crew: Generating command...', {
    prompt,
    intent: 'TERMINAL',
  });

  if (response) {
    // Clean up response just in case
    let command = response.content.trim();
    if (command.startsWith('```') && command.endsWith('```')) {
      command = command.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    } else if (command.startsWith('`') && command.endsWith('`')) {
      command = command.slice(1, -1);
    }

    // Execute via TerminalManager (which handles confirmation)
    await terminalManager.executeCommand(command, input);
  }
}