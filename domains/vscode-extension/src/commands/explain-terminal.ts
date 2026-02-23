import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function explainTerminalCommand(
    commandExecutor: CommandExecutor,
    outputLogger: OutputLogger
): Promise<void> {
    const input = await vscode.window.showInputBox({
        prompt: 'Paste the terminal error or command output to explain',
        placeHolder: 'Error message...'
    });

    if (!input) return;
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Explaining terminal output...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.explainTerminal(input);
            
            if (!result.success) {
                throw new Error(result.output);
            }
            
            outputLogger.logExchange({
                title: 'Terminal Explanation',
                model: result.model,
                cost: result.costUSD,
                content: result.output
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Terminal explanation failed: ${error.message}`);
        }
    });
}