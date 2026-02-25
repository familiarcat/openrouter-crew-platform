import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { FileManager } from '../services/file-manager.js';

export async function optimizeCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger,
    fileManager?: FileManager // Optional dependency injection
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

    let codeToAnalyze = context.selectedCode || context.fileContent;
    const filePath = editor.document.fileName;
    let instruction = "Optimize this code for performance. Identify bottlenecks and provide an optimized version.";

    // If no specific code is selected, try to find optimization candidates
    if (!context.selectedCode && fileManager) {
        const analysis = fileManager.analyzeFile(filePath, context.fileContent);
        const suggestions = fileManager.generateSuggestions(analysis);
        
        // Filter for complexity or performance related suggestions
        const optimizationCandidates = suggestions.filter(s => 
            s.issue.includes('complexity') || s.issue.includes('long') || s.priority === 'high'
        );

        if (optimizationCandidates.length > 0) {
            const items = optimizationCandidates.map(s => ({
                label: `$(beaker) ${s.location.split(':')[0]}`,
                description: s.issue,
                detail: s.suggestion,
                suggestion: s
            }));

            items.unshift({
                label: '$(zap) General Optimization',
                description: 'Analyze the entire file for performance improvements',
                detail: 'Full File Analysis',
                suggestion: null as any
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a target to optimize',
                title: 'Optimize Code'
            });

            if (!selected) return;

            if (selected.suggestion) {
                instruction = `Optimize this specific issue: ${selected.suggestion.issue}. ${selected.suggestion.suggestion}`;
                // We still send the whole file context, but the instruction focuses the LLM
            }
        }
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Optimizing code...',
        cancellable: false
    }, async () => {
        try {
            const result = await commandExecutor.refactor(
                codeToAnalyze,
                filePath,
                instruction
            );

            if (!result.success) {
                throw new Error(result.output);
            }

            // Extract code from the result to make it apply-able
            const optimizedCode = commandExecutor.extractCode(result.output, true);

            const logData: any = {
                title: 'Code Optimization',
                model: result.model,
                cost: result.costUSD,
                content: result.output,
                contextCode: {
                    language: context.languageId,
                    code: codeToAnalyze
                }
            };

            if (optimizedCode) {
                // If no selection was made, we optimized the whole file, so we should replace the whole file
                let rangeToReplace = context.selectionRange;
                if (!context.selectedCode) {
                    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                    rangeToReplace = new vscode.Range(0, 0, lastLine.lineNumber, lastLine.range.end.character);
                }

                await editor.edit(editBuilder => {
                    editBuilder.replace(rangeToReplace, optimizedCode);
                });

                logData.applyCommand = {
                    command: 'openrouter-crew.applyRefactoring',
                    args: [optimizedCode, rangeToReplace]
                };
            } else {
                vscode.window.showWarningMessage('No code block found in optimization response.');
            }
            outputLogger.logExchange(logData);
        } catch (error) {
            vscode.window.showErrorMessage(`Optimization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}