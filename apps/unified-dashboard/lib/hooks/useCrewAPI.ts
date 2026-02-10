'use client';

import { useCallback, useState } from 'react';
import { crewMemoryAPI } from '../crew-api';

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

  return {
    getCompliance,
    getForecast,
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
