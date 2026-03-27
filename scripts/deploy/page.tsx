import React from 'react';
import { AlarmStatusGrid } from '../../../components/monitoring/AlarmStatusGrid';
import { HealthHistoryChart } from '../../../components/monitoring/HealthHistoryChart';

export default function MonitoringPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Platform Health & Alarms</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time status of system monitors and CloudWatch alarms via AWS SDK.
        </p>
      </header>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Health History
          </h2>
        </div>
        <HealthHistoryChart />
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Active Alarms
          </h2>
        </div>
        <AlarmStatusGrid />
      </section>
    </div>
  );
}