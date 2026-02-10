/**
 * Cost Trend Chart Component
 * Displays cost trends over time
 */

'use client';

import React, { useState } from 'react';

export default function CostTrendChart() {
  // Mock data - in production would fetch from API
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const getTrendData = () => {
    if (timeframe === 'week') {
      return [
        { date: 'Mon', cost: 12.5 },
        { date: 'Tue', cost: 14.2 },
        { date: 'Wed', cost: 11.8 },
        { date: 'Thu', cost: 15.3 },
        { date: 'Fri', cost: 13.7 },
        { date: 'Sat', cost: 9.2 },
        { date: 'Sun', cost: 8.5 },
      ];
    } else if (timeframe === 'month') {
      return [
        { date: 'Week 1', cost: 45.0 },
        { date: 'Week 2', cost: 42.5 },
        { date: 'Week 3', cost: 39.8 },
        { date: 'Week 4', cost: 36.2 },
      ];
    } else {
      return [
        { date: 'Month 1', cost: 150 },
        { date: 'Month 2', cost: 140 },
        { date: 'Month 3', cost: 125 },
      ];
    }
  };

  const data = getTrendData();
  const maxCost = Math.max(...data.map(d => d.cost));
  const minCost = Math.min(...data.map(d => d.cost));
  const avgCost = data.reduce((sum, d) => sum + d.cost, 0) / data.length;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-6">
        {(['week', 'month', 'quarter'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 flex flex-col justify-end gap-2">
        {/* Y-axis Labels */}
        <div className="flex items-end gap-4 h-64">
          {/* Y-axis */}
          <div className="flex flex-col justify-between text-xs text-gray-500 w-12">
            <span>${maxCost.toFixed(0)}</span>
            <span>${(maxCost / 2).toFixed(0)}</span>
            <span>$0</span>
          </div>

          {/* Bars */}
          <div className="flex-1 flex items-end gap-3 pb-0">
            {data.map((item, idx) => {
              const height = (item.cost / maxCost) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${item.date}: $${item.cost.toFixed(2)}`}
                  ></div>
                  <span className="text-xs text-gray-600 mt-1">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div>
          <p className="text-xs text-gray-500">Average</p>
          <p className="font-bold text-lg">${avgCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Peak</p>
          <p className="font-bold text-lg">${maxCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Lowest</p>
          <p className="font-bold text-lg">${minCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 p-3 bg-green-50 rounded flex items-center gap-2 text-sm">
        <span className="text-green-600">📉</span>
        <span className="text-green-700">
          Costs declining by {(((data[0].cost - data[data.length - 1].cost) / data[0].cost) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
