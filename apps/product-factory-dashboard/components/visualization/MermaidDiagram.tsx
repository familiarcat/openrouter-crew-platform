'use client';

/**
 * MermaidDiagram - Static diagram visualization using Mermaid.js
 */

import { useEffect, useRef, useState } from 'react';
import { Graph } from '@/lib/visualization';

interface MermaidDiagramProps {
  graph: Graph;
}

export function MermaidDiagram({ graph }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamically import Mermaid
        const mermaid = (await import('mermaid')).default;

        // Initialize Mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, sans-serif',
        });

        // Generate Mermaid syntax
        const mermaidSyntax = graph.toMermaidDiagram();

        // Render
        const { svg } = await mermaid.render(
          `mermaid-${graph.id}`,
          mermaidSyntax
        );

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    renderDiagram();
  }, [graph]);

  const handleCopyMermaid = () => {
    const mermaidSyntax = graph.toMermaidDiagram();
    navigator.clipboard.writeText(mermaidSyntax);
    alert('Mermaid syntax copied to clipboard!');
  };

  const handleDownloadSVG = () => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${graph.id}-architecture.svg`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleCopyMermaid}
          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Copy Mermaid
        </button>
        <button
          onClick={handleDownloadSVG}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Download SVG
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-gray-500 dark:text-gray-400">
            Rendering diagram...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-red-500">
            Error rendering diagram: {error}
          </div>
        </div>
      )}

      {/* Diagram Container */}
      <div
        ref={containerRef}
        className="p-8 overflow-auto"
        style={{
          minHeight: '600px',
          display: loading || error ? 'none' : 'block',
        }}
      />
    </div>
  );
}
