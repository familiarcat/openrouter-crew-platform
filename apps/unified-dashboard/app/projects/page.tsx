'use client';

import React from 'react';
import { MOCK_PROJECTS, DOMAINS } from '@/lib/unified-mock-data';
import Link from 'next/link';
import { Plus, Search, Filter } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-gray-400">Manage all active workstreams across domains</p>
        </div>
        <Link 
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Project</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full bg-[#16181d] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="px-4 py-2 bg-[#16181d] border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 flex items-center gap-2">
          <Filter size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PROJECTS.map(project => {
          const domain = DOMAINS.find(d => d.id === project.domainId);
          const percentUsed = Math.round((project.budget.spent / project.budget.allocated) * 100);
          
          return (
            <div key={project.id} className="bg-[#16181d] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${domain?.color || 'from-gray-700 to-gray-900'} flex items-center justify-center text-white font-bold`}>
                  {domain?.name.charAt(0)}
                </div>
                <span className={`px-2 py-1 rounded text-xs border ${project.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {project.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{project.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Budget</span>
                    <span className="text-gray-300">${project.budget.spent.toLocaleString()} / ${project.budget.allocated.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${percentUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                  <span>Updated 2h ago</span>
                  <span>{domain?.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}