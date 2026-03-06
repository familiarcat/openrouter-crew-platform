// File: apps/unified-dashboard/components/crew/CrewAssignments.tsx

'use client'

import React from 'react'

interface CrewWorkload {
  crewMemberId: string
  name: string
  role: string
  currentWorkload: number // 0-100
  assignedStories: number
  capacityHours: number
}

interface CrewAssignmentsProps {
  assignments: CrewWorkload[]
}

const getCapacityColor = (workload: number): string => {
  if (workload > 100) return 'bg-red-500'
  if (workload > 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getCapacityTextColor = (workload: number): string => {
  if (workload > 100) return 'text-red-400'
  if (workload > 80) return 'text-yellow-400'
  return 'text-green-400'
}

export function CrewAssignments({ assignments }: CrewAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-center">
        <p className="text-gray-400">No crew assignments yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 space-y-4">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white">Crew Assignments</h3>

      {/* Crew Cards */}
      <div className="space-y-4">
        {assignments.map((crew) => (
          <div
            key={crew.crewMemberId}
            className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-3"
          >
            {/* Crew Info */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-white">{crew.name}</h4>
                <p className="text-xs text-gray-400">{crew.role}</p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${getCapacityTextColor(crew.currentWorkload)}`}>
                  {crew.currentWorkload}%
                </div>
                <div className="text-xs text-gray-500">capacity</div>
              </div>
            </div>

            {/* Workload Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`${getCapacityColor(crew.currentWorkload)} h-full transition-all duration-300`}
                  style={{ width: `${Math.min(crew.currentWorkload, 100)}%` }}
                />
              </div>
            </div>

            {/* Assignment Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div>
                <span className="text-gray-500">Assigned Stories:</span>{' '}
                <span className="text-white font-semibold">{crew.assignedStories}</span>
              </div>
              <div>
                <span className="text-gray-500">Capacity:</span>{' '}
                <span className="text-white font-semibold">{crew.capacityHours}h</span>
              </div>
            </div>

            {/* Status */}
            {crew.currentWorkload > 100 && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span> Overallocated
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
