'use client';

import React from 'react';
import { Code } from 'lucide-react';

export default function VscodePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">VSCode Extension</h1>
        <p className="text-gray-400">IDE integration and development tools</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Code className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>VSCode extension coming soon</p>
            <p className="text-sm text-gray-500 mt-1">IDE integration and developer tools</p>
          </div>
        </div>
      </div>
    </div>
  );
}
