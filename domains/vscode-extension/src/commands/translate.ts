import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { ChatPanel } from '../ui/chat-panel.js';

export async function translateCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context || !context.selectedCode) {
        vscode.window.showInformationMessage('Please select the code containing comments to translate.');
        return;
    }

    const languages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 
        'Portuguese', 'Japanese', 'Chinese (Simplified)', 'Korean', 'Russian'
    ];

    const selectedLanguage = await vscode.window.showQuickPick(languages, {
        placeHolder: 'Select target language for comments',
        title: 'Translate Comments'
    });

    if (!selectedLanguage) return;

    const prompt = `Translate the comments in the following code to ${selectedLanguage}.

Code:
\`\`\`${context.languageId}
${context.selectedCode}
\`\`\`
`;

    await vscode.commands.executeCommand('openrouter-crew.chat');
    if (ChatPanel.currentPanel) {
        ChatPanel.currentPanel.ask(prompt);
    } else {
        vscode.window.showErrorMessage('Failed to open Chat Panel.');
    }
}