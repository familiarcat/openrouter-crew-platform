'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Project } from '@/types/project';

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Project Alpha', status: 'active', description: 'Mock project for testing', updatedAt: new Date(Date.now() - 86400000).toISOString(), headline: 'Project Alpha', subheadline: 'Alpha Sub', theme: 'gradient', components: [{id: 'c1', title: 'comp1', type: 'hero', status: 'active', body: 'comp body'}] },
  { id: '2', name: 'Project Beta', status: 'draft', description: 'Another mock project', updatedAt: new Date().toISOString(), headline: 'Project Beta', subheadline: 'Beta Sub', theme: 'cyberpunk', components: [] }
];

const initialState = {
  globalTheme: 'default',
  setGlobalTheme: (theme: string) => {},
  updateGlobalTheme: (theme: string) => {},
  updateTheme: (projectId: string, theme: string) => {},
  updateProject: (projectId: string, field: string, value: any) => {},
  deleteProject: (projectId: string) => {},
  updateComponent: (projectId: string, componentId: string, updates: any) => {},
  addComponents: (projectId: string, components: any[]) => {},
  reorderComponents: (projectId: string, components: any[]) => {},
  user: { name: 'Guest' },
  isLoaded: true,
  projects: MOCK_PROJECTS
};

const AppStateContext = createContext(initialState);

export function StateProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppStateContext.Provider value={initialState}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}
