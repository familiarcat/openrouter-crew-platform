'use client';

/**
 * CytoscapeGraph - Interactive graph visualization using Cytoscape.js
 */

import { useEffect, useRef, useState } from 'react';
import { Graph, CytoscapeAdapter, LayoutType } from '@/lib/visualization';

interface CytoscapeGraphProps {
  graph: Graph;
  layout?: LayoutType;
  height?: string;
}

export function CytoscapeGraph({
  graph,
  layout = 'breadthfirst',
  height = '600px',
}: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(layout);

  useEffect(() => {
    // Dynamically import Cytoscape to avoid SSR issues
    const loadCytoscape = async () => {
      if (!containerRef.current) return;

      try {
        const cytoscape = (await import('cytoscape')).default;

        // Get Cytoscape config
        const config = CytoscapeAdapter.toElements(graph, {
          layout: currentLayout,
          theme: 'light', // TODO: Get from theme context
        });

        // Initialize Cytoscape
        cyRef.current = cytoscape({
          container: containerRef.current,
          elements: config.elements,
          style: config.style,
          layout: config.layout,
          minZoom: 0.3,
          maxZoom: 3,
          wheelSensitivity: 0.2,
        });

        // Add interaction handlers
        cyRef.current.on('tap', 'node', (evt: any) => {
          const node = evt.target;
          console.log('Node clicked:', node.data());
          // TODO: Show node details panel
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading Cytoscape:', error);
        setLoading(false);
      }
    };

    loadCytoscape();

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graph, currentLayout]);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setCurrentLayout(newLayout);
    if (cyRef.current) {
      cyRef.current.layout({
        name: newLayout,
        animate: true,
        animationDuration: 500,
      }).run();
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      const zoom = cyRef.current.zoom();
      cyRef.current.zoom(zoom * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const zoom = cyRef.current.zoom();
      cyRef.current.zoom(zoom * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={handleFit}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
          title="Fit to Screen"
        >
          ⊡
        </button>
      </div>

      {/* Layout Selector */}
      <div className="absolute top-4 right-4 z-10">
        <select
          value={currentLayout}
          onChange={(e) => handleLayoutChange(e.target.value as LayoutType)}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
        >
          <option value="breadthfirst">Hierarchical</option>
          <option value="dagre">Dagre</option>
          <option value="circle">Circle</option>
          <option value="grid">Grid</option>
          <option value="cose">Force</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400">
            Loading visualization...
          </div>
        </div>
      )}

      {/* Cytoscape Container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height }}
        className="bg-gray-50 dark:bg-gray-900"
      />
    </div>
  );
}
