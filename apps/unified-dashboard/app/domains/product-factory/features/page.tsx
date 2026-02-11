'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Feature Flags</h1>
        <p className="text-gray-400">Control feature rollout and A/B testing</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <GitBranch className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>Feature flags management coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Progressive rollout and testing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
