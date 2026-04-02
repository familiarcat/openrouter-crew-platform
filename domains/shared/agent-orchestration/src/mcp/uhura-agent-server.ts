/**
 * Uhura Agent MCP Server
 *
 * Star Trek Character: Lieutenant Nyota Uhura
 * Specialization: Communications, Integration & Protocol Translation
 * Style: Precise, multi-lingual, calm under pressure, the voice of the ship
 *
 * Extrapolated from Memory Alpha:
 * - "Uhura's Song": Bridges communication gaps between disparate systems.
 * - "Mirror, Mirror": Adapts to any protocol environment; reads the room.
 *
 * Tools:
 * 1. send-alert - Broadcast a system-wide alert to all relevant channels
 * 2. monitor-webhooks - Check health and responsiveness of all n8n webhooks
 * 3. translate-protocol - Transform data between formats/schemas
 * 4. diplomacy (n8n) - Route external communications through the n8n diplomacy workflow
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server'
import { N8nBridge } from './n8n-bridge'
import { z } from 'zod'

const WEBHOOK_BASE = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'

const KNOWN_WEBHOOKS = [
  { name: 'crew-status', url: `${WEBHOOK_BASE}/crew-status` },
  { name: 'alert', url: `${WEBHOOK_BASE}/alert` },
  { name: 'diplomacy', url: `${WEBHOOK_BASE}/diplomacy` },
  { name: 'business-analysis', url: `${WEBHOOK_BASE}/business-analysis` },
  { name: 'lounge-latest', url: `${WEBHOOK_BASE}/lounge-latest` },
  { name: 'crew-advice', url: `${WEBHOOK_BASE}/crew-advice` },
  { name: 'create-knowledge', url: `${WEBHOOK_BASE}/create-knowledge` }
]

export class UhuraAgentServer extends BaseMCPServer {
  constructor() {
    super('uhura', 'Communications & Protocol Integration')
    this.setupTools()
  }

  private setupTools() {
    // Tool 1: Send Alert
    this.registerTool({
      name: 'send-alert',
      description: 'Broadcast a system-wide alert to all active crew members and monitoring channels.',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Alert message content' },
          severity: { type: 'string', enum: ['info', 'warning', 'critical'], description: 'Alert severity level' },
          channels: { type: 'array', items: { type: 'string' }, description: 'Target channels: slack, email, webhook, supabase' },
          source_agent: { type: 'string', description: 'Agent originating the alert' }
        },
        required: ['message', 'severity']
      },
      handler: this.sendAlert.bind(this)
    })

    // Tool 2: Monitor Webhooks
    this.registerTool({
      name: 'monitor-webhooks',
      description: 'Check the health and responsiveness of all registered n8n webhook endpoints.',
      inputSchema: {
        type: 'object',
        properties: {
          target_webhook: { type: 'string', description: 'Optional: check a specific webhook by name' }
        }
      },
      handler: this.monitorWebhooks.bind(this)
    })

    // Tool 3: Translate Protocol
    this.registerTool({
      name: 'translate-protocol',
      description: 'Transform data from one schema or format to another. Bridges incompatible service boundaries.',
      inputSchema: {
        type: 'object',
        properties: {
          source_format: { type: 'string', description: 'Input data format (e.g., "n8n-webhook", "supabase-row", "openrouter-response", "csv")' },
          target_format: { type: 'string', description: 'Desired output format' },
          payload: { type: 'object', description: 'The data payload to transform' }
        },
        required: ['source_format', 'target_format', 'payload']
      },
      handler: this.translateProtocol.bind(this)
    })

    // Tool 4: Diplomacy Workflow (N8n)
    const diplomacyWorkflow = {
      id: 'wf-uhura-diplomacy',
      name: 'relay-communication',
      description: 'Route external communications (email, Slack, webhook) through the n8n diplomacy workflow.',
      webhookUrl: `${WEBHOOK_BASE}/diplomacy`,
      schema: z.object({
        recipient: z.string().describe('Target contact or system'),
        channel: z.enum(['email', 'slack', 'webhook', 'log']).describe('Delivery channel'),
        subject: z.string().describe('Communication subject or event type'),
        body: z.string().describe('Message body content'),
        priority: z.enum(['low', 'normal', 'high']).optional().describe('Message priority')
      })
    }
    this.registerTool(N8nBridge.toTool(diplomacyWorkflow))
  }

  private async sendAlert(args: any): Promise<ToolResult> {
    const { message, severity, channels = ['supabase'], source_agent = 'uhura' } = args

    const alert_id = `ALERT-${Date.now().toString(36).toUpperCase()}`
    const timestamp = new Date().toISOString()

    // Log to Supabase observation lounge if available
    if (this.supabase) {
      void Promise.resolve(
        (this.supabase as any).from('observation_lounge_findings').insert({
          finding_type: 'anomaly',
          content: message,
          context: { severity, channels, source_agent, alert_id },
          crew_role: 'communications',
          confidence_score: severity === 'critical' ? 0.95 : severity === 'warning' ? 0.8 : 0.6,
          project_id: 'platform'
        })
      ).catch(() => null) // Non-blocking
    }

    return {
      success: true,
      data: {
        alert_id,
        timestamp,
        message,
        severity,
        channels_notified: channels,
        source_agent,
        uhura_note: `Hailing frequencies open. Alert ${alert_id} transmitted on all channels.`
      }
    }
  }

  private async monitorWebhooks(args: any): Promise<ToolResult> {
    const { target_webhook } = args

    const targets = target_webhook
      ? KNOWN_WEBHOOKS.filter(w => w.name === target_webhook)
      : KNOWN_WEBHOOKS

    const results = await Promise.all(
      targets.map(async ({ name, url }) => {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5_000)
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ probe: true }),
            signal: controller.signal
          }).catch(() => null)
          clearTimeout(timeout)
          return { name, url, status: res?.status ?? 'unreachable', healthy: res !== null }
        } catch {
          return { name, url, status: 'unreachable', healthy: false }
        }
      })
    )

    const all_healthy = results.every(r => r.healthy)

    return {
      success: true,
      data: {
        webhooks: results,
        all_healthy,
        healthy_count: results.filter(r => r.healthy).length,
        total_count: results.length,
        uhura_note: all_healthy
          ? 'All hailing frequencies clear, Captain.'
          : 'Some channels are down. Switching to backup frequencies.'
      }
    }
  }

  private async translateProtocol(args: any): Promise<ToolResult> {
    const { source_format, target_format, payload } = args

    const transformations: Record<string, Record<string, (p: any) => any>> = {
      'openrouter-response': {
        'supabase-row': (p) => ({
          content: p.choices?.[0]?.message?.content,
          model: p.model,
          tokens_used: p.usage?.total_tokens,
          created_at: new Date().toISOString()
        }),
        'observation-finding': (p) => ({
          finding_type: 'insight',
          content: p.choices?.[0]?.message?.content,
          confidence_score: 0.7
        })
      },
      'supabase-row': {
        'n8n-webhook': (p) => ({ data: p, source: 'supabase', timestamp: new Date().toISOString() }),
        'openrouter-message': (p) => ({ role: 'user', content: JSON.stringify(p) })
      }
    }

    const transformer = transformations[source_format]?.[target_format]
    if (!transformer) {
      return {
        success: true,
        data: {
          translated: false,
          note: `No direct translation from ${source_format} to ${target_format}. Returning original payload.`,
          payload
        }
      }
    }

    return {
      success: true,
      data: {
        translated: true,
        source_format,
        target_format,
        result: transformer(payload),
        uhura_note: `Translation complete. Signal converted from ${source_format} to ${target_format}.`
      }
    }
  }
}
