import * as vscode from 'vscode';
import { ToolDefinition } from '../services/types.js';
import { execAsync } from '../services/exec.js';

export const opsTools: ToolDefinition[] = [
    {
        schema: {
            type: 'function',
            function: {
                name: 'deployToStaging',
                description: 'Deploy a domain or project to the staging environment using the deployment scripts.',
                parameters: {
                    type: 'object',
                    properties: {
                        domain: { type: 'string', description: 'The domain to deploy (e.g., "product-factory")' },
                        project: { type: 'string', description: 'The specific project to deploy (optional)' }
                    },
                    required: ['domain']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                let cmd = '';
                if (args.project) {
                    cmd = `bash scripts/deploy-project.sh "${args.domain}" "${args.project}" staging`;
                } else {
                    cmd = `bash scripts/deploy-domain.sh "${args.domain}" staging`;
                }

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to deploy to staging?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied deployment.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Deployment to staging initiated for ${args.domain}${args.project ? '/' + args.project : ''}.`;
            } catch (e: any) {
                return `Error deploying to staging: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'restartService',
                description: 'Restart a specific Docker container/service to apply changes or recover from errors.',
                parameters: {
                    type: 'object',
                    properties: {
                        container: { type: 'string', description: 'The name or ID of the container to restart' }
                    },
                    required: ['container']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `docker restart ${args.container}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to restart container ${args.container}?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied restart.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Container ${args.container} restarted successfully.`;
            } catch (e: any) {
                return `Error restarting container: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'runDatabaseMigration',
                description: 'Execute Supabase database migrations to update the schema.',
                parameters: {
                    type: 'object',
                    properties: {
                        linked: { type: 'boolean', description: 'Whether to push to the linked remote project (default: false)' }
                    }
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = args.linked ? 'supabase db push --linked' : 'supabase db push';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to run database migrations?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied migration.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "Migrations applied successfully.";
            } catch (e: any) {
                return `Error running migrations: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'runBuild',
                description: 'Run the project build script to verify compilation. Use this before running tests to ensure code validity.',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm run build';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to run build?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied build execution.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `BUILD SUCCESS:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `BUILD FAILED:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'monitorLogs',
                description: 'Retrieve recent logs from a running service (Docker) or log file to diagnose issues.',
                parameters: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', description: 'The container name or log file path' },
                        lines: { type: 'number', description: 'Number of lines to retrieve (default: 50)' }
                    },
                    required: ['target']
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const lines = args.lines || 50;
                const target = args.target;
                let cmd = '';

                if (target.includes('/') || target.includes('\\') || target.endsWith('.log')) {
                     cmd = `tail -n ${lines} "${target}"`;
                } else {
                    cmd = `docker logs --tail ${lines} ${target}`;
                }

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to read logs from ${target}?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied log access.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `No logs returned for ${target}.`;
            } catch (e: any) {
                return `Error reading logs: ${e.message}`;
            }
        }
    }
];