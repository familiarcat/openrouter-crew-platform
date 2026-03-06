// File: apps/unified-dashboard/components/projects/ProjectHeader.tsx

'use client'

import React from 'react'
import type { Tables } from '@openrouter-crew/shared-schemas'

interface ProjectHeaderProps {
  project: Tables<'projects'>
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500',
  archived: 'bg-gray-600',
}

const domainColors: Record<string, string> = {
  'dj-booking': 'bg-purple-600',
  'product-factory': 'bg-blue-600',
  'ai-assistant': 'bg-cyan-600',
  'custom': 'bg-indigo-600',
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const statusColor = statusColors[project.status] || 'bg-gray-500'
  const domainColor = domainColors[project.type] || 'bg-indigo-600'

  const budgetPercentage = project.budget_usd
    ? (project.total_cost_usd / project.budget_usd) * 100
    : 0

  const budgetColor = budgetPercentage > 90 ? 'bg-red-500' : budgetPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-6">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-400 mt-2">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Domain Badge */}
          <div className={`${domainColor} rounded-full px-3 py-1 text-xs font-semibold text-white`}>
            {project.type.replace(/-/g, ' ')}
          </div>

          {/* Status Badge */}
          <div className={`${statusColor} rounded-full px-3 py-1 text-xs font-semibold text-white`}>
            {project.status}
          </div>
        </div>
      </div>

      {/* Budget Bar */}
      {project.budget_usd && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Budget Used</span>
            <span className="text-white font-semibold">
              ${project.total_cost_usd.toFixed(2)} / ${project.budget_usd.toFixed(2)}
            </span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`${budgetColor} h-full transition-all duration-300 rounded-full`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>

          <div className="text-right text-xs text-gray-500">
            {budgetPercentage.toFixed(1)}% utilized
          </div>
        </div>
      )}
    </div>
  )
}
