import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DarkForestValidator } from './dark-forest-validator';

export class ProposeChangeTool {
  private validator: DarkForestValidator;

  constructor() {
    this.validator = new DarkForestValidator();
  }

  /**
   * Proposes a change to a file.
   * 1. Validates path/content against Dark Forest Protocol.
   * 2. Creates a temporary file with new content.
   * 3. Opens a VSCode diff view for user approval.
   */
  public async propose(filePath: string, newContent: string): Promise<void> {
    // 1. Safety Validation
    const validation = this.validator.validatePath(filePath);
    if (!validation.isValid) {
      vscode.window.showErrorMessage(`[Protocol Violation] ${validation.violatedAxiom}: ${validation.reason}`);
      return;
    }

    const contentValidation = this.validator.validateContent(newContent, filePath);
    if (!contentValidation.isValid) {
      vscode.window.showErrorMessage(`[Protocol Violation] ${contentValidation.violatedAxiom}: ${contentValidation.reason}`);
      return;
    }

    const uri = vscode.Uri.file(filePath);
    const tempUri = vscode.Uri.parse(`untitled:${filePath}.proposed`);

    try {
      // 2. Open Diff View
      const doc = await vscode.workspace.openTextDocument(tempUri);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(tempUri, new vscode.Position(0, 0), newContent);
      await vscode.workspace.applyEdit(edit);

      await vscode.commands.executeCommand(
        'vscode.diff',
        uri,
        tempUri,
        `Proposed Changes: ${path.basename(filePath)} (Review Required)`
      );

      const choice = await vscode.window.showInformationMessage(
        `An agent has proposed changes to ${path.basename(filePath)}. Do you approve?`,
        'Approve & Apply',
        'Reject'
      );

      if (choice === 'Approve & Apply') {
        await fs.writeFile(filePath, newContent, 'utf8');
        vscode.window.showInformationMessage(`✅ Applied changes to ${filePath}`);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to propose change: ${error.message}`);
    }
  }
}