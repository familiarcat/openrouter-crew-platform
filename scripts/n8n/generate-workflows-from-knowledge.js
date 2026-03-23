#!/usr/bin/env node

/**
 * N8N Workflow Generator from Knowledge Base
 * 
 * Reads scraped data (crew_memory_alpha.json) and generates n8n workflows
 * for skills identified in the data.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.resolve(__dirname, '../../data/knowledge/crew_memory_alpha.json');
const WORKFLOWS_DIR = path.resolve(__dirname, '../../domains/shared/workflows/generated');

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Input file not found: ${INPUT_FILE}`);
  console.error('Run scripts/knowledge/scrape_memory_alpha.py first.');
  process.exit(1);
}

if (!fs.existsSync(WORKFLOWS_DIR)) {
  fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });
}

const crewData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

function generateSkillWorkflow(member, skill) {
  const safeMember = member.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const safeSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const workflowName = `${member} - ${skill} Action`;
  const webhookPath = `${safeMember}/${safeSkill}`;

  return {
    name: workflowName,
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: webhookPath,
          responseMode: "lastNode",
          options: {}
        },
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [250, 300]
      },
      {
        parameters: {
          message: `Executing ${skill} action for ${member}`,
          level: "info"
        },
        name: "Log Action",
        type: "n8n-nodes-base.noOp", 
        typeVersion: 1,
        position: [450, 300]
      },
      {
        parameters: {
          command: `echo "Executing ${skill} protocol based on Memory Alpha knowledge..."`
        },
        name: "Execute Command",
        type: "n8n-nodes-base.executeCommand",
        typeVersion: 1,
        position: [650, 300]
      }
    ],
    connections: {
      "Webhook": {
        "main": [[{ "node": "Log Action", "type": "main", "index": 0 }]]
      },
      "Log Action": {
        "main": [[{ "node": "Execute Command", "type": "main", "index": 0 }]]
      }
    }
  };
}

console.log(`🔍 Generating workflows for ${crewData.length} crew members...`);

crewData.forEach(entry => {
  entry.skills.forEach(skill => {
    const workflow = generateSkillWorkflow(entry.crew_member, skill);
    const filename = `${entry.crew_member.replace(/\s+/g, '-')}-${skill}.json`.toLowerCase();
    fs.writeFileSync(path.join(WORKFLOWS_DIR, filename), JSON.stringify(workflow, null, 2));
    console.log(`  ✅ Generated: ${filename}`);
  });
});