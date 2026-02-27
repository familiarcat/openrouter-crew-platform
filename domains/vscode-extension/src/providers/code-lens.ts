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

        // Future: Parse document for functions and add "Refactor" / "Test" lenses
        // const analysis = await this.fileManager.analyzeFile(document.fileName, document.getText());
        // for (const node of analysis.nodes) {
        //     if (node.type === 'function') {
        //         const range = new vscode.Range(node.startLine - 1, 0, node.startLine - 1, 0);
        //         lenses.push(new vscode.CodeLens(range, {
        //             title: "$(beaker) Generate Tests",
        //             command: "openrouter-crew.test",
        //             arguments: []
        //         }));
        //     }
        // }

        return lenses;
    }
}