/**
 * Analytics Topics Chart Component
 * Displays trending topics over time
 */

'use client';

import React, { useState } from 'react';

interface Props {
  topics: string[];
}

interface TopicData {
  name: string;
  frequency: number;
  trend: number;
  lastAccess: string;
}

export default function AnalyticsTopicsChart({ topics }: Props) {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('month');

  // Mock data for demonstration
  const getTopicData = (): TopicData[] => {
    return topics.map((topic, idx) => ({
      name: topic,
      frequency: Math.floor(Math.random() * 100) + 50,
      trend: Math.random() > 0.5 ? 5 : -3,
      lastAccess: `${Math.floor(Math.random() * 24)} hours ago`,
    }));
  };

  const topicData = getTopicData();
  const maxFrequency = Math.max(...topicData.map(t => t.frequency));

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(['week', 'month'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {topicData.map((topic, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{topic.name}</h4>
                <p className="text-xs text-gray-500">Last accessed: {topic.lastAccess}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{topic.frequency}</p>
                <p className={`text-sm ${topic.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {topic.trend > 0 ? '↑' : '↓'} {Math.abs(topic.trend)}%
                </p>
              </div>
            </div>

            {/* Frequency Bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                style={{ width: `${(topic.frequency / maxFrequency) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2">🎯 Topic Insights</h4>
        <ul className="space-y-1 text-sm text-purple-800">
          <li>• Most accessed topic: {topicData[0]?.name}</li>
          <li>• Total unique topics: {topicData.length}</li>
          <li>• Trending up: {topicData.filter(t => t.trend > 0).length} topics</li>
          <li>→ Focus content improvements on high-frequency topics</li>
        </ul>
      </div>
    </div>
  );
}
