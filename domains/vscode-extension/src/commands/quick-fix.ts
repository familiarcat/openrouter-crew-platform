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

  if (relevantDiagnostics.length > 0) {
    targetDiagnostic = relevantDiagnostics[0]; // Pick first relevant
  } else {
    // Find closest diagnostic to cursor
    const cursorLine = selection.active.line;
    targetDiagnostic = diagnostics.sort((a, b) => {
      return Math.abs(a.range.start.line - cursorLine) - Math.abs(b.range.start.line - cursorLine);
    })[0];
  }

  if (!targetDiagnostic) {
     vscode.window.showInformationMessage('No errors found to fix.');
     return;
  }

  const errorRange = targetDiagnostic.range;
  const codeContext = document.getText(new vscode.Range(
      Math.max(0, errorRange.start.line - 5), 0,
      Math.min(document.lineCount - 1, errorRange.end.line + 5), 1000
  ));

  const language = document.languageId;
  const filePath = document.fileName;

  await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'OpenRouter Crew: Analyzing error...',
      cancellable: false
  }, async () => {
      try {
          const errorDescription = `Fix the following ${targetDiagnostic!.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'issue'}: "${targetDiagnostic!.message}"`;

          const result = await commandExecutor.debug(
              errorDescription,
              { code: codeContext, file: filePath }
          );

          if (!result.success) {
              throw new Error(result.output);
          }

          outputLogger.logExchange({
              title: `Quick Fix: ${targetDiagnostic!.message}`,
              model: result.model,
              cost: result.costUSD,
              content: result.output,
              contextCode: {
                  language,
                  code: codeContext,
              },
          });
      } catch (error: any) {
          vscode.window.showErrorMessage(`Quick fix failed: ${error.message}`);
      }
  });
}