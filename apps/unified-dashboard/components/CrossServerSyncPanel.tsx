'use client';
import React from 'react';

export default function CrossServerSyncPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-bold text-sm">Sync Active</span>
        </div>
        <span className="text-xs text-gray-500">Last sync: Just now</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
          <span className="text-gray-300">Product Factory</span>
          <span className="text-green-400">Synced</span>
        </div>
        <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
          <span className="text-gray-300">Alex AI Universal</span>
          <span className="text-green-400">Synced</span>
        </div>
        <div className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
          <span className="text-gray-300">DJ Booking</span>
          <span className="text-yellow-400">Syncing (98%)</span>
        </div>
      </div>

      <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-gray-300 transition-colors">
        Force Full Resync
      </button>
    </div>
  );
}
