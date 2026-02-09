'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MOCK_PROJECTS, DOMAINS, Project } from '@/lib/unified-mock-data';

export default function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [isLive, setIsLive] = useState(false);
  const [envLabel, setEnvLabel] = useState('Local');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        setEnvLabel(sbUrl.includes('localhost') || sbUrl.includes('127.0.0.1') ? 'Local' : 'Remote');

        const supabase = createClient(sbUrl, sbKey);
        const { data, error } = await supabase.from('projects').select('*');
        
        if (!error && data && data.length > 0) {
          // Map DB schema (snake_case/jsonb) back to UI schema
          const mapped = data.map((d: any) => ({
            id: d.id,
            domainId: d.metadata?.domainId || 'product-factory',
            name: d.name,
            description: d.description,
            status: d.status,
            budget: d.metadata?.budget || { allocated: 0, spent: 0, currency: 'USD' },
            team: d.metadata?.team || { leads: [], size: 0 },
            metrics: d.metadata?.metrics || { uptime: 0, requestsPerMin: 0, errorRate: 0 },
            updatedAt: d.updated_at
          }));
          setProjects(mapped);
          setIsLive(true);
        }
      } catch (e) {
        console.warn('Failed to fetch live projects, using mock data');
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="col-span-1 flex justify-end">
        {isLive ? (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 font-mono">
            ● LIVE ({envLabel.toUpperCase()})
          </span>
        ) : (
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 font-mono">
            ○ MOCK DATA
          </span>
        )}
      </div>
      {projects.map(project => {
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
