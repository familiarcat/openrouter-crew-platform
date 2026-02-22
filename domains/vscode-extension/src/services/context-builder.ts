import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import { FileManager } from './file-manager';

/**
 * Context Builder Service
 * Intelligently assembles context from multiple files for complex queries.
 */
export class ContextBuilder {
  constructor(private fileManager: FileManager) {}

  /**
   * Build context string from active file and related dependencies
   */
  async buildContext(query: string, maxTokens: number = 8000): Promise<string> {
    const contextFiles = new Map<string, string>();
    let totalTokens = 0;

    // 1. Add active editor content (Highest Priority)
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const content = activeEditor.document.getText();
      const path = vscode.workspace.asRelativePath(activeEditor.document.uri);
      
      contextFiles.set(path, content);
      totalTokens += this.estimateTokens(content);

      // 2. Analyze imports to find related files
      const analysis = this.fileManager.analyzeFile(activeEditor.document.fileName, content);
      
      // Limit imports to avoid exploding context
      const importsToScan = analysis.imports.slice(0, 10);

      for (const importPath of importsToScan) {
        // Simple resolution: search for file with same name
        // This handles relative imports like './service' -> 'service.ts'
        const basename = importPath.split('/').pop();
        if (!basename) continue;

        // Search for files matching the import name
        // Exclude node_modules and dist/out folders
        const files = await vscode.workspace.findFiles(
            `**/${basename}.{ts,js,tsx,jsx,py,java,cs,go,rs}`, 
            '**/{node_modules,dist,out,build,.git}/**'
        );

        for (const file of files) {
            // Skip if it's the active file
            if (file.fsPath === activeEditor.document.uri.fsPath) continue;

            try {
                const fileContent = await this.readFileContent(file);
                const relativePath = vscode.workspace.asRelativePath(file);
                
                // Avoid duplicates
                if (!contextFiles.has(relativePath)) {
                    const tokens = this.estimateTokens(fileContent);
                    
                    // Check token budget
                    if (totalTokens + tokens < maxTokens) {
                        contextFiles.set(relativePath, fileContent);
                        totalTokens += tokens;
                    }
                }
            } catch (e) {
                console.warn(`Failed to read context file: ${file.fsPath}`, e);
            }
        }
        
        if (totalTokens >= maxTokens) break;
      }
    }

    // 3. Format context string
    let contextString = 'Project Context:\n';
    for (const [path, content] of contextFiles) {
        contextString += `\nFile: ${path}\n\`\`\`\n${content}\n\`\`\`\n`;
    }

    return contextString;
  }

  /**
   * Read file content using VSCode FS API
   */
  private async readFileContent(uri: vscode.Uri): Promise<string> {
      const uint8Array = await vscode.workspace.fs.readFile(uri);
      return new TextDecoder().decode(uint8Array);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
      return Math.ceil(text.length / 4);
  }
}