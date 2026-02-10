/**
 * Budget Gauge Component
 * Displays budget status with visual gauge
 */

import React, { useEffect, useState } from 'react';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

interface BudgetGaugeProps {
  crewId: string;
}

export default function BudgetGauge({ crewId }: BudgetGaugeProps) {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const costService = new CostOptimizationService();
        // Set a default budget for demo
        costService.setBudget(crewId, 100, 'monthly');
        const b = costService.getBudget(crewId);
        setBudget(b);
      } catch (error) {
        console.error('Failed to load budget:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [crewId]);

  if (loading || !budget) {
    return <div className="text-gray-500">Loading budget...</div>;
  }

  const percentUsed = budget.percentUsed;
  const getGaugeColor = (): string => {
    if (percentUsed >= 90) return 'from-red-500 to-red-600';
    if (percentUsed >= 80) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const getStatusText = (): string => {
    if (budget.alertThresholdReached) return '⚠️ Alert threshold reached';
    if (percentUsed >= 90) return '🔴 Critical';
    if (percentUsed >= 80) return '🟡 Warning';
    return '🟢 Healthy';
  };

  return (
    <div className="space-y-6">
      {/* Gauge Visualization */}
      <div className="relative h-40 flex items-center justify-center">
        <svg className="w-full h-full max-w-xs" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={percentUsed >= 90 ? '#ef4444' : percentUsed >= 80 ? '#eab308' : '#22c55e'} />
              <stop offset="100%" stopColor={percentUsed >= 90 ? '#dc2626' : percentUsed >= 80 ? '#ca8a04' : '#16a34a'} />
            </linearGradient>
          </defs>
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${(percentUsed / 100) * 219.8} 219.8`}
          />

          {/* Center text */}
          <text x="100" y="70" textAnchor="middle" className="text-2xl font-bold" fill="#1f2937">
            {percentUsed.toFixed(1)}%
          </text>
          <text x="100" y="95" textAnchor="middle" className="text-sm" fill="#6b7280">
            of budget used
          </text>
        </svg>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-lg font-semibold mb-1">{getStatusText()}</p>
        <p className="text-sm text-gray-600">Period: {budget.period}</p>
      </div>

      {/* Budget Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Limit</span>
          <span className="font-semibold">${budget.limit.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Spent</span>
          <span className={`font-semibold ${percentUsed >= 80 ? 'text-red-600' : ''}`}>
            ${budget.spent.toFixed(2)}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Remaining</span>
          <span className="text-lg font-bold text-green-600">${budget.remaining.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">
          Increase Budget
        </button>
        <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium">
          View History
        </button>
      </div>

      {/* Alert Message */}
      {budget.alertThresholdReached && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Budget Alert:</strong> You've used {percentUsed.toFixed(1)}% of your budget. Consider increasing your limit or optimizing costs.
          </p>
        </div>
      )}
    </div>
  );
}
