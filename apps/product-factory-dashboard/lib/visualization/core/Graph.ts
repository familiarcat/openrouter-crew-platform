/**
 * Graph Aggregate Root - Domain model for project architecture graph
 * Adapted from sitemap-visualization-ddd template
 */

import { Node, NodeType } from './Node';
import { Edge, EdgeType } from './Edge';

export interface GraphOptions {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class Graph {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();

  constructor(
    public readonly id: string,
    public readonly options: GraphOptions = {}
  ) {
    if (!id || id.trim() === '') {
      throw new Error('Graph ID cannot be empty');
    }
  }

  /**
   * Add a node to the graph
   */
  addNode(node: Node): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} already exists`);
    }
    this.nodes.set(node.id, node);
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: Edge): void {
    // Validate source and target nodes exist
    if (!this.nodes.has(edge.sourceId)) {
      throw new Error(`Source node ${edge.sourceId} not found`);
    }
    if (!this.nodes.has(edge.targetId)) {
      throw new Error(`Target node ${edge.targetId} not found`);
    }

    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with ID ${edge.id} already exists`);
    }

    this.edges.set(edge.id, edge);
  }

  /**
   * Get all nodes
   */
  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get node by ID
   */
  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  /**
   * Find nodes by type
   */
  getNodesByType(type: NodeType): Node[] {
    return this.getNodes().filter((n) => n.type === type);
  }

  /**
   * Get root nodes (nodes with no incoming edges)
   */
  getRootNodes(): Node[] {
    const targetIds = new Set(this.getEdges().map((e) => e.targetId));
    return this.getNodes().filter((n) => !targetIds.has(n.id));
  }

  /**
   * Get children of a node
   */
  getChildren(nodeId: string): Node[] {
    const childIds = this.getEdges()
      .filter((e) => e.sourceId === nodeId)
      .map((e) => e.targetId);

    return childIds
      .map((id) => this.nodes.get(id))
      .filter((n): n is Node => n !== undefined);
  }

  /**
   * Get parent of a node
   */
  getParent(nodeId: string): Node | undefined {
    const parentEdge = this.getEdges().find((e) => e.targetId === nodeId);
    if (!parentEdge) return undefined;
    return this.nodes.get(parentEdge.sourceId);
  }

  /**
   * Search nodes by query
   */
  searchNodes(query: string): Node[] {
    if (!query || query.trim() === '') {
      return [];
    }
    return this.getNodes().filter((n) => n.matches(query));
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType: Object.fromEntries(
        Array.from(
          this.getNodes().reduce((acc, node) => {
            acc.set(node.type, (acc.get(node.type) || 0) + 1);
            return acc;
          }, new Map<NodeType, number>())
        )
      ),
      rootNodes: this.getRootNodes().length,
    };
  }

  /**
   * Validate graph integrity
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for at least one root node
    if (this.getRootNodes().length === 0 && this.nodes.size > 0) {
      errors.push('Graph has no root nodes');
    }

    // Check for orphaned edges
    for (const edge of this.getEdges()) {
      if (!this.nodes.has(edge.sourceId)) {
        errors.push(`Edge ${edge.id} references non-existent source ${edge.sourceId}`);
      }
      if (!this.nodes.has(edge.targetId)) {
        errors.push(`Edge ${edge.id} references non-existent target ${edge.targetId}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export to Cytoscape.js format
   */
  toCytoscapeElements() {
    return [
      ...this.getNodes().map((node) => ({
        data: node.toCytoscapeData(),
      })),
      ...this.getEdges().map((edge) => ({
        data: edge.toCytoscapeData(),
      })),
    ];
  }

  /**
   * Export to Mermaid diagram
   */
  toMermaidDiagram(): string {
    const lines: string[] = ['graph TD'];

    // Add nodes
    for (const node of this.getNodes()) {
      const shape = this.getNodeShape(node.type);
      lines.push(`  ${node.id}${shape.start}${node.toMermaidLabel()}${shape.end}`);
    }

    // Add edges
    for (const edge of this.getEdges()) {
      const arrow = edge.toMermaidArrow();
      lines.push(`  ${edge.sourceId} ${arrow} ${edge.targetId}`);
    }

    return lines.join('\n');
  }

  private getNodeShape(type: NodeType): { start: string; end: string } {
    const shapes: Record<NodeType, { start: string; end: string }> = {
      project: { start: '([', end: '])' },      // Stadium
      domain: { start: '[[', end: ']]' },       // Subroutine
      feature: { start: '[', end: ']' },        // Rectangle
      file: { start: '(', end: ')' },           // Round
      directory: { start: '[/', end: '/]' },    // Trapezoid
      dependency: { start: '{{', end: '}}' },   // Hexagon
      milestone: { start: '>', end: ']' },      // Flag
      tag: { start: '{', end: '}' },            // Rhombus
    };
    return shapes[type] || { start: '[', end: ']' };
  }
}
