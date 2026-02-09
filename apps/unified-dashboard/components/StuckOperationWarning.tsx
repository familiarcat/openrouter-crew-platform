'use client';
import React from 'react';

export default function StuckOperationWarning({ operationName, retryCount, maxRetries, onCancel, onRetry, error }: any) {
  return (
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="text-sm font-bold text-yellow-400">Operation Stuck: {operationName}</h4>
          <p className="text-xs text-gray-300">Failed {retryCount} times. Stopping after {maxRetries} attempts.</p>
        </div>
      </div>
      {error && (
        <div className="p-2 bg-black/20 rounded text-[10px] font-mono text-gray-400">
          Error: {error.message || error.toString()}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onRetry} className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 text-xs rounded border border-yellow-500/30 transition-colors">
          🔄 Retry Now
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded border border-white/10 transition-colors">
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}
