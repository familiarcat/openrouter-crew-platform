/**
 * O'Brien Agent MCP Server
 *
 * Star Trek Character: Chief Miles O'Brien
 * Specialization: Operations, System Maintenance & The Transporter Buffer
 * Style: Practical, resourceful, gets the job done under pressure
 *
 * Extrapolated from Memory Alpha:
 * - "Tribunal": Works within constraints; always finds a workaround.
 * - "The Assignment": Manages systems under duress; keeps the station running.
 *
 * Tools:
 * 1. buffer-file - Store file state in the Transporter Buffer (Redis) before changes
 * 2. restore-file - Restore a file from the Transporter Buffer
 * 3. docker-health - Check health of all Docker containers
 * 4. alert (n8n) - Trigger system-wide maintenance alert workflow
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server'
import { N8nBridge } from './n8n-bridge'
import { z } from 'zod'
import * as fs from 'fs'

export class ObrienAgentServer extends BaseMCPServer {
  constructor() {
    super('chief_obrien', 'Operations & System Maintenance')
    this.setupTools()
  }

  private setupTools() {
    // Tool 1: Buffer File (Transporter Buffer)
    this.registerTool({
      name: 'buffer-file',
      description: "Store the current state of a file in the Transporter Buffer (Redis) before making changes. O'Brien's safety net.",
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Absolute path to the file to buffer' },
          reason: { type: 'string', description: 'Why this file is being buffered (for audit trail)' }
        },
        required: ['file_path']
      },
      handler: this.bufferFile.bind(this)
    })

    // Tool 2: Restore File
    this.registerTool({
      name: 'restore-file',
      description: 'Restore a file from the Transporter Buffer. Use when a change needs to be rolled back.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Absolute path to the file to restore' }
        },
        required: ['file_path']
      },
      handler: this.restoreFile.bind(this)
    })

    // Tool 3: Docker Health Check
    this.registerTool({
      name: 'docker-health',
      description: 'Check the health status of all running Docker containers in the platform.',
      inputSchema: {
        type: 'object',
        properties: {
          service_filter: { type: 'string', description: 'Optional: filter to specific service name (e.g., "n8n", "redis", "supabase")' }
        }
      },
      handler: this.dockerHealth.bind(this)
    })

    // Tool 4: Alert Workflow (N8n)
    const alertWorkflow = {
      id: 'wf-maintenance-alert',
      name: 'maintenance-alert',
      description: 'Trigger an n8n maintenance alert workflow to notify the crew of system operations.',
      webhookUrl: `${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'}/alert`,
      schema: z.object({
        system: z.string().describe('System or service being maintained'),
        operation: z.enum(['restart', 'patch', 'migration', 'backup', 'cleanup']).describe('Type of maintenance operation'),
        severity: z.enum(['info', 'warning', 'critical']).describe('Alert severity'),
        message: z.string().describe('Human-readable description of the maintenance action')
      })
    }
    this.registerTool(N8nBridge.toTool(alertWorkflow))
  }

  private async bufferFile(args: any): Promise<ToolResult> {
    const { file_path, reason = 'Pre-change backup' } = args

    if (!this.redis) {
      return { success: false, error: 'Redis not available — Transporter Buffer offline.' }
    }

    try {
      if (!fs.existsSync(file_path)) {
        return { success: false, error: `File not found: ${file_path}` }
      }

      const content = fs.readFileSync(file_path, 'utf-8')
      const buffer_key = `obrien:buffer:${file_path}`
      const metadata = JSON.stringify({
        file_path,
        content,
        buffered_at: new Date().toISOString(),
        reason
      })

      await this.redis.setex(buffer_key, 3600, metadata) // 1-hour TTL

      return {
        success: true,
        data: {
          buffered: true,
          file_path,
          buffer_key,
          reason,
          expires_in: '1 hour',
          obrien_note: "She's in the buffer, safe and sound. Make your changes."
        }
      }
    } catch (err: any) {
      return { success: false, error: `Buffer failed: ${err.message}` }
    }
  }

  private async restoreFile(args: any): Promise<ToolResult> {
    const { file_path } = args

    if (!this.redis) {
      return { success: false, error: 'Redis not available — Transporter Buffer offline.' }
    }

    try {
      const buffer_key = `obrien:buffer:${file_path}`
      const raw = await this.redis.get(buffer_key)

      if (!raw) {
        return { success: false, error: `No buffer found for ${file_path}. Buffer may have expired.` }
      }

      const { content, buffered_at, reason } = JSON.parse(raw)
      fs.writeFileSync(file_path, content, 'utf-8')
      await this.redis.del(buffer_key)

      return {
        success: true,
        data: {
          restored: true,
          file_path,
          original_buffer_time: buffered_at,
          original_reason: reason,
          obrien_note: "Rematerialization complete. File restored to pre-change state."
        }
      }
    } catch (err: any) {
      return { success: false, error: `Restore failed: ${err.message}` }
    }
  }

  private async dockerHealth(args: any): Promise<ToolResult> {
    const { service_filter } = args

    const { execSync } = await import('child_process')

    try {
      const filterArg = service_filter ? `--filter "name=${service_filter}"` : ''
      const output = execSync(
        `docker ps ${filterArg} --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"`,
        { encoding: 'utf-8', timeout: 10_000 }
      )

      const containers = output.trim().split('\n')
        .filter(Boolean)
        .map(line => {
          const [name, status, ports] = line.split('\t')
          const healthy = status?.toLowerCase().includes('up')
          return { name, status, ports, healthy }
        })

      const all_healthy = containers.every(c => c.healthy)

      return {
        success: true,
        data: {
          containers,
          all_healthy,
          total: containers.length,
          unhealthy: containers.filter(c => !c.healthy).map(c => c.name),
          obrien_note: all_healthy
            ? "All systems are operational, Chief."
            : "We've got problems. Some containers need attention."
        }
      }
    } catch (err: any) {
      return { success: false, error: `Docker health check failed: ${err.message}` }
    }
  }
}
