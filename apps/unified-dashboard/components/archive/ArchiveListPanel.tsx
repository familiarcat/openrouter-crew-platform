/**
 * Archive List Panel Component
 * Displays list of archived memories
 */

'use client';

import React, { useState } from 'react';

interface ArchiveItem {
  id: string;
  memoryId: string;
  type: string;
  archivedDate: string;
  originalSize: number;
  compressedSize: number;
  confidence: number;
}

export default function ArchiveListPanel({ crewId }: { crewId: string }) {
  const [sortBy, setSortBy] = useState<'date' | 'size'>('date');
  const [filter, setFilter] = useState<'all' | 'compressed'>('all');

  const archives: ArchiveItem[] = [
    {
      id: 'arch_001',
      memoryId: 'mem_1234',
      type: 'insight',
      archivedDate: '2025-12-15',
      originalSize: 45,
      compressedSize: 18,
      confidence: 0.82,
    },
    {
      id: 'arch_002',
      memoryId: 'mem_5678',
      type: 'interaction',
      archivedDate: '2025-11-20',
      originalSize: 78,
      compressedSize: 28,
      confidence: 0.75,
    },
    {
      id: 'arch_003',
      memoryId: 'mem_9012',
      type: 'decision',
      archivedDate: '2025-10-05',
      originalSize: 156,
      compressedSize: 52,
      confidence: 0.89,
    },
  ];

  const sortedArchives = [...archives].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.archivedDate).getTime() - new Date(a.archivedDate).getTime();
    } else {
      return b.originalSize - a.originalSize;
    }
  });

  const displayedArchives = filter === 'compressed' ? sortedArchives.filter(a => a.compressedSize < a.originalSize) : sortedArchives;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="date">Archived Date</option>
            <option value="size">Original Size</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Archives</option>
            <option value="compressed">Compressed Only</option>
          </select>
        </div>
      </div>

      {/* Archive List */}
      <div className="space-y-3">
        {displayedArchives.map((archive) => (
          <div key={archive.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">{archive.memoryId}</p>
                <p className="text-xs text-gray-500">ID: {archive.id}</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {archive.type.charAt(0).toUpperCase() + archive.type.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">Archived Date</p>
                <p className="text-sm font-medium text-gray-900">{archive.archivedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="text-sm font-medium text-gray-900">{(archive.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            {/* Size Information */}
            <div className="bg-gray-50 rounded p-2 mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Original: {archive.originalSize} KB</span>
                <span>Compressed: {archive.compressedSize} KB</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(archive.compressedSize / archive.originalSize) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Saved {((1 - archive.compressedSize / archive.originalSize) * 100).toFixed(0)}%
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors">
                Restore
              </button>
              <button className="flex-1 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {displayedArchives.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No archived memories found</p>
        </div>
      )}
    </div>
  );
}
