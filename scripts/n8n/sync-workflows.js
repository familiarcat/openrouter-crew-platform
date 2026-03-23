#!/usr/bin/env node

/**
 * N8N Workflow Sync
 * 
 * Pushes local JSON workflows to an n8n instance.
 * Supports local (default) and production (--prod) targets.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const projectRoot = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const isPush = args.includes('--push');

const WORKFLOWS_DIR = path.join(projectRoot, 'domains/shared/workflows');

// Configuration based on target environment
const CONFIG = isProd ? {
    url: process.env.N8N_PROD_URL,
    apiKey: process.env.N8N_PROD_API_KEY,
    name: 'Production'
} : {
    url: process.env.N8N_URL || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY,
    name: 'Local'
};

if (!CONFIG.url || !CONFIG.apiKey) {
    console.error(`❌ Missing configuration for ${CONFIG.name} environment.`);
    if (isProd) console.error('   Ensure N8N_PROD_URL and N8N_PROD_API_KEY are set.');
    else console.error('   Ensure N8N_URL and N8N_API_KEY are set.');
    process.exit(1);
}

const API_BASE = `${CONFIG.url.replace(/\/$/, '')}/api/v1`;
const HEADERS = {
    'X-N8N-API-KEY': CONFIG.apiKey,
    'Content-Type': 'application/json'
};

async function getRemoteWorkflows() {
    try {
        const response = await fetch(`${API_BASE}/workflows`, { headers: HEADERS });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        return data.data; // Array of workflow objects
    } catch (error) {
        console.error(`❌ Failed to fetch workflows from ${CONFIG.name}: ${error.message}`);
        process.exit(1);
    }
}

async function upsertWorkflow(localWorkflow, remoteWorkflows) {
    const existing = remoteWorkflows.find(w => w.name === localWorkflow.name);

    // Prepare workflow object (n8n expects specific fields)
    // We respect the ID if it exists locally and matches remote, otherwise we rely on name matching
    const payload = {
        name: localWorkflow.name,
        nodes: localWorkflow.nodes,
        connections: localWorkflow.connections,
        settings: localWorkflow.settings || {},
        staticData: localWorkflow.staticData || null,
        active: true
    };

    try {
        if (existing) {
            console.log(`   🔄 Updating: ${localWorkflow.name} (ID: ${existing.id})`);
            const response = await fetch(`${API_BASE}/workflows/${existing.id}`, {
                method: 'PUT',
                headers: HEADERS,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }
        } else {
            console.log(`   Mw  Creating: ${localWorkflow.name}`);
            const response = await fetch(`${API_BASE}/workflows`, {
                method: 'POST',
                headers: HEADERS,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }
        }
    } catch (error) {
        console.error(`   ❌ Error syncing ${localWorkflow.name}: ${error.message}`);
    }
}

async function main() {
    if (!isPush) {
        console.log('ℹ️  Run with --push to actually sync workflows.');
        return;
    }

    console.log(` Syncing workflows to ${CONFIG.name} (${CONFIG.url})...`);

    // 1. Get Remote State
    const remoteWorkflows = await getRemoteWorkflows();
    console.log(`   📋 Found ${remoteWorkflows.length} existing workflows on server.`);

    // 2. Read Local Files
    if (!fs.existsSync(WORKFLOWS_DIR)) {
        console.error(`❌ Workflows directory not found: ${WORKFLOWS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));
    console.log(`   qc Found ${files.length} local workflow definitions.`);

    // 3. Upsert
    for (const file of files) {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const workflow = JSON.parse(content);
        await upsertWorkflow(workflow, remoteWorkflows);
    }

    console.log('✨ Workflow sync complete.');
}

main();