/**
 * Base MCP Server
 *
 * Provides foundation for all crew agent MCP servers.
 * Allows Claude to call crew agent tools directly via Model Context Protocol.
 *
 * Each agent (Data, Worf, Troi, Geordi) extends this base class
 * and implements their specialized tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  Tool,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import crypto from 'crypto'
import { PersonaProvider } from './persona-provider.js'
import { N8nBridge } from './n8n-bridge.js'
import { z } from 'zod'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler?: (args: any) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

export abstract class BaseMCPServer {
  protected server: Server
  protected supabase: ReturnType<typeof createClient>
  protected agentName: string
  protected agentRole: string
  protected systemPrompt: string
  protected tools: Map<string, ToolDefinition> = new Map()
  protected redis: Redis

  constructor(agentName: string, agentRole: string) {
    this.agentName = agentName
    this.agentRole = agentRole

    // Automatically load character persona from crew-identities.md
    this.systemPrompt = PersonaProvider.getSystemPrompt(agentName);

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    )

    // Initialize Redis client for agent-driven caching
    const redisPassword = process.env.REDIS_PASSWORD || 'redis'
    const redisHost = process.env.REDIS_HOST || 'localhost'
    this.redis = new Redis(`redis://:${redisPassword}@${redisHost}:6379`)

    // Initialize MCP server
    this.server = new Server({
      name: `${agentName}-agent`,
      version: '1.0.0'
    })

    this.setupRequestHandlers()
    this.setupSharedMemoryTools()
  }

  /**
   * Register tools (called by subclasses)
   */
  protected registerTool(definition: ToolDefinition) {
    this.tools.set(definition.name, definition)
  }

  /**
   * Setup MCP request handlers
   */
  private setupRequestHandlers() {
    // Handle /tools/list request
    this.server.setRequestHandler('tools/list' as any, async () => {
      const tools: Tool[] = Array.from(this.tools.values()).map(tool => {
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as any // Cast to any to satisfy Tool type
        }
      })

      return { tools }
    })

    // Handle /tools/call request
    this.server.setRequestHandler('tools/call' as any, async (request: any) => {
      try {
        const { name, arguments: args } = request.params

        const tool = this.tools.get(name)
        if (!tool || !tool.handler) {
          throw new Error(`Unknown tool: ${name}`)
        }

        const result = await tool.handler(args)

        // Log tool call to observation lounge
        await this.logToolCall(name, args, result)

        // Convert result to TextContent
        const content: TextContent = {
          type: 'text',
          text: JSON.stringify({
            tool: name,
            agent: this.agentName,
            ...result
          }, null, 2)
        }

        return { content: [content] }
      } catch (error) {
        const errorContent: TextContent = { // Use TextContent directly
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
        }
        return { content: [errorContent] }
      }
    })

    // Handle /resources/list request (for context)
    this.server.setRequestHandler('resources/list' as any, async () => ({
      resources: [
        {
          uri: `mcp://agent/${this.agentName}`,
          name: `${this.agentName} Agent`,
          description: `${this.agentName} crew member with ${this.tools.size} available tools`,
          mimeType: 'application/json'
        }
      ]
    }))
  }

  /**
   * Setup shared memory/configuration tools
   * Enables agents to read/write shared configuration files (.agent.md, .claude.md, etc.)
   */
  private setupSharedMemoryTools() {
    // Tool: Read Agent Configuration
    this.registerTool({
      name: 'read-agent-config',
      description: 'Read the shared configuration file (.agent.md, .claude.md, .gemini.md) for a specific crew member.',
      inputSchema: {
        type: 'object',
        properties: {
          targetAgent: { 
            type: 'string', 
            description: 'Name of the agent to read config for (e.g., "data", "worf", "picard")' 
          },
          configType: { 
            type: 'string', 
            enum: ['agent', 'claude', 'gemini'], 
            description: 'Type of configuration file to read' 
          }
        },
        required: ['targetAgent', 'configType']
      },
      handler: async (args: any) => {
        const { targetAgent, configType } = args
        const { data, error } = await this.supabase
          .from('agent_configurations')
          .select('content')
          .eq('agent_name', targetAgent.toLowerCase())
          .eq('config_type', configType)
          .single()

        if (error) return { success: false, error: `Config not found: ${error.message}` }
        
        return {
          success: true,
          data: { content: (data as any).content }, // Cast to any for content property
          metadata: { source: 'supabase-shared-memory' }
        }
      }
    })

    // Tool: Update Agent Configuration
    this.registerTool({
      name: 'update-agent-config',
      description: 'Update the configuration file for a crew member. Used for self-learning and knowledge sharing.',
      inputSchema: {
        type: 'object',
        properties: {
          configType: { 
            type: 'string', 
            enum: ['agent', 'claude', 'gemini'], 
            description: 'Type of configuration file to update' 
          },
          content: { 
            type: 'string', 
            description: 'New markdown content for the configuration' 
          }
        },
        required: ['configType', 'content']
      },
      handler: async (args: any) => {
        const { configType, content } = args
        // Agents can only update their own config to prevent conflicts
        const { error } = await (this.supabase as any) // Cast supabase for from()
          .from('agent_configurations')
          .upsert({ 
            agent_name: this.agentName.toLowerCase(),
            config_type: configType,
            content: content,
            updated_at: new Date().toISOString()
          } as any, { onConflict: 'agent_name,config_type' }) // Cast upsert object

        if (error) return { success: false, error: `Failed to update config: ${error.message}` }
        
        return {
          success: true,
          data: { message: 'Configuration updated successfully' }
        }
      }
    })

    // Tool: Consult Knowledge Base (Memory Alpha)
    this.registerTool({
      name: 'consult-knowledge-base',
      description: 'Search the crew knowledge base (including Memory Alpha data) for information about roles, history, or protocols.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { 
            type: 'string', 
            description: 'The topic or crew member to search for' 
          },
          limit: { 
            type: 'number', 
            description: 'Max results',
            default: 3 
          }
        },
        required: ['query']
      },
      handler: async (args: any) => {
        const { query, limit = 3 } = args
        
        // New Tool Logic: Discover coordinating MCP servers via Web/Registry
        if (query.includes('mcp-server') || query.includes('tool-provider')) {
          // Logic: Scrape Smithery.ai or local registry
          // For now, we simulate the specialty matching
          return {
            success: true,
            data: {
              discovered_servers: [
                { 
                  name: 'brave-search-mcp', 
                  specialty: 'Web Intelligence', 
                  status: 'Compatible',
                  reason: 'Required for real-time data fetching requested by agent.'
                }
              ]
            },
            metadata: { method: 'autonomous-specialty-discovery' }
          }
        }

        // 1. Try Semantic Search
        const embedding = await this.generateEmbedding(query)
        
        if (embedding.length > 0) {
          const { data, error } = await (this.supabase as any).rpc('search_crew_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: limit
          });

          if (!error && data && data.length > 0) {
            return {
              success: true,
              data: { results: data },
              metadata: { source: 'crew_knowledge', method: 'semantic' }
            }
          }
        }

        // 2. Fallback to Text Search
        // Using Supabase text search on content column
        const { data, error } = await this.supabase
          .from('crew_knowledge')
          .select('crew_member, topic, content, source_url')
          .textSearch('content', query, { type: 'websearch', config: 'english' })
          .limit(limit)

        if (error) return { success: false, error: `Search failed: ${error.message}` }
        
        return {
          success: true,
          data: { results: data },
          metadata: { source: 'crew_knowledge', method: 'text_fallback' }
        }
      }
    })

    // Tool: Create Knowledge Entry (Learning)
    // Bridges to n8n to generate embeddings and store in Supabase
    const createKnowledgeWorkflow = {
      id: 'wf-create-knowledge',
      name: 'create-knowledge-entry',
      description: 'Record new knowledge or insights into the crew knowledge base for future retrieval. Use this to "learn" from experiences.',
      webhookUrl: `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'}/create-knowledge`,
      schema: z.object({
        topic: z.string().describe('The main topic or subject'),
        content: z.string().describe('The detailed knowledge to store'),
        skills: z.array(z.string()).optional().describe('Related skills'),
        source: z.string().default('agent-experience').describe('Origin of knowledge')
      })
    }
    this.registerTool(N8nBridge.toTool(createKnowledgeWorkflow) as ToolDefinition) // Cast to ToolDefinition

    // Admiral's Directive: Agent-Driven Redis Tools
    this.registerTool({
      name: 'cache-agreed-solution',
      description: 'Store a validated solution in the high-speed Redis cache for future retrieval.',
      inputSchema: {
        type: 'object',
        properties: {
          problem: { type: 'string', description: 'The objective that was solved' },
          solution: { type: 'object', description: 'The full structured result' },
          ttl: { type: 'number', description: 'Expiry in seconds (default 24h)', default: 86400 }
        },
        required: ['problem', 'solution']
      },
      handler: async (args: any) => {
        const { problem, solution, ttl = 86400 } = args
        const key = `solution:${crypto.createHash('sha256').update(problem).digest('hex')}`
        try {
          await this.redis.set(key, JSON.stringify(solution), 'EX', ttl)
          return { success: true, data: { key, status: 'cached' } }
        } catch (err: any) {
          return { success: false, error: `Redis write failed: ${err.message}` }
        }
      }
    })

    this.registerTool({
      name: 'retrieve-cached-solution',
      description: 'Query the high-speed Redis cache for an existing solution to a mission objective.',
      inputSchema: {
        type: 'object',
        properties: {
          problem: { type: 'string', description: 'The objective to look up' }
        },
        required: ['problem']
      },
      handler: async (args: any) => {
        const { problem } = args
        const key = `solution:${crypto.createHash('sha256').update(problem).digest('hex')}`
        const data = await this.redis.get(key)
        if (!data) return { success: false, error: 'No cached solution found.' }
        return { success: true, data: JSON.parse(data) }
      }
    })
  }

  /**
   * Generate embedding for semantic search
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY
    if (!apiKey) return []

    try {
      // Use OpenAI API format (compatible with OpenRouter if baseURL is set)
      const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small'
        })
      })

      if (!response.ok) return []
      
      const data = await response.json() as any
      return data.data?.[0]?.embedding || []
    } catch (error) {
      console.error('Error generating embedding:', error)
      return []
    }
  }

  /**
   * Get tool definition by name (implement in subclasses)
   */
  protected getToolDefinition(toolName: string): ToolDefinition | null {
    return this.tools.get(toolName) || null;
  }

  /**
   * Log tool call to observation lounge
   */
  protected async logToolCall(
    toolName: string,
    args: any,
    result: ToolResult
  ): Promise<void> {
    try {
      // Store tool execution in observation lounge
      const { error } = await (this.supabase as any).from('observation_lounge_findings').insert({
        id: `mcp_${this.agentName}_${toolName}_${Date.now()}`,
        project_id: process.env.PROJECT_ID || 'mcp-execution',
        crew_member_id: this.agentName,
        crew_member_name: this.agentName.charAt(0).toUpperCase() + this.agentName.slice(1),
        crew_member_role: this.agentRole,
        finding: JSON.stringify({
          tool_executed: toolName,
          arguments: args,
          result: result.data,
          success: result.success
        }),
        insight_type: result.success ? 'pattern' : 'anomaly',
        mcp_service_used: `mcp-${this.agentName}`,
        confidence: result.confidence || (result.success ? 0.85 : 0.4),
        tags: [this.agentName, toolName, 'mcp-execution'],
        status: 'published'
      })

      if (error) {
        console.error(`Failed to log tool call: ${error.message}`)
      }
    } catch (err) {
      console.error(`Error logging tool call:`, err)
    }
  }

  /**
   * Query Supabase cost tracking data
   */
  protected async getCostData(timeframe: string = 'last-7-days'): Promise<any[]> {
    const days = timeframe === 'last-7-days' ? 7 : timeframe === 'last-30-days' ? 30 : 7

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await this.supabase
      .from('llm_usage_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch cost data: ${error.message}`)
    }

    return data || []
  }

  /**
   * Query observation lounge findings
   */
  protected async getFindings(filters?: {
    crewRole?: string
    insightType?: string
    minConfidence?: number
    limit?: number
  }): Promise<any[]> {
    let query = this.supabase
      .from('observation_lounge_findings')
      .select('*')
      .eq('status', 'published')

    if (filters?.crewRole) {
      query = query.eq('crew_member_role', filters.crewRole)
    }

    if (filters?.insightType) {
      query = query.eq('insight_type', filters.insightType)
    }

    const { data, error } = await query
      .gte('confidence', filters?.minConfidence || 0.1)
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50)

    if (error) {
      throw new Error(`Failed to fetch findings: ${error.message}`)
    }

    return data || []
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.log(`✅ ${this.agentName} MCP Server started`)
  }

  /**
   * Close the server
   */
  async close(): Promise<void> {
    // Graceful shutdown
  }
}

export default BaseMCPServer
