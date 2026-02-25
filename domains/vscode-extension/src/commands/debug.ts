import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function debugCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const context = contextProvider.getEditorContext();
    if (!context) {
        vscode.window.showWarningMessage('No code selected or file is empty');
        return;
    }

    // Check for diagnostics (errors/warnings) in the file
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    let errorDescription = "Analyze this code for potential bugs, logical errors, and runtime issues.";
    let codeToAnalyze = context.selectedCode || context.fileContent;
    const filePath = editor.document.fileName;

    if (diagnostics.length > 0 && !context.selectedCode) {
        // If no code is explicitly selected, but there are errors, offer to debug a specific error
        const items = diagnostics.map(d => {
            const icon = d.severity === vscode.DiagnosticSeverity.Error ? '$(error)' : '$(warning)';
            return {
                label: `${icon} ${d.message}`,
                description: `Line ${d.range.start.line + 1}`,
                detail: d.source,
                diagnostic: d
            };
        });

        // Add an option to debug the whole file/selection generally
        items.unshift({
            label: '$(bug) General Debugging',
            description: 'Analyze the file for any issues',
            detail: 'General Analysis',
            diagnostic: null as any
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an error to debug or choose General Debugging',
            title: 'Debug Code'
        });

        if (!selected) return;

        if (selected.diagnostic) {
            errorDescription = `Help me debug this ${selected.diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'issue'}: "${selected.diagnostic.message}" on line ${selected.diagnostic.range.start.line + 1}`;
            
            // Focus context on the error if the file is large
            if (document.lineCount > 100) {
                const range = selected.diagnostic.range;
                codeToAnalyze = document.getText(new vscode.Range(
                    Math.max(0, range.start.line - 10), 0,
                    Math.min(document.lineCount - 1, range.end.line + 10), 1000
                ));
            }
        }
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Debugging code...',
        cancellable: false
    }, async () => {
        try {
            // We pass a general instruction as the "error" since we are doing a proactive debug analysis
            const result = await commandExecutor.debug(
                errorDescription,
                { code: codeToAnalyze, file: filePath }
            );

            if (!result.success) {
                throw new Error(result.output);
            }

            outputLogger.logExchange({
                title: `Debug Analysis (${context.languageId})`,
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToAnalyze
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Debug analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}