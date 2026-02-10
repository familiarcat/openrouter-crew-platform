/**
 * Archive Stats Panel Component
 * Displays archive statistics and metrics
 */

'use client';

import React from 'react';

interface ArchiveStats {
  totalArchived: number;
  totalSize: string;
  compressionRatio: number;
  averageAge: number;
  oldestArchive: string;
  newestArchive: string;
}

export default function ArchiveStatsPanel({ stats }: { stats: ArchiveStats }) {
  const spaceSaved = stats.totalSize;
  const compressionPercent = ((1 - stats.compressionRatio) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Archived */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📦</span>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Memories Archived</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalArchived}</p>
            </div>
          </div>
        </div>

        {/* Storage Saved */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💾</span>
            <div>
              <p className="text-xs text-green-600 font-medium">Total Storage</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalSize}</p>
            </div>
          </div>
        </div>

        {/* Compression Ratio */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-xs text-purple-600 font-medium">Compression Ratio</p>
              <p className="text-2xl font-bold text-purple-900">{(stats.compressionRatio * 100).toFixed(0)}%</p>
            </div>
          </div>
          <p className="text-xs text-purple-700 mt-2">{compressionPercent}% space savings</p>
        </div>

        {/* Average Age */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📅</span>
            <div>
              <p className="text-xs text-orange-600 font-medium">Average Archive Age</p>
              <p className="text-2xl font-bold text-orange-900">{stats.averageAge} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Information */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Archive Timeline</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Oldest Archive</p>
            <p className="text-base font-semibold text-gray-900">{stats.oldestArchive}</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor((new Date().getTime() - new Date(stats.oldestArchive).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-400 to-blue-400" style={{ width: '85%' }} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Newest Archive</p>
            <p className="text-base font-semibold text-gray-900">{stats.newestArchive}</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.floor((new Date().getTime() - new Date(stats.newestArchive).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
        </div>
      </div>

      {/* Archive Distribution Chart */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Archive Distribution by Type</h3>
        <div className="space-y-2">
          {['Insights', 'Interactions', 'Decisions', 'Other'].map((type, idx) => {
            const percentages = [45, 30, 20, 5];
            return (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-medium text-gray-900">{percentages[idx]}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : idx === 2 ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${percentages[idx]}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">📊 Summary</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ {stats.totalArchived} memories successfully archived</li>
          <li>✓ {compressionPercent}% of storage space saved through compression</li>
          <li>✓ Average archive age: {stats.averageAge} days</li>
          <li>→ Consider deleting archives older than 2 years</li>
        </ul>
      </div>
    </div>
  );
}
