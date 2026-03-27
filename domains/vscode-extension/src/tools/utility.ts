import * as vscode from 'vscode';
import { ToolDefinition } from '../services/types.js';
import { execAsync } from '../services/exec.js';

export const utilityTools: ToolDefinition[] = [
    {
        schema: {
            type: 'function',
            function: {
                name: 'runTerminalCommand',
                description: 'Execute a shell command in the terminal. Use this for running tests, installing dependencies, or checking system status.',
                parameters: {
                    type: 'object',
                    properties: {
                        command: { type: 'string', description: 'The shell command to execute' },
                        reason: { type: 'string', description: 'The reason for running this command' }
                    },
                    required: ['command', 'reason']
                }
            }
        },
        execute: async (args, agent, deps) => {
            let costDetail = '';
            
            if (deps?.costTracker) {
                // Heuristic: ~4 characters per token for the shell command
                const estimatedTokens = Math.ceil(args.command.length / 4);
                const cost = await deps.costTracker.estimateCost(estimatedTokens, 0, 'google/gemini-flash-1.5');
                const metrics = await deps.costTracker.getCostMetrics('daily');
                
                if (metrics.remaining < cost) {
                    return `ABORTED: Estimated cost ($${cost.toFixed(4)}) exceeds remaining daily budget ($${metrics.remaining.toFixed(4)}).`;
                }
                costDetail = `\n\nEstimated Execution Cost: $${cost.toFixed(4)}`;
            }

            const allowed = await vscode.window.showInformationMessage(
                `Allow ${agent.profile.name} to run: ${args.command}?`,
                { modal: true, detail: `${args.reason}${costDetail}` },
                'Yes'
            );

            if (allowed !== 'Yes') return "User denied execution.";

            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                const { stdout, stderr } = await execAsync(args.command, { cwd });
                return stdout || stderr || "Command executed (no output).";
            } catch (e: any) {
                return `Command failed: ${e.message}\nStderr: ${e.stderr}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'checkBudget',
                description: 'Check the current budget status and remaining funds. Use this before starting expensive tasks.',
                parameters: {
                    type: 'object',
                    properties: {
                        estimatedCost: { type: 'number', description: 'Estimated cost of the upcoming task (optional)' }
                    }
                }
            }
        },
        execute: async (args, agent, deps) => {
            const metrics = await deps.costTracker.getCostMetrics('daily');
            const estimated = args.estimatedCost || 0;
            
            if (metrics.remaining < estimated) {
                return `BUDGET EXCEEDED: Cannot proceed. Remaining: $${metrics.remaining.toFixed(4)}, Required: $${estimated.toFixed(4)}. Stop execution.`;
            }
            
            return `Budget Status: OK. Remaining: $${metrics.remaining.toFixed(4)} (${(100 - metrics.percentUsed).toFixed(1)}% left).`;
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'askUser',
                description: 'Ask the user for clarification, confirmation, or additional information when the task is ambiguous.',
                parameters: {
                    type: 'object',
                    properties: {
                        question: { type: 'string', description: 'The question to ask the user' }
                    },
                    required: ['question']
                }
            }
        },
        execute: async (args, agent) => {
            const answer = await vscode.window.showInputBox({
                prompt: `Agent ${agent.profile.name} asks: ${args.question}`,
                placeHolder: 'Type your answer here...'
            });
            return answer ? `User Answer: ${answer}` : 'User cancelled the question.';
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'saveInsight',
                description: 'Save a successful command pattern, fix, or learning to the database for future use.',
                parameters: {
                    type: 'object',
                    properties: {
                        insight: { type: 'string', description: 'The knowledge/pattern to save' }
                    },
                    required: ['insight']
                }
            }
        },
        execute: async (args, agent, deps) => {
            await deps.network.broadcastInsight(args.insight, agent.profile.name);
            return "Insight saved successfully.";
        }
    }
];