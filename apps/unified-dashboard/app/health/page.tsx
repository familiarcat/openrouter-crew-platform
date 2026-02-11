'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Activity } from 'lucide-react';

export default function HealthPage() {
  const systemStatus = [
    { name: 'API Gateway', status: 'healthy', uptime: '99.8%' },
    { name: 'Database Cluster', status: 'healthy', uptime: '99.9%' },
    { name: 'Cache Layer', status: 'healthy', uptime: '99.7%' },
    { name: 'Message Queue', status: 'healthy', uptime: '99.5%' },
    { name: 'Search Engine', status: 'healthy', uptime: '99.6%' },
    { name: 'Analytics Engine', status: 'healthy', uptime: '99.4%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Health</h1>
        <p className="text-gray-400">Real-time monitoring of all system components</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Overall Status</div>
              <div className="text-2xl font-bold text-green-500">Operational</div>
            </div>
          </div>
        </div>

        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Average Uptime</div>
          <div className="text-3xl font-bold text-white">99.82%</div>
        </div>

        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Services Online</div>
          <div className="text-3xl font-bold text-white">6 / 6</div>
        </div>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">Component Status</h2>
        </div>
        <div className="divide-y divide-white/5">
          {systemStatus.map((component) => (
            <div key={component.name} className="p-6 flex items-center justify-between hover:bg-white/5 transition">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-white">{component.name}</div>
                  <div className="text-sm text-gray-400">Uptime: {component.uptime}</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-sm rounded-full border border-green-500/20">
                {component.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
