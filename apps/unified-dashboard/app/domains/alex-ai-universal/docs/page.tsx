'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
        <p className="text-gray-400">API reference and usage guides</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <BookOpen className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>Documentation coming soon</p>
            <p className="text-sm text-gray-500 mt-1">API docs and usage guides</p>
          </div>
        </div>
      </div>
    </div>
  );
}
