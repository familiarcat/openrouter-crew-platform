import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { FileManager } from '../services/file-manager.js';
import { ChatPanel } from '../ui/chat-panel.js';

export async function findRelatedFilesCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    fileManager: FileManager
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context) {
        vscode.window.showWarningMessage('Cannot get editor context.');
        return;
    }

    const query = context.selectedCode || context.fileContent;
    const filePath = editor.document.fileName;

    // Construct a prompt for the agent
    const prompt = `Based on the following code from '${filePath}', find related files in the project. 
Consider imports, function calls, and class instantiations. 
List the most relevant file paths.

Code Context:
\`\`\`${context.languageId}
${query}
\`\`\`
`;

    await vscode.commands.executeCommand('openrouter-crew.chat');
    
    if (ChatPanel.currentPanel) {
        ChatPanel.currentPanel.ask(prompt);
    } else {
        vscode.window.showErrorMessage('Failed to open Chat Panel.');
    }
}