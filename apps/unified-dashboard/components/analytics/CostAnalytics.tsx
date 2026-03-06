// File: apps/unified-dashboard/components/analytics/CostAnalytics.tsx

'use client'

import React from 'react'

interface CostData {
  budget: number
  spent: number
  remaining: number
}

interface CostAnalyticsProps {
  data: CostData
  budget: number
}

export function CostAnalytics({ data, budget }: CostAnalyticsProps) {
  const utilization = budget > 0 ? (data.spent / budget) * 100 : 0
  const remainingPercentage = budget > 0 ? ((data.remaining / budget) * 100) : 0

  const getUtilizationColor = () => {
    if (utilization > 90) return 'text-red-400'
    if (utilization > 70) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getBarColor = () => {
    if (utilization > 90) return 'bg-red-500'
    if (utilization > 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Cost Analytics</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-2">Allocated Budget</div>
          <div className="text-xl font-bold text-white">${budget.toFixed(2)}</div>
        </div>

        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-2">Spent</div>
          <div className="text-xl font-bold text-white">${data.spent.toFixed(2)}</div>
        </div>

        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-xs text-gray-400 mb-2">Remaining</div>
          <div className={`text-xl font-bold ${remainingPercentage < 10 ? 'text-red-400' : 'text-green-400'}`}>
            ${data.remaining.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Budget Utilization Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Budget Utilization</span>
          <span className={`text-sm font-semibold ${getUtilizationColor()}`}>
            {utilization.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className={`${getBarColor()} h-full transition-all duration-300 rounded-full`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Indicator */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {utilization > 90
              ? 'Budget critically low'
              : utilization > 70
              ? 'Approaching budget limit'
              : 'Budget healthy'}
          </span>
        </div>
      </div>
    </div>
  )
}
