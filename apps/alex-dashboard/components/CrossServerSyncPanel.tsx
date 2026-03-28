'use client';

import React from 'react';
import { useCrossServerSync } from '@/lib/cross-server-sync';

export default function CrossServerSyncPanel() {
  const status = useCrossServerSync('current-project');

  return (
    <div style={{
      padding: '24px',
      background: 'var(--card-bg, rgba(255,255,255,0.05))',
      border: '1px solid var(--border, rgba(255,255,255,0.1))',
      borderRadius: 'var(--radius, 12px)',
    }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Cross-Server Sync</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: status.connected ? '#10b981' : '#ef4444'
        }} />
        <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Last Sync</div>
          <div style={{ fontFamily: 'monospace' }}>{status.lastSync || 'Never'}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Pending Updates</div>
          <div style={{ fontWeight: 'bold' }}>{status.pendingUpdates}</div>
        </div>
      </div>
    </div>
  );
}
