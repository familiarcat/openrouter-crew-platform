import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager, CodeNode } from '../services/file-manager.js';
import { ChatPanel } from '../ui/chat-panel.js';

interface ExplainableNodeQuickPickItem extends vscode.QuickPickItem {
    node: CodeNode | { content: string; name: string };
}

export async function explainCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger,
    fileManager?: FileManager
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context) {
        vscode.window.showWarningMessage('No code selected or file is empty');
        return;
    }

    let codeToExplain = context.selectedCode;
    const filePath = editor.document.fileName;
    let targetName: string | undefined;

    // If no code selected, try to find explainable units
    if (!codeToExplain && fileManager) {
        const analysis = await fileManager.analyzeFile(filePath, context.fileContent);
        const explainableNodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (explainableNodes.length > 0) {
            const items: ExplainableNodeQuickPickItem[] = explainableNodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            // Add option for full file explanation
            items.unshift({
                label: '$(file) Explain Entire File',
                description: 'Explain the full file content',
                node: { content: context.fileContent, name: 'Entire File' }
            });

            const selected = await vscode.window.showQuickPick<ExplainableNodeQuickPickItem>(items, {
                placeHolder: 'Select a function, class, or the entire file to explain',
                title: 'Explain Code'
            });

            if (!selected) return;

            codeToExplain = selected.node.content;
            targetName = selected.node.name !== 'Entire File' ? selected.node.name : undefined;
        }
    }

    // Fallback to file content if still no code selected
    if (!codeToExplain) {
        codeToExplain = context.fileContent;
    }

    // Construct the prompt
    const contextDescription = targetName ? `function/class '${targetName}'` : 'the selected code';
    const prompt = `Explain ${contextDescription} in '${filePath}':\n\n\`\`\`${context.languageId}\n${codeToExplain}\n\`\`\``;

    // Ensure Chat Panel is open
    await vscode.commands.executeCommand('openrouter-crew.chat');
    
    // Send to Chat Panel
    if (ChatPanel.currentPanel) {
        ChatPanel.currentPanel.ask(prompt);
    } else {
        vscode.window.showErrorMessage('Failed to open Chat Panel.');
    }
}