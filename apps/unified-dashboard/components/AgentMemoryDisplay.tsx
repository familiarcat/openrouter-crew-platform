'use client';
import React from 'react';

export default function AgentMemoryDisplay({ agentName = 'Agent', limit = 5, showStats = false }: any) {
  return (
    <div className="h-full flex flex-col">
      {showStats && (
        <div className="flex gap-4 mb-4 text-xs text-gray-400 border-b border-white/10 pb-2">
          <div><span className="text-white font-bold">1,240</span> Memories</div>
          <div><span className="text-white font-bold">85%</span> Retrieval Rate</div>
          <div><span className="text-white font-bold">4.2s</span> Avg Latency</div>
        </div>
      )}
      <div className="space-y-2 flex-1 overflow-auto">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="flex gap-3 text-sm p-2 hover:bg-white/5 rounded transition-colors">
            <div className="text-gray-500 font-mono text-xs w-12 shrink-0">10:4{i} AM</div>
            <div className="text-gray-300">
              <span className="text-blue-400 font-bold">@{agentName}:</span> Processed user request for project creation. Context retained.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
