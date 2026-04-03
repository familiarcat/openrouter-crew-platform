import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DarkForestValidator } from '../services/dark-forest-validator';
import { execAsync } from '../services/exec';
import { AgentNetworkService } from '../services/agent-network';

/**
 * Worf Security Sweep Command
 * 
 * Acts as Security Chief Worf performing a broad-spectrum sweep of the current Git branch.
 * It identifies all files modified in the branch and subjects them to the Dark Forest Validator
 * (both Path and AST-based Content analysis).
 */
export async function worfSecuritySweepCommand(context: vscode.ExtensionContext, agentNetwork: AgentNetworkService) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('🛡️ Worf: No active workspace detected for tactical sweep.');
        return;
    }

    const validator = new DarkForestValidator();
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🛡️ Worf: Initiating branch security sweep...",
        cancellable: true
    }, async (progress, token) => {
        try {
            // Identify changed files in the current branch compared to main/master
            // Uses Git to find the honorable path of the warrior
            const { stdout: filesOutput } = await execAsync('git diff --name-only main...', { cwd: workspaceRoot })
                .catch(() => execAsync('git diff --name-only master...', { cwd: workspaceRoot }))
                .catch(() => execAsync('git diff --name-only HEAD', { cwd: workspaceRoot }));

            const files = filesOutput.split('\n').filter(f => f.trim().length > 0);
            
            if (files.length === 0) {
                vscode.window.showInformationMessage('🛡️ Worf: No changed files detected. The branch is honorable.');
                return;
            }

            const violations: string[] = [];
            let processedCount = 0;

            for (const relPath of files) {
                if (token.isCancellationRequested) break;

                const absPath = path.join(workspaceRoot, relPath);
                
                // Ensure file exists (skip deletions)
                try {
                    await fs.access(absPath);
                } catch {
                    continue;
                }

                progress.report({ message: `Scanning ${relPath}...`, increment: (1 / files.length) * 100 });

                // Execute Deterministic Protocol Checks
                const pathValidation = validator.validatePath(absPath, workspaceRoot);
                if (!pathValidation.isValid) {
                    violations.push(`[PATH] ${relPath}: ${pathValidation.reason} (${pathValidation.violatedAxiom})`);
                }

                const content = await fs.readFile(absPath, 'utf8');
                const contentValidation = validator.validateContent(content, absPath);
                if (!contentValidation.isValid) {
                    violations.push(`[CONTENT] ${relPath}: ${contentValidation.reason} (${contentValidation.violatedAxiom})`);
                }
                
                processedCount++;
            }

            if (violations.length > 0) {
                // Log violations to agent_memory so Worf remembers past transgressions
                for (const violation of violations) {
                    // Deterministic protocol violations are recorded as HIGH priority
                    await agentNetwork.broadcastInsight(violation, 'Worf Security Sweep', 'HIGH');
                }

                const alertMsg = `🛡️ Worf: Protocol violation detected! Found ${violations.length} issues in ${processedCount} files.`;
                const selection = await vscode.window.showErrorMessage(alertMsg, 'View Tactical Report');
                
                if (selection === 'View Tactical Report') {
                    const channel = vscode.window.createOutputChannel('Worf Security Sweep');
                    channel.appendLine(`=== WORF SECURITY SWEEP REPORT ===`);
                    channel.appendLine(`Date: ${new Date().toLocaleString()}`);
                    channel.appendLine(`Files Analyzed: ${processedCount}`);
                    channel.appendLine('-----------------------------------');
                    violations.forEach(v => channel.appendLine(v));
                    channel.show();
                }
            } else {
                vscode.window.showInformationMessage(`🛡️ Worf: Sweep complete. All ${processedCount} files are cleared for duty.`);
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`🛡️ Worf: Tactical sweep failed: ${error.message}`);
        }
    });
}