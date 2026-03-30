'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { SovereignAgentViewport } from '@/components/SovereignAgentViewport'; // Corrected local reference
import { DeploymentLogList } from '@/components/DeploymentLogList';
import { useOrchestration } from '@/hooks/useOrchestration';
import { Loader2, Zap, AlertCircle, Rocket, FolderKanban } from 'lucide-react';

export default function HomePage() {
  const [problemInput, setProblemInput] = useState('');
  const [currentProject, setCurrentProject] = useState('Global Fleet');
  const { data, isLoading, error, solveProblem, reset } = useOrchestration();

  // Refactored to be a universal codebase analysis
  const handleAnalyzeCodebase = async () => {
    const codebaseAnalysisPrompt = `
      Perform a comprehensive analysis of the OpenRouter Crew Platform codebase.
      Focus on identifying:
      1. Domain-Driven Design (DDD) boundary adherence.
      2. Opportunities for cost optimization in LLM calls.
      3. Gaps in local development and testing readiness.
      4. Potential security vulnerabilities or protocol violations (Dark Forest).
      5. Recommendations for improving agent coordination and prompt engineering.
      
      Synthesize your findings into a structured report, highlighting key areas for improvement.
    `;
    await solveProblem(codebaseAnalysisPrompt);
  };

  // Determine active agent for display
  const activeAgentId = data?.triage?.agentId || 'orchestrator';
  const activeAgentName = activeAgentId.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Orchestration Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-blue-500/20 border border-blue-500/30">
                  <Rocket className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mission Control</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Universal Command Interface</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-400">
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Project:</span>
                <select 
                  value={currentProject} 
                  onChange={(e) => setCurrentProject(e.target.value)}
                  className="bg-transparent text-blue-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Global Fleet">Global Fleet</option>
                  <option value="BarItalia STL">BarItalia STL</option>
                  <option value="Agency Scout">Agency Scout</option>
                </select>
              </div>
            </div>

            <textarea
              className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              rows={4}
              placeholder="Enter your mission objective for the crew..."
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              disabled={isLoading}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                Clear Mission
              </button>
              <button
                onClick={handleAnalyzeCodebase}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                ) : (
                  <Zap className="w-4 h-4 inline-block mr-2" />
                )}
                Analyze Codebase
              </button>
            </div>

            {isLoading && (
              <div className="mt-4 flex items-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Orchestrator is engaging the crew...</span>
              </div>
            )}
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Error: {error}</span>
              </div>
            )}
          </div>

          {/* Sovereign Agent Viewport */}
          {data && (
            <SovereignAgentViewport
              agentName={activeAgentName}
              agentId={activeAgentId}
              status={data.success ? 'SUCCESS' : 'ERROR'}
              streamContent={data.synthesis}
              metadata={{
                model: data.metadata.model,
                tokensUsed: data.metadata.tokens_used,
                cost: data.metadata.cost, // Assuming cost is added to metadata
                executionTimeMs: data.metadata.execution_time_ms,
              }}
              cached={data.metadata.cached}
              isActive={true}
            />
          )}
        </div>

        {/* Side Panel: Deployment Logs */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white mb-4">Deployment History</h2>
          <DeploymentLogList limit={5} />
        </div>
      </div>
    </DashboardLayout>
  );
}