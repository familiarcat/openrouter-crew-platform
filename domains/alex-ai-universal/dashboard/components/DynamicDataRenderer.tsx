'use client';

import React from 'react';
import { DynamicComponentRenderer, ComponentStructure } from '@/lib/dynamic-ui-system';

interface DynamicDataRendererProps {
  data: any;
  structure: ComponentStructure;
}

export default function DynamicDataRenderer({ data, structure }: DynamicDataRendererProps) {
  return (
    <div className="dynamic-renderer">
      <DynamicComponentRenderer structure={structure} />
    </div>
  );
}
