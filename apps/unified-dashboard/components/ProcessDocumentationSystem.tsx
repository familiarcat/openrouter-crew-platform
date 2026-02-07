'use client';
import React, { useState } from 'react';

export default function ProcessDocumentationSystem() {
  const [activeDoc, setActiveDoc] = useState('overview');

  const docs = [
    { id: 'overview', title: 'System Overview' },
    { id: 'deployment', title: 'Deployment Guide' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
  ];

  return (
    <div className="flex h-full gap-4">
      <div className="w-1/3 border-r border-white/10 pr-2">
        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Documentation</div>
        <ul className="space-y-1">
          {docs.map(doc => (
            <li 
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`px-2 py-1.5 rounded text-sm cursor-pointer ${activeDoc === doc.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {doc.title}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-auto">
        <h3 className="text-xl font-bold mb-4">{docs.find(d => d.id === activeDoc)?.title}</h3>
        <div className="prose prose-invert prose-sm">
          <p className="text-gray-300">
            This is the content for the {activeDoc} documentation. In a real implementation, this would be rendered from markdown files or a CMS.
          </p>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-blue-300 font-bold mb-1">Key Takeaway</h4>
            <p className="text-sm text-blue-200/80">Always verify environment variables before deployment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
