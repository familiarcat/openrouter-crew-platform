/**
 * Edge Entity - Represents relationships between nodes
 * Adapted from sitemap-visualization-ddd template
 */

export type EdgeType =
  | 'contains'       // Parent-child relationship (project contains domain)
  | 'depends_on'     // Dependency relationship
  | 'implements'     // Implementation relationship
  | 'extends'        // Inheritance
  | 'uses'           // Usage relationship
  | 'related_to'     // General relationship
  | 'milestone';     // Milestone association

export interface EdgeMetadata {
  weight?: number;           // Relationship strength (0-1)
  bidirectional?: boolean;   // Is relationship bidirectional?
  strength?: 'weak' | 'medium' | 'strong';
  [key: string]: any;
}

export class Edge {
  constructor(
    public readonly id: string,
    public readonly type: EdgeType,
    public readonly sourceId: string,
    public readonly targetId: string,
    public readonly metadata: EdgeMetadata = {}
  ) {
    if (!id || id.trim() === '') {
      throw new Error('Edge ID cannot be empty');
    }
    if (!sourceId || !targetId) {
      throw new Error('Edge must have source and target');
    }
    if (sourceId === targetId) {
      throw new Error('Edge cannot connect node to itself');
    }
  }

  /**
   * Get Cytoscape.js edge data
   */
  toCytoscapeData() {
    return {
      id: this.id,
      source: this.sourceId,
      target: this.targetId,
      type: this.type,
      ...this.metadata,
    };
  }

  /**
   * Get Mermaid diagram arrow
   */
  toMermaidArrow(): string {
    const arrows = {
      contains: '-->',
      depends_on: '-.->',
      implements: '==>',
      extends: '==>',
      uses: '--',
      related_to: '---',
      milestone: '-.->',
    };
    return arrows[this.type] || '-->';
  }
}
