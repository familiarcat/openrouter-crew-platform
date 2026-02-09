'use client';
import React, { useState } from 'react';

export default function MCPDashboardSection() {
  const [hydrating, setHydrating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const targetEnv = sbUrl.includes('localhost') || sbUrl.includes('127.0.0.1') ? 'Local' : 'Remote';

  const handleHydrate = async () => {
    setHydrating(true);
    setStatus('Hydrating...');
    try {
      const res = await fetch('/api/hydrate', { method: 'POST' });
      await res.json();
      setStatus('Done');
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setStatus('Error');
    } finally {
      setHydrating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h4 className="font-bold">Filesystem Server</h4>
        </div>
        <div className="text-xs text-gray-400">v1.2.0 • Local</div>
        <div className="mt-3 flex gap-2">
          <span className="px-2 py-1 bg-white/10 rounded text-xs">read_file</span>
          <span className="px-2 py-1 bg-white/10 rounded text-xs">write_file</span>
        </div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h4 className="font-bold">PostgreSQL Server</h4>
        </div>
        <div className="text-xs text-gray-400">v0.9.5 • Remote</div>
        <div className="mt-3 flex gap-2">
          <span className="px-2 py-1 bg-white/10 rounded text-xs">query</span>
          <span className="px-2 py-1 bg-white/10 rounded text-xs">schema</span>
        </div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10 flex flex-col items-center justify-center border-dashed gap-2">
        <button 
          onClick={handleHydrate}
          disabled={hydrating}
          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
        >
          {hydrating ? 'Hydrating...' : '⚡ Hydrate Mock Data'}
        </button>
        {status && <div className="text-xs text-gray-400">{status}</div>}
        <div className="text-[10px] text-gray-500 text-center">
          Push to {targetEnv} Supabase & n8n
        </div>
      </div>
    </div>
  );
}
