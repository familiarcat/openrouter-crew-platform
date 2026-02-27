import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager, CodeNode } from '../services/file-manager.js';
import { ChatPanel } from '../ui/chat-panel.js';

interface ReviewableNodeQuickPickItem extends vscode.QuickPickItem {
    node: CodeNode | { content: string; name: string };
}

export async function reviewCommand(
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

    let codeToReview = context.selectedCode;
    const filePath = editor.document.fileName;
    let targetName: string | undefined;

    // If no code selected, try to find reviewable units
    if (!codeToReview && fileManager) {
        const analysis = await fileManager.analyzeFile(filePath, context.fileContent);
        const reviewableNodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (reviewableNodes.length > 0) {
            const items: ReviewableNodeQuickPickItem[] = reviewableNodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            // Add option for full file review
            items.unshift({
                label: '$(file) Review Entire File',
                description: 'Analyze the full file content',
                node: { content: context.fileContent, name: 'Entire File' }
            });

            const selected = await vscode.window.showQuickPick<ReviewableNodeQuickPickItem>(items, {
                placeHolder: 'Select a function, class, or the entire file to review',
                title: 'Code Review'
            });

            if (!selected) return;

            codeToReview = selected.node.content;
            targetName = selected.node.name !== 'Entire File' ? selected.node.name : undefined;
        }
    }

    // Fallback to file content if still no code selected (e.g. no fileManager or no nodes found)
    if (!codeToReview) {
        codeToReview = context.fileContent;
    }

    // Construct the prompt
    const contextDescription = targetName ? `function/class '${targetName}'` : 'the selected code';
    const prompt = `Perform a comprehensive code review of ${contextDescription} in '${filePath}'.
        
Check for:
1. Logic errors and bugs
2. Security vulnerabilities
3. Performance issues
4. Code style and best practices
5. TypeScript/typing issues (if applicable)

Provide specific, actionable feedback and code snippets for improvements.

Code to review:
\`\`\`${context.languageId}
${codeToReview}
\`\`\`
`;

    // Ensure Chat Panel is open
    await vscode.commands.executeCommand('openrouter-crew.chat');
    
    // Send to Chat Panel
    if (ChatPanel.currentPanel) {
        ChatPanel.currentPanel.ask(prompt);
    } else {
        vscode.window.showErrorMessage('Failed to open Chat Panel.');
    }
}