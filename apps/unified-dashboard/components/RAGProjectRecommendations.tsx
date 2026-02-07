'use client';
import React from 'react';

export default function RAGProjectRecommendations() {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-sm text-purple-300">Optimization Opportunity</h4>
          <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded">High Confidence</span>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          Based on recent error logs, implementing a circuit breaker pattern for the Venue API could reduce downtime by 15%.
        </p>
        <button className="w-full py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs text-purple-200 transition-colors">
          Apply Recommendation
        </button>
      </div>
      
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg opacity-75">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-sm text-gray-300">Code Quality</h4>
          <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded">Medium</span>
        </div>
        <p className="text-xs text-gray-400">
          Consider extracting the shared validation logic in the booking flow to a separate utility.
        </p>
      </div>
    </div>
  );
}
