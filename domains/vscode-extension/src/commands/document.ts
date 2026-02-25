import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager } from '../services/file-manager.js';

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
        const analysis = fileManager.analyzeFile(filePath, context.fileContent);
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

        const items = undocumentedNodes.map(node => ({
            label: `$(symbol-${node.type}) ${node.name}`,
            description: `at line ${node.startLine}`,
            node: node
        }));

        const selected = await vscode.window.showQuickPick(items, {
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

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating documentation...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.document(
                codeToDocument,
                filePath,
                targetNodeName
            );

            if (!result.success) {
                throw new Error(result.output);
            }

            await editor.edit(editBuilder => {
                editBuilder.replace(selectionRange, result.output);
            });
            await vscode.commands.executeCommand('editor.action.formatSelection');
            
            const logContent = targetNodeName
                ? `Documentation generated for ${targetNodeName} and applied to file.`
                : 'Documentation applied to the editor.';
            
            outputLogger.logExchange({
                title: `Documentation Generation (${context.languageId})`,
                model: result.model,
                cost: result.costUSD,
                content: logContent,
                contextCode: {
                    language: context.languageId,
                    code: codeToDocument,
                },
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Documentation generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}