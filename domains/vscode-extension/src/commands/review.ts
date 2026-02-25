import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager } from '../services/file-manager.js';

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
        const analysis = fileManager.analyzeFile(filePath, context.fileContent);
        const reviewableNodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (reviewableNodes.length > 0) {
            const items = reviewableNodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            // Add option for full file review
            items.unshift({
                label: '$(file) Review Entire File',
                description: 'Analyze the full file content',
                node: { content: context.fileContent, name: 'Entire File' } as any
            });

            const selected = await vscode.window.showQuickPick(items, {
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

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Reviewing code...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.review(codeToReview!, filePath, targetName);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: 'Code Review',
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToReview!
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Review failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}