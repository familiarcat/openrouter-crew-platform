'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOMAINS } from '@/lib/unified-mock-data';

export default function DashboardNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="w-64 bg-[#0f1115] border-r border-white/10 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Unified Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-1">OpenRouter Crew Platform</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Overview
        </div>
        <ul className="space-y-1 px-2 mb-6">
          <li>
            <Link 
              href="/" 
              className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${isActive('/') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              Dashboard Home
            </Link>
          </li>
          <li>
            <Link 
              href="/projects" 
              className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${isActive('/projects') ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              All Projects
            </Link>
          </li>
        </ul>

        <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Domains
        </div>
        <ul className="space-y-1 px-2">
          {DOMAINS.map(domain => (
            <li key={domain.id}>
              <Link 
                href={`/domains/${domain.id}`}
                className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors group ${isActive(`/domains/${domain.id}`) ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className={`w-2 h-2 rounded-full mr-3 bg-gradient-to-r ${domain.color}`}></span>
                {domain.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <div>
            <div className="text-sm font-medium text-white">Admin User</div>
            <div className="text-xs text-gray-500">admin@openrouter.ai</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
