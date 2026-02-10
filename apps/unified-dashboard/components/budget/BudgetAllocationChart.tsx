/**
 * Budget Allocation Chart Component
 * Displays budget allocation with donut chart visualization
 */

'use client';

import React from 'react';

interface BudgetData {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export default function BudgetAllocationChart({ budget }: { budget: BudgetData }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (budget.percentUsed / 100) * circumference;

  const getColor = () => {
    if (budget.percentUsed >= 90) return '#ef4444';
    if (budget.percentUsed >= 75) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="flex gap-8 items-center justify-center py-8">
      {/* Donut Chart */}
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-gray-900">{budget.percentUsed.toFixed(0)}%</p>
          <p className="text-xs text-gray-500">Used</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">${budget.limit.toFixed(2)}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Spent</span>
            <span className="font-semibold">${budget.spent.toFixed(2)}</span>
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Remaining</span>
            <span className="font-semibold text-green-600">${budget.remaining.toFixed(2)}</span>
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.max(100 - budget.percentUsed, 0)}%` }}
            />
          </div>
        </div>

        {budget.percentUsed >= 75 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">⚠️ Budget usage is high. Consider optimizing costs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
