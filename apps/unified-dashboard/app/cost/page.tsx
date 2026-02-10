/**
 * Cost Analytics Dashboard Page
 * Display comprehensive cost analysis and optimization metrics
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';
import CostAnalyticsDashboard from '@/components/cost/CostAnalyticsDashboard';
import CostTrendChart from '@/components/cost/CostTrendChart';
import CostBreakdownChart from '@/components/cost/CostBreakdownChart';
import BudgetGauge from '@/components/cost/BudgetGauge';

export default function CostPage() {
  const [crewId, setCrewId] = useState<string>('crew_1'); // Would come from auth context
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const costService = new CostOptimizationService();

        // Get optimization metrics
        const optimMetrics = costService.getOptimizationMetrics();
        setMetrics(optimMetrics);

        // Get cost breakdown
        const costBreakdown = costService.getCostBreakdown();
        setBreakdown(costBreakdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cost metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();

    // Refresh metrics every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [crewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading cost analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">💰 Cost Analytics</h1>
        <p className="text-gray-600">Monitor and optimize your memory system costs</p>
      </div>

      {/* Main Dashboard */}
      <CostAnalyticsDashboard metrics={metrics} breakdown={breakdown} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📈 Cost Trend</h2>
          <CostTrendChart />
        </div>

        {/* Cost Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📊 Cost Breakdown</h2>
          <CostBreakdownChart breakdown={breakdown} />
        </div>
      </div>

      {/* Budget Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Budget Gauge */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">💳 Budget Status</h2>
          <BudgetGauge crewId={crewId} />
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">💡 Recommendations</h2>
          <ul className="space-y-3">
            {metrics?.recommendedActions?.map((action: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-yellow-500 mt-1">→</span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-4">📊 Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Cost</p>
            <p className="text-2xl font-bold text-blue-900">${metrics?.totalCost?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-gray-600">Cache Hit Rate</p>
            <p className="text-2xl font-bold text-blue-900">{((metrics?.cacheHitRate || 0) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Cost Reduction</p>
            <p className="text-2xl font-bold text-blue-900">{((metrics?.costReductionRatio || 0) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Batch Savings</p>
            <p className="text-2xl font-bold text-blue-900">${metrics?.batchSavings?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex gap-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          📥 Export CSV
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
          🔄 Refresh Now
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
          ⚙️ Settings
        </button>
      </div>
    </div>
  );
}
