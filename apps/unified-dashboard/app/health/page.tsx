'use client';

import React from 'react';

export default function HealthPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">System Health Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Service Status</h2>
          <div className="space-y-4">
            <StatusRow service="Web Portal" status="Operational" />
            <StatusRow service="API Server" status="Operational" />
            <StatusRow service="Database" status="Operational" />
            <StatusRow service="n8n Workflows" status="Operational" />
          </div>
        </div>

        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Metrics</h2>
          <div className="space-y-4">
            <MetricRow label="Uptime" value="99.99%" />
            <MetricRow label="Response Time" value="45ms" />
            <MetricRow label="Error Rate" value="0.01%" />
            <MetricRow label="Active Connections" value="1,240" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ service, status }: { service: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <span className="text-gray-300">{service}</span>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        <span className="text-green-400 font-mono text-sm">{status}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-white/5 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}