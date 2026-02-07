'use client';
import React from 'react';
import { MOCK_PROJECTS, DOMAINS } from '@/lib/unified-mock-data';

export default function ProjectGrid() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {MOCK_PROJECTS.map(project => {
        const domain = DOMAINS.find(d => d.id === project.domainId);
        return (
          <div key={project.id} className="p-4 border border-white/10 rounded bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${domain?.color || 'from-gray-500 to-gray-600'}`} />
                <h3 className="font-bold">{project.name}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                project.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 
                'border-gray-500/30 text-gray-400 bg-gray-500/10'
              }`}>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex -space-x-2">
                {project.team.leads.map((lead, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border border-[#16181d] flex items-center justify-center text-[10px] text-white">
                    {lead.charAt(0)}
                  </div>
                ))}
              </div>
              <div className="font-mono">
                ${project.budget.spent.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
