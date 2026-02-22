import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function quickFixCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger): Promise<void> {
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
  const prompt = `Fix the following ${targetDiagnostic.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'issue'} in ${language}:
"${targetDiagnostic.message}"

Code context:
\`\`\`${language}
${codeContext}
\`\`\`

Provide the fixed code and a brief explanation.`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Analyzing error...',
    {
      prompt,
      context: document.getText(), // Provide full file content as context
      intent: 'DEBUG',
    }
  );

  if (response) {
    outputLogger.logExchange({
      title: `Quick Fix: ${targetDiagnostic?.message}`,
      model: response.model,
      cost: response.cost,
      content: response.content,
      contextCode: {
        language,
        code: codeContext,
      },
    });
  }
}