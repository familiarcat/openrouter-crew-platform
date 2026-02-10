'use client';

import { useCallback, useState } from 'react';
import { crewMemoryAPI } from '../crew-api';
import type { Memory } from '@openrouter-crew/crew-api-client';

/**
 * Hook for managing crew memory operations with loading/error states
 */
export function useCrewMemory(crewId?: string, userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    return null;
  };

  const create = useCallback(
    async (content: string, type: any, options?: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.create(content, type, {
          ...options,
          crewId,
          userId,
        });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  const list = useCallback(
    async (options?: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.list({ ...options, crewId, userId });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  const search = useCallback(
    async (query: string, options?: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.search(query, { ...options, crewId, userId });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  const update = useCallback(
    async (id: string, updates: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.update(id, updates, { crewId, userId });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  const delete_ = useCallback(
    async (id: string, permanent = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.delete(id, permanent, { crewId, userId });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  const restore = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.restore(id, { crewId, userId });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  return {
    create,
    list,
    search,
    update,
    delete: delete_,
    restore,
    loading,
    error,
  };
}

/**
 * Hook for crew compliance and forecasting
 */
export function useCrewStatus(crewId?: string, userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    return null;
  };

  const getCompliance = useCallback(
    async (period?: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.getComplianceStatus({
          period,
          crewId,
          userId,
        });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  const getForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await crewMemoryAPI.getExpirationForecast({
        crewId,
        userId,
      });
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [crewId, userId]);

  const getRetentionStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await crewMemoryAPI.getRetentionStatistics({
        crewId,
      });
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  const getExpiringMemories = useCallback(
    async (daysUntilExpiration: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.findExpiringMemories(daysUntilExpiration, {
          crewId,
        });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId]
  );

  const getMemoriesReadyForDelete = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await crewMemoryAPI.findMemoriesReadyForHardDelete({
        crewId,
      });
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [crewId]);

  return {
    getCompliance,
    getForecast,
    getRetentionStats,
    getExpiringMemories,
    getMemoriesReadyForDelete,
    loading,
    error,
  };
}

/**
 * Hook for crew execution
 */
export function useCrewExecution(crewId?: string, userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    return null;
  };

  const execute = useCallback(
    async (input: string, budget?: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await crewMemoryAPI.execute(input, {
          budget,
          crewId,
          userId,
        });
        return result;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [crewId, userId]
  );

  return {
    execute,
    loading,
    error,
  };
}

/**
 * Hook for memory decay metrics
 */
export function useMemoryDecay(memory?: Memory) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    return null;
  };

  const getMetrics = useCallback(async () => {
    if (!memory) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await crewMemoryAPI.getDecayMetrics(memory);
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [memory]);

  return {
    getMetrics,
    loading,
    error,
  };
}
