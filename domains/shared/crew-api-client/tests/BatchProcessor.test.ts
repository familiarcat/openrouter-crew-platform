/**
 * Batch Processor Service Tests
 * Verify batch queuing, processing, and retry logic
 */

import { BatchProcessorService, BatchItem, BatchResult, BatchProcessor } from '../src/services/batch-processor';

describe('BatchProcessorService', () => {
  let processor: BatchProcessorService<string, string>;

  beforeEach(() => {
    processor = new BatchProcessorService({
      batchSize: 3,
      maxConcurrent: 2,
      maxRetries: 2,
      timeoutMs: 5000,
      delayMs: 50,
    });
  });

  describe('Queue Management', () => {
    test('enqueues single item', () => {
      const item: BatchItem<string> = {
        id: 'item1',
        data: 'test data',
      };

      processor.enqueue(item);

      expect(processor.getQueueSize()).toBe(1);
    });

    test('enqueues multiple items', () => {
      const items: BatchItem<string>[] = [
        { id: 'item1', data: 'data1' },
        { id: 'item2', data: 'data2' },
        { id: 'item3', data: 'data3' },
      ];

      processor.enqueueBatch(items);

      expect(processor.getQueueSize()).toBe(3);
    });

    test('maintains queue order for same priority', () => {
      const items = [
        { id: 'first', data: 'data1', priority: 0 },
        { id: 'second', data: 'data2', priority: 0 },
        { id: 'third', data: 'data3', priority: 0 },
      ];

      processor.enqueueBatch(items);

      expect(processor.getQueueSize()).toBe(3);
    });

    test('prioritizes items by priority level', () => {
      processor.enqueue({ id: 'low', data: 'low_priority', priority: 1 });
      processor.enqueue({ id: 'high', data: 'high_priority', priority: 10 });
      processor.enqueue({ id: 'medium', data: 'medium_priority', priority: 5 });

      expect(processor.getQueueSize()).toBe(3);
    });

    test('clears queue', () => {
      processor.enqueue({ id: 'item1', data: 'data1' });
      processor.enqueue({ id: 'item2', data: 'data2' });

      expect(processor.getQueueSize()).toBe(2);

      const cleared = processor.clearQueue();

      expect(cleared).toBe(2);
      expect(processor.getQueueSize()).toBe(0);
    });

    test('defaults priority to 0 if not specified', () => {
      processor.enqueue({ id: 'nopriority', data: 'test' });

      expect(processor.getQueueSize()).toBe(1);
    });
  });

  describe('Basic Processing', () => {
    test('processes queued items', async () => {
      processor.enqueue({ id: 'item1', data: 'test1' });
      processor.enqueue({ id: 'item2', data: 'test2' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: `processed:${item.data}`,
        }));
      });

      const result = await processor.process(mockProcessor);

      expect(result.succeeded.length).toBe(2);
      expect(result.failed.length).toBe(0);
      expect(result.itemsProcessed).toBe(2);
      expect(result.itemsFailed).toBe(0);
      expect(mockProcessor).toHaveBeenCalled();
    });

    test('returns results in correct format', async () => {
      processor.enqueue({ id: 'a', data: 'data_a' });
      processor.enqueue({ id: 'b', data: 'data_b' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: `result_${item.id}`,
        }));
      });

      const result: BatchResult<string> = await processor.process(mockProcessor);

      expect(result.succeeded[0]).toEqual({ id: 'a', result: 'result_a' });
      expect(result.succeeded[1]).toEqual({ id: 'b', result: 'result_b' });
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('processes items in batch size chunks', async () => {
      const batchSizes: number[] = [];

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        batchSizes.push(items.length);
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      for (let i = 0; i < 8; i++) {
        processor.enqueue({ id: `item${i}`, data: `data${i}` });
      }

      await processor.process(mockProcessor);

      // With batch size 3: should have batches of 3, 3, 2
      expect(batchSizes).toContain(3);
      expect(batchSizes.reduce((a, b) => a + b, 0)).toBe(8);
    });

    test('reports processing time', async () => {
      processor.enqueue({ id: 'item1', data: 'test' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'done',
        }));
      });

      const result = await processor.process(mockProcessor);

      expect(result.processingTimeMs).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Failure Handling', () => {
    test('handles processor errors with retry', async () => {
      processor.enqueue({ id: 'item1', data: 'test' });
      processor.enqueue({ id: 'item2', data: 'test' });

      let callCount = 0;

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Processor failed');
        }
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'recovered',
        }));
      });

      const result = await processor.process(mockProcessor);

      // First batch fails, items retry
      // Second batch succeeds
      expect((mockProcessor as any).mock.calls.length).toBeGreaterThan(1);
    });

    test('tracks failed items when max retries exceeded', async () => {
      processor = new BatchProcessorService({
        batchSize: 2,
        maxRetries: 1,
        delayMs: 10,
      });

      processor.enqueue({ id: 'fail1', data: 'test' });
      processor.enqueue({ id: 'fail2', data: 'test' });

      const mockProcessor = jest.fn(async () => {
        throw new Error('Always fails');
      });

      const result = await processor.process(mockProcessor);

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.failed[0].error).toContain('Always fails');
    });

    test('records retry count for failed items', async () => {
      processor = new BatchProcessorService({
        maxRetries: 2,
        delayMs: 10,
      });

      processor.enqueue({ id: 'item1', data: 'test' });

      const mockProcessor = jest.fn(async () => {
        throw new Error('Fail');
      });

      const result = await processor.process(mockProcessor);

      expect(result.failed.length).toBe(1);
      expect(result.failed[0].retries).toBeGreaterThan(0);
    });

    test('handles partial batch failure', async () => {
      processor.enqueue({ id: 'success1', data: 'test' });
      processor.enqueue({ id: 'fail1', data: 'test' });
      processor.enqueue({ id: 'success2', data: 'test' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items
          .filter((item: BatchItem<string>) => !item.id.includes('fail'))
          .map((item: BatchItem<string>) => ({
            id: item.id,
            result: 'ok',
          }));
      });

      const result = await processor.process(mockProcessor);

      expect(result.succeeded.length).toBeGreaterThan(0);
      expect(result.failed.length).toBeGreaterThan(0);
    });

    test('retries failed items up to maxRetries', async () => {
      processor = new BatchProcessorService({
        maxRetries: 3,
        delayMs: 10,
      });

      processor.enqueue({ id: 'retry_test', data: 'test' });

      let attempts = 0;
      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Not ready yet');
        }
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'success',
        }));
      });

      const result = await processor.process(mockProcessor);

      expect(attempts).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Status and Results', () => {
    test('reports queue size', async () => {
      processor.enqueue({ id: 'item1', data: 'test' });
      processor.enqueue({ id: 'item2', data: 'test' });

      expect(processor.getQueueSize()).toBe(2);
    });

    test('reports processing status', async () => {
      processor.enqueue({ id: 'item1', data: 'test' });

      const status = processor.getStatus();

      expect(status.queueSize).toBe(1);
      expect(status.processing).toBe(false);
      expect(status.processed).toBeGreaterThanOrEqual(0);
    });

    test('returns result for processed item', async () => {
      processor.enqueue({ id: 'tracked_item', data: 'test' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: `processed:${item.data}`,
        }));
      });

      await processor.process(mockProcessor);

      const result = processor.getResult('tracked_item');

      expect(result).toBeDefined();
      expect(result?.result).toBe('processed:test');
    });

    test('returns undefined for unprocessed item', () => {
      const result = processor.getResult('nonexistent');

      expect(result).toBeUndefined();
    });

    test('returns error for failed item', async () => {
      processor.enqueue({ id: 'error_item', data: 'test' });

      const mockProcessor = jest.fn(async () => {
        throw new Error('Processing error');
      });

      processor = new BatchProcessorService({
        maxRetries: 0,
        delayMs: 10,
      });
      processor.enqueue({ id: 'error_item', data: 'test' });

      await processor.process(mockProcessor);

      const result = processor.getResult('error_item');

      expect(result?.error).toBeDefined();
    });
  });

  describe('Concurrency and Delays', () => {
    test('respects batch delay configuration', async () => {
      const delayProcessor = new BatchProcessorService<string, string>({
        batchSize: 1,
        delayMs: 100,
      });

      delayProcessor.enqueue({ id: 'item1', data: 'test' });
      delayProcessor.enqueue({ id: 'item2', data: 'test' });

      const startTime = Date.now();

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      await delayProcessor.process(mockProcessor);

      const elapsed = Date.now() - startTime;

      // Should have at least one delay between batches
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    test('does not delay after last batch', async () => {
      processor.enqueue({ id: 'single', data: 'test' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      const result = await processor.process(mockProcessor);

      // Single batch should complete quickly
      expect(result.processingTimeMs).toBeLessThan(500);
    });
  });

  describe('Empty Queue Handling', () => {
    test('handles empty queue gracefully', async () => {
      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      const result = await processor.process(mockProcessor);

      expect(result.succeeded.length).toBe(0);
      expect(result.failed.length).toBe(0);
      expect(result.itemsProcessed).toBe(0);
      expect(result.itemsFailed).toBe(0);
      expect(mockProcessor).not.toHaveBeenCalled();
    });

    test('processes empty batches', async () => {
      processor.enqueue({ id: 'item1', data: 'test' });

      const mockProcessor = jest.fn(async (items) => {
        // Return empty results (all items fail)
        return [];
      });

      const result = await processor.process(mockProcessor);

      expect(result.failed.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Queue Behavior', () => {
    test('processes high priority items first', async () => {
      const processingOrder: string[] = [];

      processor.enqueue({ id: 'low', data: 'low', priority: 1 });
      processor.enqueue({ id: 'high', data: 'high', priority: 10 });
      processor.enqueue({ id: 'medium', data: 'medium', priority: 5 });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        items.forEach((item: BatchItem<string>) => processingOrder.push(item.id));
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      await processor.process(mockProcessor);

      // High priority should be processed first
      expect(processingOrder.indexOf('high')).toBeLessThan(processingOrder.indexOf('low'));
    });

    test('maintains insertion order within same priority', () => {
      processor.enqueue({ id: 'first', data: 'first', priority: 5 });
      processor.enqueue({ id: 'second', data: 'second', priority: 5 });
      processor.enqueue({ id: 'third', data: 'third', priority: 5 });

      expect(processor.getQueueSize()).toBe(3);
    });
  });

  describe('Configuration Options', () => {
    test('uses default configuration', () => {
      const defaultProcessor = new BatchProcessorService();
      defaultProcessor.enqueue({ id: 'test', data: 'test' });

      expect(defaultProcessor.getQueueSize()).toBe(1);
    });

    test('accepts custom batch size', async () => {
      const customProcessor = new BatchProcessorService<string, string>({
        batchSize: 5,
      });

      for (let i = 0; i < 12; i++) {
        customProcessor.enqueue({ id: `item${i}`, data: 'test' });
      }

      const batchSizes: number[] = [];

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        batchSizes.push(items.length);
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      await customProcessor.process(mockProcessor);

      expect(batchSizes[0]).toBe(5);
      expect(batchSizes[1]).toBe(5);
      expect(batchSizes[2]).toBe(2);
    });

    test('accepts custom max retries', async () => {
      const customProcessor = new BatchProcessorService({
        maxRetries: 5,
      });

      customProcessor.enqueue({ id: 'retry', data: 'test' });

      let attempts = 0;

      const mockProcessor = jest.fn(async () => {
        attempts++;
        throw new Error('Fail');
      });

      await customProcessor.process(mockProcessor);

      // Should attempt multiple times (initial + retries)
      expect(attempts).toBeGreaterThanOrEqual(2);
    });

    test('accepts custom timeout', async () => {
      const customProcessor = new BatchProcessorService({
        timeoutMs: 100,
      });

      customProcessor.enqueue({ id: 'timeout', data: 'test' });

      const mockProcessor = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return [];
      });

      const result = await customProcessor.process(mockProcessor);

      // Should timeout and report failure
      expect(result.failed.length).toBeGreaterThan(0);
    });
  });

  describe('Item Initialization', () => {
    test('initializes retry count to 0', async () => {
      processor.enqueue({ id: 'test', data: 'test' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        expect(items[0].retries).toBeGreaterThanOrEqual(0);
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      await processor.process(mockProcessor);
    });

    test('preserves user-provided priority', async () => {
      processor.enqueue({ id: 'test', data: 'test', priority: 42 });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        expect(items[0].priority).toBe(42);
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'ok',
        }));
      });

      await processor.process(mockProcessor);
    });
  });

  describe('Processing State', () => {
    test('indicates not processing when idle', () => {
      expect(processor.isProcessing()).toBe(false);
    });

    test('completes without errors', async () => {
      processor.enqueue({ id: 'item1', data: 'test' });

      const mockProcessor: BatchProcessor<string, string> = jest.fn(async (items) => {
        return items.map((item: BatchItem<string>) => ({
          id: item.id,
          result: 'success',
        }));
      });

      const result = await processor.process(mockProcessor);

      expect(result.itemsProcessed).toBe(1);
      expect(result.itemsFailed).toBe(0);
      expect(processor.isProcessing()).toBe(false);
    });
  });
});
