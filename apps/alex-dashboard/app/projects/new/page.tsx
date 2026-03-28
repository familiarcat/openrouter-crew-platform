'use client';

import React, { useState } from 'react';

type Step = 'quiz' | 'theme' | 'wizard' | 'review' | 'generating';

export default function NewProjectPage() {
  const [step, setStep] = useState<Step>('quiz');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Create New Project</h1>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {(['quiz', 'theme', 'wizard', 'review', 'generating'] as Step[]).map((s) => (
            <div 
              key={s} 
              style={{ 
                height: '4px', 
                flex: 1, 
                borderRadius: '2px', 
                background: getStepStatus(step, s) ? 'var(--alex-purple, #7c5cff)' : 'var(--alex-gold, #c9a227)',
                opacity: getStepStatus(step, s) ? 1 : 0.3
              }} 
            />
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px' }}>
          {step === 'quiz' && (
            <div>
              <h2>Project Quiz</h2>
              <p>What kind of project are you building?</p>
              <button 
                onClick={() => setStep('theme')} 
                style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--alex-blue)', border: 'none', borderRadius: '8px', color: 'white' }}
              >
                Next
              </button>
            </div>
          )}
          {step === 'theme' && (
            <div>
              <h2>Select Theme</h2>
              <button 
                onClick={() => setStep('wizard')} 
                style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--alex-blue)', border: 'none', borderRadius: '8px', color: 'white' }}
              >
                Next
              </button>
            </div>
          )}
          {step === 'wizard' && (
            <div>
              <h2>Configuration Wizard</h2>
              <button 
                onClick={() => setStep('review')} 
                style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--alex-blue)', border: 'none', borderRadius: '8px', color: 'white' }}
              >
                Next
              </button>
            </div>
          )}
          {step === 'review' && (
            <div>
              <h2>Review</h2>
              <button 
                onClick={() => setStep('generating')} 
                style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--alex-purple)', border: 'none', borderRadius: '8px', color: 'white' }}
              >
                Create Project
              </button>
            </div>
          )}
          {step === 'generating' && (
            <div>
              <h2>Generating Project...</h2>
              <p>Please wait while we set up your crew.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStepStatus(current: Step, target: Step) {
  const steps: Step[] = ['quiz', 'theme', 'wizard', 'review', 'generating'];
  return steps.indexOf(current) >= steps.indexOf(target);
}
