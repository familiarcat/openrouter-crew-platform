'use client';
import React from 'react';

export default function SimpleChart({ data, chartType = 'bar', title, height = 200 }: any) {
  const max = Math.max(...data.map((d: any) => d.value));
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 h-full flex flex-col">
      {title && <h4 className="text-sm font-bold text-gray-300 mb-4">{title}</h4>}
      
      <div className="flex-1 flex items-end gap-2" style={{ minHeight: height }}>
        {chartType === 'bar' && data.map((d: any, i: number) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div 
              className="w-full rounded-t transition-all duration-500 relative"
              style={{ height: `${(d.value / max) * 100}%`, background: colors[i % colors.length] }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {d.value}
              </div>
            </div>
            <span className="text-[10px] text-gray-500 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
        
        {chartType === 'pie' && (
          <div className="w-full h-full flex items-center justify-center relative">
             <div className="w-32 h-32 rounded-full border-8 border-blue-500/30 flex items-center justify-center">
               <span className="text-xs text-gray-400">Pie Chart<br/>Placeholder</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
