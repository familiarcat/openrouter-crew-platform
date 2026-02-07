'use client';
import React from 'react';

export default function AIImpactAssessment() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold text-white">A+</div>
          <div className="text-xs text-gray-400">Overall Impact Score</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-green-400">Low Risk</div>
          <div className="text-xs text-gray-500">Last assessed: Today</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Ethical Compliance</span>
          <span className="text-green-400">98%</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-[98%]"></div>
        </div>
        
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-300">Resource Efficiency</span>
          <span className="text-blue-400">85%</span>
        </div>
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-[85%]"></div>
        </div>
      </div>
    </div>
  );
}
