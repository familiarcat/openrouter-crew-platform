'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Alarm {
  name: string;
  state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  reason: string;
  updatedAt: string;
  description: string;
}

export const AlarmStatusGrid = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAlarms = async (force = false) => {
    try {
      const response = await fetch(`/api/monitoring/alarms${force ? '?refresh=true' : ''}`);
      const data = await response.json();
      if (data.success) {
        setAlarms(data.alarms);
        setLastUpdated(data.timestamp);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch alarms');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlarms(true);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 300000); // Poll every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-4 animate-pulse text-gray-400 italic">Loading platform health status...</div>;
  if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-md border border-red-200">Error: {error}</div>;

  return (
    <div className="space-y-4">
      {lastUpdated && (
        <div className="flex items-center justify-end gap-3 px-1">
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Last sync: {new Date(lastUpdated).toLocaleTimeString()} (5m cache)
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-all disabled:opacity-50 text-gray-500"
            title="Force Refresh (Bypass Cache)"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {alarms.map((alarm) => (
        <div 
          key={alarm.name} 
          className={`border rounded-lg p-4 shadow-sm bg-white dark:bg-slate-800 transition-all hover:shadow-md ${
            alarm.state === 'ALARM' ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10' : 
            alarm.state === 'INSUFFICIENT_DATA' ? 'border-yellow-400' : 'border-green-500'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-sm truncate max-w-[70%]" title={alarm.name}>
              {alarm.name.split('-').pop()?.replace(/_/g, ' ')}
            </h3>
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
              alarm.state === 'ALARM' ? 'bg-red-500 text-white' : 
              alarm.state === 'INSUFFICIENT_DATA' ? 'bg-yellow-400 text-black' : 
              'bg-green-500 text-white'
            }`}>
              {alarm.state}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 h-8 line-clamp-2">
            {alarm.description || 'System monitor for platform reliability.'}
          </p>
          <div className="flex items-center justify-between text-[10px] text-gray-400 border-t pt-2 mt-auto">
            <span>{new Date(alarm.updatedAt).toLocaleTimeString()}</span>
            <span className="italic">CloudWatch</span>
          </div>
        </div>
      ))}
      {alarms.length === 0 && (
        <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
          No active alarms found for the current environment.
        </div>
      )}
      </div>
    </div>
  );
};