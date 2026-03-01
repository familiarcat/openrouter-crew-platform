import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';
import { ToolDefinition } from '../services/types.js';

export const fsTools: ToolDefinition[] = [
    {
        schema: {
            type: 'function',
            function: {
                name: 'writeFile',
                description: 'Write content to a file. Use this to create new files or overwrite existing ones. Prefer this over terminal commands for file creation.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file' },
                        content: { type: 'string', description: 'The content to write to the file' }
                    },
                    required: ['path', 'content']
                }
            }
        },
        execute: async (args) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(args.content));
                return `Successfully wrote to ${args.path}`;
            } catch (e: any) {
                return `Error writing file: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'readFile',
                description: 'Read the contents of a file in the workspace. Use this to inspect code before making changes or running commands.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the file (e.g., src/main.ts)' }
                    },
                    required: ['path']
                }
            }
        },
        execute: async (args) => {
            try {
                const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, args.path);
                const content = await vscode.workspace.fs.readFile(uri);
                return new TextDecoder().decode(content);
            } catch (e: any) {
                return `Error reading file: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'listFiles',
                description: 'List files in a directory to understand project structure.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the directory (default: root)' }
                    },
                    required: ['path']
                }
            }
        },
        execute: async (args) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path || '.');
                const files = await vscode.workspace.fs.readDirectory(uri);
                return files.map(([name, type]) => 
                    `${name}${type === vscode.FileType.Directory ? '/' : ''}`
                ).join('\n');
            } catch (e: any) {
                return `Error listing files: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'generateDocumentation',
                description: 'Generate a README.md file for a specific directory based on its file contents and structure.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to the directory to document' }
                    },
                    required: ['path']
                }
            }
        },
        execute: async (args) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const dirUri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                
                // Read directory
                const files = await vscode.workspace.fs.readDirectory(dirUri);
                
                let context = `Directory: ${args.path}\n\nFiles:\n`;
                
                // Filter and read files (limit to 10 non-directory files to save tokens)
                let readCount = 0;
                for (const [fileName, type] of files) {
                    if (type === vscode.FileType.File && readCount < 10 && !fileName.startsWith('.')) {
                        const fileUri = vscode.Uri.joinPath(dirUri, fileName);
                        const contentUint8 = await vscode.workspace.fs.readFile(fileUri);
                        const content = new TextDecoder().decode(contentUint8);
                        // Truncate large files
                        const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + '... (truncated)' : content;
                        context += `\n--- ${fileName} ---\n${truncatedContent}\n`;
                        readCount++;
                    } else {
                        context += `- ${fileName} (${type === vscode.FileType.Directory ? 'Dir' : 'File'})\n`;
                    }
                }

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Generate a comprehensive README.md for the following directory content.
                Include:
                - Overview of the module/directory
                - Description of key files
                - Usage examples if applicable
                
                Context:
                ${context}
                
                Return ONLY the markdown content for the README.md.`;

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
                        'X-Title': 'OpenRouter Crew VSCode',
                    },
                    body: JSON.stringify({
                        model: 'openai/gpt-4o',
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                const data = await response.json() as any;
                const generatedContent = data.choices?.[0]?.message?.content;
                
                if (!generatedContent) return "Error: Failed to generate documentation.";

                // Clean up markdown code blocks if present
                const cleanContent = generatedContent.replace(/^```markdown\n|^```\n|```$/gm, '');

                const readmeUri = vscode.Uri.joinPath(dirUri, 'README.md');
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(readmeUri, encoder.encode(cleanContent));

                return `Successfully generated README.md in ${args.path}`;

            } catch (e: any) {
                return `Error generating documentation: ${e.message}`;
            }
        }
    },
    {
        schema: {
            type: 'function',
            function: {
                name: 'scanForSecrets',
                description: 'Scan files for potential hardcoded secrets (API keys, tokens, passwords) before committing.',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', description: 'Relative path to scan (optional, defaults to workspace root)' }
                    }
                }
            }
        },
        execute: async (args) => {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const rootPath = args.path || '.';
                const searchPattern = new vscode.RelativePattern(workspaceFolder, `${rootPath}/**/*.{ts,js,json,env,yml,yaml,xml,java,py,go,rs,cs}`);
                const excludePattern = '**/{node_modules,dist,out,build,.git,test,tests,coverage}/**';
                
                // Limit to 50 files for performance in this synchronous tool
                const files = await vscode.workspace.findFiles(searchPattern, excludePattern, 50);
                
                const secretPatterns = [
                    // Generic assignment of secret-like variables
                    /(api_?key|auth_?token|access_?token|secret|password|passwd|private_?key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/i,
                    // Specific patterns (e.g. OpenAI sk-...)
                    /['"](sk-[a-zA-Z0-9]{20,})['"]/
                ];

                let findings = '';
                let foundCount = 0;

                for (const file of files) {
                    const contentUint8 = await vscode.workspace.fs.readFile(file);
                    const content = new TextDecoder().decode(contentUint8);
                    const lines = content.split('\n');

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        // Skip comments roughly
                        if (line.trim().startsWith('//') || line.trim().startsWith('#')) continue;

                        for (const pattern of secretPatterns) {
                            if (pattern.test(line)) {
                                const relativePath = vscode.workspace.asRelativePath(file);
                                // Mask the secret in the output for safety
                                const maskedLine = line.replace(/([:=]\s*['"])([^'"]+)(['"])/, '$1********$3');
                                findings += `\n⚠️ Potential secret in ${relativePath}:${i + 1}\n   ${maskedLine.trim()}`;
                                foundCount++;
                                break; // Found one on this line, move to next line
                            }
                        }
                    }
                }

                if (foundCount === 0) {
                    return "✅ No potential secrets found in scanned files.";
                } else {
                    return `⚠️ Found ${foundCount} potential secrets:${findings}\n\nPlease review these files and use environment variables instead.`;
                }

            } catch (e: any) {
                return `Error scanning for secrets: ${e.message}`;
            }
        }
    }
];