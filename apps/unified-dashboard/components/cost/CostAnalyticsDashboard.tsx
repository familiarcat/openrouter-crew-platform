/**
 * Cost Analytics Dashboard Component
 * Displays overview of cost metrics and optimization status
 */

import React from 'react';

interface CostMetrics {
  totalCost: number;
  averageCostPerMemory: number;
  cacheHitRate: number;
  batchSavings: number;
  totalSavingsByCompression: number;
  costReductionRatio: number;
  recommendedActions: string[];
}

interface CostBreakdown {
  embedding: number;
  compression: number;
  clustering: number;
  storage: number;
  total: number;
}

interface CostAnalyticsDashboardProps {
  metrics: CostMetrics | null;
  breakdown: CostBreakdown | null;
}

export default function CostAnalyticsDashboard({
  metrics,
  breakdown,
}: CostAnalyticsDashboardProps) {
  if (!metrics || !breakdown) {
    return <div className="text-gray-500">Loading metrics...</div>;
  }

  const getMetricColor = (value: number, threshold = 0.5): string => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Cost Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Total Cost</h3>
          <span className="text-2xl">💰</span>
        </div>
        <p className="text-3xl font-bold text-blue-900">{formatCurrency(metrics.totalCost)}</p>
        <p className="text-sm text-gray-600 mt-2">Per memory: {formatCurrency(metrics.averageCostPerMemory)}</p>
      </div>

      {/* Cache Hit Rate Card */}
      <div className={`bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Cache Hit Rate</h3>
          <span className="text-2xl">⚡</span>
        </div>
        <p className={`text-3xl font-bold ${getMetricColor(metrics.cacheHitRate)}`}>
          {formatPercent(metrics.cacheHitRate)}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Target: 60%+ for optimal performance
        </p>
      </div>

      {/* Cost Reduction Card */}
      <div className={`bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Cost Reduction</h3>
          <span className="text-2xl">📉</span>
        </div>
        <p className={`text-3xl font-bold ${getMetricColor(metrics.costReductionRatio)}`}>
          {formatPercent(metrics.costReductionRatio)}
        </p>
        <p className="text-sm text-gray-600 mt-2">Optimization effectiveness</p>
      </div>

      {/* Batch Savings Card */}
      <div className={`bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-700">Batch Savings</h3>
          <span className="text-2xl">📦</span>
        </div>
        <p className="text-3xl font-bold text-yellow-900">{formatCurrency(metrics.batchSavings)}</p>
        <p className="text-sm text-gray-600 mt-2">From API batching</p>
      </div>

      {/* Cost by Type */}
      <div className="md:col-span-2 lg:col-span-4 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Cost Breakdown by Operation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Embedding</p>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(breakdown.embedding)}</p>
            <div className="mt-2 bg-blue-200 rounded-full h-2 w-full overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{
                  width: `${(breakdown.embedding / breakdown.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Compression</p>
            <p className="text-lg font-bold text-purple-900">{formatCurrency(breakdown.compression)}</p>
            <div className="mt-2 bg-purple-200 rounded-full h-2 w-full overflow-hidden">
              <div
                className="bg-purple-500 h-full"
                style={{
                  width: `${(breakdown.compression / breakdown.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Clustering</p>
            <p className="text-lg font-bold text-orange-900">{formatCurrency(breakdown.clustering)}</p>
            <div className="mt-2 bg-orange-200 rounded-full h-2 w-full overflow-hidden">
              <div
                className="bg-orange-500 h-full"
                style={{
                  width: `${(breakdown.clustering / breakdown.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded">
            <p className="text-xs text-gray-600 mb-1">Storage</p>
            <p className="text-lg font-bold text-green-900">{formatCurrency(breakdown.storage)}</p>
            <div className="mt-2 bg-green-200 rounded-full h-2 w-full overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{
                  width: `${(breakdown.storage / breakdown.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Compression Savings Card */}
      <div className="md:col-span-2 lg:col-span-4 bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-2">💾 Compression & Storage Savings</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total savings from compression</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {formatCurrency(metrics.totalSavingsByCompression)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Estimated storage reduction</p>
            <p className="text-2xl font-bold text-green-900 mt-1">60-80%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
