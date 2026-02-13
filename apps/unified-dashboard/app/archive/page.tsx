'use client';

import React from 'react';
import { Archive, RotateCcw, Trash2, Search } from 'lucide-react';

const MOCK_ARCHIVE = [
  { id: 1, name: "Project Alpha 2023", type: "Project", date: "2023-12-15", size: "1.2 GB" },
  { id: 2, name: "Legacy Crew Config v1", type: "Configuration", date: "2024-01-10", size: "45 KB" },
  { id: 3, name: "Q4 Financial Reports", type: "Document", date: "2024-01-05", size: "12 MB" },
  { id: 4, name: "Beta Testing Logs", type: "Logs", date: "2023-11-30", size: "450 MB" },
  { id: 5, name: "Old Marketing Assets", type: "Assets", date: "2023-10-20", size: "2.8 GB" },
];

export default function ArchivePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Archive</h1>
      <p className="text-gray-400 mb-8">Long-term storage for historical project data and memories</p>

      <div className="bg-[#16181d] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search archives..." 
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-500">
            Total Storage: <span className="text-white">4.5 GB</span>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Archived Date</th>
              <th className="p-4 font-medium">Size</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_ARCHIVE.map(item => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Archive size={16} className="text-gray-500" />
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-400">{item.type}</td>
                <td className="p-4 text-gray-400">{item.date}</td>
                <td className="p-4 text-gray-400 font-mono">{item.size}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors" title="Restore">
                      <RotateCcw size={16} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete Forever">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}