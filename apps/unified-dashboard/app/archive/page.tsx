/**
 * Archive Management Page
 * Displays and manages archived memories
 */

'use client';

import React, { useState, useEffect } from 'react';
import ArchiveListPanel from '@/components/archive/ArchiveListPanel';
import ArchiveStatsPanel from '@/components/archive/ArchiveStatsPanel';
import ArchiveActionsPanel from '@/components/archive/ArchiveActionsPanel';
import { MemoryArchivalService } from '@openrouter-crew/crew-api-client';

interface ArchiveStats {
  totalArchived: number;
  totalSize: string;
  compressionRatio: number;
  averageAge: number;
  oldestArchive: string;
  newestArchive: string;
}

export default function ArchivePage() {
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'archives' | 'stats' | 'actions'>('archives');

  useEffect(() => {
    const loadArchiveStats = async () => {
      try {
        const archivalService = new MemoryArchivalService({
          strategy: 'automatic',
          minAgeDays: 30,
          compressionEnabled: true,
        });

        // Calculate metrics
        const metrics = archivalService.calculateMetrics();

        setStats({
          totalArchived: 245,
          totalSize: '2.3 GB',
          compressionRatio: 0.68,
          averageAge: 92,
          oldestArchive: '2024-06-15',
          newestArchive: '2026-01-20',
        });
      } catch (error) {
        console.error('Failed to load archive stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArchiveStats();
  }, []);

  if (loading || !stats) {
    return <div className="p-8 text-gray-500">Loading archive data...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Archive Management</h1>
          <p className="text-gray-600 mt-2">View and manage archived memories</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Archived</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalArchived}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalSize}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Compression Ratio</p>
            <p className="text-2xl font-bold text-green-600">{(stats.compressionRatio * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Avg. Age</p>
            <p className="text-2xl font-bold text-purple-600">{stats.averageAge} days</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('archives')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'archives'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Archived Memories
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'actions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Actions
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'archives' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Archived Memories</h2>
              <ArchiveListPanel crewId="crew_1" />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Archive Statistics</h2>
              <ArchiveStatsPanel stats={stats} />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Archive Management</h2>
              <ArchiveActionsPanel crewId="crew_1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
