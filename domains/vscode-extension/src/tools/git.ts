import * as vscode from 'vscode';
import { ToolDefinition } from '../services/types.js';
import { execAsync } from '../services/exec.js';

export const gitTools: ToolDefinition[] = [
    {
        schema: {
            type: 'function',
            function: {
                name: 'gitCommit',
                description: 'Stage and commit all changes to the current branch. Use this ONLY after verifying that tests pass.',
                parameters: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'The commit message following conventional commits (e.g. "feat: add user login")' }
                    },
                    required: ['message']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const safeMessage = args.message.replace(/"/g, '\\"');
                const cmd = `git add . && git commit -m "${safeMessage}"`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to commit changes?`,
                    { modal: true, detail: `Message: ${args.message}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied commit.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Committed changes: "${args.message}"`;
            } catch (e: any) {
                return `Error committing changes: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'rollbackChanges',
                description: 'Revert all unstaged changes (modifications and new files) to the current branch state. Use this if tests fail or the implementation is incorrect.',
                parameters: {
                    type: 'object',
                    properties: {
                        reason: { type: 'string', description: 'The reason for rolling back changes' }
                    },
                    required: ['reason']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `git checkout . && git clean -fd`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to rollback changes?`,
                    { modal: true, detail: `Reason: ${args.reason}\nCommand: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied rollback.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "Changes rolled back successfully (workspace cleaned).";
            } catch (e: any) {
                return `Error rolling back changes: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'createPullRequest',
                description: 'Create a Pull Request on GitHub using the gh CLI. Use this after committing changes.',
                parameters: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'The title of the PR' },
                        body: { type: 'string', description: 'The description/body of the PR' },
                        draft: { type: 'boolean', description: 'Whether to create as a draft PR (default: false)' }
                    },
                    required: ['title', 'body']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const safeTitle = args.title.replace(/"/g, '\\"');
                const safeBody = args.body.replace(/"/g, '\\"');
                const draftFlag = args.draft ? '--draft' : '';
                
                const cmd = `gh pr create --title "${safeTitle}" --body "${safeBody}" ${draftFlag}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to create a Pull Request?`,
                    { modal: true, detail: `Title: ${args.title}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied PR creation.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `PR Created: "${args.title}"`;
            } catch (e: any) {
                return `Error creating PR: ${e.message}. Ensure GitHub CLI (gh) is installed and authenticated.`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'reviewChanges',
                description: 'Review changes made to the project files (git diff). Use this to verify your edits before confirming completion.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file (optional)' }
                    }
                }
            }
        },
        execute: async (args) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";
                
                const cmd = args.path ? `git diff "${args.path}"` : 'git diff';
                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "No unstaged changes detected.";
            } catch (e: any) {
                return `Error running git diff: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'checkGitStatus',
                description: 'Check the current git branch and status (clean/dirty).',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        },
        execute: async () => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const statusCmd = 'git status --porcelain';
                const branchCmd = 'git branch --show-current';

                const { stdout: statusOut } = await execAsync(statusCmd, { cwd });
                const { stdout: branchOut } = await execAsync(branchCmd, { cwd });

                const currentBranch = branchOut.trim();
                const isDirty = statusOut.trim().length > 0;
                
                return `Current Branch: ${currentBranch}\nStatus: ${isDirty ? 'Dirty (Uncommitted changes)' : 'Clean'}\n\n${isDirty ? 'Changes:\n' + statusOut : ''}`;
            } catch (e: any) {
                return `Error checking git status: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'createFeature',
                description: 'Initialize a new feature branch using the Product Factory domain standards.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'The name of the feature (e.g., "add-sprint-automation")' },
                        domain: { type: 'string', description: 'The domain the feature belongs to (e.g., "product-factory")' }
                    },
                    required: ['name', 'domain']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `bash scripts/agile/create-feature.sh "${args.domain}" "${args.name}"`;
                
                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to create feature branch?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied feature creation.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Feature branch for ${args.domain}/${args.name} created successfully.`;
            } catch (e: any) {
                return `Error creating feature: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'createHotfixBranch',
                description: 'Create a new hotfix branch from the main branch for urgent fixes.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'The name of the hotfix (e.g., "fix-login-crash")' }
                    },
                    required: ['name']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                // Try to detect main branch name
                let mainBranch = 'main';
                try {
                    const { stdout } = await execAsync('git branch -r', { cwd });
                    if (stdout.includes('origin/master')) mainBranch = 'master';
                } catch {}

                const branchName = `hotfix/${args.name}`;
                const cmd = `git checkout ${mainBranch} && git pull && git checkout -b ${branchName}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to create hotfix branch '${branchName}' from ${mainBranch}?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied hotfix creation.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Successfully created hotfix branch ${branchName} from ${mainBranch}`;
            } catch (e: any) {
                return `Error creating hotfix branch: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'createReleaseBranch',
                description: 'Create a new release branch following git flow standards (e.g., release/v1.0.0).',
                parameters: {
                    type: 'object',
                    properties: {
                        version: { type: 'string', description: 'The version number for the release (e.g., "v1.0.0")' }
                    },
                    required: ['version']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const branchName = `release/${args.version}`;
                const cmd = `git checkout -b ${branchName}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to create release branch '${branchName}'?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied branch creation.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Successfully created and switched to branch ${branchName}`;
            } catch (e: any) {
                return `Error creating release branch: ${e.message}`;
            }
        }
    }
];