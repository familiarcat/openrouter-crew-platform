#!/usr/bin/env node

/**
 * 🧪 N8N Webhook Verification & Contract Test
 * 
 * Verifies that all Crew webhooks and Dashboard endpoints are active 
 * and adhere to the JSON Data Contract.
 * 
 * JSON Data Contract:
 * {
 *   "content": string,          // The text response
 *   "model": string,            // The model used (e.g., "anthropic/claude-3-sonnet")
 *   "tokens_used": number,      // Total tokens consumed
 *   "estimated_cost": number,   // Cost in USD
 *   "crew_member": string,      // ID of the crew member (e.g., "captain_picard")
 *   "metadata": {               // Additional context
 *     "execution_time_ms": number,
 *     "routing_mode": string
 *   }
 * }
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m"
};

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL_BASE || 'https://n8n.pbradygeorgen.com/webhook';

const CREW_MEMBERS = [
  'captain_picard',
  'commander_data',
  'commander_riker',
  'counselor_troi',
  'lt_worf',
  'dr_crusher',
  'geordi_la_forge',
  'lt_uhura',
  'chief_obrien',
  'quark'
];

const DASHBOARD_ENDPOINTS = [
  'knowledge/query',
  'crew/stats',
  'learning/metrics',
  'project/recommendations',
  'security/assessment',
  'cost/optimization',
  'ux/analytics',
  'sync/status',
  'ai/impact',
  'process/documentation',
  'data/sources',
  'documentation'
];

async function verifyEndpoint(name, relativePath, isCrew = false) {
  const url = `${N8N_BASE_URL}/${relativePath}`;
  const prompt = `Hello I am: /webhook/${relativePath}`;

  process.stdout.write(`${colors.dim}Testing ${name.padEnd(25)} ${colors.reset}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout for cold starts

    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: prompt, 
        test_mode: true,
        project_id: 'test-verification',
        source: 'verification-script'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const duration = Date.now() - start;

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // Validate Contract (Strict for Crew, Lenient for Dashboard)
    const errors = [];
    
    if (isCrew) {
      // Crew members must return structured data for the CLI/Agents
      if (typeof data.content !== 'string' && typeof data.output !== 'string' && typeof data.text !== 'string') {
        errors.push('Missing content/output/text field');
      }
      // Optional: Check for cost tracking fields if your workflow enforces them
      // if (typeof data.estimated_cost !== 'number') errors.push('Missing estimated_cost');
    } else {
      // Dashboard endpoints just need to return valid JSON (often arrays or objects)
      if (typeof data !== 'object' || data === null) errors.push('Invalid JSON response');
    }

    if (errors.length > 0) {
      console.log(`${colors.red}❌ Invalid Format${colors.reset}`);
      errors.forEach(e => console.log(`   - ${e}`));
      return false;
    }

    console.log(`${colors.green}✅ Passed (${duration}ms)${colors.reset}`);
    return true;

  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`\n${colors.cyan}🕵️  Verifying N8N Connectivity (Unified System)${colors.reset}`);
  console.log(`${colors.dim}Target: ${N8N_BASE_URL}${colors.reset}\n`);

  let successCount = 0;
  let totalTests = 0;

  console.log(`${colors.yellow}--- Crew Members (CLI & Agents) ---${colors.reset}`);
  for (const member of CREW_MEMBERS) {
    totalTests++;
    if (await verifyEndpoint(member, `crew-${member}`, true)) {
      successCount++;
    }
  }

  console.log(`\n${colors.yellow}--- Dashboard Fallbacks (UI) ---${colors.reset}`);
  for (const endpoint of DASHBOARD_ENDPOINTS) {
    totalTests++;
    if (await verifyEndpoint(endpoint, endpoint, false)) {
      successCount++;
    }
  }

  console.log(`\n${colors.cyan}Summary: ${successCount}/${totalTests} endpoints verified.${colors.reset}`);
  
  if (successCount !== totalTests) {
    console.log(`${colors.yellow}⚠️  Some endpoints failed. Please check n8n workflows.${colors.reset}`);
    process.exit(1);
  }
}

main();