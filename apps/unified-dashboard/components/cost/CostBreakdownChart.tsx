/**
 * Cost Breakdown Chart Component
 * Displays pie chart of costs by operation type
 */

'use client';

import React from 'react';

interface CostBreakdown {
  embedding: number;
  compression: number;
  clustering: number;
  storage: number;
  total: number;
}

interface CostBreakdownChartProps {
  breakdown: CostBreakdown | null;
}

export default function CostBreakdownChart({ breakdown }: CostBreakdownChartProps) {
  if (!breakdown) {
    return <div className="text-gray-500">Loading breakdown...</div>;
  }

  const total = breakdown.total;
  const items = [
    {
      label: 'Embedding',
      value: breakdown.embedding,
      color: 'bg-blue-500',
      icon: '⚡',
    },
    {
      label: 'Compression',
      value: breakdown.compression,
      color: 'bg-purple-500',
      icon: '📦',
    },
    {
      label: 'Clustering',
      value: breakdown.clustering,
      color: 'bg-orange-500',
      icon: '🔗',
    },
    {
      label: 'Storage',
      value: breakdown.storage,
      color: 'bg-green-500',
      icon: '💾',
    },
  ].filter(item => item.value > 0);

  const getPercentage = (value: number): number => (value / total) * 100;

  // Calculate SVG pie chart
  let currentAngle = 0;
  const slices = items.map((item) => {
    const percentage = getPercentage(item.value);
    const sliceAngle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    // Convert angles to coordinates
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    currentAngle = endAngle;

    return { ...item, path, percentage };
  });

  return (
    <div className="flex gap-8">
      {/* Pie Chart */}
      <div className="flex-1">
        <svg viewBox="0 0 100 100" className="w-full">
          {slices.map((slice, idx) => {
            const colorMap: Record<string, string> = {
              'bg-blue-500': '#3b82f6',
              'bg-purple-500': '#a855f7',
              'bg-orange-500': '#f97316',
              'bg-green-500': '#22c55e',
            };
            return (
              <path
                key={idx}
                d={slice.path}
                fill={colorMap[slice.color]}
                stroke="white"
                strokeWidth="1.5"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={`${slice.label}: $${slice.value.toFixed(2)} (${slice.percentage.toFixed(1)}%)`}
              />
            );
          })}

          {/* Center circle */}
          <circle cx="50" cy="50" r="25" fill="white" />
          <text x="50" y="52" textAnchor="middle" className="text-lg font-bold" fill="#1f2937">
            ${total.toFixed(2)}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {slices.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
            </div>
            <p className="text-sm font-bold text-gray-700">${item.value.toFixed(2)}</p>
          </div>
        ))}

        {/* Total */}
        <div className="border-t pt-4 flex items-center justify-between">
          <p className="font-semibold text-gray-700">Total Cost</p>
          <p className="text-lg font-bold text-gray-900">${total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
