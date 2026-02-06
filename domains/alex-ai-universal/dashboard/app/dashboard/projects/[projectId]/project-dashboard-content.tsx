'use client';

import React from 'react';

export default function ProjectDashboardContent({ projectId }: { projectId: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      padding: '40px 20px',
      color: 'var(--foreground)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
            Project Dashboard: {projectId}
          </h1>
          <p style={{ opacity: 0.8 }}>
            Manage your AI crew, workflows, and resources.
          </p>
        </header>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Crew Status</h2>
            <p>Active Agents: 0</p>
          </div>
          
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Active Workflows</h2>
            <p>Running: 0</p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Recent Events</h2>
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
