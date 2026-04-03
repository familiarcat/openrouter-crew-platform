import React from 'react';
import { format } from 'date-fns';

interface AttemptMetadata {
  attempt: number;
  model: string;
  timestamp: string;
  duration_ms: number;
  consistency_score: number;
  is_consistent: boolean;
  cost_usd: number;
}

interface AttemptHistoryTableProps {
  attempts: AttemptMetadata[];
}

/**
 * Displays the retry and model upgrade history for a specific workflow request.
 * Visualizes telemetry data captured by the Hinton-inspired Consistency Loop.
 */
export const AttemptHistoryTable: React.FC<AttemptHistoryTableProps> = ({ attempts }) => {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-800 rounded-lg bg-gray-900/20">
        <p className="text-gray-500 text-sm italic">No attempt history recorded for this request.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900/50 shadow-sm backdrop-blur-sm">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-gray-800/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Attempt</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Intelligence Tier</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Latency</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Consistency</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actual Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-transparent">
          {attempts.map((attempt, index) => (
            <tr key={index} className="hover:bg-gray-800/30 transition-colors group">
              <td className="px-4 py-3 text-sm font-bold text-blue-400">#{attempt.attempt + 1}</td>
              <td className="px-4 py-3 text-sm">
                <span className="font-mono text-[10px] px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 group-hover:border-blue-500/30">
                  {attempt.model.split('/').pop()}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                {format(new Date(attempt.timestamp), 'MMM d, HH:mm:ss')}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-300">
                {(attempt.duration_ms / 1000).toFixed(2)}s
              </td>
              <td className="px-4 py-3 text-sm text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  attempt.is_consistent 
                    ? 'bg-green-900/20 text-green-400 border border-green-900/50' 
                    : 'bg-red-900/20 text-red-400 border border-red-900/50'
                }`}>
                  {(attempt.consistency_score * 100).toFixed(0)}%
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-right font-mono text-gray-300">
                ${attempt.cost_usd.toFixed(6)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};