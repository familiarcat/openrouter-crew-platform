import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CostTracker } from './cost-tracker';
import { RedisClient } from '@openrouter-crew/shared-redis-client';
import { DarkForestValidator } from './dark-forest-validator';

/**
 * ProposeChangeService
 * Implements the Dark Forest Protocol by replacing destructive writes 
 * with a human-in-the-loop approval workflow.
 */
export class ProposeChangeService {
    private redis: Redis; // Geordi: Explicitly type Redis client
    private validator: DarkForestValidator;

    constructor(private costTracker?: CostTracker) {
        // Standard fleet connection
        this.validator = new DarkForestValidator();
        this.redis = RedisClient.getInstance();
    }

    /**
     * Proposes a change to a file by showing a side-by-side diff.
     * Returns true if accepted, false otherwise.
     */
    public async propose(filePath: string, newContent: string, costUSD: number = 0): Promise<boolean> {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No active workspace found.');
        }

        const absolutePath = await this.resolvePath(filePath, workspaceRoot);

        // Validate the path against Dark Forest Protocol before proceeding
        const validation = this.validator.validatePath(absolutePath, workspaceRoot);
        if (!validation.isValid) {
            vscode.window.showErrorMessage(`[Protocol Violation] ${validation.violatedAxiom}: ${validation.reason}`);
            return false;
        }

        // Validate the content against Dark Forest Protocol malicious patterns
        const contentValidation = this.validator.validateContent(newContent, absolutePath);
        if (!contentValidation.isValid) {
            vscode.window.showErrorMessage(`[Protocol Violation] ${contentValidation.violatedAxiom}: ${contentValidation.reason}`);
            return false;
        }

        // Confirmation dialog showing the resolved absolute path
        const confirmation = await vscode.window.showInformationMessage(
            `Alex AI is proposing changes to the following location:\n\n${absolutePath}`,
            { modal: true },
            'Proceed to Review',
            'Cancel'
        );

        if (confirmation !== 'Proceed to Review') {
            return false;
        }

        const fileName = path.basename(absolutePath);
        
        // Handle new file creation
        if (!fs.existsSync(absolutePath)) {
            return this.proposeNewFile(absolutePath, newContent);
        }

        // Create a temporary file for the proposed version
        const tempDir = path.join(workspaceRoot, '.crew', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilePath = path.join(tempDir, `${fileName}.proposed`);
        fs.writeFileSync(tempFilePath, newContent);

        const originalUri = vscode.Uri.file(absolutePath);
        const proposedUri = vscode.Uri.file(tempFilePath);

        // Open the diff editor
        await vscode.commands.executeCommand(
            'vscode.diff', 
            originalUri, 
            proposedUri, 
            `Proposal: ${fileName} (Review Required)`
        );

        const costString = costUSD > 0 ? ` (Generation Cost: $${costUSD.toFixed(5)})` : '';

        const response = await vscode.window.showInformationMessage(
            `Alex AI proposes changes to ${fileName}${costString}. Do you accept these changes?`,
            { modal: true },
            'Accept & Apply', 
            'Reject'
        );

        // Cleanup temp file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        if (response === 'Accept & Apply') {
            // O'BRIEN TRANSPORTER BUFFER: Cache current state before overwriting
            const currentState = fs.readFileSync(absolutePath, 'utf-8');
            await this.redis.set(`buffer:${filePath}`, currentState, 'EX', 3600);

            fs.writeFileSync(absolutePath, newContent);
            vscode.window.showInformationMessage(`Successfully applied changes to ${fileName}`);
            return true;
        }

        return false;
    }

    private async proposeNewFile(filePath: string, content: string): Promise<boolean> {
        const response = await vscode.window.showInformationMessage(
            `Alex AI wants to create a new file at:\n\n${filePath}\n\nAllow?`,
            { modal: true },
            'Create', 'Cancel'
        );
        
        if (response === 'Create') {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, content);
            return true;
        }
        return false;
    }

    /**
     * Resolves a file path, attempting to find the best match in the workspace if it's relative or partial.
     */
    private async resolvePath(filePath: string, workspaceRoot: string): Promise<string> {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }

        // Try direct relative resolution first
        const directPath = path.join(workspaceRoot, filePath);
        if (fs.existsSync(directPath)) {
            return directPath;
        }

        // Fuzzy search for the filename in the workspace (ignoring node_modules)
        const fileName = path.basename(filePath);
        const files = await vscode.workspace.findFiles(`**/${fileName}`, '**/node_modules/**');

        if (files.length === 1) return files[0].fsPath;
        if (files.length > 1) {
            // Pick the match that shares the most common suffix with the requested path
            const match = files.find(f => f.fsPath.replace(/\\\\/g, '/').endsWith(filePath.replace(/\\\\/g, '/')));
            return match ? match.fsPath : files[0].fsPath;
        }

        return directPath; // Fallback to direct path even if it doesn't exist yet (creation case)
    }
}