/**
 * AgentMCPClient — bridges the VSCode extension to crew agent MCP servers.
 *
 * Each crew agent runs as a separate Node process using stdio transport.
 * This client manages those processes and communicates via raw JSON-RPC 2.0
 * over stdin/stdout — the same protocol used by BaseMCPServer.
 *
 * Wire format (matches base-mcp-server.ts):
 *   Request:  {"jsonrpc":"2.0","id":<n>,"method":"tools/call","params":{"name":"...","arguments":{...}}}
 *   Response: {"jsonrpc":"2.0","id":<n>,"result":{"content":[{"type":"text","text":"<JSON>"}]}}
 */

import * as vscode from 'vscode'
import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { CostTracker } from './cost-tracker'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: unknown
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: { code: number; message: string }
}

interface ToolInfo {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timer: ReturnType<typeof setTimeout>
}

const TOOL_CALL_COST_USD = 0.0001
const REQUEST_TIMEOUT_MS = 60_000

/** Manages a single crew agent subprocess and communicates with it via JSON-RPC stdio */
export class AgentMCPClient {
  private process: child_process.ChildProcess | null = null
  private pending: Map<number, PendingRequest> = new Map()
  private nextId = 1
  private lineBuffer = ''
  private ready = false
  private startPromise: Promise<void> | null = null

  constructor(
    readonly agentId: string,
    private runnerPath: string,
    private childEnv: NodeJS.ProcessEnv,
    private costTracker: CostTracker
  ) {}

  isReady(): boolean {
    return this.ready && this.process !== null && !this.process.killed
  }

  async ensureStarted(): Promise<void> {
    if (this.isReady()) return
    if (this.startPromise) return this.startPromise
    this.startPromise = this.spawn()
    return this.startPromise
  }

  private async spawn(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = child_process.spawn('node', [this.runnerPath, this.agentId], {
        env: this.childEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stderr = ''
      this.process.stderr?.on('data', (chunk: Buffer) => {
        const line = chunk.toString()
        stderr += line
        if (line.includes('MCP Server started')) {
          this.ready = true
          resolve()
        }
        if (line.includes('Failed to start agent')) {
          reject(new Error(`Agent ${this.agentId} failed to start: ${stderr}`))
        }
      })

      this.process.stdout?.on('data', (chunk: Buffer) => {
        this.lineBuffer += chunk.toString()
        let newlineIdx: number
        while ((newlineIdx = this.lineBuffer.indexOf('\n')) !== -1) {
          const line = this.lineBuffer.slice(0, newlineIdx).trim()
          this.lineBuffer = this.lineBuffer.slice(newlineIdx + 1)
          if (line) this.handleResponse(line)
        }
      })

      this.process.on('exit', () => {
        this.ready = false
        for (const [, pending] of this.pending) {
          clearTimeout(pending.timer)
          pending.reject(new Error(`Agent ${this.agentId} process exited`))
        }
        this.pending.clear()
      })

      // Resolve after 3 seconds if no explicit ready signal
      setTimeout(() => {
        if (!this.ready) {
          this.ready = true
          resolve()
        }
      }, 3000)
    })
  }

  private handleResponse(line: string): void {
    let response: JsonRpcResponse
    try {
      response = JSON.parse(line)
    } catch {
      return
    }
    const pending = this.pending.get(response.id)
    if (!pending) return
    clearTimeout(pending.timer)
    this.pending.delete(response.id)
    if (response.error) {
      pending.reject(new Error(response.error.message))
    } else {
      pending.resolve(response.result)
    }
  }

  private async sendRequest(method: string, params: unknown): Promise<unknown> {
    await this.ensureStarted()
    if (!this.process?.stdin) throw new Error(`Agent ${this.agentId} stdin not available`)

    const id = this.nextId++
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Request to ${this.agentId}.${method} timed out after ${REQUEST_TIMEOUT_MS}ms`))
      }, REQUEST_TIMEOUT_MS)

      this.pending.set(id, { resolve, reject, timer })
      this.process!.stdin!.write(JSON.stringify(request) + '\n')
    })
  }

  async listTools(): Promise<ToolInfo[]> {
    const result = await this.sendRequest('tools/list', {}) as { tools?: ToolInfo[] }
    return result?.tools ?? []
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await this.sendRequest('tools/call', { name: toolName, arguments: args })

    // Record cost — tool calls don't return token counts so use fixed estimate
    await this.costTracker.recordUsage(TOOL_CALL_COST_USD, {
      model: this.agentId,
      command: toolName,
      intent: 'TOOL_CALL',
      costUSD: TOOL_CALL_COST_USD,
    } as Parameters<CostTracker['recordUsage']>[1])

    // The MCP text content may be double-JSON-encoded (base-mcp-server.ts pattern)
    const content = (result as { content?: Array<{ type: string; text: string }> })?.content
    if (content?.[0]?.text) {
      try {
        return JSON.parse(content[0].text)
      } catch {
        return content[0].text
      }
    }
    return result
  }

  dispose(): void {
    this.ready = false
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(new Error(`Agent ${this.agentId} disposed`))
    }
    this.pending.clear()
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM')
    }
    this.process = null
  }
}

/**
 * Pool of AgentMCPClients — one per agent ID.
 * Created once at extension activation and disposed on deactivation.
 */
export class AgentMCPClientPool implements vscode.Disposable {
  private clients: Map<string, AgentMCPClient> = new Map()
  private agentDistPath: string
  private childEnv: NodeJS.ProcessEnv

  constructor(
    private costTracker: CostTracker,
    private context: vscode.ExtensionContext
  ) {
    // Resolve agent dist path: dev (monorepo) vs packaged VSIX
    const monorepoDomains = path.join(__dirname, '..', '..', '..', '..', 'domains')
    const isDev = fs.existsSync(monorepoDomains)
    this.agentDistPath = isDev
      ? path.join(__dirname, '..', '..', '..', '..', 'domains', 'shared', 'agent-orchestration', 'dist')
      : path.join(__dirname, '..', 'agent-dist')

    const config = vscode.workspace.getConfiguration('openrouterCrew')
    const apiKey = config.get<string>('apiKey') || process.env.OPENROUTER_API_KEY || ''

    this.childEnv = {
      ...process.env,
      OPENROUTER_API_KEY: apiKey,
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'redis',
      USE_LOCAL_TRIAGE: 'false',
    }
  }

  getClient(agentId: string): AgentMCPClient {
    if (!this.clients.has(agentId)) {
      const runnerPath = path.join(this.agentDistPath, 'mcp', 'mcp-runner.js')
      const client = new AgentMCPClient(agentId, runnerPath, this.childEnv, this.costTracker)
      this.clients.set(agentId, client)
    }
    return this.clients.get(agentId)!
  }

  disposeAll(): void {
    for (const client of this.clients.values()) {
      client.dispose()
    }
    this.clients.clear()
  }

  dispose(): void {
    this.disposeAll()
  }
}
