#!/usr/bin/env node

/**
 * 🔐 N8N Credential Sync
 * 
 * Synchronizes local environment variables (OpenAI, Supabase) 
 * into n8n's credential store via API.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const projectRoot = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const N8N_API_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY is not set. Please set it in .env.local');
  process.exit(1);
}

const HEADERS = {
  'X-N8N-API-KEY': N8N_API_KEY,
  'Content-Type': 'application/json'
};

// Map Env Vars to N8N Credential Types
const CREDENTIALS = [
  {
    name: 'OpenRouter / OpenAI',
    type: 'openAiApi',
    data: {
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    }
  },
  {
    name: 'Supabase',
    type: 'supabaseApi',
    data: {
      url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
    }
  }
];

async function syncCredentials() {
  console.log(`🔐 Syncing credentials to ${N8N_API_URL}...`);

  for (const cred of CREDENTIALS) {
    if (!cred.data.apiKey && (!cred.data.url || !cred.data.serviceRole)) {
      console.warn(`⚠️  Skipping ${cred.name}: Missing environment variables.`);
      continue;
    }

    try {
      // 1. Check if credential exists
      // Note: n8n API doesn't support filtering credentials by name directly in all versions,
      // so we might create duplicates if we rely solely on name. 
      // However, for automation, we'll try to Create. 
      // If you need updates, you'd list all and match by name.
      
      // Creating a new credential
      const res = await fetch(`${N8N_API_URL}/api/v1/credentials`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          name: cred.name,
          type: cred.type,
          data: cred.data
        })
      });

      if (res.ok) {
        const json = await res.json();
        console.log(`   ✅ Created: ${cred.name} (ID: ${json.id})`);
      } else {
        const text = await res.text();
        // Ignore if it's a "duplicate name" error, or handle update logic here if needed
        if (text.includes('already exists')) {
             console.log(`   Mw  ${cred.name} already exists (Skipping overwrite to protect ID stability)`);
        } else {
             console.error(`   ❌ Failed ${cred.name}: ${text}`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error syncing ${cred.name}: ${error.message}`);
    }
  }
  
  console.log('✨ Credential sync complete.');
}

syncCredentials();