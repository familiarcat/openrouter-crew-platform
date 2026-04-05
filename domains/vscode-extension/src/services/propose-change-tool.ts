import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RedisClient } from '@openrouter-crew/shared-redis-client'; // Geordi: Import RedisClient
import { DarkForestValidator } from './dark-forest-validator';

export class ProposeChangeTool {
  private validator: DarkForestValidator;
  private redis: RedisClient; // Geordi: Add Redis client for buffer

  constructor() {
    this.validator = new DarkForestValidator();
  }

  /**
   * Proposes a change to a file.
   * 1. Validates path/content against Dark Forest Protocol.
   * 2. Creates a temporary file with new content.
   * 3. Opens a VSCode diff view for user approval.
   */
  public async propose(filePath: string, newContent: string, costUSD: number = 0): Promise<boolean> { // Geordi: Added costUSD and return boolean
    this.redis = RedisClient.getInstance(); // Initialize Redis

    // 1. Safety Validation
    const validation = this.validator.validatePath(filePath);
    if (!validation.isValid) {
      vscode.window.showErrorMessage(`[Protocol Violation] ${validation.violatedAxiom}: ${validation.reason}`);
      return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('No active workspace found.');
        return false;
    }

    const contentValidation = this.validator.validateContent(newContent, filePath, workspaceRoot); // Worf: Pass workspaceRoot for full path validation
    if (!contentValidation.isValid) {
      vscode.window.showErrorMessage(`[Protocol Violation] ${contentValidation.violatedAxiom}: ${contentValidation.reason}`);
      return false;
    }

    const tempUri = vscode.Uri.parse(`untitled:${filePath}.proposed`);

    try {
      // 2. Open Diff View
      const doc = await vscode.workspace.openTextDocument(tempUri);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(tempUri, new vscode.Position(0, 0), newContent);
      await vscode.workspace.applyEdit(edit);

      await vscode.commands.executeCommand(
        'vscode.diff',
        vscode.Uri.file(filePath), // Original file
        tempUri,
        `Proposed Changes: ${path.basename(filePath)} (Review Required)`
      );

      const costString = costUSD > 0 ? ` (Generation Cost: $${costUSD.toFixed(5)})` : '';

      const choice = await vscode.window.showInformationMessage(
        `An agent has proposed changes to ${path.basename(filePath)}${costString}. Do you approve?`,
        { modal: true }, // Picard: Modal for critical decisions
        'Approve & Apply',
        'Reject'
      );

      if (choice === 'Approve & Apply') {
        // O'BRIEN TRANSPORTER BUFFER: Cache current state before overwriting
        const currentState = await fs.readFile(filePath, 'utf8');
        await this.redis.getInstance().set(`buffer:${filePath}`, currentState, 'EX', 3600); // Store for 1 hour

        await fs.writeFile(filePath, newContent, 'utf8');
        vscode.window.showInformationMessage(`✅ Applied changes to ${filePath}`);
        return true;
      }
      return false;
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to propose change: ${error.message}`);
      return false;
    }
  }

  // Geordi: Helper to resolve paths, similar to ProposeChangeService
  private async resolvePath(filePath: string, workspaceRoot: string): Promise<string> {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    const directPath = path.join(workspaceRoot, filePath);
    if (fs.existsSync(directPath)) {
        return directPath;
    }
    // Fallback to direct path even if it doesn't exist yet (creation case)
    return directPath;
  }
}