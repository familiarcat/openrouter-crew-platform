'use client';

import React from 'react';
import { Database } from 'lucide-react';

export default function RAGPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">RAG Knowledge Base</h1>
        <p className="text-gray-400">Manage retrieval augmented generation knowledge</p>
      </div>

      <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center gap-3 py-12">
          <Database className="w-6 h-6 text-gray-500" />
          <div className="text-gray-400">
            <p>RAG knowledge base coming soon</p>
            <p className="text-sm text-gray-500 mt-1">Document indexing and retrieval</p>
          </div>
        </div>
      </div>
    </div>
  );
}
