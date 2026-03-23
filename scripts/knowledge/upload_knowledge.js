#!/usr/bin/env node
/**
 * Wrapper: delegates to the canonical uploader in domains/shared/agent-orchestration/.
 * Source of truth: domains/shared/agent-orchestration/src/mcp/upload_knowledge.js
 */
const path = require('path');
const { execFileSync } = require('child_process');
const real = path.resolve(__dirname, '../../domains/shared/agent-orchestration/src/mcp/upload_knowledge.js');
execFileSync(process.execPath, [real, ...process.argv.slice(2)], { stdio: 'inherit' });
