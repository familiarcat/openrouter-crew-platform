/**
 * Polling Service - Request Status Tracking
 *
 * Implements real-time polling for async workflow requests
 * - Polls pending requests at configurable intervals
 * - Updates status in Supabase
 * - Supports WebSocket subscriptions for real-time updates
 * - Automatic cleanup of expired requests
 * - Cost-aware retry logic
 */

export interface PollingConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  pollIntervalMs?: number;
  maxConcurrentPolls?: number;
  maxPolls?: number;
}

export interface PollStatus {
  requestId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';
  pollCount: number;
  response?: Record<string, any>;
  error?: string;
  durationMs?: number;
  cost?: number;
}

export interface PollingSubscription {
  requestId: string;
  callback: (status: PollStatus) => void;
  unsubscribe: () => void;
}

/**
 * Polling Service - Tracks and updates async request status
 */
export class PollingService {
  private config: PollingConfig;
  private supabaseClient?: any;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private subscriptions: Map<string, Set<(status: PollStatus) => void>> = new Map();
  private activePolls: Set<string> = new Set();

  constructor(config: PollingConfig = {}) {
    this.config = {
      pollIntervalMs: 5000,
      maxConcurrentPolls: 10,
      maxPolls: 60,
      ...config,
    };
  }

  /**
   * Initialize Supabase client
   */
  private async initSupabaseClient(): Promise<any> {
    if (this.supabaseClient) return this.supabaseClient;

    try {
      const { createClient } = require('@supabase/supabase-js');
      this.supabaseClient = createClient(
        this.config.supabaseUrl || process.env.SUPABASE_URL,
        this.config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      return this.supabaseClient;
    } catch (error) {
      console.warn('Failed to initialize Supabase client:', error);
      return null;
    }
  }

  /**
   * Start polling a request for status updates
   */
  async startPolling(requestId: string): Promise<void> {
    if (this.activePolls.has(requestId)) {
      return;
    }

    // Check if we're at max concurrent polls
    if (this.activePolls.size >= this.config.maxConcurrentPolls!) {
      console.warn(
        `Max concurrent polls (${this.config.maxConcurrentPolls}) reached. Queueing request ${requestId}`
      );
      // Queue for later
      setTimeout(() => this.startPolling(requestId), 1000);
      return;
    }

    this.activePolls.add(requestId);

    // Set up polling interval
    const interval = setInterval(async () => {
      await this.pollRequest(requestId);
    }, this.config.pollIntervalMs);

    this.pollingIntervals.set(requestId, interval);
  }

  /**
   * Stop polling a request
   */
  stopPolling(requestId: string): void {
    const interval = this.pollingIntervals.get(requestId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(requestId);
    }
    this.activePolls.delete(requestId);
  }

  /**
   * Poll a single request for status update
   */
  async pollRequest(requestId: string): Promise<PollStatus | null> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) return null;

    try {
      // Fetch current request status
      const { data, error } = await supabase
        .from('workflow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.warn(`Failed to fetch request ${requestId}:`, error);
        return null;
      }

      // Update poll count
      await supabase
        .from('workflow_requests')
        .update({ poll_count: data.poll_count + 1 })
        .eq('id', requestId);

      const status: PollStatus = {
        requestId,
        status: data.status,
        pollCount: data.poll_count + 1,
        response: data.response_payload,
        error: data.error_message,
        durationMs: data.duration_ms,
        cost: data.actual_cost_usd,
      };

      // Notify subscribers
      this.notifySubscribers(requestId, status);

      // Check if polling should stop
      if (
        status.status === 'success' ||
        status.status === 'failed' ||
        status.status === 'timeout' ||
        status.status === 'cancelled' ||
        status.pollCount >= this.config.maxPolls!
      ) {
        this.stopPolling(requestId);
      }

      return status;
    } catch (error) {
      console.warn('Error polling request:', error);
      return null;
    }
  }

  /**
   * Get current request status (single poll, no subscription)
   */
  async getStatus(requestId: string): Promise<PollStatus | null> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('workflow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) return null;

      return {
        requestId,
        status: data.status,
        pollCount: data.poll_count,
        response: data.response_payload,
        error: data.error_message,
        durationMs: data.duration_ms,
        cost: data.actual_cost_usd,
      };
    } catch (error) {
      console.warn('Error fetching status:', error);
      return null;
    }
  }

  /**
   * Wait for a request to complete with timeout
   */
  async waitForCompletion(
    requestId: string,
    timeoutMs: number = 300000
  ): Promise<PollStatus | null> {
    const startTime = Date.now();
    const pollInterval = this.config.pollIntervalMs!;

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getStatus(requestId);

      if (!status) {
        return null;
      }

      if (
        status.status === 'success' ||
        status.status === 'failed' ||
        status.status === 'timeout' ||
        status.status === 'cancelled'
      ) {
        return status;
      }

      // Wait before next poll
      await this.delay(pollInterval);
    }

    // Timeout reached
    return {
      requestId,
      status: 'timeout',
      pollCount: Math.floor((Date.now() - startTime) / pollInterval),
    };
  }

  /**
   * Subscribe to status updates for a request
   */
  subscribe(
    requestId: string,
    callback: (status: PollStatus) => void
  ): PollingSubscription {
    if (!this.subscriptions.has(requestId)) {
      this.subscriptions.set(requestId, new Set());
      // Start polling when first subscription added
      this.startPolling(requestId);
    }

    const callbacks = this.subscriptions.get(requestId)!;
    callbacks.add(callback);

    return {
      requestId,
      callback,
      unsubscribe: () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(requestId);
          this.stopPolling(requestId);
        }
      },
    };
  }

  /**
   * Subscribe to all pending requests (batch monitoring)
   */
  async subscribeToActive(
    callback: (requests: PollStatus[]) => void
  ): Promise<() => void> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client unavailable');
    }

    try {
      // Initial fetch
      const { data } = await supabase
        .from('workflow_requests')
        .select('*')
        .in('status', ['pending', 'running']);

      if (data) {
        const statuses = data.map((req: any) => ({
          requestId: req.id,
          status: req.status,
          pollCount: req.poll_count,
          durationMs: req.duration_ms,
          cost: req.actual_cost_usd,
        }));
        callback(statuses);
      }

      // Subscribe to real-time changes
      const subscription = supabase
        .from('workflow_requests')
        .on('*', (payload: any) => {
          if (
            payload.new.status === 'pending' ||
            payload.new.status === 'running'
          ) {
            // Refetch and notify
            this.getActiveRequests().then(callback);
          }
        })
        .subscribe();

      return () => {
        supabase.removeSubscription(subscription);
      };
    } catch (error) {
      console.warn('Error subscribing to active requests:', error);
      throw error;
    }
  }

  /**
   * Get all active (pending/running) requests
   */
  async getActiveRequests(): Promise<PollStatus[]> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('workflow_requests')
        .select('*')
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false });

      if (error) return [];

      return data.map((req: any) => ({
        requestId: req.id,
        status: req.status,
        pollCount: req.poll_count,
        response: req.response_payload,
        error: req.error_message,
        durationMs: req.duration_ms,
        cost: req.actual_cost_usd,
      }));
    } catch (error) {
      console.warn('Error fetching active requests:', error);
      return [];
    }
  }

  /**
   * Get completed requests (for history)
   */
  async getCompletedRequests(
    limit: number = 50
  ): Promise<PollStatus[]> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('workflow_requests')
        .select('*')
        .in('status', ['success', 'failed', 'timeout', 'cancelled'])
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) return [];

      return data.map((req: any) => ({
        requestId: req.id,
        status: req.status,
        pollCount: req.poll_count,
        response: req.response_payload,
        error: req.error_message,
        durationMs: req.duration_ms,
        cost: req.actual_cost_usd,
      }));
    } catch (error) {
      console.warn('Error fetching completed requests:', error);
      return [];
    }
  }

  /**
   * Notify all subscribers of a status update
   */
  private notifySubscribers(requestId: string, status: PollStatus): void {
    const callbacks = this.subscriptions.get(requestId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(status);
        } catch (error) {
          console.warn('Error in polling subscriber:', error);
        }
      });
    }
  }

  /**
   * Clean up expired requests
   */
  async cleanupExpiredRequests(): Promise<number> {
    const supabase = await this.initSupabaseClient();
    if (!supabase) return 0;

    try {
      const { data, error } = await supabase
        .from('workflow_requests')
        .delete()
        .in('status', ['pending', 'running'])
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.warn('Error cleaning up expired requests:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.warn('Error in cleanup:', error);
      return 0;
    }
  }

  /**
   * Get polling statistics
   */
  getStatistics(): {
    activePolls: number;
    totalSubscriptions: number;
    pollingIntervals: number;
  } {
    let totalSubscriptions = 0;
    this.subscriptions.forEach((callbacks) => {
      totalSubscriptions += callbacks.size;
    });

    return {
      activePolls: this.activePolls.size,
      totalSubscriptions,
      pollingIntervals: this.pollingIntervals.size,
    };
  }

  /**
   * Shutdown the polling service
   */
  shutdown(): void {
    // Clear all intervals
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();

    // Clear subscriptions
    this.subscriptions.clear();
    this.activePolls.clear();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for global access
 */
let pollingServiceInstance: PollingService | null = null;

export function getPollingService(config?: PollingConfig): PollingService {
  if (!pollingServiceInstance) {
    pollingServiceInstance = new PollingService(config);
  }
  return pollingServiceInstance;
}
