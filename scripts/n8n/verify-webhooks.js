#!/usr/bin/env node

/**
 * 🧪 N8N Webhook Verification & Contract Test
 * 
 * Verifies that all Crew webhooks are active and adhere to the JSON Data Contract.
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

async function verifyWebhook(member) {
  const path = `crew-${member}`;
  const url = `${N8N_BASE_URL}/${path}`;
  const prompt = `Hello I am: /webhook/${path}`;

  process.stdout.write(`${colors.dim}Testing ${member.padEnd(20)} ${colors.reset}`);

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
        project_id: 'test-verification'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const duration = Date.now() - start;

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // Validate Contract
    const errors = [];
    if (typeof data.content !== 'string') errors.push('Missing/Invalid "content"');
    if (typeof data.model !== 'string') errors.push('Missing/Invalid "model"');
    if (typeof data.tokens_used !== 'number') errors.push('Missing/Invalid "tokens_used"');
    if (typeof data.estimated_cost !== 'number') errors.push('Missing/Invalid "estimated_cost"');
    if (data.crew_member !== member) errors.push(`Wrong "crew_member" (got ${data.crew_member})`);

    if (errors.length > 0) {
      console.log(`${colors.red}❌ Failed Contract${colors.reset}`);
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
  console.log(`\n${colors.cyan}🕵️  Verifying N8N Crew Webhooks & Data Contract${colors.reset}`);
  console.log(`${colors.dim}Target: ${N8N_BASE_URL}${colors.reset}\n`);

  let successCount = 0;
  for (const member of CREW_MEMBERS) {
    if (await verifyWebhook(member)) {
      successCount++;
    }
  }

  console.log(`\n${colors.cyan}Summary: ${successCount}/${CREW_MEMBERS.length} webhooks verified.${colors.reset}`);
  
  if (successCount !== CREW_MEMBERS.length) {
    console.log(`${colors.yellow}⚠️  Some webhooks failed. Please check n8n workflows.${colors.reset}`);
    process.exit(1);
  }
}

main();