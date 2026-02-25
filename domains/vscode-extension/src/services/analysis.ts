import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import { ToolDefinition } from './types.js';
import { execAsync } from './exec.js';

export const analysisTools: ToolDefinition[] = [
    {
        schema: {
            type: 'function',
            function: {
                name: 'runTests',
                description: 'Run the project test suite to verify functionality. Returns pass/fail status and output.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Specific test file to run (optional)' }
                    }
                }
            }
        },
        execute: async (args, agent) => {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                // Default to npm test, append path if provided
                const cmd = args.path ? `npm test -- ${args.path}` : 'npm test';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to run tests?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied test execution.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `TESTS PASSED:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `TESTS FAILED:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'runLinter',
                description: 'Run the project linter to check for code quality issues and style violations.',
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

                const cmd = 'npm run lint';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to run linter?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied linter execution.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `LINT PASSED:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `LINT FAILED:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'fixLintIssues',
                description: 'Automatically fix linting errors and style violations where possible.',
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

                const cmd = 'npm run lint -- --fix';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to fix lint issues?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied lint fix.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `LINT FIX APPLIED:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `LINT FIX FAILED/PARTIAL:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'formatCode',
                description: 'Run Prettier to format the codebase and improve code style.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'The path of the file or directory to format. If omitted, formats the entire project.' }
                    },
                    required: []
                }
            }
        },
        execute: async (args, agent) => {
             try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npx prettier --write .';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${agent.profile.name} to format code?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied code formatting.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `Code Formatted:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `Code Formatting Failed:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'createUnitTest',
                description: 'Automatically generate a unit test file for a given source file using the project testing framework.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the source file' }
                    },
                    required: ['path']
                }
            }
        },
        execute: async (args) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const sourceUri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(sourceUri);
                const sourceCode = new TextDecoder().decode(contentUint8);

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                // Construct prompt
                const prompt = `Generate a comprehensive unit test file for the following code. 
                Use the existing project testing framework (assume Jest/Mocha/Vitest based on file extension or standard practices).
                Include happy paths and error cases.
                
                File: ${args.path}
                Code:
                \`\`\`
                ${sourceCode}
                \`\`\`
                
                Return ONLY the code for the test file.`;

                // Call LLM
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
                        'X-Title': 'OpenRouter Crew VSCode',
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o', // Use high quality model for code gen
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                const data = await response.json() as any;
                const generatedContent = data.choices?.[0]?.message?.content;
                
                if (!generatedContent) return "Error: Failed to generate test content.";

                // Extract code block
                const codeBlockMatch = generatedContent.match(/```(?:typescript|javascript|ts|js)?\n([\s\S]*?)```/);
                const finalCode = codeBlockMatch ? codeBlockMatch[1] : generatedContent;

                // Determine output path: file.ts -> file.test.ts
                const pathParts = args.path.split('.');
                const ext = pathParts.pop();
                const testPath = `${pathParts.join('.')}.test.${ext}`;
                const testUri = vscode.Uri.joinPath(workspaceFolder.uri, testPath);

                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(testUri, encoder.encode(finalCode));

                return `Successfully created unit test file: ${testPath}`;

            } catch (e: any) {
                return `Error creating unit test: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'refactorFile',
                description: 'Apply a specific refactoring pattern to a file.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file' },
                        pattern: { 
                            type: 'string', 
                            description: 'Refactoring pattern to apply',
                            enum: ['extract-function', 'simplify-logic', 'rename-variables', 'remove-dead-code']
                        },
                        context: { type: 'string', description: 'Additional context or instructions for the refactoring' }
                    },
                    required: ['path', 'pattern']
                }
            }
        },
        execute: async (args, agent, deps) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);

                // Use FileManager to perform the refactoring
                const finalCode = await deps.fileManager.generateRefactoring(
                    content,
                    args.pattern,
                    args.context || ''
                );

                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(finalCode));

                return `Successfully refactored ${args.path} using pattern '${args.pattern}'.`;
            } catch (e: any) {
                return `Error refactoring file: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'analyzeComplexity',
                description: 'Analyze the cyclomatic complexity of a file to identify refactoring candidates.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file' }
                    },
                    required: ['path']
                }
            }
        },
        execute: async (args, agent, deps) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);

                const analysis = await deps.fileManager.analyzeFile(args.path, content);
                
                return `Complexity Report for ${args.path}:\nScore: ${analysis.complexity}\nFunctions: ${analysis.nodes.filter(n => n.type === 'function').length}\nIssues: ${analysis.issues.length}`;
            } catch (e: any) {
                return `Error analyzing complexity: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'analyzeDependencies',
                description: 'Analyze imports and dependencies of a file.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file' }
                    },
                    required: ['path']
                }
            }
        },
        execute: async (args, agent, deps) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);

                const analysis = await deps.fileManager.analyzeFile(args.path, content);
                
                return `Dependencies for ${args.path}:\nImports: ${analysis.imports.join(', ') || 'None'}`;
            } catch (e: any) {
                return `Error analyzing dependencies: ${e.message}`;
            }
        }
    }
];