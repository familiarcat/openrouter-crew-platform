// Re-export all crew agent MCP servers and orchestration utilities
export { BaseMCPServer } from './mcp/base-mcp-server'
export type { ToolDefinition, ToolResult } from './mcp/base-mcp-server'

export { DataAgentServer } from './mcp/data-agent-server'
export { WorfAgentServer } from './mcp/worf-agent-server'
export { TroiAgentServer } from './mcp/troi-agent-server'
export { GeordiAgentServer } from './mcp/geordi-agent-server'
export { CrusherAgentServer } from './mcp/crusher-agent-server'
export { PicardAgentServer } from './mcp/picard-agent-server'
export { QuarkAgentServer } from './mcp/quark-agent-server'
export { UhuraAgentServer } from './mcp/uhura-agent-server'
export { ObrienAgentServer } from './mcp/obrien-agent-server'
export { RikerAgentServer } from './mcp/riker-agent-server'

export { CrewOrchestrator } from './mcp/claude-with-crew'
export { PromptManager } from './mcp/prompt-manager'
export { OllamaMCPClient } from './mcp/ollama-mcp-client'
export type { CrewAgent, ToolResult as CrewToolResult, OrchestratorResponse as ClaudeResponse } from './mcp/claude-with-crew'
