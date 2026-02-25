/**
 * domains/vscode-extension/src/services/agent-network.ts
 * 
 * The "Central Mind" orchestration layer.
 * Replaces static n8n workflows with dynamic, code-based agent hierarchies.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as vscode from 'vscode';
import { TextDecoder, TextEncoder, promisify } from 'util';
import { exec } from 'child_process';
import { TerminalManager } from './terminal-manager.js';
import { CostTracker } from './cost-tracker.js';
import { FileManager } from './file-manager.js';

// Configuration for an Agent's persona and capabilities
export interface AgentProfile {
    name: string;
    role: string;
    specialties: string[];
    model: 'claude-3-5-sonnet' | 'gpt-4o' | 'gemini-1.5-pro';
}

// A tool the agent can use (e.g., "readFile", "runTest")
export interface AgentTool {
    name: string;
    description: string;
    execute: (args: any) => Promise<any>;
}

const execAsync = promisify(exec);

export class AgentNetworkService {
    private supabase: SupabaseClient;
    private activeAgents: Map<string, CrewAgent> = new Map();
    private terminalManager: TerminalManager;
    private fileManager: FileManager;

    constructor(private costTracker: CostTracker) {
        // Connect to your local Supabase instance for shared memory
        this.supabase = createClient(
            process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
        );
        this.terminalManager = new TerminalManager();
        this.fileManager = new FileManager();
    }

    /**
     * Spawns a Department Lead who can then recruit sub-agents.
     */
    public getDepartment(name: string): CrewAgent {
        if (this.activeAgents.has(name)) {
            return this.activeAgents.get(name)!;
        }

        // Define standard departments (The "Crew")
        const profiles: Record<string, AgentProfile> = {
            'picard': { name: 'Picard', role: 'Strategy & Leadership', specialties: ['planning', 'delegation'], model: 'claude-3-5-sonnet' },
            'data': { name: 'Data', role: 'Technical Analysis', specialties: ['code-analysis', 'debugging'], model: 'gpt-4o' },
            'riker': { name: 'Riker', role: 'Execution & Operations', specialties: ['implementation', 'refactoring'], model: 'claude-3-5-sonnet' },
        };

        const profile = profiles[name.toLowerCase()] || profiles['data'];
        const agent = new CrewAgent(profile, this.supabase, this, this.terminalManager, this.costTracker, this.fileManager);
        this.activeAgents.set(name, agent);
        return agent;
    }

    /**
     * Records a shared learning/insight into Supabase for all agents to access.
     */
    public async broadcastInsight(insight: string, source: string): Promise<void> {
        console.log(`[Central Mind] Storing insight from ${source}: ${insight}`);
        try {
            const { error } = await this.supabase.from('agent_memory').insert({
                content: insight,
                source: source,
                type: 'pattern', // Categorize as 'pattern' for command reuse
                created_at: new Date().toISOString()
            });
            
            if (error) throw error;
        } catch (e) {
            console.error(`[Central Mind] Failed to save insight: ${e}`);
        }
    }
}

/**
 * A single Crew Member capable of reasoning, tool use, and sub-delegation.
 */
export class CrewAgent {
    private subTeam: CrewAgent[] = [];

    constructor(
        public profile: AgentProfile,
        private memory: SupabaseClient,
        private network: AgentNetworkService,
        private terminalManager: TerminalManager,
        private costTracker: CostTracker,
        private fileManager: FileManager
    ) {}

    /**
     * The main execution loop for the agent.
     */
    public async executeTask(task: string, context?: any): Promise<string> {
        // 1. Retrieve Context (RAG) from Supabase
        let memoryContext = '';
        try {
            // Basic keyword extraction: words > 3 chars, joined by OR operator for text search
            const keywords = task.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3).join(' | ');
            
            if (keywords) {
                const { data, error } = await this.memory
                    .from('agent_memory')
                    .select('content, type, source')
                    .textSearch('content', keywords)
                    .limit(5);

                if (!error && data && data.length > 0) {
                    memoryContext = data.map(m => `[${m.type.toUpperCase()}] ${m.content} (Source: ${m.source})`).join('\n');
                    console.log(`[${this.profile.name}] Retrieved ${data.length} memories.`);
                }
            }
        } catch (e) {
            console.warn(`[${this.profile.name}] RAG retrieval failed:`, e);
        }
        
        // 2. "Think" - Determine if sub-agents are needed (Mock LLM Logic)
        const needsSubTeam = task.includes("complex") || task.includes("project");

        if (needsSubTeam) {
            return this.delegateToSubTeam(task);
        }

        // 3. Act - Perform the task using tools or direct generation
        return this.performWork(task, memoryContext);
    }

    private async delegateToSubTeam(task: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const apiKey = config.get<string>('apiKey');
        if (!apiKey) return `[${this.profile.name}] Error: API Key missing for delegation.`;

        // 1. Define the sub-agent profile using LLM
        const delegationPrompt = `
        You are ${this.profile.name}, a ${this.profile.role}.
        You need to delegate the following task to a specialized sub-agent:
        "${task}"

        Define the ideal profile for this sub-agent.
        Return ONLY a JSON object (no markdown formatting) with the following structure:
        {
            "name": "Agent Name",
            "role": "Specific Role",
            "specialties": ["skill1", "skill2"],
            "model": "gpt-4o"
        }
        Valid models: 'gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'.
        `;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
                    'X-Title': 'OpenRouter Crew VSCode',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o', // Use a smart model for coordination
                    messages: [{ role: 'user', content: delegationPrompt }]
                })
            });

            const data = await response.json() as any;
            const content = data.choices?.[0]?.message?.content;
            
            if (!content) throw new Error("No response from delegation request");

            // Clean up content (remove markdown code blocks if present)
            const jsonString = content.replace(/```json\n?|```/g, '').trim();

            let subAgentProfile: AgentProfile;
            try {
                subAgentProfile = JSON.parse(jsonString);
            } catch (e) {
                console.error("Failed to parse sub-agent profile", content);
                throw new Error("Failed to parse sub-agent profile JSON");
            }

            console.log(`[${this.profile.name}] Spawning sub-agent: ${subAgentProfile.name} (${subAgentProfile.role})`);

            // 2. Spawn the agent
            const subAgent = new CrewAgent(
                subAgentProfile, 
                this.memory, 
                this.network, 
                this.terminalManager,
                this.costTracker,
                this.fileManager
            );
            this.subTeam.push(subAgent);

            // 3. Execute task
            const result = await subAgent.executeTask(task);

            // 4. Record outcome
            await this.network.broadcastInsight(
                `Sub-agent ${subAgentProfile.name} completed: ${task.substring(0, 50)}...`, 
                this.profile.name
            );

            return `[${this.profile.name}] Delegated to ${subAgentProfile.name}:\n${result}`;

        } catch (error: any) {
            return `[${this.profile.name}] Delegation failed: ${error.message}`;
        }
    }

    private async performWork(task: string, memoryContext: string = ''): Promise<string> {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const apiKey = config.get<string>('apiKey');

        if (!apiKey) return `[${this.profile.name}] Error: API Key missing.`;

        // Define tools including the new Terminal Command
        const tools: any[] = [
            {
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
            {
                type: 'function',
                function: {
                    name: 'createRelease',
                    description: 'Create a new release on GitHub using the gh CLI. Requires authorization based on release level.',
                    parameters: {
                        type: 'object',
                        properties: {
                            tag: { type: 'string', description: 'The tag version (e.g., v1.0.0)' },
                            title: { type: 'string', description: 'Release title' },
                            notes: { type: 'string', description: 'Release notes content or path to changelog file' },
                            level: { type: 'string', enum: ['feature', 'uat', 'production'], description: 'The release authority level' }
                        },
                        required: ['tag', 'title', 'level']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'summarizeCommits',
                    description: 'Generate a daily standup report based on recent git commit activity.',
                    parameters: {
                        type: 'object',
                        properties: {
                            days: { type: 'number', description: 'Number of days to look back (default: 1)' },
                            author: { type: 'string', description: 'Filter by author (optional)' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'generateChangelog',
                    description: 'Generate a CHANGELOG.md file by analyzing git commit history.',
                    parameters: {
                        type: 'object',
                        properties: {
                            since: { type: 'string', description: 'Git tag or commit hash to start from (e.g., "v1.0.0"). Defaults to beginning.' },
                            outputFile: { type: 'string', description: 'Path to save the changelog (default: CHANGELOG.md)' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'validateSchema',
                    description: 'Validate a JSON or YAML file against a schema definition.',
                    parameters: {
                        type: 'object',
                        properties: {
                            filePath: { type: 'string', description: 'Path to the data file (JSON/YAML)' },
                            schemaPath: { type: 'string', description: 'Path to the schema file (optional)' },
                            schemaContent: { type: 'string', description: 'Inline schema definition (optional)' }
                        },
                        required: ['filePath']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'createArchitectureDiagram',
                    description: 'Generate a Mermaid architecture diagram based on the project structure.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Relative path to the directory to analyze (optional, defaults to root)' },
                            outputFile: { type: 'string', description: 'Path to save the diagram (e.g., docs/architecture.mermaid)' }
                        },
                        required: ['outputFile']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'suggestOptimization',
                    description: 'Analyze a file and propose performance and memory optimizations.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Relative path to the file to analyze' }
                        },
                        required: ['path']
                    }
                }
            },
            {
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
            {
                type: 'function',
                function: {
                    name: 'compareFiles',
                    description: 'Compare two files semantically to understand differences in logic, structure, or intent (beyond simple text diff).',
                    parameters: {
                        type: 'object',
                        properties: {
                            pathA: { type: 'string', description: 'Relative path to the first file' },
                            pathB: { type: 'string', description: 'Relative path to the second file' }
                        },
                        required: ['pathA', 'pathB']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'findUnusedCode',
                    description: 'Analyze the project or a specific path to identify unused code (dead code), such as unused exports or imports.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Relative path to limit the analysis (optional)' }
                        }
                    }
                }
            },
            {
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
            {
                type: 'function',
                function: {
                    name: 'runDependencyCheck',
                    description: 'Verify that all imports in a file are listed in package.json dependencies.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Relative path to the file to check' }
                        },
                        required: ['path']
                    }
                }
            },
            {
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
            {
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
            {
                type: 'function',
                function: {
                    name: 'addErrorHandling',
                    description: 'Automatically wrap a specific function in a try-catch block to handle exceptions.',
                    parameters: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', description: 'Relative path to the file' },
                            functionName: { type: 'string', description: 'Name of the function to wrap' }
                        },
                        required: ['path', 'functionName']
                    }
                }
            },
            {
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
            {
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
            {
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
            {
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
            {
                type: 'function',
                function: {
                    name: 'searchWeb',
                    description: 'Search the web for documentation, libraries, or solutions to errors when internal knowledge is insufficient.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'The search query' }
                        },
                        required: ['query']
                    }
                }
            },
            {
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
            {
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
            {
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
            {
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
            {
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
            {
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
            {
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
            {
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
            {
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
            {
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
            {
                type: 'function',
                function: {
                    name: 'getServiceHealth',
                    description: 'Check the health status of a running service via HTTP request. Use this to verify deployments.',
                    parameters: {
                        type: 'object',
                        properties: {
                            url: { type: 'string', description: 'The health endpoint URL (e.g. http://localhost:3001/api/health)' }
                        },
                        required: ['url']
                    }
                }
            },
            {
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
             {
                type: 'function',
                function: {
                    name: 'runSecurityAudit',
                    description: 'Run npm audit to check for security vulnerabilities in project dependencies.',
                    parameters: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }
            },
            {
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
            {
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
            {
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
            {
                type: 'function',
                function: {
                    name: 'syncSecrets',
                    description: 'Pull and synchronize environment variables from the secure vault to the local workspace.',
                    parameters: {
                        type: 'object',
                        properties: {}
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'createMigration',
                    description: 'Create a new empty SQL migration file in the supabase/migrations directory.',
                    parameters: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'The name of the migration (e.g., "create_users_table")' }
                        },
                        required: ['name']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'generateTypes',
                    description: 'Generate TypeScript definitions from the Supabase schema to ensure type safety.',
                    parameters: {
                        type: 'object',
                        properties: {}
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'resetDatabase',
                    description: 'Wipe and reset the local database. CAUTION: This destroys all local data.',
                    parameters: {
                        type: 'object',
                        properties: {
                            linked: { type: 'boolean', description: 'Whether to reset the linked remote project (default: false)' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'seedDatabase',
                    description: 'Populate the database with test data using the seed script.',
                    parameters: {
                        type: 'object',
                        properties: {
                            linked: { type: 'boolean', description: 'Whether to seed the linked remote project (default: false)' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'listContainers',
                    description: 'List running Docker containers to see available services.',
                    parameters: {
                        type: 'object',
                        properties: {
                            all: { type: 'boolean', description: 'Include stopped containers (default: false)' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'rollbackDeployment',
                    description: 'Rollback a deployment for a domain or project if the new version is unstable.',
                    parameters: {
                        type: 'object',
                        properties: {
                            domain: { type: 'string', description: 'The domain to rollback (e.g., "product-factory")' },
                            project: { type: 'string', description: 'The specific project to rollback (optional)' },
                            environment: { type: 'string', description: 'The environment to rollback (default: staging)' }
                        },
                        required: ['domain']
                    }
                }
            },
            {
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
            {
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
            {
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
            {
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
            {
                type: 'function',
                function: {
                    name: 'runIntegrationTests',
                    description: 'Execute integration tests to verify system components work together.',
                    parameters: {
                        type: 'object',
                        properties: {
                            suite: { type: 'string', description: 'Specific test suite or file to run (optional)' }
                        }
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'checkCodeCoverage',
                    description: 'Parse the code coverage report to determine testing completeness.',
                    parameters: {
                        type: 'object',
                        properties: {
                            reportPath: { type: 'string', description: 'Path to coverage summary JSON (default: coverage/coverage-summary.json)' }
                        }
                    }
                }
            },
            {
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
            }
        ];

        const messages: any[] = [
            { 
                role: 'system', 
                content: `You are ${this.profile.name}, a ${this.profile.role}. 
                Your specialties are: ${this.profile.specialties.join(', ')}.
                You can execute terminal commands to gather information or perform tasks.
                ALWAYS read the output of your commands to decide your next step.
                If a command fails, analyze the error and try a fix.
                When you have completed the task, provide a final summary.
                
                ${memoryContext ? `\nRELEVANT MEMORY & PATTERNS:\n${memoryContext}\nUse these insights to guide your actions and avoid past mistakes.` : ''}` 
            },
            { role: 'user', content: task }
        ];

        let iterations = 0;
        const maxIterations = 15; // Safety limit to prevent infinite loops

        while (iterations < maxIterations) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
                        'X-Title': 'OpenRouter Crew VSCode',
                    },
                    body: JSON.stringify({
                        model: this.profile.model === 'claude-3-5-sonnet' ? 'anthropic/claude-3.5-sonnet' : 'openai/gpt-4o',
                        messages,
                        tools
                    })
                });

                const data = await response.json() as any;
                const message = data.choices?.[0]?.message;

                if (!message) break;

                // Add assistant's thought/tool-call to history
                messages.push(message);

                // If there are tool calls, execute them and loop again
                if (message.tool_calls && message.tool_calls.length > 0) {
                    for (const toolCall of message.tool_calls) {
                        const args = JSON.parse(toolCall.function.arguments);
                        console.log(`[${this.profile.name}] Executing: ${toolCall.function.name}`, args);
                        
                        // Execute the tool safely
                        const result = await this.executeTool(toolCall.function.name, args);
                        
                        // Feed result back to LLM
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            name: toolCall.function.name,
                            content: typeof result === 'string' ? result : JSON.stringify(result)
                        });
                    }
                    // Loop continues...
                } else {
                    // No tool calls means the agent is done
                    return message.content || `[${this.profile.name}] Task completed.`;
                }

            } catch (e) {
                return `[${this.profile.name}] Error: ${e}`;
            }
            iterations++;
        }
        
        return `[${this.profile.name}] Task stopped after ${maxIterations} iterations.`;
    }

    private async executeTool(name: string, args: any): Promise<any> {
        if (name === 'gitCommit') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const safeMessage = args.message.replace(/"/g, '\\"');
                const cmd = `git add . && git commit -m "${safeMessage}"`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to commit changes?`,
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

        if (name === 'rollbackChanges') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `git checkout . && git clean -fd`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to rollback changes?`,
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

        if (name === 'createPullRequest') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const safeTitle = args.title.replace(/"/g, '\\"');
                const safeBody = args.body.replace(/"/g, '\\"');
                const draftFlag = args.draft ? '--draft' : '';
                
                const cmd = `gh pr create --title "${safeTitle}" --body "${safeBody}" ${draftFlag}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to create a Pull Request?`,
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

        if (name === 'checkBudget') {
            const metrics = await this.costTracker.getCostMetrics('daily');
            const estimated = args.estimatedCost || 0;
            
            if (metrics.remaining < estimated) {
                return `BUDGET EXCEEDED: Cannot proceed. Remaining: $${metrics.remaining.toFixed(4)}, Required: $${estimated.toFixed(4)}. Stop execution.`;
            }
            
            return `Budget Status: OK. Remaining: $${metrics.remaining.toFixed(4)} (${(100 - metrics.percentUsed).toFixed(1)}% left).`;
        }

        if (name === 'searchWeb') {
            const config = vscode.workspace.getConfiguration('openrouterCrew');
            const searchApiKey = config.get<string>('searchApiKey');
            
            if (!searchApiKey) {
                vscode.window.showErrorMessage('Search API key is missing. Please configure it in settings.', 'Open Settings')
                    .then(selection => {
                        if (selection === 'Open Settings') {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'openrouterCrew.searchApiKey');
                        }
                    });
                return "Error: Search API key not configured. The user has been prompted to set 'openrouterCrew.searchApiKey'.";
            }

            try {
                // Using Tavily API (optimized for LLM agents)
                const response = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ api_key: searchApiKey, query: args.query, max_results: 3 })
                });
                const data = await response.json() as any;
                return JSON.stringify(data.results || data);
            } catch (e: any) {
                return `Search failed: ${e.message}`;
            }
        }

        if (name === 'createFeature') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `bash scripts/agile/create-feature.sh "${args.domain}" "${args.name}"`;
                
                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to create feature branch?`,
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

        if (name === 'runBuild') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm run build';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to run build?`,
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

        if (name === 'runTests') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                // Default to npm test, append path if provided
                const cmd = args.path ? `npm test -- ${args.path}` : 'npm test';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to run tests?`,
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

        if (name === 'reviewChanges') {
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

        if (name === 'saveInsight') {
            await this.network.broadcastInsight(args.insight, this.profile.name);
            return "Insight saved successfully.";
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return "Error: No workspace open.";

        if (name === 'listFiles') {
            try {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path || '.');
                const files = await vscode.workspace.fs.readDirectory(uri);
                return files.map(([name, type]) => 
                    `${name}${type === vscode.FileType.Directory ? '/' : ''}`
                ).join('\n');
            } catch (e: any) {
                return `Error listing files: ${e.message}`;
            }
        }

        if (name === 'writeFile') {
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

        if (name === 'readFile') {
            try {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const content = await vscode.workspace.fs.readFile(uri);
                return new TextDecoder().decode(content);
            } catch (e: any) {
                return `Error reading file: ${e.message}`;
            }
        }

        if (name === 'deployToStaging') {
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
                    `Allow ${this.profile.name} to deploy to staging?`,
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

        if (name === 'rollbackDeployment') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const env = args.environment || 'staging';
                let cmd = '';
                if (args.project) {
                    cmd = `bash scripts/rollback-project.sh "${args.domain}" "${args.project}" "${env}"`;
                } else {
                    cmd = `bash scripts/rollback-domain.sh "${args.domain}" "${env}"`;
                }

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to rollback ${env} deployment?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied rollback.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Rollback initiated for ${args.domain}${args.project ? '/' + args.project : ''} in ${env}.`;
            } catch (e: any) {
                return `Error executing rollback: ${e.message}`;
            }
        }

        if (name === 'monitorLogs') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const lines = args.lines || 50;
                const target = args.target;
                let cmd = '';

                // Simple heuristic to distinguish file paths from service names
                if (target.includes('/') || target.includes('\\') || target.endsWith('.log')) {
                     cmd = `tail -n ${lines} "${target}"`;
                } else {
                    cmd = `docker logs --tail ${lines} ${target}`;
                }

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to read logs from ${target}?`,
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

        if (name === 'listContainers') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const flag = args.all ? '-a' : '';
                const cmd = `docker ps ${flag} --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`;

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "No containers found.";
            } catch (e: any) {
                return `Error listing containers: ${e.message}`;
            }
        }

        if (name === 'restartService') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `docker restart ${args.container}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to restart container ${args.container}?`,
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

        if (name === 'getServiceHealth') {
            try {
                // Use a short timeout (5s) to avoid hanging if service is down
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(args.url, { 
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeout);

                const text = await response.text();
                return `Status: ${response.status} ${response.statusText}\nBody: ${text.substring(0, 300)}`;
            } catch (e: any) {
                return `Health check failed for ${args.url}: ${e.message}`;
            }
        }

        if (name === 'runDatabaseMigration') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = args.linked ? 'supabase db push --linked' : 'supabase db push';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to run database migrations?`,
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

        if (name === 'seedDatabase') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = args.linked ? 'supabase db seed --linked' : 'supabase db seed';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to seed the database?`,
                    { modal: true, detail: `Command: ${cmd}\nWarning: This inserts test data.` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied database seeding.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "Database seeded successfully.";
            } catch (e: any) {
                return `Error seeding database: ${e.message}`;
            }
        }

        if (name === 'resetDatabase') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = args.linked ? 'supabase db reset --linked' : 'supabase db reset';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to RESET the database?`,
                    { modal: true, detail: `Command: ${cmd}\nWARNING: ALL DATA WILL BE LOST.` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied database reset.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "Database reset successfully.";
            } catch (e: any) {
                return `Error resetting database: ${e.message}`;
            }
        }

        if (name === 'generateTypes') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm run generate:types';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to generate types?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied type generation.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "Types generated successfully.";
            } catch (e: any) {
                return `Error generating types: ${e.message}`;
            }
        }

        if (name === 'createMigration') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = `supabase migration new ${args.name}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to create a new migration?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied migration creation.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Migration file '${args.name}' created successfully.`;
            } catch (e: any) {
                return `Error creating migration: ${e.message}`;
            }
        }

        if (name === 'syncSecrets') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm run secrets:load';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to sync secrets from vault?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied secret sync.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || "Secrets synced successfully.";
            } catch (e: any) {
                return `Error syncing secrets: ${e.message}`;
            }
        }

        if (name === 'runLinter') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm run lint';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to run linter?`,
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

        if (name === 'fixLintIssues') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm run lint -- --fix';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to fix lint issues?`,
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

         if (name === 'runSecurityAudit') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npm audit';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to run security audit?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied security audit.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `Security Audit Result:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `Security Audit Failed:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }

        if (name === 'formatCode') {
             try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = 'npx prettier --write .';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to format code?`,
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

        if (name === 'askUser') {
            const answer = await vscode.window.showInputBox({
                prompt: `Agent ${this.profile.name} asks: ${args.question}`,
                placeHolder: 'Type your answer here...'
            });
            return answer ? `User Answer: ${answer}` : 'User cancelled the question.';
        }

        if (name === 'addErrorHandling') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);
                
                // 1. Find the function start
                // Matches: async function name(...) {  OR  function name(...) {  OR  const name = (...) => {
                const funcRegex = new RegExp(`(async\\s+)?(function\\s+${args.functionName}\\s*\\(|const\\s+${args.functionName}\\s*=\\s*(\\(|async\\s*\\())`);
                const match = content.match(funcRegex);
                
                if (!match || match.index === undefined) {
                    return `Error: Function '${args.functionName}' not found in ${args.path}.`;
                }

                // 2. Find the opening brace
                const openBraceIndex = content.indexOf('{', match.index);
                if (openBraceIndex === -1) return "Error: Could not find function body start.";

                // 3. Find the matching closing brace (simple counter)
                let balance = 1;
                let closeBraceIndex = -1;
                for (let i = openBraceIndex + 1; i < content.length; i++) {
                    if (content[i] === '{') balance++;
                    else if (content[i] === '}') balance--;
                    
                    if (balance === 0) {
                        closeBraceIndex = i;
                        break;
                    }
                }

                if (closeBraceIndex === -1) return "Error: Could not find function body end.";

                // 4. Wrap the body
                const body = content.substring(openBraceIndex + 1, closeBraceIndex);
                const newBody = `\n  try {${body}\n  } catch (error) {\n    console.error('Error in ${args.functionName}:', error);\n    throw error;\n  }\n`;
                
                const newContent = content.substring(0, openBraceIndex + 1) + newBody + content.substring(closeBraceIndex);
                
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(newContent));
                return `Successfully added try-catch block to function '${args.functionName}' in ${args.path}.`;
            } catch (e: any) {
                return `Error adding error handling: ${e.message}`;
            }
        }

        if (name === 'runDependencyCheck') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);

                // Use FileManager to get imports
                const analysis = this.fileManager.analyzeFile(args.path, content);
                const imports = analysis.imports;

                // Read package.json
                const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
                const packageJsonUint8 = await vscode.workspace.fs.readFile(packageJsonUri);
                const packageJson = JSON.parse(new TextDecoder().decode(packageJsonUint8));
                
                const allDeps = { 
                    ...packageJson.dependencies, 
                    ...packageJson.devDependencies,
                    ...packageJson.peerDependencies 
                };

                const builtins = ['assert', 'buffer', 'child_process', 'cluster', 'console', 'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'module', 'net', 'os', 'path', 'process', 'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys', 'timers', 'tls', 'tty', 'url', 'util', 'vm', 'zlib', 'vscode'];

                const missing = [];
                
                for (const imp of imports) {
                    if (imp.startsWith('.')) continue; // Relative
                    if (imp.startsWith('/')) continue; // Absolute
                    if (builtins.includes(imp) || imp.startsWith('node:')) continue;
                    
                    // Handle scoped packages @org/pkg or subpaths pkg/sub
                    let pkgName = imp;
                    if (imp.startsWith('@')) {
                        const parts = imp.split('/');
                        if (parts.length >= 2) pkgName = `${parts[0]}/${parts[1]}`;
                    } else {
                        pkgName = imp.split('/')[0];
                    }

                    if (!allDeps[pkgName]) {
                        missing.push(imp);
                    }
                }

                if (missing.length === 0) {
                    return "All imports are satisfied by package.json or built-ins.";
                } else {
                    return `Missing dependencies in package.json: ${missing.join(', ')}`;
                }

            } catch (e: any) {
                return `Error checking dependencies: ${e.message}`;
            }
        }

        if (name === 'createUnitTest') {
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

        if (name === 'findUnusedCode') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                // 1. Gather files
                const searchPattern = args.path 
                    ? new vscode.RelativePattern(workspaceFolder, `${args.path}/**/*.{ts,js,tsx,jsx,py,java,cs,go,rs}`)
                    : '**/*.{ts,js,tsx,jsx,py,java,cs,go,rs}';
                
                const excludePattern = '**/{node_modules,dist,out,build,.git,test,tests}/**';
                const files = await vscode.workspace.findFiles(searchPattern, excludePattern, 50); // Limit to 50 for performance

                if (files.length === 0) return "No matching files found to analyze.";

                const fileData = [];
                for (const file of files) {
                    const contentUint8 = await vscode.workspace.fs.readFile(file);
                    fileData.push({
                        path: vscode.workspace.asRelativePath(file),
                        content: new TextDecoder().decode(contentUint8)
                    });
                }

                // 2. Analyze
                const analysisResult = this.fileManager.analyzeMultipleFiles(fileData);
                
                // 3. Generate Report
                let report = `Analysis of ${files.length} files:\n`;
                
                // Unused Imports
                const unusedImports = [];
                for (const analysis of analysisResult.analyses) {
                    const suggestions = this.fileManager.generateSuggestions(analysis);
                    const importSuggestions = suggestions.filter(s => s.issue === 'Potentially unused import');
                    if (importSuggestions.length > 0) {
                        unusedImports.push(`File: ${analysis.filePath}`);
                        importSuggestions.forEach(s => unusedImports.push(`  - ${s.suggestion}`));
                    }
                }

                if (unusedImports.length > 0) {
                    report += `\nUnused Imports:\n${unusedImports.join('\n')}\n`;
                } else {
                    report += `\nNo unused imports detected.\n`;
                }

                // Naive Unused Exports Check
                const allImports = new Set<string>();
                analysisResult.analyses.forEach(a => {
                    a.imports.forEach(i => {
                        const parts = i.split('/');
                        allImports.add(parts[parts.length - 1]); 
                        allImports.add(i);
                    });
                });

                const potentiallyUnusedExports = [];
                for (const analysis of analysisResult.analyses) {
                    for (const exp of analysis.exports) {
                        if (exp !== 'default' && !allImports.has(exp)) {
                            potentiallyUnusedExports.push(`${analysis.filePath}: ${exp}`);
                        }
                    }
                }

                if (potentiallyUnusedExports.length > 0) {
                    report += `\nPotentially Unused Exports (Verify manually):\n${potentiallyUnusedExports.slice(0, 20).join('\n')}${potentiallyUnusedExports.length > 20 ? '\n...and more' : ''}\n`;
                }

                return report;
            } catch (e: any) {
                return `Error finding unused code: ${e.message}`;
            }
        }

        if (name === 'refactorFile') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";
                
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Refactor the following code.
                Pattern: ${args.pattern}
                Context/Instructions: ${args.context || 'None'}
                
                File: ${args.path}
                Code:
                \`\`\`
                ${content}
                \`\`\`
                
                Return ONLY the full refactored code for the file.`;

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
                
                if (!generatedContent) return "Error: Failed to generate refactored code.";

                const codeBlockMatch = generatedContent.match(/```(?:typescript|javascript|ts|js|python|java|cs|go|rs)?\n([\s\S]*?)```/);
                const finalCode = codeBlockMatch ? codeBlockMatch[1] : generatedContent;

                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(finalCode));

                return `Successfully refactored ${args.path} using pattern '${args.pattern}'.`;
            } catch (e: any) {
                return `Error refactoring file: ${e.message}`;
            }
        }

        if (name === 'generateDocumentation') {
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

        if (name === 'compareFiles') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const uriA = vscode.Uri.joinPath(workspaceFolder.uri, args.pathA);
                const uriB = vscode.Uri.joinPath(workspaceFolder.uri, args.pathB);

                const contentA = new TextDecoder().decode(await vscode.workspace.fs.readFile(uriA));
                const contentB = new TextDecoder().decode(await vscode.workspace.fs.readFile(uriB));

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Compare the following two files semantically.
                Highlight:
                - Logic changes
                - Structural differences
                - Refactoring improvements or regressions
                - Key additions/removals
                
                File A (${args.pathA}):
                \`\`\`
                ${contentA}
                \`\`\`
                
                File B (${args.pathB}):
                \`\`\`
                ${contentB}
                \`\`\`
                `;

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
                return data.choices?.[0]?.message?.content || "Error: No analysis returned.";

            } catch (e: any) {
                return `Error comparing files: ${e.message}`;
            }
        }

        if (name === 'createArchitectureDiagram') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const rootPath = args.path || '.';
                const searchPattern = new vscode.RelativePattern(workspaceFolder, `${rootPath}/**/*.{ts,js,tsx,jsx,py,java,cs,go,rs}`);
                const excludePattern = '**/{node_modules,dist,out,build,.git,test,tests}/**';
                
                // Limit to top 50 files to avoid token limits
                const files = await vscode.workspace.findFiles(searchPattern, excludePattern, 50);
                
                const fileList = files.map(f => vscode.workspace.asRelativePath(f)).join('\n');

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Generate a Mermaid JS architecture diagram (graph TD) for the following file structure.
                Group files by directories (subgraphs).
                Focus on relationships implied by directory structure and naming conventions.
                
                Files:
                ${fileList}
                
                Return ONLY the Mermaid code block.`;

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
                const content = data.choices?.[0]?.message?.content;
                
                if (!content) return "Error: Failed to generate diagram.";

                const codeBlockMatch = content.match(/```mermaid\n?([\s\S]*?)```/) || content.match(/```\n?([\s\S]*?)```/);
                const mermaidCode = codeBlockMatch ? codeBlockMatch[1] : content;

                const outputUri = vscode.Uri.joinPath(workspaceFolder.uri, args.outputFile);
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(outputUri, encoder.encode(mermaidCode));

                return `Architecture diagram saved to ${args.outputFile}`;

            } catch (e: any) {
                return `Error creating diagram: ${e.message}`;
            }
        }

        if (name === 'suggestOptimization') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const uri = vscode.Uri.joinPath(workspaceFolder.uri, args.path);
                const contentUint8 = await vscode.workspace.fs.readFile(uri);
                const content = new TextDecoder().decode(contentUint8);

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Analyze the following code for performance and memory optimizations.
                Identify:
                1. Time complexity hotspots (Big O)
                2. Memory leaks or excessive allocations
                3. Inefficient algorithms or patterns
                4. Specific code changes to improve performance
                
                File: ${args.path}
                Code:
                \`\`\`
                ${content}
                \`\`\`
                `;

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
                return data.choices?.[0]?.message?.content || "Error: No suggestions returned.";

            } catch (e: any) {
                return `Error suggesting optimizations: ${e.message}`;
            }
        }

        if (name === 'generateChangelog') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const range = args.since ? `${args.since}..HEAD` : '';
                const cmd = `git log ${range} --pretty=format:"%h - %s (%an) %ad" --date=short --no-merges`;
                
                const { stdout } = await execAsync(cmd, { cwd });
                
                if (!stdout) return "No commits found in the specified range.";

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Generate a structured CHANGELOG.md from the following git commit history.
                Group by: Features, Fixes, Documentation, Chore.
                Format as Markdown.
                Include the date and version if applicable.
                
                Commits:
                ${stdout.substring(0, 15000)} 
                `;

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
                const content = data.choices?.[0]?.message?.content;
                
                if (!content) return "Error: Failed to generate changelog content.";

                const cleanContent = content.replace(/^```markdown\n|^```\n|```$/gm, '');
                const outputPath = args.outputFile || 'CHANGELOG.md';
                const outputUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, outputPath);
                
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(outputUri, encoder.encode(cleanContent));

                return `Successfully generated ${outputPath}`;
            } catch (e: any) {
                return `Error generating changelog: ${e.message}`;
            }
        }

        if (name === 'validateSchema') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, args.filePath);
                const fileContent = new TextDecoder().decode(await vscode.workspace.fs.readFile(fileUri));

                let schemaContent = args.schemaContent;
                if (!schemaContent && args.schemaPath) {
                    const schemaUri = vscode.Uri.joinPath(workspaceFolder.uri, args.schemaPath);
                    schemaContent = new TextDecoder().decode(await vscode.workspace.fs.readFile(schemaUri));
                }

                if (!schemaContent) return "Error: No schema provided (use schemaPath or schemaContent).";

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Validate the following file content against the provided schema.
                Check for:
                1. Structure and type correctness
                2. Required fields
                3. Enum values or constraints
                
                If valid, return "VALID".
                If invalid, list specific errors and line numbers if possible.
                
                Schema:
                \`\`\`
                ${schemaContent}
                \`\`\`
                
                File Content (${args.filePath}):
                \`\`\`
                ${fileContent}
                \`\`\`
                `;

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
                return data.choices?.[0]?.message?.content || "Error: No validation result returned.";

            } catch (e: any) {
                return `Error validating schema: ${e.message}`;
            }
        }

        if (name === 'createRelease') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const level = args.level || 'feature';
                let warning = '';
                let prereleaseFlag = '';

                if (level === 'production') {
                    warning = '⚠️ PRODUCTION RELEASE: This requires strict verification. Ensure all tests pass and UAT is signed off.';
                } else if (level === 'uat') {
                    warning = 'UAT RELEASE: Ensure feature is ready for testing.';
                    prereleaseFlag = '--prerelease';
                } else {
                    prereleaseFlag = '--prerelease';
                }

                const notesArg = args.notes ? (args.notes.endsWith('.md') || args.notes.endsWith('.txt') ? `--notes-file "${args.notes}"` : `--notes "${args.notes.replace(/"/g, '\\"')}"`) : '';
                const cmd = `gh release create ${args.tag} --title "${args.title}" ${notesArg} ${prereleaseFlag}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Authorize ${level.toUpperCase()} Release ${args.tag}?`,
                    { modal: true, detail: `${warning}\n\nCommand: ${cmd}` },
                    'Authorize Release'
                );

                if (allowed !== 'Authorize Release') return "User denied release authorization.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return stdout || stderr || `Release ${args.tag} created successfully.`;
            } catch (e: any) {
                return `Error creating release: ${e.message}. Ensure GitHub CLI (gh) is installed and authenticated.`;
            }
        }

        if (name === 'summarizeCommits') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const days = args.days || 1;
                let author = args.author;

                if (!author) {
                    try {
                        const { stdout } = await execAsync('git config user.name', { cwd });
                        author = stdout.trim();
                    } catch {
                        // ignore if git config fails
                    }
                }

                const authorFilter = author ? `--author="${author}"` : '';
                const cmd = `git log --since="${days} day ago" ${authorFilter} --pretty=format:"%h %s (%ad)" --date=short --no-merges`;
                
                const { stdout } = await execAsync(cmd, { cwd });
                
                if (!stdout) return `No commits found for ${author || 'current user'} in the last ${days} days.`;

                const config = vscode.workspace.getConfiguration('openrouterCrew');
                const apiKey = config.get<string>('apiKey');
                if (!apiKey) return "Error: API Key missing.";

                const prompt = `Generate a daily standup report based on these git commits.
                Format:
                ## 📅 Daily Standup Report
                **Author:** ${author || 'User'}
                **Period:** Last ${days} day(s)

                ### ✅ Accomplished
                (Group commits by feature/topic)

                ### 📝 Technical Notes
                (Brief summary of key changes)
                
                Commits:
                ${stdout.substring(0, 10000)}
                `;

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
                return data.choices?.[0]?.message?.content || "Error: Failed to generate summary.";

            } catch (e: any) {
                return `Error summarizing commits: ${e.message}`;
            }
        }

        if (name === 'runIntegrationTests') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const cmd = args.suite ? `npm run test:integration -- ${args.suite}` : 'npm run test:integration';

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to run integration tests?`,
                    { modal: true, detail: `Command: ${cmd}` },
                    'Yes'
                );

                if (allowed !== 'Yes') return "User denied integration tests.";

                const { stdout, stderr } = await execAsync(cmd, { cwd });
                return `INTEGRATION TESTS RESULT:\n${stdout}\n${stderr}`;
            } catch (e: any) {
                return `INTEGRATION TESTS FAILED:\n${e.stdout || e.message}\n${e.stderr || ''}`;
            }
        }

        if (name === 'checkCodeCoverage') {
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) return "Error: No workspace open.";

                const reportPath = args.reportPath || 'coverage/coverage-summary.json';
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, reportPath);
                
                try {
                    const contentUint8 = await vscode.workspace.fs.readFile(uri);
                    const content = new TextDecoder().decode(contentUint8);
                    const coverage = JSON.parse(content);
                    
                    const total = coverage.total;
                    if (!total) return "Error: Invalid coverage report format (missing 'total' key).";

                    return `Code Coverage Summary:
Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})
Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})
Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})
Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`;
                } catch (fsError) {
                    return `Error reading coverage report at ${reportPath}. Make sure tests have been run with coverage enabled (e.g., 'npm test -- --coverage').`;
                }
            } catch (e: any) {
                return `Error checking coverage: ${e.message}`;
            }
        }

        if (name === 'createReleaseBranch') {
            try {
                const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (!cwd) return "Error: No workspace open.";

                const branchName = `release/${args.version}`;
                const cmd = `git checkout -b ${branchName}`;

                const allowed = await vscode.window.showInformationMessage(
                    `Allow ${this.profile.name} to create release branch '${branchName}'?`,
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

        if (name === 'scanForSecrets') {
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

        if (name === 'createHotfixBranch') {
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
                    `Allow ${this.profile.name} to create hotfix branch '${branchName}' from ${mainBranch}?`,
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

        if (name === 'checkGitStatus') {
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

        if (name === 'runTerminalCommand') {
            // We use execAsync here to capture stdout/stderr, which TerminalManager (UI) doesn't provide.
            // We must still ask for permission for safety.
            const allowed = await vscode.window.showInformationMessage(
                `Allow ${this.profile.name} to run: ${args.command}?`,
                { modal: true, detail: args.reason },
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
        return { error: 'Unknown tool' };
    }
}