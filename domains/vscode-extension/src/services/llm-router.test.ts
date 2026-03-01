import * as assert from 'assert';
import * as vscode from 'vscode';
import { LLMRouter } from './llm-router.js';
import { CostTracker } from './cost-tracker.js';
import { ResponseCache } from './cache.js';
import { ModelRouter } from '@openrouter-crew/shared-cost-tracking';

suite('LLMRouter Service Test Suite', () => {
    let router: LLMRouter;
    let mockCostTracker: any;
    let mockCache: any;
    let capturedSharedRouterArgs: any;
    let originalSelectBestModel: any;

    setup(() => {
        mockCostTracker = {
            recordUsage: async () => {}
        };
        mockCache = {
            get: () => undefined,
            set: async () => {}
        };

        // Mock the shared ModelRouter's prototype to intercept calls
        originalSelectBestModel = ModelRouter.prototype.selectBestModel;
        ModelRouter.prototype.selectBestModel = (args: any) => {
            capturedSharedRouterArgs = args;
            // Return a predictable model for the test
            return { id: 'mock/model-for-test', provider: 'mock' };
        };

        // Mock VSCode config
        (vscode.workspace as any).getConfiguration = (section: string) => ({
            get: (key: string) => {
                if (key === 'apiKey') return 'test-key';
                return undefined;
            }
        });
        
        router = new LLMRouter(
            mockCostTracker as CostTracker,
            mockCache as ResponseCache
        );

        // Mock the internal API call to prevent actual network requests
        (router as any).callOpenRouter = async (request: any, model: string) => {
            return {
                content: 'mock response',
                model: model,
                provider: 'openrouter',
                costUSD: 0.00123,
                executionTimeMs: 50,
                cached: false
            };
        };
    });

    teardown(() => {
        // Restore the original method
        ModelRouter.prototype.selectBestModel = originalSelectBestModel;
        capturedSharedRouterArgs = undefined;
    });

    test('should use "budget" tier for simple, small requests', async () => {
        await router.route({ prompt: 'short prompt' });
        assert.strictEqual(capturedSharedRouterArgs.costTier, 'budget');
    });

    test('should use "premium" tier for DEBUG intent', async () => {
        await router.route({ prompt: 'fix this bug', intent: 'DEBUG' });
        assert.strictEqual(capturedSharedRouterArgs.costTier, 'premium');
    });

    test('should use "premium" tier for HIGH complexity', async () => {
        await router.route({ prompt: 'long prompt', complexity: 'HIGH' });
        assert.strictEqual(capturedSharedRouterArgs.costTier, 'premium');
    });

    test('should use "premium" tier for large context size (>4000 chars)', async () => {
        const longPrompt = 'a'.repeat(4001);
        await router.route({ prompt: longPrompt });
        assert.strictEqual(capturedSharedRouterArgs.costTier, 'premium');
        assert.ok(capturedSharedRouterArgs.contextWindow >= 4001, 'Context window should be passed to shared router');
    });

    test('should call costTracker.recordUsage with the cost from the response', async () => {
        let recordedCost: number | undefined;
        mockCostTracker.recordUsage = async (cost: number) => {
            recordedCost = cost;
        };

        await router.route({ prompt: 'test' });

        // The mocked callOpenRouter returns 0.00123
        assert.strictEqual(recordedCost, 0.00123);
    });
});