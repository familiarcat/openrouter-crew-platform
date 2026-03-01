import * as vscode from 'vscode';
import { FileManager } from '../services/file-manager.js';

export class CrewCodeLensProvider implements vscode.CodeLensProvider {
    constructor(private fileManager: FileManager) {}

    async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
        const lenses: vscode.CodeLens[] = [];
        
        // Example: Add "Explain" lens to top of file
        const topOfFile = new vscode.Range(0, 0, 0, 0);
        lenses.push(new vscode.CodeLens(topOfFile, {
            title: "$(hubot) Ask Crew",
            command: "openrouter-crew.chat",
            arguments: []
        }));

        // Parse document for functions and classes to add context-aware lenses
        const analysis = await this.fileManager.analyzeFile(document.fileName, document.getText());
        
        for (const node of analysis.nodes) {
            if (node.type === 'function' || node.type === 'class') {
                const range = new vscode.Range(node.startLine - 1, 0, node.startLine - 1, 0);
                
                lenses.push(new vscode.CodeLens(range, {
                    title: "$(comment-discussion) Explain",
                    command: "openrouter-crew.explain",
                    arguments: [] // The command will pick up the selection/cursor context
                }));

                lenses.push(new vscode.CodeLens(range, {
                    title: "$(eye) Review",
                    command: "openrouter-crew.review",
                    arguments: []
                }));
            }
        }

        return lenses;
    }
}