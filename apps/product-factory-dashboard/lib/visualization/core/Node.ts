/**
 * Node Entity - Core building block of the graph visualization
 * Adapted from sitemap-visualization-ddd template for project architecture
 */

export type NodeType =
  | 'project'        // Root project node
  | 'domain'         // Bounded context / domain
  | 'feature'        // Feature / component
  | 'file'           // Individual file
  | 'directory'      // Directory grouping
  | 'dependency'     // External dependency
  | 'milestone'      // Project milestone
  | 'tag';           // Classification tag

export interface NodeMetadata {
  path?: string;              // File system path
  url?: string;               // External URL (for dependencies)
  category?: string;          // Classification (e.g., "frontend", "backend")
  tags?: string[];            // Multiple tags
  lastModified?: string;      // ISO date
  size?: number;              // File size in bytes
  complexity?: number;        // Cyclomatic complexity (if file)
  dependencies?: string[];    // List of dependency IDs
  [key: string]: any;         // Additional metadata
}

export class Node {
  constructor(
    public readonly id: string,
    public readonly type: NodeType,
    public readonly label: string,
    public readonly metadata: NodeMetadata = {}
  ) {
    if (!id || id.trim() === '') {
      throw new Error('Node ID cannot be empty');
    }
    if (!label || label.trim() === '') {
      throw new Error('Node label cannot be empty');
    }
  }

  /**
   * Check if this node matches a search query
   */
  matches(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return (
      this.label.toLowerCase().includes(lowerQuery) ||
      this.id.toLowerCase().includes(lowerQuery) ||
      this.metadata.path?.toLowerCase().includes(lowerQuery) ||
      false
    );
  }

  /**
   * Get display label for visualization
   */
  getDisplayLabel(): string {
    return this.label;
  }

  /**
   * Get Cytoscape.js node data
   */
  toCytoscapeData() {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      ...this.metadata,
    };
  }

  /**
   * Get Mermaid diagram label
   */
  toMermaidLabel(): string {
    // Sanitize label for Mermaid (remove special characters)
    return this.label
      .replace(/[\\()]/g, '')
      .replace(/['"]/g, '')
      .substring(0, 50);
  }
}
