'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--background)',
      color: 'var(--foreground)'
    }}>
      <div className="glass-panel" style={{ 
        padding: '40px', 
        borderRadius: '16px', 
        width: '100%', 
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Sign In</h1>
        
        {error && (
          <div style={{ 
            padding: '10px', 
            background: 'rgba(255, 0, 0, 0.1)', 
            border: '1px solid rgba(255, 0, 0, 0.2)', 
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#ff4444'
          }}>
            Authentication Error
          </div>
        )}

        <button 
          onClick={() => window.location.href = callbackUrl}
          style={{
            padding: '12px 24px',
            background: 'var(--alex-purple, #7c5cff)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Sign in with Mock Auth
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
