import * as vscode from 'vscode';
import { FileManager } from '../services/file-manager.js';

export class DiagnosticsProvider {
    private collection: vscode.DiagnosticCollection;

    constructor(private fileManager: FileManager) {
        this.collection = vscode.languages.createDiagnosticCollection('openrouter-crew');
    }

    subscribeToDocumentChanges(context: vscode.ExtensionContext): void {
        if (vscode.window.activeTextEditor) {
            this.refreshDiagnostics(vscode.window.activeTextEditor.document);
        }
        context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.refreshDiagnostics(editor.document);
                }
            })
        );
    }

    private async refreshDiagnostics(document: vscode.TextDocument): Promise<void> {
        // Future: Run local analysis (complexity, secrets) and report diagnostics
    }
}