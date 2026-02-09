'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MOCK_WORKFLOWS, Workflow } from '@/lib/unified-mock-data';

type ViewState = 'list' | 'detail' | 'execution';

export default function N8NWorkflowBento() {
  const [view, setView] = useState<ViewState>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [isLive, setIsLive] = useState(false);
  const [envLabel, setEnvLabel] = useState('Local');

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        setEnvLabel(sbUrl.includes('localhost') || sbUrl.includes('127.0.0.1') ? 'Local' : 'Remote');

        const supabase = createClient(sbUrl, sbKey);
        const { data } = await supabase.from('workflows').select('*');
        if (data && data.length > 0) {
          setWorkflows(data as Workflow[]);
          setIsLive(true);
        }
      } catch (e) {
        console.warn('Using mock workflows');
      }
    };
    fetchWorkflows();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">n8n Workflows</h3>
        {isLive ? (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">LIVE ({envLabel.toUpperCase()})</span>
        ) : (
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-mono">MOCK DATA</span>
        )}
        {view !== 'list' && (
          <button onClick={() => setView('list')} className="text-xs text-blue-400 hover:text-blue-300">
            ← Back to List
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="space-y-2 overflow-auto flex-1">
          {workflows.map(wf => (
            <div key={wf.id} className="p-3 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors flex justify-between items-center">
              <div>
                <div className="font-medium">{wf.name}</div>
                <div className="text-xs text-gray-500">{wf.status} • Last run: {wf.lastRun}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedWorkflow(wf.id); setView('detail'); }}
                  className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30"
                >
                  Edit
                </button>
                <button 
                  onClick={() => { setSelectedWorkflow(wf.id); setView('execution'); }}
                  className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded hover:bg-green-500/30"
                >
                  Run
                </button>
              </div>
            </div>
          ))}
          <button className="w-full py-2 border border-dashed border-white/20 rounded text-gray-500 text-sm hover:border-white/40 hover:text-gray-300">
            + Create New Workflow
          </button>
        </div>
      )}

      {view === 'execution' && (
        <div className="flex-1 bg-black/20 rounded p-4 border border-white/5">
          <div className="text-sm font-mono text-green-400 mb-2">&gt; Initializing execution for {selectedWorkflow}...</div>
          <div className="text-sm font-mono text-gray-400 mb-2">&gt; Loading parameters...</div>
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">Input Payload (JSON)</label>
            <textarea className="w-full h-24 bg-black/40 border border-white/10 rounded p-2 text-xs font-mono text-gray-300" defaultValue="{}" />
          </div>
          <button className="mt-4 w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium text-sm">
            Execute Workflow
          </button>
        </div>
      )}

      {view === 'detail' && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Workflow Canvas Placeholder for {selectedWorkflow}
        </div>
      )}
    </div>
  );
}
