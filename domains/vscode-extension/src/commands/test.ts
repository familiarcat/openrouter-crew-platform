import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager } from '../services/file-manager.js';

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
        const analysis = fileManager.analyzeFile(filePath, context.fileContent);
        const testableNodes = analysis.nodes.filter(n => n.type === 'function' || n.type === 'class');

        if (testableNodes.length > 0) {
            const items = testableNodes.map(node => ({
                label: `$(symbol-${node.type}) ${node.name}`,
                description: `Line ${node.startLine}`,
                node: node
            }));

            const selected = await vscode.window.showQuickPick(items, {
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

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating tests...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.generateTests(codeToTest!, filePath, targetName);

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: `Unit Test Generation (${context.languageId})`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToTest!
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Test generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}