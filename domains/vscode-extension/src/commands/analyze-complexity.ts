import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { FileManager, CodeNode } from '../services/file-manager.js';

interface AnalyzableNodeQuickPickItem extends vscode.QuickPickItem {
    node: CodeNode | { content: string; name: string };
}

export async function analyzeComplexityCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
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

    let codeToAnalyze = context.selectedCode;
    const filePath = editor.document.fileName;

    // If no code selected, try to find analyzable units
    if (!codeToAnalyze && fileManager) {
        const analysis = await fileManager.analyzeFile(filePath, context.fileContent);
        const nodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (nodes.length > 0) {
            const items: AnalyzableNodeQuickPickItem[] = nodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            // Add option for full file analysis
            items.unshift({
                label: '$(file) Analyze Entire File',
                description: 'Analyze complexity of the full file',
                node: { content: context.fileContent, name: 'Entire File' }
            });

            const selected = await vscode.window.showQuickPick<AnalyzableNodeQuickPickItem>(items, {
                placeHolder: 'Select a function, class, or the entire file to analyze',
                title: 'Analyze Complexity'
            });

            if (!selected) return;

            codeToAnalyze = selected.node.content;
        }
    }

    // Fallback to file content if still no code selected
    if (!codeToAnalyze) {
        codeToAnalyze = context.fileContent;
    }

    const result = await commandExecutor.analyzeComplexity(codeToAnalyze, filePath);

    if (result.success) {
        vscode.window.showInformationMessage(result.output, { modal: true });
    } else {
        vscode.window.showErrorMessage(`Complexity analysis failed: ${result.output}`);
    }
}