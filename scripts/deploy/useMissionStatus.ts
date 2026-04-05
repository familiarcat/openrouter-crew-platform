import { useState, useEffect, useCallback, useRef } from 'react';
import { MissionState, MissionStateSchema } from '@openrouter-crew/shared-schemas'; // Picard: Use alias for shared schemas

interface UseMissionStatusOptions {
  projectId: string;
  initialPollIntervalMs?: number;
  maxPollIntervalMs?: number;
  backoffMultiplier?: number;
}

interface MissionStatusHook {
  mission: MissionState | null;
  loading: boolean;
  error: string | null;
  isPolling: boolean;
  currentPollInterval: number;
  stopPolling: () => void;
  startPolling: () => void;
  refetch: () => Promise<void>;
}

/**
 * React hook for polling mission status from the Crew API Gateway with exponential backoff.
 * It fetches the mission state for a given projectId and handles rate limiting (HTTP 429)
 * by increasing the polling interval.
 *
 * @param options - Configuration for the hook, including projectId and polling intervals.
 * @returns MissionStatusHook - Contains mission data, loading/error states, and polling controls.
 */
export const useMissionStatus = ({
  projectId,
  initialPollIntervalMs = 3000, // Default to 3 seconds
  maxPollIntervalMs = 60000,    // Max 60 seconds
  backoffMultiplier = 2,        // Double the interval on rate limit
}: UseMissionStatusOptions): MissionStatusHook => {
  const [mission, setMission] = useState<MissionState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [currentPollInterval, setCurrentPollInterval] = useState<number>(initialPollIntervalMs);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef<boolean>(true);

  const fetchMission = useCallback(async (isInitialFetch: boolean = false) => {
    if (!projectId) {
      setError('Project ID is required.');
      setLoading(false);
      return;
    }

    if (isInitialFetch) setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proxy/mission/${projectId}`);

      if (response.status === 429) {
        // Rate limit hit, apply exponential backoff
        const newInterval = Math.min(currentPollInterval * backoffMultiplier, maxPollIntervalMs);
        console.warn(`[MissionStatus] Rate limit hit (429). Backing off polling to ${newInterval}ms.`);
        setCurrentPollInterval(newInterval);
        setError('Rate limit exceeded. Polling interval increased.');
        return; // Skip processing data, wait for next poll with new interval
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      const parsedMission = MissionStateSchema.safeParse(rawData);

      if (!parsedMission.success) {
        console.error('[MissionStatus] Zod validation failed:', parsedMission.error);
        throw new Error('Invalid mission data received from API.');
      }

      if (isMounted.current) {
        setMission(parsedMission.data);
        // Reset poll interval if successful after a backoff
        if (currentPollInterval !== initialPollIntervalMs) {
          setCurrentPollInterval(initialPollIntervalMs);
        }
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || 'An unknown error occurred.');
      }
    } finally {
      if (isMounted.current && isInitialFetch) setLoading(false);
    }
  }, [projectId, currentPollInterval, initialPollIntervalMs, maxPollIntervalMs, backoffMultiplier]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    stopPolling(); // Clear any existing timer
    pollTimerRef.current = setInterval(() => fetchMission(), currentPollInterval);
    setIsPolling(true);
  }, [stopPolling, fetchMission, currentPollInterval]);

  useEffect(() => {
    isMounted.current = true;
    fetchMission(true); // Initial fetch
    startPolling();

    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, [projectId, fetchMission, startPolling, stopPolling]);

  return {
    mission,
    loading,
    error,
    isPolling,
    currentPollInterval,
    stopPolling,
    startPolling,
    refetch: () => fetchMission(true), // Allow manual refetch
  };
};