/**
 * Analytics Dashboard Page
 * Displays memory analytics, insights, and recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import AnalyticsInsightsPanel from '@/components/analytics/AnalyticsInsightsPanel';
import AnalyticsTopicsChart from '@/components/analytics/AnalyticsTopicsChart';
import AnalyticsRecommendationsPanel from '@/components/analytics/AnalyticsRecommendationsPanel';
import { MemoryAnalyticsService } from '@openrouter-crew/crew-api-client';

interface AnalyticsData {
  crewId: string;
  totalMemories: number;
  averageConfidence: number;
  retentionRate: number;
  accessPatterns: number;
  topTopics: string[];
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'topics' | 'recommendations'>('insights');

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const analyticsService = new MemoryAnalyticsService();

        // Record some access patterns
        analyticsService.recordAccess('mem_1');
        analyticsService.recordAccess('mem_2');
        analyticsService.recordAccess('mem_1');

        setAnalyticsData({
          crewId: 'crew_1',
          totalMemories: 1250,
          averageConfidence: 0.82,
          retentionRate: 0.94,
          accessPatterns: 3,
          topTopics: ['Performance Optimization', 'API Design', 'Database Queries', 'Cache Strategy'],
        });
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  if (loading || !analyticsData) {
    return <div className="p-8 text-gray-500">Loading analytics data...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Memory insights and recommendations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Memories</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalMemories}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Avg. Confidence</p>
            <p className="text-2xl font-bold text-blue-600">{(analyticsData.averageConfidence * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Retention Rate</p>
            <p className="text-2xl font-bold text-green-600">{(analyticsData.retentionRate * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Top Topics</p>
            <p className="text-2xl font-bold text-purple-600">{analyticsData.topTopics.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'insights'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'topics'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Topics
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recommendations
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Memory Insights</h2>
              <AnalyticsInsightsPanel analytics={analyticsData} />
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Topic Trends</h2>
              <AnalyticsTopicsChart topics={analyticsData.topTopics} />
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Recommendations</h2>
              <AnalyticsRecommendationsPanel crewId={analyticsData.crewId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
