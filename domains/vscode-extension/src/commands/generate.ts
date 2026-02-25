import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function generateCommand(
    executor: CommandExecutor,
    contextProvider: ContextProvider,
    logger: OutputLogger
) {
    // 1. Get User Input
    const task = await vscode.window.showInputBox({
        placeHolder: 'Describe the code you want to generate or modify...',
        prompt: 'OpenRouter Crew Agent'
    });

    if (!task) return;

    // 2. Gather Context
    const editorContext = contextProvider.getEditorContext();
    
    // 3. Execute via Agent Network
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'OpenRouter Crew: Working...',
        cancellable: true
    }, async (progress, token) => {
        await executor.executeTask(task, editorContext);
    });
}