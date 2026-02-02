#!/usr/bin/env node
/**
 * n8n Workflow Sync Script
 *
 * Syncs n8n workflows from git to n8n instance (bidirectional)
 *
 * Usage:
 *   node scripts/n8n/sync-workflows.js --direction=to-n8n
 *   node scripts/n8n/sync-workflows.js --direction=from-n8n
 *   pnpm n8n:sync
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse command line arguments
const args = process.argv.slice(2);
const direction = args.find(arg => arg.startsWith('--direction='))?.split('=')[1] || 'to-n8n';
const useProd = args.includes('--prod') || args.includes('--production');

// Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || (useProd ? 'https://n8n.pbradygeorgen.com' : 'http://localhost:5678');
const N8N_API_KEY = process.env.N8N_API_KEY;
const WORKFLOW_DIR = path.join(__dirname, '../../packages/n8n-workflows');

console.log('🔄 n8n Workflow Sync');
console.log('================================================================================');
console.log(`Direction: ${direction}`);
console.log(`n8n URL: ${N8N_BASE_URL}`);
console.log(`Workflow Dir: ${WORKFLOW_DIR}`);
console.log('================================================================================\n');

/**
 * Make API request to n8n
 */
async function n8nRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, N8N_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY })
      }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Get all workflow files from git
 */
function getWorkflowFiles() {
  const workflows = [];

  function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('.json')) {
        workflows.push(fullPath);
      }
    }
  }

  scan(WORKFLOW_DIR);
  return workflows;
}

/**
 * Sync workflows TO n8n
 */
async function syncToN8n() {
  console.log('📤 Syncing workflows TO n8n...\n');

  const workflowFiles = getWorkflowFiles();
  console.log(`Found ${workflowFiles.length} workflow files\n`);

  for (const file of workflowFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf8'));
      const name = content.name || path.basename(file, '.json');

      console.log(`  • ${name}`);

      // Check if workflow exists in n8n
      const existing = await n8nRequest(`/api/v1/workflows?filter={"name":"${name}"}`);

      if (existing.data && existing.data.length > 0) {
        // Update existing workflow
        await n8nRequest(`/api/v1/workflows/${existing.data[0].id}`, 'PATCH', content);
        console.log(`    ✅ Updated`);
      } else {
        // Create new workflow
        await n8nRequest('/api/v1/workflows', 'POST', content);
        console.log(`    ✅ Created`);
      }
    } catch (error) {
      console.error(`    ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Sync to n8n complete!');
}

/**
 * Sync workflows FROM n8n
 */
async function syncFromN8n() {
  console.log('📥 Syncing workflows FROM n8n...\n');

  try {
    const response = await n8nRequest('/api/v1/workflows');
    const workflowSummaries = response.data || [];

    console.log(`Found ${workflowSummaries.length} workflows in n8n\n`);

    for (const summary of workflowSummaries) {
      // Fetch full details to ensure completeness (API best practice)
      let workflow = summary;
      try {
        workflow = await n8nRequest(`/api/v1/workflows/${summary.id}`);
      } catch (e) {
        console.warn(`    ⚠️ Could not fetch details for ${summary.name}, using list summary.`);
      }

      const { name, nodes, connections, settings } = workflow;

      // Determine category based on name/tags
      let category = 'projects';
      if (name.includes('crew-') || name.includes('CREW')) {
        category = 'crew';
      } else if (name.match(/^\d{2}_/)) {
        category = 'subflows';
      }

      const filename = name.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '.json';
      const filepath = path.join(WORKFLOW_DIR, category, filename);

      // Create directory if it doesn't exist
      fs.mkdirSync(path.dirname(filepath), { recursive: true });

      // Write workflow file
      fs.writeFileSync(filepath, JSON.stringify({
        name,
        nodes,
        connections,
        settings,
        active: workflow.active || false,
        tags: workflow.tags || []
      }, null, 2));

      console.log(`  • ${name} → ${category}/${filename}`);
    }

    console.log('\n✅ Sync from n8n complete!');
  } catch (error) {
    console.error(`❌ Error syncing from n8n: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  // Validate n8n connectivity
  try {
    await n8nRequest('/api/v1/workflows');
  } catch (error) {
    console.error(`❌ Cannot connect to n8n at ${N8N_BASE_URL}`);
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Make sure n8n is running:');
    console.error('   • Local: pnpm dev:n8n or docker-compose up n8n');
    console.error('   • Remote: Check N8N_BASE_URL and N8N_API_KEY');
    process.exit(1);
  }

  if (direction === 'to-n8n') {
    await syncToN8n();
  } else if (direction === 'from-n8n') {
    await syncFromN8n();
  } else {
    console.error(`❌ Invalid direction: ${direction}`);
    console.error('   Use: --direction=to-n8n or --direction=from-n8n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
