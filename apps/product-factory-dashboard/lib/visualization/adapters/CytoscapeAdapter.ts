/**
 * CytoscapeAdapter - Transform Graph to Cytoscape.js format
 * Provides styling and layout configuration for interactive visualization
 */

import { Graph } from '../core/Graph';
import { NodeType } from '../core/Node';
import { EdgeType } from '../core/Edge';

export type LayoutType = 'breadthfirst' | 'dagre' | 'circle' | 'grid' | 'cose';

export interface CytoscapeConfig {
  layout?: LayoutType;
  showLabels?: boolean;
  theme?: 'light' | 'dark';
}

export class CytoscapeAdapter {
  /**
   * Convert Graph to Cytoscape.js elements and configuration
   */
  static toElements(graph: Graph, config: CytoscapeConfig = {}) {
    return {
      elements: graph.toCytoscapeElements(),
      style: this.getStylesheet(config.theme || 'light'),
      layout: this.getLayout(config.layout || 'breadthfirst'),
    };
  }

  /**
   * Get Cytoscape.js stylesheet with node and edge styling
   */
  private static getStylesheet(theme: 'light' | 'dark') {
    const colors = theme === 'dark' ? this.darkColors : this.lightColors;

    return [
      // Base node style
      {
        selector: 'node',
        style: {
          label: 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': colors.node.default,
          color: colors.text,
          'font-size': '12px',
          'font-family': 'system-ui, -apple-system, sans-serif',
          width: 60,
          height: 60,
          'border-width': 2,
          'border-color': colors.border,
        },
      },

      // Node types
      ...this.getNodeTypeStyles(colors),

      // Base edge style
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': colors.edge.default,
          'target-arrow-color': colors.edge.default,
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
        },
      },

      // Edge types
      ...this.getEdgeTypeStyles(colors),

      // Hover states
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': colors.accent,
        },
      },
      {
        selector: 'edge:selected',
        style: {
          width: 4,
          'line-color': colors.accent,
        },
      },
    ];
  }

  /**
   * Get node type-specific styles
   */
  private static getNodeTypeStyles(colors: any) {
    const nodeColors: Record<NodeType, string> = {
      project: colors.node.project,
      domain: colors.node.domain,
      feature: colors.node.feature,
      file: colors.node.file,
      directory: colors.node.directory,
      dependency: colors.node.dependency,
      milestone: colors.node.milestone,
      tag: colors.node.tag,
    };

    return Object.entries(nodeColors).map(([type, color]) => ({
      selector: `node[type = "${type}"]`,
      style: {
        'background-color': color,
        shape: this.getNodeShape(type as NodeType),
      },
    }));
  }

  /**
   * Get edge type-specific styles
   */
  private static getEdgeTypeStyles(colors: any) {
    const edgeStyles: Record<EdgeType, any> = {
      contains: { 'line-style': 'solid', width: 2 },
      depends_on: { 'line-style': 'dashed', width: 2 },
      implements: { 'line-style': 'solid', width: 3 },
      extends: { 'line-style': 'solid', width: 3 },
      uses: { 'line-style': 'dotted', width: 1 },
      related_to: { 'line-style': 'dotted', width: 1 },
      milestone: { 'line-style': 'dashed', width: 2, 'line-color': colors.edge.milestone },
    };

    return Object.entries(edgeStyles).map(([type, style]) => ({
      selector: `edge[type = "${type}"]`,
      style,
    }));
  }

  /**
   * Get Cytoscape shape for node type
   */
  private static getNodeShape(type: NodeType): string {
    const shapes: Record<NodeType, string> = {
      project: 'round-rectangle',
      domain: 'rectangle',
      feature: 'ellipse',
      file: 'ellipse',
      directory: 'round-rectangle',
      dependency: 'hexagon',
      milestone: 'triangle',
      tag: 'diamond',
    };
    return shapes[type] || 'ellipse';
  }

  /**
   * Get layout configuration
   */
  private static getLayout(type: LayoutType) {
    const layouts = {
      breadthfirst: {
        name: 'breadthfirst',
        directed: true,
        padding: 50,
        spacingFactor: 1.5,
      },
      dagre: {
        name: 'dagre',
        rankDir: 'TB',
        nodeSep: 80,
        rankSep: 100,
      },
      circle: {
        name: 'circle',
        padding: 50,
      },
      grid: {
        name: 'grid',
        padding: 50,
        rows: undefined,
        cols: undefined,
      },
      cose: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
      },
    };

    return layouts[type] || layouts.breadthfirst;
  }

  /**
   * Light theme colors
   */
  private static lightColors = {
    background: '#ffffff',
    text: '#000000',
    border: '#e5e7eb',
    accent: '#3b82f6',
    node: {
      default: '#f3f4f6',
      project: '#8b5cf6',     // Purple
      domain: '#3b82f6',      // Blue
      feature: '#10b981',     // Green
      file: '#f59e0b',        // Amber
      directory: '#6b7280',   // Gray
      dependency: '#ef4444',  // Red
      milestone: '#ec4899',   // Pink
      tag: '#06b6d4',         // Cyan
    },
    edge: {
      default: '#d1d5db',
      milestone: '#ec4899',
    },
  };

  /**
   * Dark theme colors
   */
  private static darkColors = {
    background: '#1f2937',
    text: '#f9fafb',
    border: '#374151',
    accent: '#60a5fa',
    node: {
      default: '#374151',
      project: '#a78bfa',
      domain: '#60a5fa',
      feature: '#34d399',
      file: '#fbbf24',
      directory: '#9ca3af',
      dependency: '#f87171',
      milestone: '#f472b6',
      tag: '#22d3ee',
    },
    edge: {
      default: '#4b5563',
      milestone: '#f472b6',
    },
  };
}
