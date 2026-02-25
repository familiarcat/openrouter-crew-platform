import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager } from '../services/file-manager.js';

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
        const analysis = fileManager.analyzeFile(filePath, context.fileContent);
        const explainableNodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (explainableNodes.length > 0) {
            const items = explainableNodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            // Add option for full file explanation
            items.unshift({
                label: '$(file) Explain Entire File',
                description: 'Explain the full file content',
                node: { content: context.fileContent, name: 'Entire File' } as any
            });

            const selected = await vscode.window.showQuickPick(items, {
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

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Explaining code...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.explain(codeToExplain!, filePath, targetName);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: 'Code Explanation',
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToExplain!
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Explanation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}