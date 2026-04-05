/**
 * domains/vscode-extension/src/services/agent-network.ts
 * 
 * The "Central Mind" orchestration layer.
 * Replaces static n8n workflows with dynamic, code-based agent hierarchies.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import { CostTracker } from './cost-tracker';
import { FileManager } from './file-manager';
import type { ToolRegistry } from './tool-registry'; // Break circular dependency
import { AgentExecutionResult } from './types';
import { LLMRouter, SelectedModelInfo } from './llm-router';
import { ProposeChangeService } from './propose-change-service';
import { AgentMCPClientPool } from './agent-mcp-client';
import { RedisClient } from '@openrouter-crew/shared-redis-client';
import type { Redis } from 'ioredis';
import * as path from 'path';
import { execAsync } from './exec';
import { MissionStateSchema } from '@openrouter-crew/shared-schemas';

// PromptManager loaded lazily to avoid circular dep and build failures
type PromptManagerLike = {
    architectMission(problem: string, projectId?: string): Promise<{
        refinedPrompt: string;
        selectedModel: string;
        agentId: string;
        agentPersona: string;
        complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
};

// Map friendly model names to OpenRouter model IDs
const MODEL_ID_MAP: Record<ModelTier, string> = {
    [ModelTier.SONNET]: 'anthropic/claude-3.5-sonnet',
    [ModelTier.GPT_4O]: 'openai/gpt-4o',
    [ModelTier.GEMINI_1_5_PRO]: 'google/gemini-1.5-pro-latest'
};

let agentProfiles: any = {};
try {
    agentProfiles = require('../config/agent-profiles.json');
} catch (e) {
    // Profiles might not exist or be loaded yet
}

// Configuration for an Agent's persona and capabilities
export interface AgentProfile {
    name: string;
    role: string;
    specialties: string[];
    model: ModelTier;
}

export class AgentNetworkService {
    private supabase: SupabaseClient;
    private activeAgents: Map<string, CrewAgent> = new Map();
    private fileManager: FileManager;
    private toolRegistry: ToolRegistry;
    private redis: Redis;
    private proposeChangeService: ProposeChangeService;

    private _onDidBroadcastInsight = new vscode.EventEmitter<string>();
    public readonly onDidBroadcastInsight = this._onDidBroadcastInsight.event;

    constructor(
        private costTracker: CostTracker,
        private llmRouter: LLMRouter,
        private promptManager?: PromptManagerLike,
        private mcpClientPool?: AgentMCPClientPool
    ) {
        // Connect to Supabase using VSCode configuration
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const supabaseUrl = config.get<string>('supabaseUrl') || process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
        const supabaseKey = config.get<string>('supabaseKey') || process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

        this.supabase = createClient(
            supabaseUrl,
            supabaseKey
        );
        // Pass llmRouter to FileManager for cost-optimized refactoring (Geordi La Forge fix)
        this.fileManager = new FileManager(llmRouter);
        this.proposeChangeService = new ProposeChangeService(this.costTracker);
        this.toolRegistry = new ToolRegistry(this.fileManager, this.costTracker, this, this.proposeChangeService);

        this.redis = RedisClient.getInstance();
    }

    public setCrewRouting(promptManager: PromptManagerLike, mcpClientPool: AgentMCPClientPool): void {
        this.promptManager = promptManager;
        this.mcpClientPool = mcpClientPool;
    }

    private getPlatformBaseUrl(): string {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const configured = config.get<string>('platformBaseUrl');
        const envUrl = process.env.CREW_PLATFORM_URL || process.env.OPENROUTER_CREW_PLATFORM_URL || process.env.MCP_URL;
        const baseUrl = configured || envUrl || '';
        return baseUrl.replace(/\/api\/mcp\/?$/, '').replace(/\/$/, '');
    }

    /**
     * Spawns a Department Lead who can then recruit sub-agents.
     */
    public getDepartment(name: string): CrewAgent {
        if (this.activeAgents.has(name)) {
            return this.activeAgents.get(name)!;
        }

        // Load profiles from external config
        const profiles = agentProfiles as Record<string, AgentProfile>;
        
        // Ensure we have a valid profile, falling back to a hardcoded default if necessary
        const profile = profiles[name.toLowerCase()] || profiles['data'] || profiles['crusher'] || {
            name: 'Default Agent',
            role: 'General Assistant',
            specialties: ['general tasks'],
            model: 'gpt-4o'
        };
        const agent = new CrewAgent(profile, this.supabase, this, this.costTracker, this.fileManager, this.toolRegistry, this.llmRouter, this.promptManager, this.mcpClientPool);
        this.activeAgents.set(name, agent);
        return agent;
    }

    /**
     * Records a shared learning/insight into Supabase for all agents to access.
     */
    public async broadcastInsight(insight: string, source: string, severity: string = 'INFO'): Promise<void> {
        console.log(`[Central Mind] Storing ${severity} insight from ${source}: ${insight}`);
        try {
            const { error } = await this.supabase.from('agent_memory').insert({
                content: insight,
                source: source,
                type: 'pattern', // Categorize as 'pattern' for command reuse
                severity: severity,
                created_at: new Date().toISOString()
            });
            
            if (error) throw error;
            this._onDidBroadcastInsight.fire(source);
        } catch (e) {
            console.error(`[Central Mind] Failed to save insight: ${e}`);
        }
    }

    /**
     * Fetches recent insights/audits from a specific source.
     */
    public async getRecentInsights(source: string, limit: number = 5): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('agent_memory')
                .select('content, severity, created_at')
                .eq('source', source)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error(`[Central Mind] Failed to fetch insights from ${source}:`, e);
            return [];
        }
    }

    /**
     * Fetches project-level cost variance summary from Supabase.
     * Used by Quark (ROI Agent) and Geordi (Engineering) for optimization.
     */
    public async getProjectCostVarianceSummary(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('project_cost_variance_summary')
                .select('*')
                .order('total_variance_usd', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error(`[Central Mind] Failed to fetch project cost variance summary:`, e);
            return [];
        }
    }

    /**
     * Fetches workflow-level cost variance analysis from Supabase.
     * Used by Geordi (Engineering) for detailed workflow optimization.
     */
    public async getWorkflowCostVarianceAnalysis(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('workflow_cost_variance_analysis')
                .select('*')
                .order('variance_usd', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error(`[Central Mind] Failed to fetch workflow cost variance analysis:`, e);
            return [];
        }
    }

    /**
     * Fetches model consistency statistics from Supabase.
     * Used by Quark (ROI Agent) for model routing arbitrage.
     */
    public async getModelConsistencyStats(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase
                .from('model_consistency_stats')
                .select('*')
                .order('avg_consistency_score', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error(`[Central Mind] Failed to fetch model consistency stats:`, e);
            return [];
        }
    }

    /**
     * Fetches projects from Supabase.
     */
    public async getProjects(): Promise<any[]> {
        const platformBaseUrl = this.getPlatformBaseUrl();
        if (platformBaseUrl) {
            try {
                const response = await fetch(`${platformBaseUrl}/api/projects`);
                if (response.ok) {
                    const payload = await response.json();
                    if (Array.isArray(payload?.projects)) {
                        return payload.projects;
                    }
                }
            } catch (error) {
                console.warn('[Central Mind] Falling back to Supabase project query:', error);
            }
        }

        try {
            const { data, error } = await this.supabase.from('projects').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e: any) {
            console.error(`[Central Mind] Failed to fetch projects: ${e}`);
            return [];
        }
    }

    /**
     * Fetches the current mission brief for a project.
     * Fallback sequence: Redis (Hot Cache) -> Supabase (Persistent Storage)
     */
    public async getActiveMissionBrief(projectId: string): Promise<unknown | null> {
        try {
            const syncKey = `project:${projectId}:mission_state`;
            const data = await this.redis.get(syncKey);

            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    const result = MissionStateSchema.safeParse(parsed);
                    if (result.success) return result.data;
                    console.warn(`[Central Mind] Corrupt Redis state for ${projectId}`);
                } catch (parseErr) {
                    console.warn(`[Central Mind] Failed to parse Redis state for ${projectId}`);
                }
            }

            // Fallback to Supabase (The Vault)
            console.log(`[Central Mind] Redis miss or corruption for ${projectId}, checking Supabase...`);
            const { data: dbState, error: dbError } = await this.supabase
                .from('mission_states')
                .select('*')
                .eq('projectId', projectId)
                .order('timestamp', { ascending: false })
                .maybeSingle();

            if (dbError) throw dbError;

            if (dbState) {
                const result = MissionStateSchema.safeParse(dbState);
                if (result.success) return result.data;
                console.error(`[Central Mind] Corrupt persistent state for ${projectId}`);
            }

            return null;
        } catch (e) {
            console.error(`[Central Mind] Failed to fetch mission brief for ${projectId}:`, e);
            return null;
        }
    }

    /**
     * O'BRIEN'S TRANSPORTER BUFFER: List all files currently in the buffer.
     */
    public async getBufferedFiles(): Promise<string[]> {
        try {
            const keys = await this.redis.keys('buffer:*');
            return keys.map(k => k.replace('buffer:', ''));
        } catch (e) {
            console.error('[Central Mind] Failed to fetch buffer list:', e);
            return [];
        }
    }

    /**
     * O'BRIEN'S TRANSPORTER BUFFER: Restore a file to its previous state.
     */
    public async restoreFromBuffer(filePath: string): Promise<boolean> {
        try {
            const content = await this.redis.get(`buffer:${filePath}`);
            if (content) {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                const absolutePath = workspaceRoot && !path.isAbsolute(filePath) 
                    ? path.join(workspaceRoot, filePath) 
                    : filePath;
                
                await this.fileManager.writeFile(absolutePath, content);
                await this.redis.del(`buffer:${filePath}`);
                return true;
            }
            return false;
        } catch (e) {
            console.error(`[Central Mind] Failed to restore ${filePath} from buffer:`, e);
            return false;
        }
    }

    /**
     * WARP FIELD STATUS: Fetches real-time health of Docker containers.
     */
    public async getDockerStatus(): Promise<Array<{ name: string; status: string; healthy: boolean }>> {
        try {
            const { stdout } = await execAsync('docker ps --format "{{.Names}}:{{.Status}}"');
            const lines = stdout.split('\n').filter(Boolean);
            
            return lines.map(line => {
                const [name, status] = line.split(':');
                const healthy = !status.includes('unhealthy') && !status.includes('Exited') && (status.includes('up') || status.includes('Up'));
                return { name, status, healthy };
            });
        } catch (e) {
            console.error('[Central Mind] Failed to fetch docker status:', e);
            return [];
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
        private costTracker: CostTracker,
        private fileManager: FileManager,
        private toolRegistry: ToolRegistry,
        private llmRouter: LLMRouter,
        private promptManager?: PromptManagerLike,
        private mcpClientPool?: AgentMCPClientPool
    ) {}

    /**
     * Main execution loop for the agent.
     * It decides whether to delegate or perform the work directly.
     */
    public async executeTask(task: string, execContext?: any, signal?: AbortSignal, onProgress?: (message: string) => void): Promise<AgentExecutionResult> {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const apiKey = config.get<string>('apiKey');
        if (!apiKey) throw new Error(`[${this.profile.name}] Error: API Key missing.`);

        // ── Crew routing path: triage → specialized agent → OpenRouter ──────
        // When promptManager + mcpClientPool are available, use the full crew
        // pipeline: PromptManager decides which agent is best, we get that
        // agent's tools via MCP, then route the refined prompt through LLMRouter
        // with those tools attached.
        if (this.promptManager && this.mcpClientPool) {
            try {
                if (onProgress) onProgress(`🖖 Routing via crew triage...`);
                const brief = await this.promptManager.architectMission(task, execContext?.projectId);
                if (onProgress) onProgress(`🤖 ${brief.agentId} (${brief.complexity}) — ${brief.selectedModel}`);

                const mcpClient = this.mcpClientPool.getClient(brief.agentId);
                const agentTools = await mcpClient.listTools().catch(() => []);

                // Build tool definitions in the format LLMRouter/OpenRouter expects
                const toolDefs = agentTools.map(t => ({
                    type: 'function' as const,
                    function: { name: t.name, description: t.description, parameters: t.inputSchema }
                }));

                const startTime = Date.now();
                const response = await this.llmRouter.route({
                    prompt: brief.refinedPrompt,
                    intent: execContext?.intent || 'ASK',
                    complexity: brief.complexity,
                    systemPrompt: brief.agentPersona,
                    tools: toolDefs.length > 0 ? toolDefs : undefined,
                    model: brief.selectedModel,
                } as any);

                // Execute any tool calls returned by the model via the MCP agent
                const responseWithTools = response as any;
                if (responseWithTools.tool_calls?.length > 0) {
                    for (const tc of responseWithTools.tool_calls) {
                        const args = typeof tc.function.arguments === 'string'
                            ? JSON.parse(tc.function.arguments)
                            : tc.function.arguments;
                        if (onProgress) onProgress(`🛠️ ${brief.agentId}: ${tc.function.name}`);
                        await mcpClient.callTool(tc.function.name, args);
                    }
                }

                return {
                    output: response.content || `[${brief.agentId}] Task completed.`,
                    model: response.model,
                    costUSD: response.costUSD ?? 0,
                    executionTimeMs: Date.now() - startTime,
                };
            } catch (crewErr: any) {
                console.warn(`[CrewAgent] Crew routing failed, falling back: ${crewErr.message}`);
                // Fall through to legacy path below
            }
        }

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
        
        // 2. "Think" - Determine if sub-agents are needed
        const decisionPrompt = `
You are ${this.profile.name}, a ${this.profile.role}.
Your task is to decide if a task is complex enough to require delegation to a specialized sub-agent.
A complex task might involve multiple steps, require a very specific skill you don't have, or be described as a "project".

Task: "${task}"

Based on the task description, do you need to delegate this to a specialist?
Answer with only "yes" or "no".
`;
        let shouldDelegate = false;
        try {
            const response = await this.llmRouter.route({
                prompt: decisionPrompt,
                intent: 'ASK',
                complexity: 'LOW'
            });
            const decision = response.content?.toLowerCase().trim().replace(/[^a-z]/g, '');

            if (decision === 'yes') {
                shouldDelegate = true;
            }
        } catch (e: any) {
            console.warn(`[${this.profile.name}] Delegation decision failed:`, e);
        }

        if (shouldDelegate) {
            return this.delegateToSubTeam(task, apiKey, signal, onProgress);
        }

        // 3. Act - Perform the task using tools or direct generation
        return this.performWork(task, apiKey, memoryContext, signal, onProgress, execContext);
    }

    private async delegateToSubTeam(task: string, apiKey: string, signal?: AbortSignal, onProgress?: (message: string) => void): Promise<AgentExecutionResult> {
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
            const response = await this.llmRouter.route({
                prompt: delegationPrompt,
                intent: 'ASK',
                complexity: 'MEDIUM'
            });
            const content = response.content;
            
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
                this.costTracker,
                this.fileManager,
                this.toolRegistry,
                this.llmRouter
            );
            this.subTeam.push(subAgent);

            if (onProgress) {
                onProgress(`Delegating to ${subAgentProfile.name} (${subAgentProfile.role})...`);
            }

            // 3. Execute task
            const result = await subAgent.executeTask(task, undefined, signal, onProgress);

            // 4. Record outcome
            await this.network.broadcastInsight(
                `Sub-agent ${subAgentProfile.name} completed: ${task.substring(0, 50)}...`, 
                this.profile.name
            );

            // Modify the output and return the full result object
            result.output = `[${this.profile.name}] Delegated to ${subAgentProfile.name}:\n${result.output}`;
            return result;

        } catch (error: any) {
            throw new Error(`[${this.profile.name}] Delegation failed: ${error.message}`);
        }
    }

    private async performWork(task: string, apiKey: string, memoryContext: string = '', signal?: AbortSignal, onProgress?: (message: string) => void, execContext?: any): Promise<AgentExecutionResult> {
        const startTime = Date.now();
        const tools = this.toolRegistry.getToolDefinitions();
        
        // Get custom system prompt
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const customSystemPrompt = config.get<string>('systemPrompt') || '';

        const messages: any[] = [
            { 
                role: 'system', 
                content: `You are ${this.profile.name}, a ${this.profile.role}. 
                Your specialties are: ${this.profile.specialties.join(', ')}.
                ${customSystemPrompt ? `\nCUSTOM INSTRUCTIONS:\n${customSystemPrompt}\n` : ''}
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

        // Extract intent/complexity from context if available (passed from CommandExecutor)
        const intent = execContext?.intent || 'ASK';
        const complexity = execContext?.complexity || 'MEDIUM';
        const canonicalForm = execContext?.canonicalForm;

        while (iterations < maxIterations) {
            if (signal?.aborted) throw new Error('Aborted');

            try {
                // Convert messages history to a prompt string for the router
                const promptString = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

                const response = await this.llmRouter.route({
                    prompt: promptString,
                    intent,
                    complexity,
                    // Note: Tools are not explicitly in LLMRequest interface but may be handled by specific providers
                    // or we might need to extend LLMRequest to support tools if the router supports it.
                    // For now, we assume the router handles the prompt and returns content.
                } as any); // Cast to any to pass tools if the underlying implementation supports it, otherwise tools are lost

                if (!response.content && (!response.tool_calls || response.tool_calls.length === 0)) break;

                // Add assistant's thought/tool-call to history
                // Note: LLMResponse doesn't explicitly have tool_calls in the interface provided, 
                // but we check for it in case the implementation returns it.
                const responseWithTools = response as any;
                messages.push({ role: 'assistant', content: response.content, tool_calls: responseWithTools.tool_calls });

                // If there are tool calls, execute them and loop again
                if (responseWithTools.tool_calls && responseWithTools.tool_calls.length > 0) {
                    for (const toolCall of responseWithTools.tool_calls) {
                        const args = JSON.parse(toolCall.function.arguments);
                        console.log(`[${this.profile.name}] Executing: ${toolCall.function.name}`, args);
                        
                        if (onProgress) {
                            onProgress(`🛠️ ${this.profile.name}: Executing ${toolCall.function.name}...`);
                        }

                        // Execute the tool safely
                        const result = await this.toolRegistry.executeTool(toolCall.function.name, args, this);
                        
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
                    const finalContent = response.content || `[${this.profile.name}] Task completed.`;
                    // LLMResponse has costUSD directly
                    const totalCost = response.costUSD;
                    
                    if (canonicalForm) {
                        await this.network.broadcastInsight(canonicalForm, this.profile.name);
                    }
                    
                    return {
                        output: finalContent,
                        model: response.model,
                        costUSD: totalCost,
                        executionTimeMs: Date.now() - startTime
                    };
                }

            } catch (e: any) {
                throw new Error(`[${this.profile.name}] Error during API call: ${e.message}`);
            }
            iterations++;
        }
        
        throw new Error(`[${this.profile.name}] Task stopped after ${maxIterations} iterations.`);
    }
}
