/**
 * domains/vscode-extension/src/services/agent-network.ts
 * 
 * The "Central Mind" orchestration layer.
 * Replaces static n8n workflows with dynamic, code-based agent hierarchies.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import { CostTracker } from './cost-tracker.js';
import { FileManager } from './file-manager.js';
import { ToolRegistry } from './tool-registry.js';
import { AgentExecutionResult } from './types.js';
import { LLMRouter } from './llm-router.js';

// Map friendly model names to OpenRouter model IDs
const MODEL_ID_MAP: Record<AgentProfile['model'], string> = {
    'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
    'gpt-4o': 'openai/gpt-4o',
    'gemini-1.5-pro': 'google/gemini-1.5-pro-latest'
};

const agentProfiles = require('../config/agent-profiles.json');

// Configuration for an Agent's persona and capabilities
export interface AgentProfile {
    name: string;
    role: string;
    specialties: string[];
    model: 'claude-3-5-sonnet' | 'gpt-4o' | 'gemini-1.5-pro';
}

export class AgentNetworkService {
    private supabase: SupabaseClient;
    private activeAgents: Map<string, CrewAgent> = new Map();
    private fileManager: FileManager;
    private toolRegistry: ToolRegistry;

    constructor(private costTracker: CostTracker, private llmRouter: LLMRouter) {
        // Connect to your local Supabase instance for shared memory
        this.supabase = createClient(
            process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
        );
        this.fileManager = new FileManager();
        this.toolRegistry = new ToolRegistry(this.fileManager, this.costTracker, this);
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
        const profile = profiles[name.toLowerCase()] || profiles['data'] || {
            name: 'Default Agent',
            role: 'General Assistant',
            specialties: ['general tasks'],
            model: 'gpt-4o'
        };
        const agent = new CrewAgent(profile, this.supabase, this, this.costTracker, this.fileManager, this.toolRegistry, this.llmRouter);
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

    /**
     * Fetches projects from Supabase.
     */
    public async getProjects(): Promise<any[]> {
        try {
            const { data, error } = await this.supabase.from('projects').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e: any) {
            console.error(`[Central Mind] Failed to fetch projects: ${e}`);
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
        private llmRouter: LLMRouter
    ) {}

    /**
     * Main execution loop for the agent.
     * It decides whether to delegate or perform the work directly.
     */
    public async executeTask(task: string, context?: any, signal?: AbortSignal, onProgress?: (message: string) => void): Promise<AgentExecutionResult> {
        const config = vscode.workspace.getConfiguration('openrouterCrew');
        const apiKey = config.get<string>('apiKey');
        if (!apiKey) throw new Error(`[${this.profile.name}] Error: API Key missing.`);

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
                messages: [{ role: 'user', content: decisionPrompt }],
                hint: 'speed'
            }, signal);
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
        return this.performWork(task, apiKey, memoryContext, signal, onProgress);
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
                messages: [{ role: 'user', content: delegationPrompt }],
                hint: 'quality'
            }, signal);
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

    private async performWork(task: string, apiKey: string, memoryContext: string = '', signal?: AbortSignal, onProgress?: (message: string) => void): Promise<AgentExecutionResult> {
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

        while (iterations < maxIterations) {
            if (signal?.aborted) throw new Error('Aborted');

            try {
                const response = await this.llmRouter.route({
                    messages,
                    tools,
                    hint: 'code'
                }, signal);

                if (!response.content && (!response.tool_calls || response.tool_calls.length === 0)) break;

                // Add assistant's thought/tool-call to history
                messages.push({ role: 'assistant', content: response.content, tool_calls: response.tool_calls });

                // If there are tool calls, execute them and loop again
                if (response.tool_calls && response.tool_calls.length > 0) {
                    for (const toolCall of response.tool_calls) {
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
                    const totalCost = this.costTracker.estimateCost(response.usage.prompt_tokens, response.usage.completion_tokens, response.model);
                    
                    return {
                        output: finalContent,
                        model: response.model,
                        cost: totalCost,
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