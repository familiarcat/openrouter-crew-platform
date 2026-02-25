import * as assert from 'assert';
import { CommandExecutor } from '../../src/commands/command-executor.js';
import { CostTracker } from '../../src/services/cost-tracker.js';
import { ContextBuilder } from '../../src/services/context-builder.js';
import { LLMResponse } from '../../src/services/llm-router.js';

suite('CommandExecutor Test Suite', () => {
    let commandExecutor: CommandExecutor;
    let mockRouter: any;
    let mockNLP: any;

    setup(() => {
        // Mock dependencies
        const mockCostTracker = {} as CostTracker;
        const mockContextBuilder = {} as ContextBuilder;
        
        commandExecutor = new CommandExecutor(mockCostTracker, mockContextBuilder);

        // Mock internal dependencies
        mockRouter = {
            route: async () => null
        };
        
        mockNLP = {
            analyze: () => ({
                intent: { intent: 'TEST' },
                complexity: 'LOW',
                confidence: 1.0,
                language: 'typescript'
            })
        };

        // Inject mocks using any cast to access private properties
        (commandExecutor as any).router = mockRouter;
        (commandExecutor as any).nlp = mockNLP;
    });

    test('execute handles successful response correctly', async () => {
        const mockResponse: LLMResponse = {
            content: 'Test content',
            model: 'test-model',
            cost: 0.001,
            costUSD: 0.001,
            executionTimeMs: 100
        };

        mockRouter.route = async () => mockResponse;

        // We use 'ask' to trigger the private 'execute' method
        const result = await commandExecutor.ask('test prompt');

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.output, 'Test content');
        assert.strictEqual(result.model, 'test-model');
        assert.strictEqual(result.costUSD, 0.001);
        assert.strictEqual(result.metadata.complexity, 'LOW');
    });

    test('execute handles router failure (null response)', async () => {
        mockRouter.route = async () => null;

        const result = await commandExecutor.ask('test prompt');

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.output, 'Execution failed');
        assert.strictEqual(result.costUSD, 0);
    });

    test('execute handles router exception', async () => {
        mockRouter.route = async () => { throw new Error('Router error'); };

        // The executeViaRouter catches errors and returns null, which execute then formats
        const result = await commandExecutor.ask('test prompt');

        assert.strictEqual(result.success, false);
        assert.strictEqual(result.output, 'Execution failed');
    });

    test('execute accumulates cost in costBuffer', async () => {
        const mockResponse: LLMResponse = {
            content: 'Test',
            model: 'test',
            cost: 0.05,
            costUSD: 0.05,
            executionTimeMs: 10
        };
        mockRouter.route = async () => mockResponse;

        await commandExecutor.ask('test 1');
        await commandExecutor.ask('test 2');

        // 0.05 + 0.05 = 0.10
        assert.strictEqual(commandExecutor.getTotalCost(), 0.10);
    });
});