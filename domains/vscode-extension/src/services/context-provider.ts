import * as vscode from 'vscode';

/**
 * Structure for captured editor context
 */
export interface EditorContext {
  selectedCode: string;
  fileContent: string;
  fileName: string;
  languageId: string;
  selectionRange: vscode.Range;
}

/**
 * Context Provider Service
 * Gathers code context from the active editor and workspace for LLM prompts.
 */
export class ContextProvider {
  
  /**
   * Get current editor context
   */
  getEditorContext(): EditorContext | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    const document = editor.document;
    const selection = editor.selection;

    return {
      selectedCode: document.getText(selection),
      fileContent: document.getText(),
      fileName: document.fileName,
      languageId: document.languageId,
      selectionRange: selection,
    };
  }

  /**
   * Build a formatted context string for the LLM
   */
  buildContextString(context: EditorContext): string {
    const relativePath = vscode.workspace.asRelativePath(context.fileName);
    
    let contextString = `File: ${relativePath}\nLanguage: ${context.languageId}\n`;

    // If selection exists, prioritize it
    const codeToInclude = context.selectedCode.trim().length > 0 ? context.selectedCode : context.fileContent;
    const label = context.selectedCode.trim().length > 0 ? `Selected Code (Lines ${context.selectionRange.start.line + 1}-${context.selectionRange.end.line + 1})` : 'File Content';

    contextString += `\n${label}:\n\`\`\`${context.languageId}\n${codeToInclude}\n\`\`\`\n`;

    return contextString;
  }
}