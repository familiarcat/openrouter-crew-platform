#!/usr/bin/env node

/**
 * Memory System CLI Inspector
 * Quick inspection and management of memory nodes, edges, and statistics
 */

import { createClient } from '@supabase/supabase-js';
import { MemoryService } from './memory-service';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDMyOTQyMDAsImV4cCI6MTkwMzg5NDIwMH0.wx_Bl5TJoVLYvwv8xfKDPVNLp6sKVZsmPv7bQDzGwYw';

const supabase = createClient(supabaseUrl, supabaseKey);
const memoryService = new MemoryService(supabase);

const args = process.argv.slice(2);
const command = args[0];

/**
 * Print a formatted table
 */
function printTable(data: any[], columns: (keyof any)[]): void {
  if (data.length === 0) {
    console.log('No data');
    return;
  }

  const colWidths: number[] = columns.map(col => {
    const maxWidth = Math.max(
      String(col).length,
      ...data.map((row: any) => String(row[col] ?? '').length)
    );
    return maxWidth + 2;
  });

  // Header
  const header = columns
    .map((col, i) => String(col).padEnd(colWidths[i] ?? 10))
    .join('│');
  console.log(header);
  console.log('─'.repeat(header.length));

  // Rows
  for (const row of data) {
    const values = columns
      .map((col, i) => String(row[col] ?? '').padEnd(colWidths[i] ?? 10))
      .join('│');
    console.log(values);
  }
}

/**
 * List memories in a project
 */
async function listMemories(projectId: string, layer?: number) {
  try {
    const { data: nodes } = await supabase
      .from('memory_nodes')
      .select('id, layer, summary, confidence_weight, activation_count, created_at')
      .eq('project_id', projectId)
      .is('deleted_at', null);

    if (!nodes || nodes.length === 0) {
      console.log('No memories found');
      return;
    }

    let filtered: any[] = nodes;
    if (layer) {
      filtered = filtered.filter(n => n.layer === layer);
    }

    const layerNames: Record<number, string> = {
      1: 'Observation',
      2: 'Pattern',
      3: 'Strategy',
      4: 'Institutional'
    };

    const rows = filtered.map((n: any) => ({
      id: n.id.slice(0, 8) + '...',
      layer: `${n.layer} (${layerNames[n.layer]})`,
      summary: (n.summary || 'N/A').slice(0, 40),
      confidence: (n.confidence_weight * 100).toFixed(0) + '%',
      activations: n.activation_count,
      created: new Date(n.created_at).toLocaleDateString()
    }));

    console.log(`\n📦 Memories in project ${projectId.slice(0, 8)}...`);
    console.log(`Total: ${filtered.length} (${layer ? `Layer ${layer}` : 'All layers'})\n`);
    printTable(rows, ['id', 'layer', 'summary', 'confidence', 'activations', 'created']);
  } catch (error) {
    console.error('Error listing memories:', error);
  }
}

/**
 * Show memory details
 */
async function showMemory(memoryId: string) {
  try {
    const { data: node, error } = await supabase
      .from('memory_nodes')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error || !node) {
      console.error('Memory not found');
      return;
    }

    const layerNames: Record<number, string> = {
      1: 'Observation',
      2: 'Pattern',
      3: 'Strategy',
      4: 'Institutional'
    };

    console.log('\n🧠 Memory Details');
    console.log('═'.repeat(60));
    console.log(`ID:              ${node.id}`);
    console.log(`Layer:           ${node.layer} (${layerNames[node.layer]})`);
    console.log(`Confidence:      ${(node.confidence_weight * 100).toFixed(1)}%`);
    console.log(`Activations:     ${node.activation_count}`);
    console.log(`Retention Tier:  ${node.retention_tier}`);
    console.log(`Tags:            ${(node.tags || []).join(', ') || 'none'}`);
    console.log(`Created:         ${new Date(node.created_at).toISOString()}`);
    console.log(`Last Activated:  ${node.last_activated_at ? new Date(node.last_activated_at).toISOString() : 'never'}`);
    console.log(`\nContent (first 200 chars):`);
    console.log(node.content.slice(0, 200));
    console.log(`\nSummary:`);
    console.log(node.summary || 'N/A');

    // Get edges
    const { data: outgoing } = await supabase
      .from('memory_edges')
      .select('*')
      .eq('source_id', memoryId);

    const { data: incoming } = await supabase
      .from('memory_edges')
      .select('*')
      .eq('target_id', memoryId);

    if ((outgoing?.length || 0) > 0) {
      console.log(`\n→ Outgoing Edges (${outgoing?.length || 0}):`);
      const edgeRows = (outgoing || []).slice(0, 5).map(e => ({
        target: e.target_id.slice(0, 8) + '...',
        weight: (e.weight * 100).toFixed(0) + '%',
        coActivations: e.co_activation_count
      }));
      printTable(edgeRows, ['target', 'weight', 'coActivations']);
      if ((outgoing?.length || 0) > 5) {
        console.log(`... and ${(outgoing?.length || 0) - 5} more`);
      }
    }

    if ((incoming?.length || 0) > 0) {
      console.log(`\n← Incoming Edges (${incoming?.length || 0}):`);
      const edgeRows = (incoming || []).slice(0, 5).map(e => ({
        source: e.source_id.slice(0, 8) + '...',
        weight: (e.weight * 100).toFixed(0) + '%',
        coActivations: e.co_activation_count
      }));
      printTable(edgeRows, ['source', 'weight', 'coActivations']);
      if ((incoming?.length || 0) > 5) {
        console.log(`... and ${(incoming?.length || 0) - 5} more`);
      }
    }

    console.log('');
  } catch (error) {
    console.error('Error showing memory:', error);
  }
}

/**
 * Show project statistics
 */
async function showStats(projectId: string) {
  try {
    const { data: nodes } = await supabase
      .from('memory_nodes')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null);

    const { data: edges } = await supabase
      .from('memory_edges')
      .select('*');

    const nodeList = nodes || [];
    const edgeList = edges || [];

    const avgConfidence = nodeList.length > 0
      ? nodeList.reduce((s, n) => s + n.confidence_weight, 0) / nodeList.length
      : 0;

    const avgEdgeWeight = edgeList.length > 0
      ? edgeList.reduce((s, e) => s + e.weight, 0) / edgeList.length
      : 0;

    // Group by layer
    const byLayer: Record<number, any[]> = {};
    for (const node of nodeList) {
      if (!byLayer[node.layer]) byLayer[node.layer] = [];
      const layer = byLayer[node.layer];
      if (layer) layer.push(node);
    }

    // Group by tier
    const byTier: Record<string, number> = {};
    for (const node of nodeList) {
      byTier[node.retention_tier] = (byTier[node.retention_tier] || 0) + 1;
    }

    console.log('\n📊 Memory Statistics');
    console.log('═'.repeat(60));
    console.log(`Project:             ${projectId.slice(0, 8)}...`);
    console.log(`Total Nodes:         ${nodeList.length}`);
    console.log(`Total Edges:         ${edgeList.length}`);
    console.log(`Avg Confidence:      ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`Avg Edge Weight:     ${(avgEdgeWeight * 100).toFixed(1)}%`);

    console.log(`\nBy Layer:`);
    for (const layer of [1, 2, 3, 4]) {
      const count = byLayer[layer]?.length || 0;
      const avg = count > 0 && byLayer[layer]
        ? (byLayer[layer].reduce((s: number, n: any) => s + n.confidence_weight, 0) / count * 100).toFixed(1)
        : '0.0';
      console.log(`  Layer ${layer}: ${count} nodes (avg confidence: ${avg}%)`);
    }

    console.log(`\nBy Retention Tier:`);
    for (const [tier, count] of Object.entries(byTier)) {
      console.log(`  ${tier}: ${count} nodes`);
    }

    console.log('');
  } catch (error) {
    console.error('Error showing stats:', error);
  }
}

/**
 * Test memory retrieval
 */
async function testRetrieval(projectId: string, context: string) {
  try {
    const result = await memoryService.retrieve({
      projectId,
      context,
      maxResults: 5
    });

    console.log(`\n🔍 Retrieval Test for: "${context.slice(0, 50)}..."`);
    console.log('═'.repeat(60));
    console.log(`Found ${result.memories.length} relevant memories\n`);

    if (result.memories.length === 0) {
      console.log('No memories retrieved');
      return;
    }

    const rows = result.memories.map((m, i) => ({
      rank: i + 1,
      layer: m.node.layer,
      relevance: (m.relevanceScore * 100).toFixed(0) + '%',
      confidence: (m.node.confidenceWeight * 100).toFixed(0) + '%',
      summary: (m.node.summary || m.node.content).slice(0, 35)
    }));

    printTable(rows, ['rank', 'layer', 'relevance', 'confidence', 'summary']);

    console.log('\n📝 Prompt Section:');
    console.log('─'.repeat(60));
    console.log(result.promptSection);
    console.log('');
  } catch (error) {
    console.error('Error testing retrieval:', error);
  }
}

/**
 * Show debug report
 */
async function showDebugReport(projectId: string) {
  try {
    const report = await memoryService.getDebugReport(projectId);
    console.log(report);
  } catch (error) {
    console.error('Error generating debug report:', error);
  }
}

/**
 * Main CLI handler
 */
async function main() {
  if (!command || command === 'help' || command === '--help') {
    console.log(`
🧠 Memory System CLI Inspector

Usage:
  memory-cli <command> [options]

Commands:
  list <projectId> [layer]      List memories in a project (optionally filter by layer 1-4)
  show <memoryId>               Show detailed information about a memory
  stats <projectId>             Show project memory statistics
  test <projectId> <context>    Test memory retrieval with a context string
  debug <projectId>             Show detailed debug report
  help                          Show this help message

Environment:
  SUPABASE_URL    Supabase project URL (default: http://localhost:54321)
  SUPABASE_KEY    Supabase API key (default: local anon key)

Examples:
  memory-cli list 550e8400-e29b-41d4-a716-446655440000
  memory-cli list 550e8400-e29b-41d4-a716-446655440000 1
  memory-cli show 660e8400-e29b-41d4-a716-446655440001
  memory-cli stats 550e8400-e29b-41d4-a716-446655440000
  memory-cli test 550e8400-e29b-41d4-a716-446655440000 "how to debug TypeScript"
  memory-cli debug 550e8400-e29b-41d4-a716-446655440000
    `);
    return;
  }

  switch (command) {
    case 'list': {
      const projectId = args[1];
      const layer = args[2] ? parseInt(args[2]) : undefined;
      if (!projectId) {
        console.error('Project ID is required');
        process.exit(1);
      }
      await listMemories(projectId, layer);
      break;
    }
    case 'show': {
      const memoryId = args[1];
      if (!memoryId) {
        console.error('Memory ID is required');
        process.exit(1);
      }
      await showMemory(memoryId);
      break;
    }
    case 'stats': {
      const projectId = args[1];
      if (!projectId) {
        console.error('Project ID is required');
        process.exit(1);
      }
      await showStats(projectId);
      break;
    }
    case 'test': {
      const projectId = args[1];
      const context = args.slice(2).join(' ');
      if (!projectId || !context) {
        console.error('Project ID and context are required');
        process.exit(1);
      }
      await testRetrieval(projectId, context);
      break;
    }
    case 'debug': {
      const projectId = args[1];
      if (!projectId) {
        console.error('Project ID is required');
        process.exit(1);
      }
      await showDebugReport(projectId);
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.log("Run 'memory-cli help' for usage information");
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
