'use client';

import React from 'react';
import Link from 'next/link';

export default function ProjectsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Projects</h1>
          <Link 
            href="/projects/new"
            style={{ 
              padding: '12px 24px', 
              background: 'var(--alex-purple, #7c5cff)', 
              color: 'white', 
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            New Project
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', opacity: 0.7 }}>No projects found. Create your first one!</p>
        </div>
      </div>
    </div>
  );
}
