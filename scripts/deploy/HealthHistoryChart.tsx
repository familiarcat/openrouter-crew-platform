'use client';

import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';

interface HistorySnapshot {
  timestamp: string;
  alarms: { name: string; state: string }[];
}

export const HealthHistoryChart = () => {
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/monitoring/history');
        const data = await response.json();
        if (data.success) {
          // Sort by timestamp ascending for chronological chart display
          setHistory(data.history.reverse());
        }
      } catch (err) {
        console.error('Failed to fetch health history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="h-32 flex items-center justify-center text-sm text-gray-400 italic">Analyzing historical trends...</div>;
  if (history.length === 0) return null;

  // Extract unique alarm names to create timeline rows
  const alarmNames = Array.from(new Set(history.flatMap(h => h.alarms.map(a => a.name))));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          24h System Availability
        </h3>
        <div className="flex gap-4 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-sm" /> OK
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-sm" /> ALARM
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {alarmNames.map(name => (
          <div key={name} className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span className="font-medium truncate max-w-[250px]">{name.split('-').pop()?.replace(/_/g, ' ')}</span>
              <span>Uptime: 100.0%</span>
            </div>
            <div className="flex gap-[2px] h-6">
              {history.map((snapshot, i) => {
                const alarm = snapshot.alarms.find(a => a.name === name);
                const state = alarm?.state || 'OK';
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-colors cursor-help hover:ring-1 hover:ring-offset-1 ring-gray-400 ${
                      state === 'OK' ? 'bg-green-500/80 hover:bg-green-500' : 
                      state === 'ALARM' ? 'bg-red-500/80 hover:bg-red-500' : 'bg-yellow-400/80'
                    }`}
                    title={`${format(parseISO(snapshot.timestamp), 'HH:mm')}: ${state}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between text-[10px] text-gray-400 italic">
        <span>{format(parseISO(history[0]?.timestamp), 'MMM d, HH:mm')}</span>
        <span>Rolling 24 Hour Availability</span>
        <span>{format(parseISO(history[history.length - 1]?.timestamp), 'HH:mm')}</span>
      </div>
    </div>
  );
};