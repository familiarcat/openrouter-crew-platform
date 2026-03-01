/**
 * Complete Example: Memory System Integration
 * Shows how to use the memory system in a real agent workflow
 */

import { createClient } from '@supabase/supabase-js';
import { createMemoryService, createMemoryAPI } from './src/index';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDMyOTQyMDAsImV4cCI6MTkwMzg5NDIwMH0.wx_Bl5TJoVLYvwv8xfKDPVNLp6sKVZsmPv7bQDzGwYw'
);

async function main() {
  console.log('🧠 Memory System Integration Example\n');

  // Initialize services
  const memoryService = createMemoryService(supabase);
  const projectId = 'baritalia-project-001';
  const crewId = 'typescript-expert';

  // ========================================
  // 1. STORE OBSERVATIONS (Layer 1)
  // ========================================
  console.log('1️⃣  Storing initial observations...\n');

  const obs1 = await memoryService.store({
    crewId,
    projectId,
    layer: 1,
    content: 'User asked about TypeScript performance optimization. Suggested profiling first.',
    summary: 'TypeScript performance inquiry',
    tags: ['typescript', 'performance', 'optimization'],
    contextKeywords: ['typescript', 'performance', 'profiling', 'optimization'],
    retentionTier: 'standard'
  });
  console.log(`✓ Stored observation: ${obs1.id.slice(0, 8)}...`);

  const obs2 = await memoryService.store({
    crewId,
    projectId,
    layer: 1,
    content: 'User wanted faster compilation. Recommended using esbuild instead of tsc.',
    summary: 'Build speed improvement',
    tags: ['typescript', 'build-tools', 'esbuild'],
    contextKeywords: ['build', 'esbuild', 'fast', 'compilation', 'typescript'],
    retentionTier: 'standard'
  });
  console.log(`✓ Stored observation: ${obs2.id.slice(0, 8)}...\n`);

  // ========================================
  // 2. RETRIEVE RELEVANT MEMORIES
  // ========================================
  console.log('2️⃣  Retrieving memories for a new context...\n');

  const retrievalResult = await memoryService.retrieve({
    projectId,
    context: 'How can I make my TypeScript compilation faster?',
    requestingCrewId: crewId,
    maxResults: 10
  });

  console.log(`✓ Found ${retrievalResult.memories.length} relevant memories`);
  console.log('\nMemories to inject into prompt:');
  console.log(retrievalResult.promptSection);
  console.log();

  // ========================================
  // 3. SIMULATE SUCCESSFUL OUTCOME
  // ========================================
  console.log('3️⃣  Reporting successful outcome...\n');

  const sessionId1 = `session_${Date.now()}_success`;
  await memoryService.reportOutcome({
    sessionId: sessionId1,
    activatedNodeIds: [obs1.id, obs2.id],
    outcome: 'success',
    outcomeDelta: 0.05,
    crewMember: crewId,
    metadata: { responseQuality: 'excellent', userFeedback: 'very helpful' }
  });

  console.log('✓ Outcome reported: success');
  console.log('  - Confidence weights increased by 5%');
  console.log('  - Edges strengthened between co-activated memories');
  console.log('  - Pattern synthesis may occur if 3+ layer-1 observations triggered\n');

  // ========================================
  // 4. STORE LAYER 2 PATTERN (if needed)
  // ========================================
  console.log('4️⃣  Manually creating a pattern from observations...\n');

  const pattern = await memoryService.store({
    crewId,
    projectId,
    layer: 2,
    content: 'When users ask about TypeScript performance: first profile with tsc --diagnostics, then consider build tool alternatives like esbuild or swc for faster compilation.',
    summary: 'TypeScript performance optimization pattern',
    tags: ['typescript', 'performance', 'build-tools', 'pattern'],
    contextKeywords: ['typescript', 'performance', 'esbuild', 'swc', 'profiling'],
    retentionTier: 'standard'
  });
  console.log(`✓ Stored pattern: ${pattern.id.slice(0, 8)}...\n`);

  // ========================================
  // 5. RETRIEVE AGAIN WITH PATTERN
  // ========================================
  console.log('5️⃣  Retrieving memories again (now includes pattern)...\n');

  const retrievalResult2 = await memoryService.retrieve({
    projectId,
    context: 'TypeScript compilation too slow',
    requestingCrewId: crewId,
    maxResults: 10
  });

  console.log(`✓ Found ${retrievalResult2.memories.length} relevant memories`);
  console.log('✓ Pattern is now included in retrieval\n');

  // ========================================
  // 6. SIMULATE FAILURE AND DECAY
  // ========================================
  console.log('6️⃣  Testing failure outcome and decay...\n');

  const sessionId2 = `session_${Date.now()}_failure`;
  await memoryService.reportOutcome({
    sessionId: sessionId2,
    activatedNodeIds: [obs1.id],
    outcome: 'failure',
    outcomeDelta: -0.10,
    crewMember: crewId,
    metadata: { issue: 'recommendation did not help' }
  });

  console.log('✓ Failure outcome reported');
  console.log('  - Confidence reduced by 10%');
  console.log('  - System learns from failures\n');

  // ========================================
  // 7. RUN DECAY
  // ========================================
  console.log('7️⃣  Applying time-based decay to memories...\n');

  const updatedCount = await memoryService.runDecay(crewId);
  console.log(`✓ Updated ${updatedCount} memory nodes`);
  console.log('  - Confidence weights adjusted based on time since last activation\n');

  // ========================================
  // 8. GET DEBUG REPORT
  // ========================================
  console.log('8️⃣  Generating debug report...\n');

  const debugReport = await memoryService.getDebugReport(projectId);
  console.log(debugReport);
  console.log();

  // ========================================
  // 9. START API SERVER
  // ========================================
  console.log('9️⃣  Starting visualization server...\n');

  const server = createMemoryAPI(supabase, 3333);
  console.log('\n📊 Open browser and visit:');
  console.log(`   http://localhost:3333/?projectId=${projectId}`);
  console.log('\n📝 Or use CLI inspector:');
  console.log(`   memory-cli list ${projectId}`);
  console.log(`   memory-cli stats ${projectId}`);
  console.log(`   memory-cli test ${projectId} "TypeScript performance"\n`);

  // Keep server running
  console.log('Press Ctrl+C to stop...\n');
}

// Run example
main().catch(console.error);
