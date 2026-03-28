import React from 'react';

export const DynamicComponentRegistry = {};

export function ComponentGrid({ componentIds }: { componentIds: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {componentIds.map(id => (
        <div key={id} className="p-4 border border-white/10 rounded">
          Component: {id}
        </div>
      ))}
    </div>
  );
}

export function PriorityComponentSelector(props: any) {
  return (
    <div className="p-4 border border-white/10 rounded bg-white/5">
      Priority Component Selector
    </div>
  );
}
