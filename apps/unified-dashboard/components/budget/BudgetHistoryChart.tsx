/**
 * Budget History Chart Component
 * Displays budget spending history over time
 */

'use client';

import React, { useState } from 'react';

interface BudgetData {
  date: string;
  spent: number;
  limit: number;
}

export default function BudgetHistoryChart({ crewId }: { crewId: string }) {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('month');

  const getHistoryData = (): BudgetData[] => {
    if (timeframe === 'week') {
      return [
        { date: 'Mon', spent: 45, limit: 100 },
        { date: 'Tue', spent: 52, limit: 100 },
        { date: 'Wed', spent: 48, limit: 100 },
        { date: 'Thu', spent: 68, limit: 100 },
        { date: 'Fri', spent: 75, limit: 100 },
        { date: 'Sat', spent: 82, limit: 100 },
        { date: 'Sun', spent: 90, limit: 100 },
      ];
    } else {
      return [
        { date: 'Week 1', spent: 120, limit: 250 },
        { date: 'Week 2', spent: 145, limit: 250 },
        { date: 'Week 3', spent: 165, limit: 250 },
        { date: 'Week 4', spent: 195, limit: 250 },
      ];
    }
  };

  const data = getHistoryData();
  const maxLimit = Math.max(...data.map(d => d.limit));

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

      {/* Chart */}
      <div className="h-64 flex items-end gap-4 px-4">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-xs text-gray-500 w-12">
          <span>${maxLimit}</span>
          <span>${maxLimit / 2}</span>
          <span>$0</span>
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-end gap-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end">
                {/* Limit line */}
                <div
                  className="absolute w-full border-t border-dashed border-gray-300"
                  style={{ bottom: `${(item.limit / maxLimit) * 100}%` }}
                />
                {/* Spent bar */}
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                  style={{ height: `${(item.spent / maxLimit) * 100}%` }}
                  title={`${item.date}: $${item.spent} / $${item.limit}`}
                />
              </div>
              <span className="text-xs text-gray-600">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-t" />
          <span>Amount Spent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 border-t border-dashed border-gray-300" />
          <span>Budget Limit</span>
        </div>
      </div>
    </div>
  );
}
