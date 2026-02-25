import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function explainTerminalCommand(
    commandExecutor: CommandExecutor,
    outputLogger: OutputLogger
): Promise<void> {
    let clipboardText = '';
    try {
        clipboardText = await vscode.env.clipboard.readText();
    } catch {
        // Ignore clipboard read errors
    }

    const input = await vscode.window.showInputBox({
        prompt: 'Paste the terminal error or command output to explain',
        placeHolder: 'Error message...',
        value: clipboardText.trim(),
        valueSelection: [0, clipboardText.trim().length]
    });

    if (!input || !input.trim()) return;
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Explaining terminal output...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.explainTerminal(input.trim());
            
            if (!result.success) {
                throw new Error(result.output);
            }
            
            outputLogger.logExchange({
                title: 'Terminal Explanation',
                model: result.model,
                cost: result.costUSD,
                content: result.output
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Terminal explanation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}