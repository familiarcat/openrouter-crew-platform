'use client';

import React, { createContext, useContext, useState } from 'react';

export interface DesignSystemConfig {
  theme: string;
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  borderRadius: string;
  fontFamily: string;
  template?: string;
}

export type DynamicUIConfig = DesignSystemConfig;

export interface NavigationPath {
  id: string;
  label: string;
  path: string;
}

export interface ComponentStructure {
  id: string;
  type: string;
  props?: Record<string, any>;
  children?: ComponentStructure[];
}

const defaultConfig: DesignSystemConfig = {
  theme: 'default',
  mode: 'dark',
  primaryColor: '#7c5cff',
  secondaryColor: '#0077b6',
  borderRadius: '12px',
  fontFamily: 'Inter, sans-serif',
  template: 'modern'
};

const DynamicUiContext = createContext<{
  designSystem: DesignSystemConfig;
  setDesignSystem: React.Dispatch<React.SetStateAction<DesignSystemConfig>>;
}>({
  designSystem: defaultConfig,
  setDesignSystem: () => {},
});

export function getTemplateStyles(template: string, config: DesignSystemConfig) {
  // Basic template logic placeholder
  return {};
}

export function DynamicComponentRenderer({ structure }: { structure: ComponentStructure }) {
  return (
    <div style={{ padding: '8px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '4px' }}>
      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{structure.type}</div>
      {structure.children?.map(child => (
        <DynamicComponentRenderer key={child.id} structure={child} />
      ))}
    </div>
  );
}

export function DynamicUiProvider({ children }: { children: React.ReactNode }) {
  const [designSystem, setDesignSystem] = useState<DesignSystemConfig>(defaultConfig);

  const templateStyles = designSystem?.template
    ? getTemplateStyles(designSystem.template, designSystem)
    : {};

  return (
    <DynamicUiContext.Provider value={{ designSystem, setDesignSystem }}>
      <div style={templateStyles as React.CSSProperties}>
        {children}
      </div>
    </DynamicUiContext.Provider>
  );
}

export function useDynamicUiSystem() {
  return useContext(DynamicUiContext);
}
