'use client';
import React from 'react';
import { MOCK_PROJECTS } from '@/lib/unified-mock-data';

export default function AnalyticsDashboard() {
  const avgUptime = MOCK_PROJECTS.reduce((acc, p) => acc + p.metrics.uptime, 0) / MOCK_PROJECTS.length;
  const totalReqs = MOCK_PROJECTS.reduce((acc, p) => acc + p.metrics.requestsPerMin, 0);
  const avgError = MOCK_PROJECTS.reduce((acc, p) => acc + p.metrics.errorRate, 0) / MOCK_PROJECTS.length;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white/5 rounded border border-white/10 text-center">
        <div className="text-sm text-gray-400 mb-1">Avg Uptime</div>
        <div className="text-2xl font-bold text-green-400">{avgUptime.toFixed(2)}%</div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10 text-center">
        <div className="text-sm text-gray-400 mb-1">Total RPM</div>
        <div className="text-2xl font-bold text-blue-400">{totalReqs}</div>
      </div>
      <div className="p-4 bg-white/5 rounded border border-white/10 text-center">
        <div className="text-sm text-gray-400 mb-1">Avg Error Rate</div>
        <div className="text-2xl font-bold text-yellow-400">{avgError.toFixed(2)}%</div>
      </div>
    </div>
  );
}
