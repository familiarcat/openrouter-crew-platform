'use client';

import { useState, useEffect } from 'react';

export interface SyncStatus {
  connected: boolean;
  lastSync: string | null;
  syncCount: number;
  pendingUpdates: number;
}

export interface SyncUpdate {
  id: string;
  type: string;
  status: 'pending' | 'synced' | 'failed';
  timestamp: string;
}

// Fix: Removed generic type argument from React.useState since React is typed as any
export function createUseCrossServerSync(React: any) {
  return function useCrossServerSync(projectId: string) {
    const [status, setStatus] = React.useState({
      connected: false,
      lastSync: null,
      syncCount: 0,
      pendingUpdates: 0
    });

    React.useEffect(() => {
      // Mock connection
      const timer = setTimeout(() => {
        setStatus((prev: any) => ({ ...prev, connected: true }));
      }, 1000);
      return () => clearTimeout(timer);
    }, [projectId]);

    return status as SyncStatus;
  };
}

// Standard hook export for direct usage
export function useCrossServerSync(projectId: string) {
  const [status, setStatus] = useState<SyncStatus>({
    connected: false,
    lastSync: null,
    syncCount: 0,
    pendingUpdates: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus(prev => ({ ...prev, connected: true }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectId]);

  return status;
}
