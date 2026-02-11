/**
 * n8n Workflow Sync Script
 * Synchronizes workflows between local JSON files and n8n API.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob'); // Assuming glob is available or using simple recursion

// Configuration
const WORKFLOWS_DIR = path.join(__dirname, '../../packages/n8n-workflows');

// Parse Args
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const isPull = args.includes('--pull');
const isPush = args.includes('--push');

// Environment Config (Defaults to local if not set)
const API_URL = isProd 
    ? (process.env.N8N_PROD_URL || 'https://n8n.pbradygeorgen.com') 
    : (process.env.N8N_LOCAL_URL || 'http://localhost:5678');

const API_KEY = isProd
    ? process.env.N8N_PROD_API_KEY
    : process.env.N8N_LOCAL_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: N8N_API_KEY not found in environment variables.');
    process.exit(1);
}

const HEADERS = {
    'X-N8N-API-KEY': API_KEY,
    'Content-Type': 'application/json'
};

/**
 * Helper: Recursive file search
 */
function getAllWorkflowFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllWorkflowFiles(filePath, fileList);
        } else {
            if (file.endsWith('.json')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

/**
 * Action: Push (Local -> Remote)
 */
async function pushWorkflows() {
    console.log(`🚀 Pushing workflows to ${API_URL}...`);
    const files = getAllWorkflowFiles(WORKFLOWS_DIR);
    
    for (const filePath of files) {
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const workflowName = content.name;
            
            // 1. Check if exists
            const searchRes = await fetch(`${API_URL}/api/v1/workflows?limit=1&name=${encodeURIComponent(workflowName)}`, { headers: HEADERS });
            const searchData = await searchRes.json();
            
            let response;
            if (searchData.data && searchData.data.length > 0) {
                // Update
                const id = searchData.data[0].id;
                console.log(`   Updating: ${workflowName} (${id})`);
                response = await fetch(`${API_URL}/api/v1/workflows/${id}`, {
                    method: 'PUT',
                    headers: HEADERS,
                    body: JSON.stringify(content)
                });
            } else {
                // Create
                console.log(`   Creating: ${workflowName}`);
                response = await fetch(`${API_URL}/api/v1/workflows`, {
                    method: 'POST',
                    headers: HEADERS,
                    body: JSON.stringify(content)
                });
            }

            if (!response.ok) {
                const err = await response.text();
                console.error(`   ❌ Failed: ${err}`);
            }
        } catch (e) {
            console.error(`   ❌ Error processing ${path.basename(filePath)}: ${e.message}`);
        }
    }
}

/**
 * Action: Pull (Remote -> Local)
 */
async function pullWorkflows() {
    console.log(`📥 Pulling workflows from ${API_URL}...`);
    
    try {
        const res = await fetch(`${API_URL}/api/v1/workflows?limit=1000`, { headers: HEADERS });
        const data = await res.json();
        
        if (!data.data) throw new Error("Invalid API response");

        const localFiles = getAllWorkflowFiles(WORKFLOWS_DIR);
        
        for (const remoteWorkflow of data.data) {
            // Get full details
            const detailRes = await fetch(`${API_URL}/api/v1/workflows/${remoteWorkflow.id}`, { headers: HEADERS });
            const fullWorkflow = await detailRes.json();
            
            // Find matching local file by name to preserve directory structure
            let targetPath = null;
            for (const file of localFiles) {
                const content = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (content.name === fullWorkflow.name) {
                    targetPath = file;
                    break;
                }
            }

            // If new, put in 'imported' folder
            if (!targetPath) {
                targetPath = path.join(WORKFLOWS_DIR, 'imported', `${fullWorkflow.name.replace(/[^a-z0-9]/gi, '_')}.json`);
                if (!fs.existsSync(path.dirname(targetPath))) fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            }

            console.log(`   Saving: ${fullWorkflow.name} -> ${path.relative(WORKFLOWS_DIR, targetPath)}`);
            
            // Clean up JSON (optional: remove sensitive data if needed, though usually stored in env)
            fs.writeFileSync(targetPath, JSON.stringify(fullWorkflow, null, 2));
        }
    } catch (e) {
        console.error(`❌ Error pulling workflows: ${e.message}`);
    }
}

// Main Execution
(async () => {
    if (isPush) {
        await pushWorkflows();
    } else if (isPull) {
        await pullWorkflows();
    } else {
        console.log("Usage: node sync-workflows.js --[push|pull] --[local|prod]");
    }
})();