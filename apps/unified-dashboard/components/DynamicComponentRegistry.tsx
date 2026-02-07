'use client';
import React from 'react';

export function ComponentGrid({ componentIds }: { componentIds: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {componentIds.map(id => (
        <div key={id} className="p-4 border border-white/10 rounded bg-white/5">
          Component: {id}
        </div>
      ))}
      <div className="p-4 border border-dashed border-white/20 rounded text-center text-gray-500">
        Dynamic Component Grid Placeholder
      </div>
    </div>
  );
}

export const DynamicComponentRegistry = {};
