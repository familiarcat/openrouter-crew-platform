import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager, CodeNode } from '../services/file-manager.js';
import { ChatPanel } from '../ui/chat-panel.js';

interface TestableNodeQuickPickItem extends vscode.QuickPickItem {
    node: CodeNode;
}

export async function testCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger,
    fileManager?: FileManager
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

    const filePath = editor.document.fileName;
    let codeToTest = context.selectedCode;
    let targetName: string | undefined;

    // If no code selected, try to find testable units
    if (!codeToTest && fileManager) {
        const analysis = await fileManager.analyzeFile(filePath, context.fileContent);
        const testableNodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (testableNodes.length > 0) {
            const items: TestableNodeQuickPickItem[] = testableNodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            const selected = await vscode.window.showQuickPick<TestableNodeQuickPickItem>(items, {
                placeHolder: 'Select a function or class to generate tests for',
                title: 'Generate Unit Tests'
            });

            if (!selected) return;

            codeToTest = selected.node.content;
            targetName = selected.node.name;
        } else {
            // Fallback to whole file if no specific nodes found
            codeToTest = context.fileContent;
        }
    } else if (!codeToTest) {
        // Fallback if no fileManager provided
        vscode.window.showInformationMessage('Please select the code you want to generate tests for.');
        return;
    }

    // Construct the prompt
    const contextDescription = targetName ? `function/class '${targetName}'` : 'the selected code';
    const prompt = `Generate comprehensive unit tests for ${contextDescription} in '${filePath}'.
    
Include:
1. Happy path cases
2. Edge cases and error handling
3. Mocking of dependencies where appropriate

Code to test:
\`\`\`${context.languageId}
${codeToTest}
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