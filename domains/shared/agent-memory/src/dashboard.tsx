'use client';

/**
 * Memory System Dashboard Component
 * Visualizes memory nodes, edges, and statistics
 */

import React, { useState, useEffect } from 'react';

interface MemoryNode {
  id: string;
  layer: number;
  summary: string;
  content: string;
  confidence_weight: number;
  activation_count: number;
  tags: string[];
  created_at: string;
}

interface MemoryEdge {
  id: string;
  source_id: string;
  target_id: string;
  weight: number;
  co_activation_count: number;
}

interface StatsData {
  projectId: string;
  nodes: number;
  edges: number;
  avgConfidence: number;
  avgEdgeWeight: number;
  byTier: Record<string, number>;
  maxConfidence: number;
  minConfidence: number;
}

const LAYER_NAMES: Record<number, string> = {
  1: 'Observation',
  2: 'Pattern',
  3: 'Strategy',
  4: 'Institutional'
};

const LAYER_COLORS: Record<number, string> = {
  1: 'bg-blue-100 border-blue-300',
  2: 'bg-purple-100 border-purple-300',
  3: 'bg-orange-100 border-orange-300',
  4: 'bg-red-100 border-red-300'
};

export interface MemoryDashboardProps {
  apiUrl?: string;
  projectId: string;
  autoRefresh?: number; // milliseconds, 0 = disabled
}

export function MemoryDashboard({
  apiUrl = 'http://localhost:3333',
  projectId,
  autoRefresh = 30000
}: MemoryDashboardProps) {
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [selectedEdges, setSelectedEdges] = useState<MemoryEdge[]>([]);
  const [filter, setFilter] = useState<{ layer?: number; minConfidence?: number }>({});
  const [testContext, setTestContext] = useState('');
  const [retrievalResult, setRetrievalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch memories
  useEffect(() => {
    fetchMemories();
    fetchStats();
  }, [filter]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMemories();
      fetchStats();
    }, autoRefresh);
    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(filter.layer && { layer: filter.layer.toString() }),
        ...(filter.minConfidence && { minConfidence: filter.minConfidence.toString() })
      });
      const response = await fetch(`${apiUrl}/api/memories/project/${projectId}?${params}`);
      const data = await response.json();
      setMemories(data.byLayer ? (Object.values(data.byLayer).flat() as any[]) : []);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/stats/project/${projectId}`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const showMemoryDetails = async (memoryId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/memories/${memoryId}`);
      const data = await response.json();
      setSelectedMemory(memoryId);
      setSelectedEdges([...((data.outgoing || []) as MemoryEdge[]), ...((data.incoming || []) as MemoryEdge[])]);
    } catch (err) {
      setError(String(err));
    }
  };

  const testRetrieval = async () => {
    if (!testContext) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/api/retrieve?projectId=${projectId}&context=${encodeURIComponent(testContext)}`
      );
      const data = await response.json();
      setRetrievalResult(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectedNode = memories.find(m => m.id === selectedMemory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧠 Memory Dashboard</h1>
          <p className="text-gray-600">Project: {projectId.slice(0, 8)}...</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">Total Memories</div>
              <div className="text-3xl font-bold text-gray-900">{stats.nodes}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">Total Edges</div>
              <div className="text-3xl font-bold text-gray-900">{stats.edges}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">Avg Confidence</div>
              <div className="text-3xl font-bold text-gray-900">{(stats.avgConfidence * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm font-medium">Avg Edge Weight</div>
              <div className="text-3xl font-bold text-gray-900">{(stats.avgEdgeWeight * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}

        {/* Layer Distribution */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4].map(layer => {
              const layerMemories = memories.filter(m => m.layer === layer);
              return (
                <div
                  key={layer}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    filter.layer === layer
                      ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg'
                      : 'shadow-sm hover:shadow-md'
                  } ${LAYER_COLORS[layer]}`}
                  onClick={() =>
                    setFilter(prev =>
                      prev.layer === layer ? { ...prev, layer: undefined } : { ...prev, layer }
                    )
                  }
                >
                  <div className="text-sm font-medium text-gray-700">Layer {layer}</div>
                  <div className="text-2xl font-bold text-gray-900">{layerMemories.length}</div>
                  <div className="text-xs text-gray-600 mt-1">{LAYER_NAMES[layer]}</div>
                </div>
              );
            })}
            <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50 cursor-pointer transition-all shadow-sm hover:shadow-md"
              onClick={() => setFilter({ ...filter, layer: undefined })}>
              <div className="text-sm font-medium text-gray-700">Total</div>
              <div className="text-2xl font-bold text-gray-900">{memories.length}</div>
              <div className="text-xs text-gray-600 mt-1">All layers</div>
            </div>
          </div>
        )}

        {/* Test Retrieval */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Test Retrieval</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={testContext}
              onChange={e => setTestContext(e.target.value)}
              placeholder="Enter a context to retrieve relevant memories..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={e => e.key === 'Enter' && testRetrieval()}
            />
            <button
              onClick={testRetrieval}
              disabled={!testContext || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {retrievalResult && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Found {retrievalResult.memories?.length || 0} relevant memories
              </h3>
              {retrievalResult.promptSection && (
                <pre className="bg-gray-50 p-3 rounded border border-gray-300 text-xs overflow-x-auto">
                  {retrievalResult.promptSection}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Memories List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Memories ({memories.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {memories.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No memories found</div>
                ) : (
                  memories.map(memory => (
                    <div
                      key={memory.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 border-l-4 ${
                        selectedMemory === memory.id
                          ? 'bg-blue-50 border-l-blue-500'
                          : `border-l-${memory.layer === 1 ? 'blue' : memory.layer === 2 ? 'purple' : memory.layer === 3 ? 'orange' : 'red'}-500`
                      }`}
                      onClick={() => showMemoryDetails(memory.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                            LAYER_COLORS[memory.layer]
                          }`}>
                            Layer {memory.layer} - {LAYER_NAMES[memory.layer]}
                          </span>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {memory.summary || memory.content.slice(0, 80)}
                          </p>
                          <div className="flex gap-2 mt-2 text-xs text-gray-600">
                            <span>Confidence: {(memory.confidence_weight * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>Activations: {memory.activation_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {selectedNode ? 'Memory Details' : 'Select a Memory'}
                </h3>
              </div>
              {selectedNode ? (
                <div className="p-6 text-sm">
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">ID</div>
                    <div className="text-gray-900 font-mono text-xs break-all">{selectedNode.id}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">Layer</div>
                    <div className="text-gray-900">
                      {selectedNode.layer} ({LAYER_NAMES[selectedNode.layer]})
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">Confidence</div>
                    <div className="text-gray-900">{(selectedNode.confidence_weight * 100).toFixed(1)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.confidence_weight * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">Activations</div>
                    <div className="text-gray-900">{selectedNode.activation_count}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags?.length ? (
                        selectedNode.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">None</span>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">Summary</div>
                    <p className="text-gray-900 text-xs line-clamp-3">
                      {selectedNode.summary || 'No summary'}
                    </p>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 font-medium uppercase mb-1">Created</div>
                    <div className="text-gray-900 text-xs">
                      {new Date(selectedNode.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedEdges.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 font-medium uppercase mb-2">
                        Connected ({selectedEdges.length})
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {selectedEdges.slice(0, 5).map(edge => (
                          <div key={edge.id} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="text-gray-600">
                              Weight: {(edge.weight * 100).toFixed(0)}%
                            </div>
                            <div className="text-gray-500">
                              Co-activations: {edge.co_activation_count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Click on a memory to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
