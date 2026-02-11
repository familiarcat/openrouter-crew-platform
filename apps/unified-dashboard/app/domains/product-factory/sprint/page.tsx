'use client';

import React from 'react';
import { Kanban, Plus } from 'lucide-react';

export default function SprintPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sprint Board</h1>
          <p className="text-gray-400">Sprint planning and task management</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition">
          <Plus className="w-4 h-4" />
          New Sprint
        </button>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Kanban className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>Sprint board content coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Kanban board integration in progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
