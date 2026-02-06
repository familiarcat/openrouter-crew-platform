'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PreviewContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const theme = searchParams.get('theme') || 'default';
  const mode = searchParams.get('mode') || 'light';

  if (!projectId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Project Preview</h1>
        <p>No project ID specified.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      background: mode === 'dark' ? '#1a1a1a' : '#ffffff',
      color: mode === 'dark' ? '#ffffff' : '#000000'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        padding: '40px',
        border: '1px solid rgba(128,128,128,0.2)',
        borderRadius: '12px'
      }}>
        <h1 style={{ marginBottom: '20px' }}>Project Preview: {projectId}</h1>
        <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(128,128,128,0.1)', borderRadius: '8px' }}>
          <strong>Theme:</strong> {theme} <br/>
          <strong>Mode:</strong> {mode}
        </div>
        <p>
          This is a preview of your project. In a real implementation, this would render the actual project components based on the configuration.
        </p>
      </div>
    </div>
  );
}

export default function ProjectPreviewPage() {
  return (
    <Suspense fallback={<div>Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
