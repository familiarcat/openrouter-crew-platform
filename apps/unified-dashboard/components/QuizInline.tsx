'use client';
import React, { useState } from 'react';

export default function QuizInline({ projectId }: any) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  
  const questions = [
    "Is this project customer-facing?",
    "Does it require high security compliance?",
    "Will it use AI agents?"
  ];

  const handleAnswer = () => {
    if (idx < questions.length - 1) setIdx(idx + 1);
    else setDone(true);
  };

  return (
    <div className="p-4 bg-[#16181d] border border-white/10 rounded-xl">
      {!done ? (
        <>
          <div className="text-xs font-bold text-blue-400 uppercase mb-2">Project Assessment {idx + 1}/{questions.length}</div>
          <h4 className="text-sm font-medium text-white mb-4">{questions[idx]}</h4>
          <div className="flex gap-2">
            <button onClick={handleAnswer} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-white transition-colors">Yes</button>
            <button onClick={handleAnswer} className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-white transition-colors">No</button>
          </div>
        </>
      ) : (
        <div className="text-center py-2">
          <div className="text-2xl mb-2">✨</div>
          <div className="font-bold text-white text-sm">Assessment Complete</div>
          <div className="text-xs text-gray-500 mt-1">Recommended Profile: High Security / AI-Enabled</div>
          <button onClick={() => {setIdx(0); setDone(false)}} className="mt-3 text-xs text-blue-400 hover:text-blue-300">Retake</button>
        </div>
      )}
    </div>
  );
}
