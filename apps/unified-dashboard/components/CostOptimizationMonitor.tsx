'use client';
import React from 'react';
import { MOCK_PROJECTS } from '@/lib/unified-mock-data';

export default function CostOptimizationMonitor() {
  const totalBudget = MOCK_PROJECTS.reduce((acc, p) => acc + p.budget.allocated, 0);
  const totalSpent = MOCK_PROJECTS.reduce((acc, p) => acc + p.budget.spent, 0);
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm text-gray-400">Total Budget Utilization</div>
          <div className="text-3xl font-bold text-white">{utilization.toFixed(1)}%</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Spent / Allocated</div>
          <div className="text-lg font-mono text-white">
            ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-500" 
          style={{ width: `${utilization}%` }}
        />
      </div>

      <div className="space-y-2">
        {MOCK_PROJECTS.map(p => (
          <div key={p.id} className="flex justify-between text-sm">
            <span className="text-gray-400">{p.name}</span>
            <span className={p.budget.spent > p.budget.allocated * 0.9 ? 'text-red-400' : 'text-gray-300'}>
              ${p.budget.spent.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
