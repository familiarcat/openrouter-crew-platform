'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function ProductFactoryPage() {
  return (
    <div className="flex-1 flex flex-col p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Factory</h1>
          <p className="text-gray-400">Idea generation and product development pipeline</p>
        </div>
        <a 
          href="http://localhost:3003" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          <ExternalLink size={16} />
          <span>Open Standalone</span>
        </a>
      </div>

      <div className="flex-1 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden relative min-h-[500px]">
        <iframe 
          src="http://localhost:3003" 
          className="w-full h-full border-0"
          title="Product Factory Dashboard"
        />
      </div>
    </div>
  );
}