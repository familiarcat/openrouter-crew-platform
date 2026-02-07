'use client';
import React from 'react';
import { DOMAINS } from '@/lib/unified-mock-data';

export default function ServiceStatusDisplay() {
  return (
    <div className="space-y-4">
      {DOMAINS.map(domain => (
        <div key={domain.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <div>
              <div className="font-medium">{domain.name}</div>
              <div className="text-xs text-gray-500">Port: {domain.port}</div>
            </div>
          </div>
          <div className="text-xs font-mono text-green-400">OPERATIONAL</div>
        </div>
      ))}
    </div>
  );
}
