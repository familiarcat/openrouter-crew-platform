/**
 * Batch Processor
 * Handles queuing and batch processing of expensive operations
 *
 * Features:
 * - Queue-based processing
 * - Configurable batch size and concurrency
 * - Retry logic for failed items
 * - Progress tracking
 */

export interface BatchItem<T> {
  /** Unique identifier */
  id: string;
  /** Item data */
  data: T;
  /** Priority (higher = process first) */
  priority?: number;
  /** Retry count */
  retries?: number;
}

export interface BatchConfig {
  /** Maximum items per batch */
  batchSize?: number;
  /** Maximum concurrent batches */
  maxConcurrent?: number;
  /** Maximum retries per item */
  maxRetries?: number;
  /** Timeout per batch in ms */
  timeoutMs?: number;
  /** Delay between batches in ms */
  delayMs?: number;
}

export interface BatchResult<R> {
  /** Successfully processed items */
  succeeded: Array<{ id: string; result: R }>;
  /** Failed items with errors */
  failed: Array<{ id: string; error: string; retries: number }>;
  /** Total processing time */
  processingTimeMs: number;
  /** Items processed */
  itemsProcessed: number;
  /** Items failed */
  itemsFailed: number;
}

export type BatchProcessor<T, R> = (items: BatchItem<T>[]) => Promise<Array<{ id: string; result: R }>>;

/**
 * Batch Processor Service
 * Manages queued batch processing with retry logic
 */
export class BatchProcessorService<T, R> {
  private config: Required<BatchConfig>;
  private queue: BatchItem<T>[] = [];
  private processing = false;
  private processedItems = new Map<string, { result?: R; error?: string }>();

  constructor(config: BatchConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      maxConcurrent: config.maxConcurrent || 3,
      maxRetries: config.maxRetries || 3,
      timeoutMs: config.timeoutMs || 30000,
      delayMs: config.delayMs || 100,
    };
  }

  /**
   * Add item to queue for batch processing
   */
  enqueue(item: BatchItem<T>): void {
    const queueItem: BatchItem<T> = {
      ...item,
      retries: item.retries || 0,
      priority: item.priority || 0,
    };

    // Insert in priority order (higher priority first)
    const insertIndex = this.queue.findIndex((i) => (i.priority || 0) < (queueItem.priority || 0));

    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }
  }

  /**
   * Add multiple items to queue
   */
  enqueueBatch(items: BatchItem<T>[]): void {
    items.forEach((item) => this.enqueue(item));
  }

  /**
   * Process all queued items
   */
  async process(processor: BatchProcessor<T, R>): Promise<BatchResult<R>> {
    const startTime = Date.now();
    this.processing = true;
    this.processedItems.clear();

    const succeeded: Array<{ id: string; result: R }> = [];
    const failed: Array<{ id: string; error: string; retries: number }> = [];

    try {
      while (this.queue.length > 0) {
        // Extract next batch
        const batch = this.queue.splice(0, this.config.batchSize);

        try {
          // Process with timeout
          const results = await Promise.race([
            processor(batch),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`Batch processing timeout after ${this.config.timeoutMs}ms`)),
                this.config.timeoutMs
              )
            ),
          ]);

          // Record successes
          results.forEach(({ id, result }) => {
            succeeded.push({ id, result });
            this.processedItems.set(id, { result });
          });

          // Record failures (items not in results)
          const successIds = new Set(results.map((r) => r.id));
          batch.forEach((item) => {
            if (!successIds.has(item.id)) {
              if ((item.retries || 0) < this.config.maxRetries) {
                // Retry
                item.retries = (item.retries || 0) + 1;
                this.enqueue(item);
              } else {
                // Max retries exceeded
                failed.push({
                  id: item.id,
                  error: 'Max retries exceeded',
                  retries: item.retries || 0,
                });
                this.processedItems.set(item.id, { error: 'Max retries exceeded' });
              }
            }
          });
        } catch (error) {
          // Batch processing failed - retry items
          const errorMsg = error instanceof Error ? error.message : String(error);

          batch.forEach((item) => {
            if ((item.retries || 0) < this.config.maxRetries) {
              // Retry
              item.retries = (item.retries || 0) + 1;
              this.enqueue(item);
            } else {
              // Max retries exceeded
              failed.push({
                id: item.id,
                error: errorMsg,
                retries: item.retries || 0,
              });
              this.processedItems.set(item.id, { error: errorMsg });
            }
          });
        }

        // Delay between batches
        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
        }
      }
    } finally {
      this.processing = false;
    }

    return {
      succeeded,
      failed,
      processingTimeMs: Date.now() - startTime,
      itemsProcessed: succeeded.length,
      itemsFailed: failed.length,
    };
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if currently processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Get processing status
   */
  getStatus(): {
    queueSize: number;
    processing: boolean;
    processed: number;
  } {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      processed: this.processedItems.size,
    };
  }

  /**
   * Clear queue (without processing)
   */
  clearQueue(): number {
    const size = this.queue.length;
    this.queue = [];
    return size;
  }

  /**
   * Get result for processed item
   */
  getResult(id: string): { result?: R; error?: string } | undefined {
    return this.processedItems.get(id);
  }
}
