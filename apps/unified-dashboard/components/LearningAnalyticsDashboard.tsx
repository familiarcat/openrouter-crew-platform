'use client';
import React from 'react';

export default function LearningAnalyticsDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="bg-white/5 rounded p-4 border border-white/10">
        <h4 className="text-sm font-bold text-gray-400 mb-4">Knowledge Acquisition</h4>
        <div className="flex items-end gap-2 h-32">
          {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
            <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t relative group">
              <div className="absolute bottom-0 w-full bg-blue-500" style={{ height: `${h}%` }}></div>
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded border border-white/10">
                {h}%
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 rounded p-4 border border-white/10">
        <h4 className="text-sm font-bold text-gray-400 mb-2">Top Insights</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-green-300">
            <span>↑</span> Deployment frequency correlates with lower error rates
          </li>
          <li className="flex items-center gap-2 text-yellow-300">
            <span>→</span> API latency spikes during backup windows
          </li>
          <li className="flex items-center gap-2 text-blue-300">
            <span>ℹ</span> New pattern detected in user onboarding
          </li>
        </ul>
      </div>
    </div>
  );
}
