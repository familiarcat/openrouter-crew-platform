'use client';

import { useState, useCallback } from 'react';
import { OrchestratorResponse } from '@openrouter-crew/agent-orchestration';

interface UseOrchestrationReturn {
  data: OrchestratorResponse | null;
  isLoading: boolean;
  error: string | null;
  solveProblem: (problem: string, agents?: string[], projectId?: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to interact with the /api/orchestrate route.
 * Handles state management for the UI -> MCP -> n8n workflow.
 */
export const useOrchestration = (): UseOrchestrationReturn => {
  const [data, setData] = useState<OrchestratorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const solveProblem = useCallback(async (problem: string, agents?: string[], projectId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem, agents, projectId }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.error || `Orchestration failed with status ${response.status}`);
      }

      setData(result);
    } catch (err: any) {
      console.error('[useOrchestration] Error:', err);
      setError(err.message || 'An unexpected error occurred during orchestration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    solveProblem,
    reset
  };
};