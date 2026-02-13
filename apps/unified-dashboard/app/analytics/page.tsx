'use client';

import React from 'react';
import { MOCK_ACTIVITY } from '@/lib/unified-mock-data';
import { BarChart2, Activity, Zap, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">System Analytics</h1>
      <p className="text-gray-400 mb-8">Performance metrics and operational insights</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Activity />} label="Total Events" value="12,450" sub="+12% vs last week" />
        <StatCard icon={<Zap />} label="Avg Latency" value="45ms" sub="-5ms improvement" />
        <StatCard icon={<BarChart2 />} label="API Requests" value="1.2M" sub="99.9% success rate" />
        <StatCard icon={<Clock />} label="Uptime" value="99.99%" sub="Last 30 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#16181d] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Activity Volume</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {[...Array(24)].map((_, i) => {
              const height = Math.floor(Math.random() * 80) + 20;
              return (
                <div key={i} className="w-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm" 
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {height * 10} events
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>
          <div className="space-y-4">
            {MOCK_ACTIVITY.filter(a => a.type === 'alert').slice(0, 5).map(alert => (
              <div key={alert.id} className="flex gap-3 items-start p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-200">{alert.message}</div>
                  <div className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {MOCK_ACTIVITY.filter(a => a.type === 'alert').length === 0 && (
              <div className="text-gray-500 text-sm text-center py-4">No recent alerts</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4 text-gray-400">
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}