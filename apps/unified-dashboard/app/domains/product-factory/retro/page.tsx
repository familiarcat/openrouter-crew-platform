'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function RetroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Retrospectives</h1>
        <p className="text-gray-400">Sprint retrospective reviews and insights</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <BarChart3 className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>Retrospective content coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Sprint review analytics and insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}
