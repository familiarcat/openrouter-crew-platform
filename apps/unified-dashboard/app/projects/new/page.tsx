'use client';

import React from 'react';
import { DOMAINS } from '@/lib/unified-mock-data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewProjectPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} />
        <span>Back to Projects</span>
      </Link>
      
      <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
      <p className="text-gray-400 mb-8">Initialize a new crew and workspace for your domain.</p>
      
      <div className="bg-[#16181d] border border-white/10 rounded-xl p-8">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
            <input 
              type="text" 
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="e.g., Q3 Marketing Campaign"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea 
              rows={3}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Describe the goals and scope of this project..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                <option value="">Select a domain...</option>
                {DOMAINS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Template</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none">
                <option value="standard">Standard Crew</option>
                <option value="research">Research & Analysis</option>
                <option value="creative">Creative Studio</option>
                <option value="dev">Development Team</option>
              </select>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
            <Link 
              href="/projects"
              className="px-6 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button 
              type="button"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}