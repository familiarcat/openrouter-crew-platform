/**
 * Analytics Recommendations Panel Component
 * Displays recommended actions based on analytics
 */

'use client';

import React from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  icon: string;
}

export default function AnalyticsRecommendationsPanel({ crewId }: { crewId: string }) {
  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Archive Old Memories',
      description: 'You have 250+ memories over 6 months old that could be archived to improve performance',
      impact: 'high',
      action: 'Archive',
      icon: '📦',
    },
    {
      id: '2',
      title: 'Increase Cache TTL',
      description: 'High-frequency topics would benefit from longer caching periods',
      impact: 'medium',
      action: 'Update',
      icon: '⚡',
    },
    {
      id: '3',
      title: 'Optimize Embeddings',
      description: 'Some topic clusters are redundant and could be consolidated',
      impact: 'medium',
      action: 'Optimize',
      icon: '🔗',
    },
    {
      id: '4',
      title: 'Review Low-Confidence Memories',
      description: '45 memories have confidence scores below 0.6 and may need review',
      impact: 'low',
      action: 'Review',
      icon: '🔍',
    },
  ];

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'bg-red-50 border-l-4 border-red-500 text-red-900';
    if (impact === 'medium') return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900';
    return 'bg-blue-50 border-l-4 border-blue-500 text-blue-900';
  };

  const getActionColor = (impact: string) => {
    if (impact === 'high') return 'bg-red-500 hover:bg-red-600 text-white';
    if (impact === 'medium') return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    return 'bg-blue-500 hover:bg-blue-600 text-white';
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div key={rec.id} className={`p-4 rounded-lg ${getImpactColor(rec.impact)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{rec.icon}</span>
              <div>
                <h3 className="font-semibold">{rec.title}</h3>
                <p className="text-sm opacity-90 mt-1">{rec.description}</p>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded font-medium transition-colors whitespace-nowrap ml-4 ${getActionColor(
                rec.impact,
              )}`}
            >
              {rec.action}
            </button>
          </div>

          {/* Impact Badge */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-semibold uppercase">
              {rec.impact === 'high' ? '🔴 High' : rec.impact === 'medium' ? '🟡 Medium' : '🔵 Low'} Impact
            </span>
          </div>
        </div>
      ))}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 font-medium">High Priority</p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {recommendations.filter(r => r.impact === 'high').length}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">Medium Priority</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">
            {recommendations.filter(r => r.impact === 'medium').length}
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Low Priority</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {recommendations.filter(r => r.impact === 'low').length}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
          Apply All Recommendations
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
          Dismiss
        </button>
      </div>
    </div>
  );
}
