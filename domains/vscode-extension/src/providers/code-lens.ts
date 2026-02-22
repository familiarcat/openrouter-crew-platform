import * as vscode from 'vscode';
import { FileManager } from '../services/file-manager';

/**
 * Code Lens Provider
 * Adds "Explain" and "Refactor" actions above functions and classes.
 */
export class CrewCodeLensProvider implements vscode.CodeLensProvider {
  constructor(private fileManager: FileManager) {}

  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    
    // Analyze file to find functions and classes
    const analysis = this.fileManager.analyzeFile(document.fileName, document.getText());

    for (const node of analysis.nodes) {
      if (node.type === 'function' || node.type === 'class') {
        // The location for the lens (start of the definition)
        const range = new vscode.Range(
          node.startLine - 1, 0,
          node.startLine - 1, 0
        );
        
        // The range to select when clicked (the entire function body)
        const targetRange = new vscode.Range(
          node.startLine - 1, 0,
          node.endLine, 0
        );

        lenses.push(new vscode.CodeLens(range, {
          title: '$(info) Explain',
          command: 'openrouter-crew.explain',
          arguments: [targetRange]
        }));

        lenses.push(new vscode.CodeLens(range, {
          title: '$(beaker) Refactor',
          command: 'openrouter-crew.refactor',
          arguments: [targetRange]
        }));
      }
    }
    return lenses;
  }
}