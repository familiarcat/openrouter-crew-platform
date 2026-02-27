/// <reference types="mocha" />
import * as assert from 'assert';
import * as vscode from 'vscode';
import { LLMRouter } from './llm-router.js';
import { LLMRequest } from './types.js';
import { CostTracker } from './cost-tracker.js';
import { CostEstimator } from './cost-estimator.js';
import { ResponseCache } from './cache.js';

// Mock dependencies
class MockCostTracker {
    async checkBudget(cost: number) {
        return { allowed: true };
    }
}
class MockResponseCache {
    generateKey(content: string) { return 'key'; }
    get(key: string) { return undefined; }
    async set(key: string, value: any) {}
}
class MockCostEstimator {
    estimateRequestCost() { return 0.01; }
}

suite('LLMRouter Service', () => {
  let router: LLMRouter;
  let mockCostTracker: any;
  let mockCostEstimator: any;
  let mockResponseCache: any;

  setup(() => {
    mockCostTracker = new MockCostTracker();
    mockCostEstimator = new MockCostEstimator();
    mockResponseCache = new MockResponseCache();

    // Mock vscode configuration
    (vscode.workspace as any).getConfiguration = (section: string) => {
        return {
            get: (key: string) => {
                if (key === 'apiKey') return 'test-key';
                return undefined;
            }
        };
    };

    router = new LLMRouter(
      mockCostTracker as unknown as CostTracker,
      mockCostEstimator as unknown as CostEstimator,
      mockResponseCache as unknown as ResponseCache
    );
  });

  test('route should throw error if API key is missing', async () => {
    (vscode.workspace as any).getConfiguration = () => ({
        get: (key: string) => undefined
    });

    const request: LLMRequest = {
        messages: [{ role: 'user', content: 'test' }]
    };

    try {
        await router.route(request);
        assert.fail('Should have thrown error');
    } catch (e: any) {
        assert.ok(e.message.includes('API Key missing'));
    }
  });
});