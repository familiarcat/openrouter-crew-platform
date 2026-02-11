'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function CostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cost Analysis</h1>
        <p className="text-gray-400">Analyze AI usage costs and optimization</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <TrendingUp className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>Cost analysis coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Usage metrics and cost optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
