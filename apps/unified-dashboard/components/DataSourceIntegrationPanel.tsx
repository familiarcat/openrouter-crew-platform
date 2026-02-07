'use client';
import React, { useState } from 'react';

export default function DataSourceIntegrationPanel() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Data Sources</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Source'}
        </button>
      </div>

      {isAdding ? (
        <div className="flex-1 bg-white/5 rounded p-4 border border-white/10">
          <h4 className="font-bold mb-4">Connect New Source</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 border border-white/10 rounded hover:border-blue-500 cursor-pointer bg-black/20">
              <div className="font-bold">PostgreSQL</div>
              <div className="text-xs text-gray-500">Relational DB</div>
            </div>
            <div className="p-4 border border-white/10 rounded hover:border-blue-500 cursor-pointer bg-black/20">
              <div className="font-bold">REST API</div>
              <div className="text-xs text-gray-500">External Service</div>
            </div>
          </div>
          <button className="w-full py-2 bg-blue-600 rounded text-white font-medium">Continue Setup</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <div className="font-medium">Production DB</div>
                <div className="text-xs text-gray-500">PostgreSQL • Synced 1m ago</div>
              </div>
            </div>
            <button className="text-xs text-gray-400 hover:text-white">Configure</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div>
                <div className="font-medium">Analytics Stream</div>
                <div className="text-xs text-gray-500">Kafka • Syncing...</div>
              </div>
            </div>
            <button className="text-xs text-gray-400 hover:text-white">Configure</button>
          </div>
        </div>
      )}
    </div>
  );
}
