'use client';

/**
 * Project Sitemap Component
 *
 * Interactive domain visualization using React Flow
 * Shows project domains as nodes with dependencies as edges
 */

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Domain Node Data
export interface DomainNodeData {
  slug: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'at-risk' | 'blocked';
  progress: number;
  scores: {
    demand: number;
    effort: number;
    monetization: number;
    differentiation?: number;
    risk?: number;
  };
  features: string[];
}

// Custom Domain Node Component
function DomainNode({ data }: { data: DomainNodeData }) {
  const statusColors = {
    completed: '#10b981',
    'in-progress': '#3b82f6',
    planned: '#6b7280',
    'at-risk': '#f59e0b',
    blocked: '#ef4444',
  };

  const statusColor = statusColors[data.status] || statusColors.planned;

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: `2px solid ${statusColor}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '220px',
        maxWidth: '280px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Domain Name */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#eef1ff',
        }}
      >
        {data.name}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            width: `${data.progress}%`,
            height: '100%',
            background: statusColor,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Status and Progress */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '12px',
        }}
      >
        <span
          style={{
            color: statusColor,
            textTransform: 'capitalize',
            fontWeight: 500,
          }}
        >
          {data.status.replace('-', ' ')}
        </span>
        <span style={{ color: '#b9c0e5' }}>{data.progress}%</span>
      </div>

      {/* Scores */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          fontSize: '11px',
          color: '#b9c0e5',
        }}
      >
        <span title="Demand">📊 {data.scores.demand}</span>
        <span title="Monetization">💰 {data.scores.monetization}</span>
        <span title="Effort">🔧 {data.scores.effort}</span>
      </div>

      {/* Feature Count */}
      {data.features.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#b9c0e5',
          }}
        >
          {data.features.length} feature{data.features.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// Register custom node type
const nodeTypes = {
  domain: DomainNode,
};

// Sitemap Component Props
export interface ProjectSitemapProps {
  projectId: string;
  projectName: string;
  nodes: Node<DomainNodeData>[];
  edges: Edge[];
  height?: string;
  onNodeClick?: (node: Node<DomainNodeData>) => void;
}

export function ProjectSitemap({
  projectId,
  projectName,
  nodes: initialNodes,
  edges: initialEdges,
  height = '600px',
  onNodeClick,
}: ProjectSitemapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node as Node<DomainNodeData>);
      }
    },
    [onNodeClick]
  );

  // Minimap node color based on status
  const minimapNodeColor = useCallback((node: Node) => {
    const data = node.data as DomainNodeData;
    const statusColors: Record<string, string> = {
      completed: '#10b981',
      'in-progress': '#3b82f6',
      planned: '#6b7280',
      'at-risk': '#f59e0b',
      blocked: '#ef4444',
    };
    return statusColors[data.status] || statusColors.planned;
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#070812',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.13)',
        overflow: 'hidden',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        style={{
          background: '#070812',
        }}
        defaultEdgeOptions={{
          style: { stroke: '#7c5cff', strokeWidth: 2 },
          animated: false,
          type: 'smoothstep',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255, 255, 255, 0.1)"
        />
        <Controls
          style={{
            background: 'rgba(13, 16, 34, 0.97)',
            border: '1px solid rgba(255, 255, 255, 0.13)',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          nodeColor={minimapNodeColor}
          style={{
            background: 'rgba(13, 16, 34, 0.97)',
            border: '1px solid rgba(255, 255, 255, 0.13)',
            borderRadius: '8px',
          }}
          maskColor="rgba(7, 8, 18, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}

export default ProjectSitemap;
