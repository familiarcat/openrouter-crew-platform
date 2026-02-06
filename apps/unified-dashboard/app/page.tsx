'use client';

import React from 'react';
import { DOMAINS, MOCK_PROJECTS, MOCK_ACTIVITY, getDomainStats } from '@/lib/unified-mock-data';
import Link from 'next/link';

export default function DashboardHome() {
  const totalBudget = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget.allocated, 0);
  const totalSpent = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget.spent, 0);
  const activeProjects = MOCK_PROJECTS.filter(p => p.status === 'active').length;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
          <p className="text-gray-400">Real-time metrics across all domains</p>
        </div>
        <Link 
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> New Project
        </Link>
      </header>

      {/* High-level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Projects" value={MOCK_PROJECTS.length} trend="+2 this week" />
        <MetricCard title="Active Workstreams" value={activeProjects} trend="Stable" />
        <MetricCard title="Budget Utilization" value={`${Math.round((totalSpent / totalBudget) * 100)}%`} trend={`$${totalSpent.toLocaleString()} spent`} />
        <MetricCard title="System Health" value="99.8%" trend="All systems operational" color="text-green-400" />
      </div>

      {/* Domain Grid */}
      <h2 className="text-xl font-semibold text-white mb-4">Domain Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {DOMAINS.map(domain => {
          const stats = getDomainStats(domain.id);
          return (
            <div key={domain.id} className="bg-[#16181d] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${domain.color} flex items-center justify-center text-white font-bold`}>
                    {domain.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{domain.name}</h3>
                    <div className="text-xs text-gray-500">Port {domain.port}</div>
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                  Healthy
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active Projects</span>
                  <span className="text-white font-mono">{stats.activeCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Budget Used</span>
                  <span className="text-white font-mono">{Math.round(stats.budgetUtilization)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full bg-gradient-to-r ${domain.color}`} 
                    style={{ width: `${stats.budgetUtilization}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Projects</h2>
          <div className="bg-[#16181d] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="p-4 font-medium">Project Name</th>
                  <th className="p-4 font-medium">Domain</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_PROJECTS.map(project => (
                  <tr key={project.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{project.name}</div>
                      <div className="text-xs text-gray-500">{project.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300 border border-white/10">
                        {DOMAINS.find(d => d.id === project.domainId)?.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`capitalize ${project.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-300">
                      ${project.budget.spent.toLocaleString()} / ${project.budget.allocated.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Live Activity</h2>
          <div className="bg-[#16181d] border border-white/10 rounded-xl p-4 space-y-4">
            {MOCK_ACTIVITY.map(event => (
              <div key={event.id} className="flex gap-3 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <div className={`w-2 h-2 mt-1.5 rounded-full ${event.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div>
                  <div className="text-sm text-gray-300">{event.message}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="uppercase">{event.domainId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, color = "text-white" }: { title: string, value: string | number, trend: string, color?: string }) {
  return (
    <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
      <div className="text-gray-400 text-sm mb-2">{title}</div>
      <div className={`text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{trend}</div>
    </div>
  );
}
