/**
 * Archive Actions Panel Component
 * Manage archive operations
 */

'use client';

import React, { useState } from 'react';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: string;
  dangerous?: boolean;
}

export default function ArchiveActionsPanel({ crewId }: { crewId: string }) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const actions: ActionItem[] = [
    {
      id: '1',
      title: 'Archive Old Memories',
      description: 'Automatically archive memories older than the configured threshold',
      action: 'Start',
      icon: '📦',
    },
    {
      id: '2',
      title: 'Compress Archives',
      description: 'Re-compress all archived memories to optimize storage',
      action: 'Compress',
      icon: '⚡',
    },
    {
      id: '3',
      title: 'Delete Old Archives',
      description: 'Permanently delete archives older than 2 years',
      action: 'Delete',
      icon: '🗑️',
      dangerous: true,
    },
    {
      id: '4',
      title: 'Export Archives',
      description: 'Export all archived memories to a file for backup',
      action: 'Export',
      icon: '📥',
    },
    {
      id: '5',
      title: 'Restore Batch',
      description: 'Restore multiple archived memories at once',
      action: 'Restore',
      icon: '↩️',
    },
    {
      id: '6',
      title: 'Archive Analytics',
      description: 'Generate detailed archive usage report',
      action: 'Generate',
      icon: '📊',
    },
  ];

  const handleAction = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action?.dangerous) {
      setShowConfirm(actionId);
    } else {
      executeAction(actionId);
    }
  };

  const executeAction = (actionId: string) => {
    setShowConfirm(null);
    // Action would be executed here
  };

  return (
    <div className="space-y-4">
      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`p-4 rounded-lg border transition-all ${
              action.dangerous
                ? 'border-red-200 bg-red-50 hover:shadow-md'
                : 'border-gray-200 bg-white hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{action.icon}</span>
              {action.dangerous && <span className="text-xs font-semibold text-red-700">⚠️ DANGEROUS</span>}
            </div>

            <h3 className={`font-semibold mb-1 ${action.dangerous ? 'text-red-900' : 'text-gray-900'}`}>
              {action.title}
            </h3>
            <p className={`text-sm mb-4 ${action.dangerous ? 'text-red-700' : 'text-gray-600'}`}>
              {action.description}
            </p>

            <button
              onClick={() => handleAction(action.id)}
              className={`w-full px-3 py-2 rounded font-medium transition-colors text-sm ${
                action.dangerous
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {action.action}
            </button>

            {/* Confirmation Dialog */}
            {showConfirm === action.id && action.dangerous && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                <p className="text-sm text-red-900 font-medium mb-2">Are you sure?</p>
                <p className="text-xs text-red-700 mb-2">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeAction(action.id)}
                    className="flex-1 px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 px-2 py-1 text-xs font-medium bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Archive Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">⚙️ Archive Configuration</h3>

        <div className="space-y-4">
          {/* Auto Archive Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Archive Threshold (days)</label>
            <input type="number" defaultValue={30} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Memories older than this will be automatically archived</p>
          </div>

          {/* Compression Enabled */}
          <div className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-500 rounded" />
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Compression</label>
              <p className="text-xs text-gray-500">Reduce storage size of archived memories</p>
            </div>
          </div>

          {/* Auto Delete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Delete Archives (years)</label>
            <input type="number" defaultValue={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Archives older than this will be permanently deleted</p>
          </div>

          {/* Save Button */}
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors">
            Save Configuration
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">📋 Recent Activity</h3>

        <div className="space-y-3">
          {[
            { action: 'Archived', count: 15, time: '2 hours ago' },
            { action: 'Restored', count: 3, time: '5 hours ago' },
            { action: 'Deleted', count: 2, time: '1 day ago' },
            { action: 'Compressed', count: 42, time: '3 days ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className="font-semibold text-gray-900">{activity.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
