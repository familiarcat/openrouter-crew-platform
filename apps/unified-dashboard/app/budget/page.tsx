'use client';

import React from 'react';
import { MOCK_PROJECTS, DOMAINS } from '@/lib/unified-mock-data';
import { DollarSign, TrendingUp, AlertCircle, PieChart } from 'lucide-react';

export default function BudgetPage() {
  const totalBudget = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget.allocated, 0);
  const totalSpent = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget.spent, 0);
  const utilization = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Budget Management</h1>
      <p className="text-gray-400 mb-8">Financial overview and cost tracking across all domains</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <DollarSign size={18} />
            <span className="text-sm">Total Allocated</span>
          </div>
          <div className="text-3xl font-bold text-white">${totalBudget.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <TrendingUp size={18} />
            <span className="text-sm">Total Spent</span>
          </div>
          <div className="text-3xl font-bold text-white">${totalSpent.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <PieChart size={18} />
            <span className="text-sm">Utilization</span>
          </div>
          <div className={`text-3xl font-bold ${utilization > 80 ? 'text-yellow-400' : 'text-green-400'}`}>{utilization}%</div>
        </div>
        
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2 text-gray-400">
            <AlertCircle size={18} />
            <span className="text-sm">Projected EOM</span>
          </div>
          <div className="text-3xl font-bold text-white">${(totalSpent * 1.2).toLocaleString()}</div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-[#16181d] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Project Allocations</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 font-medium">Project</th>
              <th className="p-4 font-medium">Domain</th>
              <th className="p-4 font-medium text-right">Allocated</th>
              <th className="p-4 font-medium text-right">Spent</th>
              <th className="p-4 font-medium w-1/3">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_PROJECTS.map(project => {
              const percent = Math.round((project.budget.spent / project.budget.allocated) * 100);
              const domain = DOMAINS.find(d => d.id === project.domainId);
              
              return (
                <tr key={project.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{project.name}</td>
                  <td className="p-4 text-gray-400">{domain?.name}</td>
                  <td className="p-4 text-right text-gray-300 font-mono">${project.budget.allocated.toLocaleString()}</td>
                  <td className="p-4 text-right text-gray-300 font-mono">${project.budget.spent.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{percent}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}