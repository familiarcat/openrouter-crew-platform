'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Audit</h1>
        <p className="text-gray-400">Monitor security and audit logs</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Shield className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>Security audit coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Security logs and compliance tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
