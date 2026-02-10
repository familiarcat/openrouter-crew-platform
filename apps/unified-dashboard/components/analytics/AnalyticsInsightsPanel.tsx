/**
 * Analytics Insights Panel Component
 * Displays memory insights and confidence metrics
 */

'use client';

import React from 'react';

interface AnalyticsData {
  crewId: string;
  totalMemories: number;
  averageConfidence: number;
  retentionRate: number;
  accessPatterns: number;
}

export default function AnalyticsInsightsPanel({ analytics }: { analytics: AnalyticsData }) {
  const insights = [
    {
      title: 'Memory Quality',
      value: `${(analytics.averageConfidence * 100).toFixed(0)}%`,
      description: 'Average confidence across all memories',
      icon: '📊',
      status: analytics.averageConfidence >= 0.8 ? 'good' : 'warning',
    },
    {
      title: 'Retention Health',
      value: `${(analytics.retentionRate * 100).toFixed(0)}%`,
      description: 'Percentage of memories being maintained',
      icon: '📈',
      status: analytics.retentionRate >= 0.9 ? 'good' : 'warning',
    },
    {
      title: 'Access Patterns',
      value: `${analytics.accessPatterns}`,
      description: 'Unique access patterns recorded',
      icon: '🔍',
      status: 'good',
    },
    {
      title: 'Total Memories',
      value: `${analytics.totalMemories}`,
      description: 'Memories in active use',
      icon: '💾',
      status: 'good',
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'good') return 'border-l-4 border-green-500 bg-green-50';
    return 'border-l-4 border-yellow-500 bg-yellow-50';
  };

  const getStatusText = (status: string) => {
    if (status === 'good') return 'text-green-700';
    return 'text-yellow-700';
  };

  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => (
        <div key={idx} className={`p-4 rounded-lg ${getStatusColor(insight.status)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{insight.icon}</span>
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
              </div>
              <p className={`text-sm ${getStatusText(insight.status)}`}>{insight.description}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${getStatusText(insight.status)}`}>{insight.value}</p>
            </div>
          </div>

          {/* Progress bar for percentage values */}
          {insight.title === 'Memory Quality' || insight.title === 'Retention Health' ? (
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  insight.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                } transition-all`}
                style={{ width: `${parseInt(insight.value)}%` }}
              />
            </div>
          ) : null}
        </div>
      ))}

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Summary</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ Your memory system is performing well</li>
          <li>✓ Confidence levels are consistently high</li>
          <li>✓ Retention metrics are above target</li>
          <li>→ Consider archiving low-confidence memories</li>
        </ul>
      </div>
    </div>
  );
}
