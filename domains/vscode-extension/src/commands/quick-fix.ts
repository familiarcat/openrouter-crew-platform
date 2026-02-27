import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { ChatPanel } from '../ui/chat-panel.js';

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
  
  // Select the context range so the user sees what's being fixed and Apply/Diff works correctly
  editor.selection = new vscode.Selection(contextRange.start, contextRange.end);
  editor.revealRange(contextRange);
  
  const codeContext = document.getText(contextRange);
  const filePath = document.fileName;

  // Construct the prompt
  const instruction = `Fix the following ${targetDiagnostic.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'issue'}: "${targetDiagnostic.message}"`;
  const prompt = `${instruction} in '${filePath}'.

Code Context:
\`\`\`${document.languageId}
${codeContext}
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