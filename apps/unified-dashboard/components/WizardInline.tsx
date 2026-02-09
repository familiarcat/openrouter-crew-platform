'use client';
import React, { useState } from 'react';

export default function WizardInline({ projectId, onApply }: any) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ headline: '', description: '', theme: 'midnight' });

  return (
    <div className="border border-white/10 rounded-xl bg-[#16181d] p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
        <h3 className="font-bold text-white">Project Setup Wizard</h3>
        <div className="flex gap-1">
          {[0, 1, 2].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full ${step >= s ? 'bg-blue-500' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">Project Headline</label>
            <input 
              value={data.headline}
              onChange={e => setData({...data, headline: e.target.value})}
              placeholder="Enter project name..."
              className="w-full p-2 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500">This will be displayed on the dashboard card.</p>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">Description</label>
            <textarea 
              value={data.description}
              onChange={e => setData({...data, description: e.target.value})}
              placeholder="Describe the project goals..."
              className="w-full p-2 h-24 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-blue-500 outline-none resize-none"
            />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-center">
              <div className="text-2xl mb-2">🎉</div>
              <div className="font-bold text-green-400">Ready to Create!</div>
              <div className="text-xs text-gray-400 mt-1">Review your settings before applying.</div>
            </div>
            <div className="text-xs text-gray-500">
              <div>Headline: {data.headline || 'Untitled'}</div>
              <div>Theme: {data.theme}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
        <button 
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50"
        >
          Back
        </button>
        {step < 2 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium"
          >
            Next Step
          </button>
        ) : (
          <button 
            onClick={() => onApply(data)}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded font-medium"
          >
            Create Project
          </button>
        )}
      </div>
    </div>
  );
}
