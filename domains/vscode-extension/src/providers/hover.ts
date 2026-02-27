import * as vscode from 'vscode';
import { FileManager } from '../services/file-manager.js';

export class CostHoverProvider implements vscode.HoverProvider {
    constructor(private fileManager: FileManager) {}

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null> {
        // Future: Show estimated cost or complexity for the function under cursor
        // For MVP, we can show a simple tooltip for keywords if needed, or return null
        
        // Example placeholder logic
        // const range = document.getWordRangeAtPosition(position);
        // const word = document.getText(range);
        
        return null;
    }
}