/**
 * OpenRouter with Crew MCP Integration
 *
 * Connects OpenRouter (Claude/GPT/etc) to all crew agent MCP servers.
 * Models can autonomously call crew member tools to solve problems.
 *
 * Architecture:
 * Problem → Model sees available MCP tools → Model calls crew tools →
 * Crew tools execute → Results → Model synthesizes → Solution
 */

import OpenAI from 'openai'
import { spawn } from 'child_process'
import { ChildProcess } from 'child_process'
import { PersonaProvider } from './persona-provider.js'
import { OllamaMCPClient } from './ollama-mcp-client.js'

export interface CrewAgent {
  name: string
  role: string
  process?: ChildProcess
}

export interface ToolResult {
  type: 'tool_result'
  tool_use_id: string
  content: string
}

export interface OrchestratorResponse {
  success: boolean
  synthesis: string
  findings: Array<{
    tool: string
    agent: string
    result: any
  }>
  triage?: TriageResult
  metadata: {
    tokens_used: number
    model: string
    execution_time_ms: number
  }
}

export interface TriageResult {
  agentId: string
  complexity: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendedModel: string
}

export class CrewOrchestrator {
  private openai: OpenAI
  private agents: Map<string, CrewAgent> = new Map()
  private ollamaClient: OllamaMCPClient
  private agentProcesses: Map<string, ChildProcess> = new Map()

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultHeaders: {
        'HTTP-Referer': 'https://openrouter-crew-platform.local',
        'X-Title': 'OpenRouter Crew Platform'
      }
    })
    this.ollamaClient = new OllamaMCPClient()
  }

  /**
   * Start crew agents as MCP servers
   */
  async startAgents(agentNames: string[] = ['data', 'worf']): Promise<void> {
    console.log(`🚀 Starting crew agents: ${agentNames.join(', ')}`)

    for (const name of agentNames) {
      await this.startAgent(name)
    }

    // Give agents time to start
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Start individual agent
   */
  private async startAgent(name: string): Promise<void> {
    console.log(`  Starting ${name} agent...`)

    const agent: CrewAgent = {
      name,
      role: name === 'data' ? 'pragmatic-solutions' : 'security-compliance'
    }

    // Start the agent as a real subprocess via pnpm
    const child = spawn('pnpm', ['--filter', `@openrouter-crew/agent-orchestration`, 'run', `start:${name}`], {
      stdio: ['pipe', 'pipe', 'inherit']
    })

    agent.process = child
    this.agents.set(name, agent)
  }

  /**
   * Get available tools from all agents
   */
  async getAvailableTools(): Promise<any[]> {
    // Simulate getting tools from agents
    // In production, these would come from the actual MCP servers

    const dataTools = [
      {
        name: 'analyze-costs',
        description:
          'Analyze cost patterns from past data. Returns total costs, per-unit costs, cost drivers, and optimization opportunities.',
        parameters: {
          type: 'object',
          properties: {
            timeframe: {
              type: 'string',
              description: 'Time period: "last-7-days", "last-30-days", "last-90-days"'
            },
            group_by: {
              type: 'string',
              description: 'Group by: "model", "crew_member", "workflow", "day"'
            }
          }
        }
      },
      {
        name: 'forecast-costs',
        description: 'Project future costs based on trends using linear regression.',
        parameters: {
          type: 'object',
          properties: {
            projection_days: {
              type: 'number',
              description: 'Days to project'
            },
            assume_change: {
              type: 'string',
              description:
                'Change scenario: "no-change", "reduce-to-haiku", "implement-caching", "optimize-routing"'
            }
          }
        }
      },
      {
        name: 'calculate-roi',
        description: 'Calculate ROI of a proposed optimization.',
        parameters: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            current_weekly_cost: { type: 'number' },
            projected_savings_percent: { type: 'number' },
            implementation_cost: { type: 'number' }
          }
        }
      },
      {
        name: 'identify-anomalies',
        description: 'Find unusual cost patterns.',
        parameters: {
          type: 'object',
          properties: {
            sensitivity: {
              type: 'string',
              description: 'Sensitivity: "low", "medium", "high"'
            }
          }
        }
      }
    ]

    const worfTools = [
      {
        name: 'verify-compliance',
        description: 'Check if a change complies with security policies.',
        parameters: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            compliance_framework: {
              type: 'string',
              description: 'Framework: "SOC2", "HIPAA", "GDPR", "general-security"'
            }
          }
        }
      },
      {
        name: 'assess-risks',
        description: 'Identify security and operational risks.',
        parameters: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            scope: {
              type: 'string',
              description: 'Scope: "model-selection", "infrastructure", "data-access", "api-change"'
            }
          }
        }
      },
      {
        name: 'validate-audit-trail',
        description: 'Verify audit logging capability.',
        parameters: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            decision_path: { type: 'string' }
          }
        }
      },
      {
        name: 'check-policy-adherence',
        description: 'Check policy compliance.',
        parameters: {
          type: 'object',
          properties: {
            proposal: { type: 'string' },
            check_budget: { type: 'boolean' },
            check_security: { type: 'boolean' },
            check_compliance: { type: 'boolean' }
          }
        }
      }
    ]

    // Convert to OpenAI tool format
    return [...dataTools, ...worfTools].map(tool => ({
      type: 'function',
      function: tool
    }))
  }

  /**
   * Phase 1: Triage
   * Uses an ultra-cheap model to determine the correct agent and complexity.
   * This saves 90% of costs by avoiding Sonnet for simple routing decisions.
   */
  private async triageTask(problem: string): Promise<TriageResult> {
    // Strategy: Prefer local Ollama for triage to hit $0 decision cost
    if (process.env.USE_LOCAL_TRIAGE === 'true') {
      const isOllamaUp = await this.ollamaClient.isAvailable();
      if (isOllamaUp) {
        const localResult = await this.ollamaClient.triageTask(problem);
        if (localResult) return localResult;
      }
      console.warn('⚠️ Local triage requested but Ollama is unavailable. Falling back to Gemini.');
    }

    const response = await this.openai.chat.completions.create({
      model: 'google/gemini-flash-1.5', // Ultra-cheap triage model
      messages: [
        { 
          role: 'system', 
          content: 'You are the Crew Triage Controller. Analyze the task and return a JSON object with: agentId (captain_picard, commander_data, worf, geordi_la_forge, counselor_troi, crusher, quark, uhura, chief_obrien, commander_riker), complexity (LOW, MEDIUM, HIGH), and recommendedModel (haiku, sonnet, opus).' 
        },
        { role: 'user', content: problem }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}') as TriageResult;
  }

  /**
   * Solve a problem using crew agents
   */
  async solveProblem(problem: string): Promise<OrchestratorResponse> {
    console.log(`\n🎯 Problem: ${problem}\n`)

    const startTime = Date.now()
    
    // 1. Run Triage to optimize model selection and cost
    const triage = await this.triageTask(problem);
    console.log(`📊 Triage complete: Agent [${triage.agentId}] at ${triage.complexity} complexity.`);

    const tools = await this.getAvailableTools()
    
    // 2. Map complexity to OpenRouter IDs
    const modelMap: Record<string, string> = {
      'haiku': 'anthropic/claude-3-haiku',
      'sonnet': 'anthropic/claude-3.5-sonnet',
      'opus': 'anthropic/claude-3-opus'
    };
    
    const selectedModel = modelMap[triage.recommendedModel] || modelMap.sonnet;

    // 3. Load the specific Agent Persona for the system prompt
    const agentPersona = PersonaProvider.getSystemPrompt(triage.agentId);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: agentPersona
      },
      {
        role: 'user',
        content: problem
      }
    ]

    const findings: Array<{
      tool: string
      agent: string
      result: any
    }> = []

    let response = await this.openai.chat.completions.create({
      model: selectedModel,
      messages,
      tools: tools as any
    })

    // Process tool calls in a loop until Claude provides final response
    let iterations = 0
    const maxIterations = 10

    while (iterations < maxIterations) {
      iterations++

      const message = response.choices[0].message

      // Check if we're done (no more tool use)
      if (!message.tool_calls || message.tool_calls.length === 0) {
        break
      }

      // Add assistant message to history
      messages.push(message)

      // Execute all tools in parallel
      // const toolResults: ToolResult[] = []

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`📞 Orchestrator calling: ${functionName}`)
        console.log(`   Input: ${JSON.stringify(functionArgs).substring(0, 100)}...`)

        // Simulate tool execution
        const result = await this.executeTool(functionName, functionArgs)

        console.log(`   Result: ${JSON.stringify(result).substring(0, 100)}...`)

        findings.push({
          tool: functionName,
          agent: this.getAgentForTool(functionName),
          result
        })

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        })
      }

      // Get next response
      response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages,
        tools: tools as any
      })
    }

    // Extract final synthesis
    const synthesis = response.choices[0].message.content || 'No synthesis generated'

    const executionTime = Date.now() - startTime

    return {
      success: true,
      synthesis,
      findings,
      triage,
      metadata: {
        tokens_used: response.usage?.total_tokens || 0,
        model: selectedModel,
        execution_time_ms: executionTime
      }
    }
  }

  /**
   * Execute a tool (simulated)
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    // In production, this would call the actual MCP server
    // For now, return simulated results

    switch (toolName) {
      case 'analyze-costs':
        return {
          success: true,
          data: {
            total_cost: 1980.5,
            cost_per_call: 0.00198,
            top_cost_drivers: [
              { name: 'claude-3.5-sonnet', cost: 1200, count: 450 },
              { name: 'claude-3.5-haiku', cost: 380, count: 2100 }
            ],
            optimization_opportunities: [
              'Use Haiku for 60% of simple queries - potential $480/week savings',
              'Implement caching for repeated queries - potential 20-40% reduction',
              'Batch process overnight requests - potential 15% reduction'
            ]
          }
        }

      case 'forecast-costs':
        return {
          success: true,
          data: {
            scenario: input.assume_change || 'no-change',
            projected_monthly_cost: 8430,
            days_until_budget_hit: 45,
            trend: 'stable'
          }
        }

      case 'calculate-roi':
        return {
          success: true,
          data: {
            annual_savings: 24960,
            payback_period_days: 14,
            roi_percentage: 249.6
          }
        }

      case 'verify-compliance':
        return {
          success: true,
          data: {
            compliant: true,
            compliance_score: '100%',
            status: 'COMPLIANT'
          }
        }

      case 'assess-risks':
        return {
          success: true,
          data: {
            risk_level: 'MEDIUM',
            critical_risks: 0,
            high_risks: 1,
            mitigations: [
              'Test accuracy on sample data',
              'Implement gradual rollout',
              'Monitor error rates closely'
            ]
          }
        }

      case 'check-policy-adherence':
        return {
          success: true,
          data: {
            adheres: true,
            violations: [],
            approval_status: 'APPROVED'
          }
        }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        }
    }
  }

  /**
   * Get agent for tool
   */
  private getAgentForTool(toolName: string): string {
    const toolToAgent: Record<string, string> = {
      'analyze-costs': 'Data',
      'forecast-costs': 'Data',
      'calculate-roi': 'Data',
      'identify-anomalies': 'Data',
      'verify-compliance': 'Worf',
      'assess-risks': 'Worf',
      'validate-audit-trail': 'Worf',
      'check-policy-adherence': 'Worf'
    }
    return toolToAgent[toolName] || 'Unknown'
  }

  /**
   * Stop all agents
   */
  async stopAgents(): Promise<void> {
    console.log('\n🛑 Stopping crew agents...')
    for (const [name, process] of this.agentProcesses) {
      if (process) {
        process.kill()
      }
    }
  }
}

export default CrewOrchestrator
