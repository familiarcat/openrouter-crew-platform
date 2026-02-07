'use client';
import React from 'react';

export default function SecurityAssessmentDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="flex flex-col items-center justify-center bg-white/5 rounded border border-white/10 p-4">
        <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center mb-2">
          <span className="text-3xl font-bold text-white">94</span>
        </div>
        <div className="text-sm text-gray-400">Security Score</div>
      </div>
      <div className="space-y-2">
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
          <div className="text-xs text-red-400 font-bold">Critical</div>
          <div className="text-xs text-gray-300">0 Issues Found</div>
        </div>
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <div className="text-xs text-yellow-400 font-bold">Warning</div>
          <div className="text-xs text-gray-300">2 Config Warnings</div>
        </div>
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
          <div className="text-xs text-blue-400 font-bold">Info</div>
          <div className="text-xs text-gray-300">5 Recommendations</div>
        </div>
      </div>
    </div>
  );
}
