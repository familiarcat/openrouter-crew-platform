'use client';

import React, { useMemo } from 'react';
import { DynamicComponentRenderer, ComponentStructure, DesignSystemConfig } from '@/lib/dynamic-ui-system';

interface DynamicDataDrilldownProps {
  data: any;
  title?: string;
  initialPath?: { label: string; path: string }[];
}

export default function DynamicDataDrilldown({ data, title = 'Data Drilldown', initialPath = [] }: DynamicDataDrilldownProps) {
  // Default theme values since we are standardizing on DesignSystemConfig
  const globalTheme = 'default'; 

  const designSystem: DesignSystemConfig = useMemo(() => {
    return {
      theme: globalTheme,
      mode: 'dark',
      primaryColor: '#7c5cff',
      secondaryColor: '#0077b6',
      borderRadius: '12px',
      fontFamily: 'Inter, sans-serif',
      template: 'modern'
    };
  }, [globalTheme]);

  // Mock structure for renderer
  const structure: ComponentStructure = {
    id: 'root',
    type: 'container',
    children: []
  };

  return (
    <div className="glass-panel p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="mb-4">
        <div className="text-sm opacity-70">Initial Path: {initialPath.map(p => p.label).join(' / ')}</div>
      </div>
      <DynamicComponentRenderer structure={structure} />
      <pre className="mt-4 p-4 bg-black/20 rounded text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
