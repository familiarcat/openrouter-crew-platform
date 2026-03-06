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
  ErrorContent
} from '@modelcontextprotocol/sdk/shared/messages.js'
import { createClient } from '@supabase/supabase-js'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
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
  protected tools: Map<string, (args: any) => Promise<ToolResult>> = new Map()

  constructor(agentName: string, agentRole: string) {
    this.agentName = agentName
    this.agentRole = agentRole

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    )

    // Initialize MCP server
    this.server = new Server({
      name: `${agentName}-agent`,
      version: '1.0.0'
    })

    this.setupRequestHandlers()
  }

  /**
   * Register tools (called by subclasses)
   */
  protected registerTool(definition: ToolDefinition, handler: (args: any) => Promise<ToolResult>) {
    this.tools.set(definition.name, handler)
  }

  /**
   * Setup MCP request handlers
   */
  private setupRequestHandlers() {
    // Handle /tools/list request
    this.server.setRequestHandler('tools/list', async () => {
      const tools: Tool[] = Array.from(this.tools.keys()).map(toolName => {
        const tool = this.getToolDefinition(toolName)
        if (!tool) {
          throw new Error(`Tool definition not found: ${toolName}`)
        }
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }
      })

      return { tools }
    })

    // Handle /tools/call request
    this.server.setRequestHandler('tools/call', async (request: any) => {
      try {
        const { name, arguments: args } = request.params

        const handler = this.tools.get(name)
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`)
        }

        const result = await handler(args)

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
        const errorContent: ErrorContent = {
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
        }
        return { content: [errorContent] }
      }
    })

    // Handle /resources/list request (for context)
    this.server.setRequestHandler('resources/list', async () => ({
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
   * Get tool definition by name (implement in subclasses)
   */
  protected abstract getToolDefinition(toolName: string): ToolDefinition | null

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
      const { error } = await this.supabase.from('observation_lounge_findings').insert({
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
