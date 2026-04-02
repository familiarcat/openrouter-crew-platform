/**
 * Riker Agent MCP Server
 *
 * Star Trek Character: Commander William T. Riker
 * Specialization: Tactical Orchestration & Mission Execution
 * Style: Bold, decisive, hands-on, leads from the front
 *
 * Extrapolated from Memory Alpha:
 * - "The Best of Both Worlds": Break complex situations into executable steps; act decisively.
 * - "Peak Performance": Coordinate crew strengths; readiness is everything.
 *
 * Tools:
 * 1. execute-mission - Decompose a high-level goal into ordered, actionable steps
 * 2. coordinate-crew - Route subtasks to the correct specialist agents
 * 3. assess-readiness - Evaluate system/crew readiness for a given mission
 * 4. crew-status (n8n) - Trigger crew coordination status workflow
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server'
import { N8nBridge } from './n8n-bridge'
import { z } from 'zod'

export class RikerAgentServer extends BaseMCPServer {
  constructor() {
    super('commander_riker', 'Tactical Orchestration & Execution')
    this.setupTools()
  }

  private setupTools() {
    // Tool 1: Execute Mission
    this.registerTool({
      name: 'execute-mission',
      description: 'Decompose a high-level mission objective into ordered, executable steps with agent assignments.',
      inputSchema: {
        type: 'object',
        properties: {
          objective: { type: 'string', description: 'The high-level mission goal' },
          constraints: { type: 'array', items: { type: 'string' }, description: 'Time, budget, or technical constraints' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Mission priority level' }
        },
        required: ['objective']
      },
      handler: this.executeMission.bind(this)
    })

    // Tool 2: Coordinate Crew
    this.registerTool({
      name: 'coordinate-crew',
      description: 'Route a task to the correct specialist agent based on task type and crew capabilities.',
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'The task to be routed' },
          task_type: {
            type: 'string',
            enum: ['analysis', 'security', 'infrastructure', 'health-check', 'ux', 'business', 'communications', 'operations'],
            description: 'Category of the task'
          },
          urgency: { type: 'string', enum: ['routine', 'urgent', 'emergency'], description: 'Task urgency' }
        },
        required: ['task', 'task_type']
      },
      handler: this.coordinateCrew.bind(this)
    })

    // Tool 3: Assess Readiness
    this.registerTool({
      name: 'assess-readiness',
      description: 'Evaluate whether the crew and systems are ready to execute a specific mission.',
      inputSchema: {
        type: 'object',
        properties: {
          mission_type: { type: 'string', description: 'Type of mission to assess readiness for' },
          required_agents: { type: 'array', items: { type: 'string' }, description: 'Agents required for the mission' },
          required_services: { type: 'array', items: { type: 'string' }, description: 'External services required (e.g., n8n, redis, supabase)' }
        },
        required: ['mission_type']
      },
      handler: this.assessReadiness.bind(this)
    })

    // Tool 4: Crew Status Workflow (N8n)
    const crewStatusWorkflow = {
      id: 'wf-crew-status',
      name: 'crew-status',
      description: 'Trigger the n8n crew coordination workflow to sync mission state across all active agents.',
      webhookUrl: `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'}/crew-status`,
      schema: z.object({
        mission_id: z.string().describe('Unique identifier for the active mission'),
        status: z.enum(['initiated', 'in_progress', 'blocked', 'completed', 'aborted']).describe('Current mission status'),
        report: z.string().describe('Status summary for the mission log')
      })
    }
    this.registerTool(N8nBridge.toTool(crewStatusWorkflow))
  }

  private async executeMission(args: any): Promise<ToolResult> {
    const { objective, constraints = [], priority = 'medium' } = args

    const steps = [
      { step: 1, action: `Analyze scope and requirements for: "${objective}"`, agent: 'commander_data' },
      { step: 2, action: 'Assess security implications and access requirements', agent: 'worf' },
      { step: 3, action: 'Plan infrastructure and resource allocation', agent: 'geordi_la_forge' },
      { step: 4, action: 'Execute primary implementation', agent: 'chief_obrien' },
      { step: 5, action: 'Validate system health post-execution', agent: 'crusher' },
      { step: 6, action: 'Report outcome and capture learnings', agent: 'commander_riker' }
    ]

    return {
      success: true,
      data: {
        mission_plan: {
          objective,
          priority,
          constraints,
          steps,
          estimated_duration: `${steps.length * 15} minutes`,
          mission_id: `MISSION-${Date.now().toString(36).toUpperCase()}`
        },
        riker_order: 'Engage. Number One, make it so.'
      }
    }
  }

  private async coordinateCrew(args: any): Promise<ToolResult> {
    const { task, task_type, urgency = 'routine' } = args

    const routingMap: Record<string, string> = {
      'analysis': 'commander_data',
      'security': 'worf',
      'infrastructure': 'geordi_la_forge',
      'health-check': 'crusher',
      'ux': 'counselor_troi',
      'business': 'quark',
      'communications': 'uhura',
      'operations': 'chief_obrien'
    }

    const assigned_agent = routingMap[task_type] || 'commander_data'

    return {
      success: true,
      data: {
        task,
        assigned_to: assigned_agent,
        urgency,
        routing_rationale: `${task_type} tasks fall under ${assigned_agent}'s area of expertise.`,
        escalation_path: urgency === 'emergency' ? 'captain_picard' : 'commander_riker'
      }
    }
  }

  private async assessReadiness(args: any): Promise<ToolResult> {
    const { mission_type, required_agents = [], required_services = [] } = args

    const known_agents = ['captain_picard', 'commander_data', 'worf', 'geordi_la_forge',
      'crusher', 'counselor_troi', 'quark', 'uhura', 'chief_obrien', 'commander_riker']

    const agents_ready = required_agents.every((a: string) => known_agents.includes(a))
    const readiness_score = agents_ready ? 95 : 60

    return {
      success: true,
      data: {
        mission_type,
        readiness_score,
        agents_ready,
        agents_status: required_agents.map((a: string) => ({
          agent: a,
          status: known_agents.includes(a) ? 'ONLINE' : 'MISSING'
        })),
        services_checklist: required_services.map((s: string) => ({
          service: s,
          status: 'CHECK_REQUIRED'
        })),
        recommendation: readiness_score >= 80
          ? 'All systems ready. You have the bridge.'
          : 'Not ready for launch. Address missing agents before proceeding.'
      }
    }
  }
}
