'use client';
import React from 'react';
import { MOCK_ACTIVITY } from '@/lib/unified-mock-data';

export default function LiveRefreshDashboard() {
  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
      {MOCK_ACTIVITY.map(event => (
        <div key={event.id} className="flex gap-3 items-start p-3 bg-white/5 rounded border border-white/5">
          <div className={`w-2 h-2 mt-1.5 rounded-full ${event.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
          <div>
            <div className="text-sm text-gray-200">{event.message}</div>
            <div className="text-xs text-gray-500 mt-1 flex gap-2">
              <span suppressHydrationWarning>{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span className="uppercase px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{event.domainId}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
