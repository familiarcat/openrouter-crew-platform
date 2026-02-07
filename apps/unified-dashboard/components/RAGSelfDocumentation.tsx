'use client';
import React from 'react';

export default function RAGSelfDocumentation() {
  return (
    <div className="h-full flex flex-col">
      <div className="relative mb-4">
        <input 
          type="text" 
          placeholder="Search system documentation..." 
          className="w-full bg-black/20 border border-white/10 rounded px-4 py-2 text-sm pl-9"
        />
        <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
      </div>
      
      <div className="flex-1 overflow-auto space-y-2">
        <div className="p-3 bg-white/5 rounded border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors">
          <div className="text-xs text-blue-400 mb-1">Auto-Generated • 2h ago</div>
          <h4 className="font-bold text-sm mb-1">API Authentication Flow</h4>
          <p className="text-xs text-gray-400 line-clamp-2">
            The system uses JWT tokens signed with RS256. Tokens are refreshed every 15 minutes via the /auth/refresh endpoint.
          </p>
        </div>
        <div className="p-3 bg-white/5 rounded border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors">
          <div className="text-xs text-blue-400 mb-1">Auto-Generated • 1d ago</div>
          <h4 className="font-bold text-sm mb-1">Database Schema: Projects</h4>
          <p className="text-xs text-gray-400 line-clamp-2">
            Projects table relates to Domains via domain_id foreign key. Cascade delete is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
