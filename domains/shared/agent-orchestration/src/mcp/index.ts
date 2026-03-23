/**
 * MCP Module Exports
 *
 * Provides access to:
 * - Base MCP server infrastructure
 * - All seven crew agent MCP servers (Phase 1 + Phase 2)
 * - Claude integration with crew agents
 */

// Base infrastructure
export { BaseMCPServer } from './base-mcp-server.js'
export type { ToolDefinition, ToolResult } from './base-mcp-server.js'

// Phase 1 Agents: Data & Worf (4 tools each)
export { DataAgentServer } from './data-agent-server.js'
export { WorfAgentServer } from './worf-agent-server.js'

// Phase 2 Agents: Troi, Geordi, Crusher (4 tools each)
export { TroiAgentServer } from './troi-agent-server.js'
export { GeordiAgentServer } from './geordi-agent-server.js'
export { CrusherAgentServer } from './crusher-agent-server.js'
export { PicardAgentServer } from './picard-agent-server.js'
export { QuarkAgentServer } from './quark-agent-server.js'
export { UhuraAgentServer } from './uhura-agent-server.js'
export { ObrienAgentServer } from './obrien-agent-server.js'
export { RikerAgentServer } from './riker-agent-server.js'

// Claude integration & orchestration
export { CrewOrchestrator } from './claude-with-crew.js'
export type { CrewAgent, ToolResult as CrewToolResult, ClaudeResponse } from './claude-with-crew.js'

/**
 * Quick Start: Create all agents and orchestrate
 *
 * const orchestrator = new CrewOrchestrator()
 * const agents = [
 *   new DataAgentServer(),
 *   new WorfAgentServer(),
 *   new TroiAgentServer(),
 *   new GeordiAgentServer(),
 *   new CrusherAgentServer(),
 *   new QuarkAgentServer(),
 *   new UhuraAgentServer(),
 *   new ObrienAgentServer(),
 *   new RikerAgentServer()
 * ]
 * const solution = await orchestrator.solveProblem('problem statement')
 */
