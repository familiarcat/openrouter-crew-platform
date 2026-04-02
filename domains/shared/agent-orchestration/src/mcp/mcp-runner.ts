/**
 * Unified MCP Runner
 * 
 * Acts as the single entry point for all crew agent processes.
 * Usage: node dist/mcp/mcp-runner.js <agent_id>
 */

import { PicardAgentServer } from './picard-agent-server.js';
import { DataAgentServer } from './data-agent-server.js';
import { WorfAgentServer } from './worf-agent-server.js';
import { GeordiAgentServer } from './geordi-agent-server.js';
import { CrusherAgentServer } from './crusher-agent-server.js';
import { TroiAgentServer } from './troi-agent-server.js';
import { QuarkAgentServer } from './quark-agent-server.js';
import { RikerAgentServer } from './riker-agent-server.js';
import { ObrienAgentServer } from './obrien-agent-server.js';
import { UhuraAgentServer } from './uhura-agent-server.js';

const AGENT_MAP: Record<string, any> = {
  // Phase 1 & 2 agents
  'captain_picard': PicardAgentServer,
  'commander_data': DataAgentServer,
  'worf': WorfAgentServer,
  'geordi_la_forge': GeordiAgentServer,
  'crusher': CrusherAgentServer,
  'counselor_troi': TroiAgentServer,
  // Phase 3 agents (full crew)
  'quark': QuarkAgentServer,
  'commander_riker': RikerAgentServer,
  'chief_obrien': ObrienAgentServer,
  'uhura': UhuraAgentServer,
  // Aliases
  'data': DataAgentServer,
  'riker': RikerAgentServer,
  'obrien': ObrienAgentServer,
  'troi': TroiAgentServer,
};

async function main() {
  const agentId = process.argv[2];

  if (!agentId || !AGENT_MAP[agentId]) {
    console.error(`❌ Error: Unknown agent ID "${agentId}".`);
    console.error(`Available agents: ${Object.keys(AGENT_MAP).join(', ')}`);
    process.exit(1);
  }

  console.log(`📡 Initializing Crew Member: ${agentId}...`);
  
  try {
    const AgentClass = AGENT_MAP[agentId];
    const server = new AgentClass();
    await server.start();
  } catch (error) {
    console.error(`❌ Failed to start agent ${agentId}:`, error);
    process.exit(1);
  }
}

main();