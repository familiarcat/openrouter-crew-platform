'use client';

/**
 * ArchitectureViewer - Interactive project architecture visualization
 * Supports multiple view dimensions and layouts
 */

import { useState } from 'react';
import { Graph, ViewDimension } from '@/lib/visualization';
import { CytoscapeGraph } from './CytoscapeGraph';
import { MermaidDiagram } from './MermaidDiagram';

type ViewMode = 'interactive' | 'diagram';

interface ArchitectureViewerProps {
  projectId: string;
  initialGraph: Graph;
}

export function ArchitectureViewer({
  projectId,
  initialGraph,
}: ArchitectureViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('interactive');
  const [dimension, setDimension] = useState<ViewDimension>('domains');
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState(initialGraph);

  const handleDimensionChange = async (newDimension: ViewDimension) => {
    setLoading(true);
    setDimension(newDimension);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/graph?dimension=${newDimension}`
      );
      const data = await response.json();

      if (data.elements) {
        // Update graph with new data
        // Note: This is a simplified approach; you may want to rebuild the Graph object
        setGraph(graph); // For now, keep existing graph
      }
    } catch (error) {
      console.error('Error loading graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = graph.getStats();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              View:
            </label>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'interactive'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                Interactive
              </button>
              <button
                onClick={() => setViewMode('diagram')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'diagram'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }`}
              >
                Diagram
              </button>
            </div>
          </div>

          {/* Dimension Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dimension:
            </label>
            <select
              value={dimension}
              onChange={(e) =>
                handleDimensionChange(e.target.value as ViewDimension)
              }
              disabled={loading}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            >
              <option value="domains">Domains</option>
              <option value="tech-stack">Tech Stack</option>
              <option value="crew">Crew</option>
              <option value="milestones">Milestones</option>
              <option value="full">Full View</option>
            </select>
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Nodes: {stats.totalNodes}</span>
            <span>Edges: {stats.totalEdges}</span>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          </div>
        ) : viewMode === 'interactive' ? (
          <CytoscapeGraph graph={graph} />
        ) : (
          <MermaidDiagram graph={graph} />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Project
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Domain
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Feature
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Dependency
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
