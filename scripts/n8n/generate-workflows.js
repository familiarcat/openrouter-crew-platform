#!/usr/bin/env node

/**
 * OpenRouter Crew Platform - n8n Workflow Generator
 * 
 * Scans MCP Agent Servers for N8nBridge workflow definitions and generates
 * corresponding n8n workflow JSON files.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const MCP_DIR = path.join(PROJECT_ROOT, 'domains/shared/agent-orchestration/src/mcp');
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, 'domains/shared/workflows');

// Unified Credential Names (Must match scripts/n8n/sync-credentials.js)
const CREDENTIALS = {
  OPENAI: {
    name: 'OpenRouter / OpenAI',
    type: 'openAiApi'
  },
  SUPABASE: {
    name: 'Supabase',
    type: 'supabaseApi'
  }
};

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Template for a basic n8n workflow
const createWorkflowTemplate = (name, urlPath, agent, description = '') => {
  // Heuristic: If tool is related to knowledge/memory/rag, add AI & DB nodes
  const isKnowledgeOp = /knowledge|memory|store|retrieve|rag/i.test(name) || 
                        /knowledge|memory|embedding|vector/i.test(description);

  // 1. Define Nodes
  const nodes = [
    {
      parameters: {
        httpMethod: 'POST',
        path: urlPath,
        options: {}
      },
      id: 'webhook-start',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [460, 300]
    }, 
    {
      parameters: {
        message: `Received request for ${name}`,
        level: 'info'
      },
      id: 'log-request',
      name: 'Log Request',
      type: 'n8n-nodes-base.noOp', // Using NoOp as placeholder for logging
      typeVersion: 1,
      position: [680, 300]
    }
  ];

  let lastNodeName = 'Log Request';
  let nextX = 900;

  // 2. Inject Knowledge Nodes if applicable
  if (isKnowledgeOp) {
    // Add OpenAI Embedding Node
    nodes.push({
      parameters: {
        model: "text-embedding-3-small",
        input: "={{ $json.body.content || $json.body.query }}",
        options: {}
      },
      id: "openai-embedding",
      name: "Generate Embedding",
      type: "n8n-nodes-base.openAi",
      typeVersion: 1,
      position: [nextX, 300],
      credentials: {
        openAiApi: {
          id: "openai-creds-auto",
          name: CREDENTIALS.OPENAI.name
        }
      }
    });
    lastNodeName = "Generate Embedding";
    nextX += 220;

    // Add Supabase Node
    nodes.push({
      parameters: {
        operation: name.includes('create') || name.includes('store') ? "insert" : "executeQuery",
        schema: "public",
        table: "crew_knowledge",
        options: {}
      },
      id: "supabase-op",
      name: "Supabase Operation",
      type: "n8n-nodes-base.supabase",
      typeVersion: 1,
      position: [nextX, 300],
      credentials: {
        supabaseApi: {
          id: "supabase-creds-auto",
          name: CREDENTIALS.SUPABASE.name
        }
      }
    });
    lastNodeName = "Supabase Operation";
    nextX += 220;
  }

  // 3. Add Response Node
  nodes.push({
    parameters: {
      options: {}
    },
    id: 'respond',
    name: 'Respond to Agent',
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1,
    position: [nextX, 300]
  });

  // 4. Build Connections
  const connections = {
    'Webhook': {
      'main': [
        [{ node: 'Log Request', type: 'main', index: 0 }]
      ]
    }
  };

  // Link Log -> (Optional AI/DB) -> Respond
  // We need to link the chain dynamically
  for (let i = 1; i < nodes.length - 1; i++) {
    const current = nodes[i].name;
    const next = nodes[i + 1].name;
    connections[current] = { main: [[{ node: next, type: 'main', index: 0 }]] };
  }

  return {
    name: `${agent} - ${name}`,
    nodes,
    connections,
    meta: { templateId: 'mcp-bridge-v2' }
  };
};

function extractWorkflowsFromFile(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract Agent Name (e.g., "Data" from "DataAgentServer")
  // Supports 'export class DataAgentServer' and 'export abstract class BaseMCPServer'
  const agentMatch = content.match(/export (?:abstract )?class (\w+)(?:AgentServer|MCPServer)/);
  const agentName = agentMatch ? agentMatch[1] : 'Unknown';

  // Regex to find workflow objects defined for N8nBridge
  // Looks for: const xyzWorkflow = { ... webhookUrl: ... }
  const workflowRegex = /const\s+(\w+Workflow)\s*=\s*({[\s\S]+?})/g;
  
  let match;
  const workflows = [];

  while ((match = workflowRegex.exec(content)) !== null) {
    try {
      const varName = match[1];
      const objectString =KpObjectString(match[2]);
      
      // Extract properties manually since we can't eval the TS code easily
      const nameMatch = objectString.match(/name:\s*['"]([^'"]+)['"]/);
      const pathMatch = objectString.match(/webhookUrl:.*['"`]\/([^'"`]+)['"`]/); // Matches end of URL path
      const descMatch = objectString.match(/description:\s*['"]([^'"]+)['"]/);
      
      if (nameMatch && pathMatch) {
        workflows.push({
          toolName: nameMatch[1],
          webhookPath: pathMatch[1],
          varName: varName,
          description: descMatch ? descMatch[1] : ''
        });
      }
    } catch (e) {
      console.warn(`⚠️  Failed to parse workflow in ${fileName}: ${e.message}`);
    }
  }
  
  return { agentName, workflows };
}

// Helper to cleanup object string for parsing (simple cases)
function KpObjectString(str) {
  return str; // Pass through for regex matching
}

function main() {
  console.log('🔄 Scanning MCP Agent Servers for n8n workflows...');
  ensureDirectoryExists(WORKFLOWS_DIR);

  const files = fs.readdirSync(MCP_DIR).filter(f => f.endsWith('-server.ts'));
  
  files.forEach(file => {
    const { agentName, workflows } = extractWorkflowsFromFile(path.join(MCP_DIR, file), file);
    
    if (workflows.length > 0) {
      console.log(`\n📂 Agent: ${agentName} (${file})`);
      
      const agentWorkflowFile = path.join(WORKFLOWS_DIR, `${agentName.toLowerCase()}-workflows.json`);
      
      workflows.forEach(wf => {
        const workflowJson = createWorkflowTemplate(wf.toolName, wf.webhookPath, agentName, wf.description);
        
        // We create individual files for clarity, or update if we were doing a big bundle
        // Here we generate 1:1 based on the tool definition if possible, but
        // often we want 1 Agent = 1 Workflow File containing routing.
        // For simplicity in auto-gen, we will create specific files for now.
        const filename = `${agentName.toLowerCase()}-${wf.toolName}.json`;
        const targetPath = path.join(WORKFLOWS_DIR, filename);
        
        fs.writeFileSync(targetPath, JSON.stringify(workflowJson, null, 2));
        console.log(`  ✅ Generated: ${filename} (Path: /${wf.webhookPath})`);
      });
    }
  });
  
  console.log('\n✨ Workflow generation complete. Import these files into n8n.');
}

main();