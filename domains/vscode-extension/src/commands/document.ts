import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager, CodeNode } from '../services/file-manager.js';
import { ChatPanel } from '../ui/chat-panel.js';

interface DocumentableNodeQuickPickItem extends vscode.QuickPickItem {
    node: CodeNode;
}

export async function documentCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger,
    fileManager: FileManager
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const context = contextProvider.getEditorContext();
    if (!context) {
        vscode.window.showWarningMessage('Cannot get document context.');
        return;
    }

    let codeToDocument = context.selectedCode;
    let selectionRange = context.selectionRange;
    const filePath = editor.document.fileName;
    let targetNodeName: string | undefined = undefined;

    // If no code is selected, analyze the file for undocumented functions/classes
    if (!codeToDocument) {
        const analysis = await fileManager.analyzeFile(filePath, context.fileContent);
        const nodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        const undocumentedNodes = nodes.filter(node => {
            if (node.startLine <= 1) return true;
            const lineAbove = document.lineAt(node.startLine - 2).text.trim();
            // Simple heuristic: check if the line above is the end of a doc comment
            return !lineAbove.endsWith('*/');
        });

        if (undocumentedNodes.length === 0) {
            vscode.window.showInformationMessage('No selection or undocumented functions/classes found to document.');
            return;
        }

        const items: DocumentableNodeQuickPickItem[] = undocumentedNodes.map(node => ({
            label: `$(symbol-${node.type}) ${node.name}`,
            description: `at line ${node.startLine}`,
            node: node
        }));

        const selected = await vscode.window.showQuickPick<DocumentableNodeQuickPickItem>(items, {
            placeHolder: 'Select a function or class to document',
            title: 'Generate Documentation'
        });

        if (!selected) return;

        // When documenting a specific node in a whole file, the context is the whole file
        codeToDocument = context.fileContent;
        targetNodeName = selected.node.name;
        
        // The replacement range will be the entire document
        const lastLine = document.lineAt(document.lineCount - 1);
        selectionRange = new vscode.Range(0, 0, lastLine.lineNumber, lastLine.range.end.character);

    } else {
        // User has a selection, proceed as before
        codeToDocument = context.selectedCode;
        selectionRange = context.selectionRange;
    }

    if (!codeToDocument) {
        vscode.window.showInformationMessage('No code available to document.');
        return;
    }

    // Construct the prompt
    const contextDescription = targetNodeName ? `function/class '${targetNodeName}'` : 'the selected code';
    const prompt = `Generate comprehensive documentation (JSDoc/Docstring) for ${contextDescription} in '${filePath}'.

Code to document:
\`\`\`${context.languageId}
${codeToDocument}
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