#!/usr/bin/env node

/**
 * 🧠 Upload N8N Backups to RAG (Supabase)
 * 
 * Ingests workflow backups into the crew_memories table to serve as
 * long-term knowledge for the AI Crew.
 * 
 * Usage: node scripts/n8n/upload-backup-to-rag.js <backup_dir>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BACKUP_DIR = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials (SUPABASE_URL, SUPABASE_KEY)');
  process.exit(1);
}

if (!BACKUP_DIR || !fs.existsSync(BACKUP_DIR)) {
  console.error(`❌ Invalid backup directory: ${BACKUP_DIR}`);
  process.exit(1);
}

async function uploadToSupabase(workflow) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      crew_member_id: 'commander_data', // Operations Officer manages backups
      type: 'workflow_backup',
      confidence: 1.0,
      content: `Workflow Backup: ${workflow.name}\nID: ${workflow.id}\nNodes: ${workflow.nodes.length}\n\n${JSON.stringify(workflow)}`,
      created_at: new Date().toISOString()
    });

    const url = new URL(`${SUPABASE_URL}/rest/v1/crew_memories`);
    const options = {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(url, options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Status Code: ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`🧠 Ingesting backups from ${path.basename(BACKUP_DIR)} into RAG system...`);
  
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
  let successCount = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(BACKUP_DIR, file), 'utf8');
      const workflow = JSON.parse(content);
      
      await uploadToSupabase(workflow);
      process.stdout.write('.');
      successCount++;
    } catch (error) {
      console.error(`\n❌ Failed to upload ${file}: ${error.message}`);
    }
  }
  console.log(`\n✅ Successfully archived ${successCount} workflows to Supabase RAG.`);
}

main();