'use client';
import React from 'react';

export type ProgressStatus = 'recording' | 'retrieved' | 'failed' | 'complete' | 'loading';

interface UniversalProgressBarProps {
  current: number;
  total: number;
  description?: string;
  label?: string;
  status?: ProgressStatus;
  showPercentage?: boolean;
  animated?: boolean;
}

const STATUS_EMOJIS: Record<ProgressStatus, string> = {
  recording: '📝',
  retrieved: '📋',
  failed: '❌',
  complete: '✅',
  loading: '⏳'
};

const STATUS_COLORS: Record<ProgressStatus, string> = {
  recording: '#00ffaa',
  retrieved: '#00d4ff',
  failed: '#ff5e5e',
  complete: '#00ffaa',
  loading: '#ffd166'
};

export default function UniversalProgressBar({
  current,
  total,
  description,
  label,
  status = 'loading',
  showPercentage = true,
  animated = true
}: UniversalProgressBarProps) {
  const desc = description || label || 'Progress';
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const emoji = STATUS_EMOJIS[status];
  const color = STATUS_COLORS[status];
  
  return (
    <div className="font-mono text-[13px] leading-relaxed text-[#d0d0d0] p-3 bg-black/20 rounded border border-white/10 mb-1">
      <div className="flex items-center gap-2 mb-1">
        <span className={animated && status === 'loading' ? 'animate-pulse' : ''}>{emoji}</span>
        <span className="flex-1" style={{ color }}>{desc}</span>
        {showPercentage && <span className="text-gray-500 text-[11px]">{percentage}%</span>}
      </div>
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden relative border border-white/10">
          <div 
            className="h-full transition-all duration-300 relative overflow-hidden"
            style={{ width: `${percentage}%`, background: color }}
          >
            {status === 'loading' && animated && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
            )}
          </div>
        </div>
        <span className="text-[11px] text-gray-500 min-w-[50px] text-right font-mono">{current}/{total}</span>
      </div>
    </div>
  );
}
