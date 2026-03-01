/**
 * Prompt Builder
 * Formats retrieved memories into a system prompt section for injection
 */

import {
  WeightedMemory,
  PromptBuilderOptions,
} from './types';

/**
 * Layer names for human-readable output
 */
const LAYER_NAMES = {
  1: 'Observation',
  2: 'Pattern',
  3: 'Strategy',
  4: 'Institutional Knowledge',
};

export class PromptBuilder {
  /**
   * Build a formatted prompt section from memories
   * Returns empty string if no memories
   */
  build(memories: WeightedMemory[], opts?: PromptBuilderOptions): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const maxMemories = opts?.maxMemories || 10;
    const includeConfidence = opts?.includeConfidence !== false;
    const includeLayer = opts?.includeLayer !== false;
    const separator = opts?.separator || '\n';

    // Sort by relevance score (descending)
    const sorted = memories.slice(0, maxMemories);

    // Format each memory
    const sections = sorted.map((mem) => {
      let line = '';

      // Add layer tag
      if (includeLayer) {
        const layerName = LAYER_NAMES[mem.node.layer as keyof typeof LAYER_NAMES] || 'Memory';
        line += `[${layerName}]`;
      }

      // Add summary or content
      const text = mem.node.summary || mem.node.content;
      if (line) {
        line += ` ${text.slice(0, 150)}`;
      } else {
        line = text.slice(0, 150);
      }

      // Add confidence
      if (includeConfidence) {
        const confidence = (mem.node.confidenceWeight * 100).toFixed(0);
        line += ` (confidence: ${confidence}%)`;
      }

      return line;
    });

    if (sections.length === 0) {
      return '';
    }

    // Build the prompt section
    const header = '--- Memory Context ---';
    const footer = '---';
    const body = sections.join(separator);

    return `${header}\n${body}\n${footer}`;
  }

  /**
   * Build a verbose memory report for debugging/logging
   */
  buildVerbose(memories: WeightedMemory[]): string {
    if (!memories || memories.length === 0) {
      return 'No memories retrieved';
    }

    const lines: string[] = [];
    lines.push('=== MEMORY RETRIEVAL REPORT ===');
    lines.push(`Total memories: ${memories.length}`);
    lines.push('');

    memories.forEach((mem, i) => {
      const layerName = LAYER_NAMES[mem.node.layer as keyof typeof LAYER_NAMES] || 'Unknown';

      lines.push(`Memory ${i + 1}:`);
      lines.push(`  ID: ${mem.node.id}`);
      lines.push(`  Layer: ${layerName} (${mem.node.layer})`);
      lines.push(`  Relevance: ${(mem.relevanceScore * 100).toFixed(1)}%`);
      lines.push(`  Confidence: ${(mem.node.confidenceWeight * 100).toFixed(1)}%`);
      lines.push(`  Edge Weight: ${(mem.edgeWeight * 100).toFixed(1)}%`);
      lines.push(`  Tags: ${(mem.node.tags || []).join(', ') || 'none'}`);
      lines.push(`  Activations: ${mem.node.activationCount}`);
      lines.push(`  Content: ${mem.node.summary || mem.node.content.slice(0, 80)}`);
      lines.push('');
    });

    lines.push('=== END REPORT ===');
    return lines.join('\n');
  }
}
