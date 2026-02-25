import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';

export async function quickFixCommand(
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
  const diagnostics = vscode.languages.getDiagnostics(document.uri);

  if (diagnostics.length === 0) {
    vscode.window.showInformationMessage('No errors or warnings found in this file.');
    return;
  }

  // Filter diagnostics to those intersecting with the selection or cursor
  const selection = editor.selection;
  let targetDiagnostic: vscode.Diagnostic | undefined;
  
  const relevantDiagnostics = diagnostics.filter(d => d.range.intersection(selection));
  let candidates: vscode.Diagnostic[] = [];

  if (relevantDiagnostics.length > 0) {
    candidates = relevantDiagnostics;
  } else {
    // Find closest diagnostic to cursor
    const cursorLine = selection.active.line;
    candidates = diagnostics.sort((a, b) => {
      return Math.abs(a.range.start.line - cursorLine) - Math.abs(b.range.start.line - cursorLine);
    });
  }

  if (candidates.length === 1) {
    targetDiagnostic = candidates[0];
  } else if (candidates.length > 1) {
    const items = candidates.map(d => {
      const icon = d.severity === vscode.DiagnosticSeverity.Error ? '$(error)' : '$(warning)';
      return {
        label: `${icon} ${d.message}`,
        description: `Line ${d.range.start.line + 1}`,
        detail: d.source,
        diagnostic: d
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select an issue to fix',
      title: 'Quick Fix Selection'
    });

    if (!selected) return;
    targetDiagnostic = selected.diagnostic;
  }

  if (!targetDiagnostic) {
     vscode.window.showInformationMessage('No errors found to fix.');
     return;
  }

  const errorRange = targetDiagnostic.range;
  const startLine = Math.max(0, errorRange.start.line - 5);
  const endLine = Math.min(document.lineCount - 1, errorRange.end.line + 5);
  const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).range.end.character);
  const codeContext = document.getText(contextRange);

  const language = document.languageId;
  const filePath = document.fileName;

  await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'OpenRouter Crew: Analyzing error...',
      cancellable: false
  }, async () => {
      try {
          const instruction = `Fix the following ${targetDiagnostic!.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'issue'}: "${targetDiagnostic!.message}"`;

          // Use refactor instead of debug to get a replaceable code block
          const result = await commandExecutor.refactor(
              codeContext,
              filePath,
              instruction
          );

          if (!result.success) {
              throw new Error(result.output);
          }

          const fixedCode = commandExecutor.extractCode(result.output, true);

          const logData: any = {
              title: `Quick Fix: ${targetDiagnostic!.message}`,
              model: result.model,
              cost: result.costUSD,
              content: result.output,
              contextCode: {
                  language,
                  code: codeContext
              }
          };

          if (fixedCode) {
              await editor.edit(editBuilder => {
                  editBuilder.replace(contextRange, fixedCode);
              });

              logData.applyCommand = {
                  command: 'openrouter-crew.applyRefactoring',
                  args: [fixedCode, contextRange]
              };
          } else {
              vscode.window.showWarningMessage('No code block found in quick fix response.');
          }

          outputLogger.logExchange(logData);
      } catch (error) {
          vscode.window.showErrorMessage(`Quick fix failed: ${error instanceof Error ? error.message : String(error)}`);
      }
  });
}