'use client';
import React from 'react';

export default function ThemeSelector({ 
  value, 
  onChange, 
  mode = 'gallery',
  label = 'Theme Selection'
}: any) {
  const themes = [
    { id: 'midnight', name: 'Midnight', icon: '🌙', color: '#0b0d11' },
    { id: 'ocean', name: 'Ocean', icon: '🌊', color: '#001f3f' },
    { id: 'forest', name: 'Forest', icon: '🌲', color: '#0f2f1f' },
    { id: 'sunset', name: 'Sunset', icon: '🌅', color: '#2d1b2e' },
  ];

  if (mode === 'dropdown') {
    return (
      <div>
        <label className="block mb-2 text-xs font-bold text-blue-400 uppercase">{label}</label>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:border-blue-500 outline-none"
        >
          {themes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block mb-2 text-xs font-bold text-blue-400 uppercase">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`p-3 rounded border transition-all text-left relative overflow-hidden ${value === t.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
          >
            <div className="text-xl mb-1">{t.icon}</div>
            <div className="text-xs font-bold text-white">{t.name}</div>
            {value === t.id && <div className="absolute top-1 right-1 text-blue-500 text-xs">✓</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
