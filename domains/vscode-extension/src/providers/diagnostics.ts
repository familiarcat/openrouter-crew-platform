import * as vscode from 'vscode';
import { FileManager } from '../services/file-manager';

/**
 * Diagnostics Provider
 * Analyzes code in the background and provides quality hints/warnings.
 */
export class DiagnosticsProvider {
  private collection: vscode.DiagnosticCollection;

  constructor(private fileManager: FileManager) {
    this.collection = vscode.languages.createDiagnosticCollection('openrouter-crew');
  }

  /**
   * Analyze document and update diagnostics
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    if (document.uri.scheme !== 'file') {
      return;
    }

    const analysis = this.fileManager.analyzeFile(document.fileName, document.getText());
    const diagnostics: vscode.Diagnostic[] = [];

    // 1. Check for long functions (Complexity)
    for (const node of analysis.nodes) {
      if (node.type === 'function' && node.endLine - node.startLine > 50) {
        const range = new vscode.Range(
          new vscode.Position(node.startLine - 1, 0),
          new vscode.Position(node.startLine, 0)
        );
        const diagnostic = new vscode.Diagnostic(
          range,
          `Function "${node.name}" is too long (${node.endLine - node.startLine} lines). Consider refactoring.`,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.source = 'OpenRouter Crew';
        diagnostic.code = 'complexity';
        diagnostics.push(diagnostic);
      }
    }

    // 2. Check for console.log (Best Practices)
    const text = document.getText();
    const consoleLogRegex = /console\.log/g;
    let match;
    while ((match = consoleLogRegex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(startPos, endPos),
        'Avoid using console.log in production code.',
        vscode.DiagnosticSeverity.Information
      );
      diagnostic.source = 'OpenRouter Crew';
      diagnostic.code = 'no-console';
      diagnostics.push(diagnostic);
    }

    // 3. Check for TODOs (Maintenance)
    const todoRegex = /\/\/\s*TODO:/g;
    while ((match = todoRegex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(startPos, endPos),
        'Pending TODO item.',
        vscode.DiagnosticSeverity.Information
      );
      diagnostic.source = 'OpenRouter Crew';
      diagnostic.code = 'todo';
      diagnostics.push(diagnostic);
    }

    this.collection.set(document.uri, diagnostics);
  }

  /**
   * Subscribe to document events
   */
  public subscribeToDocumentChanges(context: vscode.ExtensionContext): void {
    if (vscode.window.activeTextEditor) {
      this.updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this.updateDiagnostics(editor.document);
        }
      }),
      vscode.workspace.onDidChangeTextDocument(e => {
        this.updateDiagnostics(e.document);
      }),
      vscode.workspace.onDidCloseTextDocument(doc => this.collection.delete(doc.uri))
    );
  }
}