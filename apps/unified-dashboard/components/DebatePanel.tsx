'use client';
import React from 'react';

export default function DebatePanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="text-xs text-purple-300 uppercase font-bold">Current Topic</div>
        <div className="font-medium text-white">Should we migrate the legacy auth system to Supabase Auth?</div>
      </div>
      
      <div className="flex-1 overflow-auto space-y-4 pr-2">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">A1</div>
          <div className="bg-white/5 p-3 rounded-r-lg rounded-bl-lg text-sm text-gray-300 flex-1">
            <div className="text-xs text-blue-400 font-bold mb-1">Architect Agent</div>
            Migrating would reduce maintenance overhead by 40% based on current metrics.
          </div>
        </div>
        <div className="flex gap-3 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold">S1</div>
          <div className="bg-white/5 p-3 rounded-l-lg rounded-br-lg text-sm text-gray-300 flex-1 text-right">
            <div className="text-xs text-red-400 font-bold mb-1">Security Agent</div>
            We need to ensure the migration path handles existing session tokens without forcing a global logout.
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input type="text" placeholder="Intervene in debate..." className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm" />
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">Send</button>
      </div>
    </div>
  );
}
