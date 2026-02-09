'use client';
import React, { useState, useEffect, useRef } from 'react';

interface TerminalLine {
  id: string;
  timestamp: string;
  type: 'output' | 'error' | 'success' | 'info';
  content: string;
}

export default function TerminalWindow({
  title = 'Process Monitor',
  height = '400px'
}: { title?: string; height?: string }) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Simulate logs
  useEffect(() => {
    const interval = setInterval(() => {
      const types: TerminalLine['type'][] = ['output', 'output', 'info', 'success'];
      const msgs = ['Processing batch...', 'Syncing data...', 'Optimizing vectors...', 'Health check passed'];
      const newLine: TerminalLine = {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: types[Math.floor(Math.random() * types.length)],
        content: msgs[Math.floor(Math.random() * msgs.length)]
      };
      setLines(prev => [...prev.slice(-19), newLine]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const getColor = (type: string) => {
    switch(type) {
      case 'error': return '#ff5e5e';
      case 'success': return '#00ffaa';
      case 'info': return '#00d4ff';
      default: return '#d0d0d0';
    }
  };

  return (
    <div style={{ height }} className="flex flex-col bg-[#0a0a0f] border border-white/10 rounded-lg overflow-hidden shadow-xl font-mono text-xs">
      <div className="bg-white/5 p-2 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2 text-green-400 font-bold">
          <span>🖖</span><span>{title}</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {lines.map(line => (
          <div key={line.id} style={{ color: getColor(line.type) }}>
            <span className="opacity-50 mr-2">[{line.timestamp}]</span>
            <span>{line.type === 'success' ? '✅' : line.type === 'error' ? '❌' : '$'} {line.content}</span>
          </div>
        ))}
        {lines.length === 0 && <div className="text-gray-600 italic text-center mt-10">Waiting for output...</div>}
      </div>
    </div>
  );
}
