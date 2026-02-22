import * as vscode from 'vscode';
import { ChatViewProvider } from '../ui/chat-panel';

export async function reviewCommand(chatProvider: ChatViewProvider) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const text = selection.isEmpty ? document.getText() : document.getText(selection);
    const language = document.languageId;

    if (!text.trim()) {
        vscode.window.showErrorMessage('No code found to review');
        return;
    }

    // Focus the chat view
    await vscode.commands.executeCommand('openrouter-crew.chat');

    const prompt = `Review the following ${language} code:\n\n\`\`\`${language}\n${text}\n\`\`\``;
    
    await chatProvider.handleUserMessage(prompt);
}