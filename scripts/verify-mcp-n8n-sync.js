#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const canonicalWorkflowDir = path.join(repoRoot, 'domains', 'shared', 'workflows');
const legacyWorkflowDir = path.join(repoRoot, 'packages', 'n8n-workflows');
const syncScriptPath = path.join(repoRoot, 'scripts', 'n8n', 'sync-workflows.js');
const composePaths = [
  path.join(repoRoot, 'docker-compose.yml'),
  path.join(repoRoot, 'docker-compose.n8n.yml'),
];
const customNodesDist = path.join(repoRoot, 'packages', 'n8n-nodes', 'dist');

const requiredCrewWorkflows = [
  'CREW___captain_picard.json',
  'CREW___chief_obrien.json',
  'CREW___commander_data.json',
  'CREW___commander_riker.json',
  'CREW___counselor_troi.json',
  'CREW___dr_crusher.json',
  'CREW___geordi_la_forge.json',
  'CREW___lieutenant_uhura.json',
  'CREW___lieutenant_worf.json',
  'CREW___quark.json',
];

const requiredCostSubflows = [
  '01_token_cost_meter.json',
  '03_hybrid_model_router.json',
  '05_budget_enforcer.json',
  '07_usage_logger.json',
];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

const failures = [];
const warnings = [];
const passes = [];

function log(kind, message) {
  if (kind === 'pass') {
    passes.push(message);
  } else if (kind === 'warn') {
    warnings.push(message);
  } else {
    failures.push(message);
  }
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function readText(targetPath) {
  return fs.readFileSync(targetPath, 'utf8');
}

function listJsonFiles(dir) {
  if (!exists(dir)) {
    return [];
  }

  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

function ensureWorkflowTopology() {
  if (!exists(canonicalWorkflowDir)) {
    log('fail', `Canonical workflow directory missing: ${path.relative(repoRoot, canonicalWorkflowDir)}`);
    return;
  }

  const crewDir = path.join(canonicalWorkflowDir, 'crew');
  const subflowsDir = path.join(canonicalWorkflowDir, 'subflows');

  if (!exists(crewDir)) {
    log('fail', `Crew workflow directory missing: ${path.relative(repoRoot, crewDir)}`);
  }

  if (!exists(subflowsDir)) {
    log('fail', `Subflow directory missing: ${path.relative(repoRoot, subflowsDir)}`);
  }

  for (const fileName of requiredCrewWorkflows) {
    const filePath = path.join(crewDir, fileName);
    if (!exists(filePath)) {
      log('fail', `Missing crew workflow: ${path.relative(repoRoot, filePath)}`);
    }
  }

  for (const fileName of requiredCostSubflows) {
    const filePath = path.join(subflowsDir, fileName);
    if (!exists(filePath)) {
      log('fail', `Missing cost-control subflow: ${path.relative(repoRoot, filePath)}`);
    }
  }

  const jsonFiles = listJsonFiles(canonicalWorkflowDir);
  if (jsonFiles.length === 0) {
    log('fail', `No JSON workflows found in ${path.relative(repoRoot, canonicalWorkflowDir)}`);
  } else {
    log('pass', `Found ${jsonFiles.length} canonical n8n workflow JSON files`);
  }

  if (exists(legacyWorkflowDir)) {
    const legacyFiles = fs.readdirSync(legacyWorkflowDir).filter((name) => !name.startsWith('.'));
    if (legacyFiles.length > 0) {
      log('fail', `Legacy workflow directory still contains files: ${path.relative(repoRoot, legacyWorkflowDir)}`);
    } else {
      log('pass', 'Legacy workflow directory is empty, reducing dual-source drift');
    }
  }
}

function ensureRuntimeReferences() {
  const syncScript = readText(syncScriptPath);
  if (!syncScript.includes("domains/shared/workflows")) {
    log('fail', 'n8n sync script is not pointing at the canonical workflow directory');
  } else {
    log('pass', 'n8n sync script uses the canonical workflow directory');
  }

  if (!syncScript.includes('N8N_API_KEY')) {
    log('fail', 'n8n sync script no longer references N8N_API_KEY');
  }

  for (const composePath of composePaths) {
    const compose = readText(composePath);
    const relPath = path.relative(repoRoot, composePath);

    if (!compose.includes('./domains/shared/workflows:/workflows')) {
      log('fail', `${relPath} is not mounting the canonical workflow directory`);
    } else {
      log('pass', `${relPath} mounts the canonical workflow directory`);
    }
  }
}

function compareOrigins(left, right) {
  try {
    return new URL(left).origin === new URL(right).origin;
  } catch {
    return false;
  }
}

function ensureEnvAlignment() {
  const n8nUrl = process.env.N8N_URL;
  const n8nBaseUrl = process.env.N8N_BASE_URL;
  const n8nWebhookBase = process.env.N8N_WEBHOOK_URL_BASE;
  const n8nApiKey = process.env.N8N_API_KEY;
  const mcpUrl = process.env.MCP_URL;
  const mcpApiKey = process.env.MCP_API_KEY;

  if (!n8nUrl && !n8nBaseUrl) {
    log('warn', 'Neither N8N_URL nor N8N_BASE_URL is set');
  } else {
    log('pass', 'n8n base URL is configured');
  }

  if (n8nUrl && n8nBaseUrl && !compareOrigins(n8nUrl, n8nBaseUrl)) {
    log('fail', `N8N_URL (${n8nUrl}) and N8N_BASE_URL (${n8nBaseUrl}) point at different origins`);
  } else if (n8nUrl && n8nBaseUrl) {
    log('pass', 'N8N_URL and N8N_BASE_URL are aligned');
  }

  if (n8nWebhookBase && n8nBaseUrl) {
    const normalizedBase = n8nBaseUrl.replace(/\/$/, '');
    const normalizedWebhookBase = n8nWebhookBase.replace(/\/$/, '');
    if (!normalizedWebhookBase.startsWith(`${normalizedBase}/webhook`)) {
      log('warn', `N8N_WEBHOOK_URL_BASE (${n8nWebhookBase}) does not match ${n8nBaseUrl}/webhook`);
    } else {
      log('pass', 'N8N_WEBHOOK_URL_BASE matches the configured n8n base URL');
    }
  }

  if (!n8nApiKey) {
    log('warn', 'N8N_API_KEY is not set, so workflow sync and admin API checks will be skipped at runtime');
  } else {
    log('pass', 'N8N_API_KEY is configured');
  }

  if (!mcpUrl) {
    log('warn', 'MCP_URL is not set, so MCP process alignment cannot be fully verified');
  } else {
    log('pass', 'MCP_URL is configured');
  }

  if (!mcpApiKey) {
    log('warn', 'MCP_API_KEY is not set, so remote MCP admin checks may fall back or fail');
  } else {
    log('pass', 'MCP_API_KEY is configured');
  }
}

function ensureCostControls() {
  const routerPath = path.join(canonicalWorkflowDir, 'subflows', '03_hybrid_model_router.json');
  const budgetPath = path.join(canonicalWorkflowDir, 'subflows', '05_budget_enforcer.json');
  const loggerPath = path.join(canonicalWorkflowDir, 'subflows', '07_usage_logger.json');

  for (const filePath of [routerPath, budgetPath, loggerPath]) {
    if (exists(filePath)) {
      log('pass', `Cost-control workflow present: ${path.relative(repoRoot, filePath)}`);
    }
  }

  if (!exists(customNodesDist)) {
    log('warn', 'packages/n8n-nodes/dist is missing; custom n8n nodes are not built for runtime loading');
  } else {
    log('pass', 'Custom n8n node build artifacts exist');
  }
}

function printSection(title, messages, color) {
  if (messages.length === 0) {
    return;
  }

  console.log(`\n${color}${title}${colors.reset}`);
  for (const message of messages) {
    console.log(`  ${message}`);
  }
}

function main() {
  console.log(`${colors.cyan}MCP + n8n Sync Verification${colors.reset}`);

  ensureWorkflowTopology();
  ensureRuntimeReferences();
  ensureEnvAlignment();
  ensureCostControls();

  printSection('Passed', passes, colors.green);
  printSection('Warnings', warnings, colors.yellow);
  printSection('Failures', failures, colors.red);

  console.log(
    `\n${colors.cyan}Summary:${colors.reset} ${passes.length} passed, ${warnings.length} warnings, ${failures.length} failures`
  );

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
