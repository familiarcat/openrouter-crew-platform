/**
 * LLM Router Tests
 *
 * Unit tests for the LLM router service covering:
 * - Complexity analysis
 * - Model selection
 * - Cost estimation
 * - Budget enforcement
 * - Intent-based routing
 */

import { LLMRouter, MODELS } from '../src/services/llm-router';
import { CostEstimator } from '../src/services/cost-estimator';

describe('LLMRouter', () => {
  let router: LLMRouter;

  beforeEach(() => {
    router = new LLMRouter('test-api-key');
  });

  describe('Complexity Analysis', () => {
    it('should classify simple prompts as LOW complexity', () => {
      const request = { prompt: 'What is 2+2?' };
      // Note: analyzeComplexity is private, test via estimateCost
      const estimate = router['analyzeComplexity'](request);
      expect(estimate).toBe('LOW');
    });

    it('should classify medium prompts as MEDIUM complexity', () => {
      const request = {
        prompt: 'Refactor this function to be more efficient. The current code has 200 lines.',
        intent: 'REFACTOR' as const,
      };
      const estimate = router['analyzeComplexity'](request);
      expect(estimate).toBe('MEDIUM');
    });

    it('should classify complex prompts as HIGH complexity', () => {
      const request = {
        prompt: 'Debug this race condition in the async function. ' +
          'It has a lock mechanism but sometimes fails in production.',
        intent: 'DEBUG' as const,
      };
      const estimate = router['analyzeComplexity'](request);
      expect(estimate).toBe('HIGH');
    });
  });

  describe('Model Selection', () => {
    it('should select Gemini Flash for LOW complexity tasks', () => {
      const model = router['selectModel'](undefined, 'LOW');
      expect(model).toBe('GEMINI_FLASH');
    });

    it('should select Claude Sonnet for MEDIUM complexity tasks', () => {
      const model = router['selectModel'](undefined, 'MEDIUM');
      expect(model).toBe('CLAUDE_SONNET');
    });

    it('should select Claude Sonnet for HIGH complexity tasks', () => {
      const model = router['selectModel'](undefined, 'HIGH');
      expect(model).toBe('CLAUDE_SONNET');
    });

    it('should select GPT-4 for code review intent', () => {
      const model = router['selectModel']('REVIEW', 'LOW');
      expect(model).toBe('GPT4_TURBO');
    });

    it('should select Claude Sonnet for debugging intent', () => {
      const model = router['selectModel']('DEBUG', 'LOW');
      expect(model).toBe('CLAUDE_SONNET');
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate lower cost for simple tasks', async () => {
      const estimate = await router.estimateCost({
        prompt: 'What is 2+2?',
      });
      expect(estimate.estimatedCost).toBeLessThan(0.001);
    });

    it('should estimate higher cost for complex tasks', async () => {
      const estimate = await router.estimateCost({
        prompt: 'Debug this race condition in the async function. ' +
          'It has a lock mechanism but sometimes fails in production.',
        intent: 'DEBUG',
        complexity: 'HIGH',
      });
      expect(estimate.estimatedCost).toBeGreaterThan(0.01);
    });

    it('should provide cheaper alternatives', async () => {
      const estimate = await router.estimateCost({
        prompt: 'Refactor this code',
        complexity: 'MEDIUM',
      });
      expect(estimate.alternatives.length).toBeGreaterThan(0);
      expect(estimate.alternatives[0].estimatedCost).toBeLessThan(estimate.estimatedCost);
    });

    it('should estimate token count from prompt length', async () => {
      const estimate = await router.estimateCost({
        prompt: 'What is 2+2?',  // 11 chars ≈ 3 tokens
      });
      expect(estimate.estimatedInputTokens).toBeGreaterThan(0);
      expect(estimate.estimatedOutputTokens).toBeGreaterThan(0);
    });

    it('should add system prompt overhead', async () => {
      const estimate = await router.estimateCost({
        prompt: 'x',  // 1 char
      });
      // Should have at least 100 tokens from system prompt
      expect(estimate.estimatedInputTokens).toBeGreaterThanOrEqual(100);
    });

    it('should include context in token estimation', async () => {
      const estimate1 = await router.estimateCost({
        prompt: 'Review this code',
      });
      const estimate2 = await router.estimateCost({
        prompt: 'Review this code',
        context: {
          selectedCode: 'function foo() { return 42; }',
        },
      });
      expect(estimate2.estimatedInputTokens).toBeGreaterThan(
        estimate1.estimatedInputTokens
      );
    });
  });

  describe('Budget Enforcement', () => {
    it('should reject requests exceeding budget', async () => {
      router.setBudget(0.0001);  // Very small budget
      const error = await router.estimateCost({
        prompt: 'This will be expensive',
        complexity: 'HIGH',
        budgetLimit: 0.00001,
      });
      expect(error.withinBudget).toBe(false);
    });

    it('should suggest cheaper alternatives when over budget', async () => {
      const estimate = await router.estimateCost({
        prompt: 'This will be expensive',
        complexity: 'HIGH',
        budgetLimit: 0.00001,
      });
      expect(estimate.alternatives.length).toBeGreaterThan(0);
    });

    it('should track remaining budget', () => {
      router.setBudget(100);
      expect(router.getBudgetRemaining()).toBe(100);
    });

    it('should allow setting daily budget', () => {
      router.setBudget(50);
      expect(router.getBudgetRemaining()).toBe(50);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost correctly for Gemini Flash', () => {
      const cost = router['calculateCost']('GEMINI_FLASH', 1000, 1000);
      // (1000/1M * 0.075) + (1000/1M * 0.3) = 0.000075 + 0.0003 = 0.000375
      expect(cost).toBeCloseTo(0.000375, 6);
    });

    it('should calculate cost correctly for Claude Sonnet', () => {
      const cost = router['calculateCost']('CLAUDE_SONNET', 1000, 1000);
      // (1000/1M * 3) + (1000/1M * 15) = 0.003 + 0.015 = 0.018
      expect(cost).toBeCloseTo(0.018, 6);
    });

    it('should calculate cost correctly for GPT-4', () => {
      const cost = router['calculateCost']('GPT4_TURBO', 1000, 1000);
      // (1000/1M * 10) + (1000/1M * 30) = 0.01 + 0.03 = 0.04
      expect(cost).toBeCloseTo(0.04, 6);
    });
  });

  describe('Model Information', () => {
    it('should list all available models', () => {
      const models = router.listModels();
      expect(Object.keys(models).length).toBeGreaterThanOrEqual(5);
    });

    it('should provide model pricing info', () => {
      const model = router.getModelInfo('CLAUDE_SONNET');
      expect(model.inputCost).toBe(3);
      expect(model.outputCost).toBe(15);
    });

    it('should provide model quality scores', () => {
      const geminiFash = router.getModelInfo('GEMINI_FLASH');
      const claudeSonnet = router.getModelInfo('CLAUDE_SONNET');
      const claudeOpus = router.getModelInfo('CLAUDE_OPUS');

      expect(geminiFash.qualityScore).toBeLessThan(claudeSonnet.qualityScore);
      expect(claudeSonnet.qualityScore).toBeLessThan(claudeOpus.qualityScore);
    });

    it('should provide best-for categories', () => {
      const geminiFash = router.getModelInfo('GEMINI_FLASH');
      expect(geminiFash.bestFor).toContain('simple tasks');

      const gpt4 = router.getModelInfo('GPT4_TURBO');
      expect(gpt4.bestFor).toContain('code review');
    });
  });

  describe('Temperature Settings', () => {
    it('should use higher temperature for generation tasks', () => {
      const temp = router['getTemperature']('GENERATE');
      expect(temp).toBe(0.7);
    });

    it('should use lower temperature for debugging tasks', () => {
      const temp = router['getTemperature']('DEBUG');
      expect(temp).toBe(0.3);
    });

    it('should use balanced temperature for general tasks', () => {
      const temp = router['getTemperature']('ASK');
      expect(temp).toBe(0.5);
    });
  });
});

describe('CostEstimator', () => {
  let estimator: CostEstimator;

  beforeEach(() => {
    estimator = new CostEstimator();
  });

  describe('Token Estimation', () => {
    it('should estimate ~3.5 chars per token for English', () => {
      const request = { prompt: 'Hello world' };  // 11 chars
      const estimate = estimator.estimateCost(request);
      // Should be around 11/3.5 ≈ 3 tokens + 100 system = 103
      expect(estimate.estimatedInputTokens).toBeGreaterThan(100);
    });

    it('should include system prompt overhead', () => {
      const request = { prompt: 'x' };
      const estimate = estimator.estimateCost(request);
      // Should have at least 100 tokens from system prompt
      expect(estimate.estimatedInputTokens).toBeGreaterThanOrEqual(100);
    });

    it('should cap file content at 5KB', () => {
      const largeContent = 'x'.repeat(10000);
      const request = {
        prompt: 'test',
        context: { fileContent: largeContent },
      };
      const estimate = estimator.estimateCost(request);
      // Should cap at 5KB (5000 chars)
      expect(estimate.estimatedInputTokens).toBeLessThan(
        100 + 5000 / 3 + 100
      );
    });
  });

  describe('Output Token Estimation', () => {
    it('should estimate 512 tokens for simple ASK', () => {
      const request = { prompt: 'What is 2+2?', intent: 'ASK' as const };
      const estimate = estimator.estimateCost(request);
      expect(estimate.estimatedOutputTokens).toBe(512);
    });

    it('should estimate 2048 tokens for GENERATE', () => {
      const request = { prompt: 'Generate a function', intent: 'GENERATE' as const };
      const estimate = estimator.estimateCost(request);
      expect(estimate.estimatedOutputTokens).toBe(2048);
    });

    it('should estimate 1024 tokens for REVIEW', () => {
      const request = { prompt: 'Review this code', intent: 'REVIEW' as const };
      const estimate = estimator.estimateCost(request);
      expect(estimate.estimatedOutputTokens).toBe(1024);
    });

    it('should increase estimate by 50% for HIGH complexity', () => {
      const lowRequest = { prompt: 'Simple task', complexity: 'LOW' as const };
      const highRequest = { prompt: 'Complex task', complexity: 'HIGH' as const };

      const lowEstimate = estimator.estimateCost(lowRequest);
      const highEstimate = estimator.estimateCost(highRequest);

      // HIGH should be 50% more
      expect(highEstimate.estimatedOutputTokens).toBeCloseTo(
        lowEstimate.estimatedOutputTokens * 1.5,
        0
      );
    });

    it('should respect user maxTokens override', () => {
      const request = {
        prompt: 'Generate code',
        intent: 'GENERATE' as const,
        maxTokens: 1000,
      };
      const estimate = estimator.estimateCost(request);
      expect(estimate.estimatedOutputTokens).toBe(1000);
    });
  });

  describe('Learning from Actual Costs', () => {
    it('should track estimation accuracy', () => {
      const request = { prompt: 'Test prompt' };
      const estimate = estimator.estimateCost(request);

      estimator.recordActual(
        'GEMINI_FLASH',
        estimate.estimatedInputTokens,
        estimate.estimatedOutputTokens,
        estimate.estimatedCostUSD * 1.05,  // 5% higher than estimate
        estimate
      );

      const newEstimate = estimator.estimateCost(request);
      // Accuracy should be recorded
      expect(newEstimate.accuracy).toBeGreaterThan(0);
      expect(newEstimate.accuracy).toBeLessThanOrEqual(1);
    });

    it('should improve estimates over time', () => {
      const request = { prompt: 'Test prompt for learning' };

      // First request
      const estimate1 = estimator.estimateCost(request);
      estimator.recordActual(
        'GEMINI_FLASH',
        estimate1.estimatedInputTokens,
        estimate1.estimatedOutputTokens,
        estimate1.estimatedCostUSD,
        estimate1
      );
      const accuracy1 = estimate1.accuracy;

      // Do 5 more similar requests
      for (let i = 0; i < 5; i++) {
        const est = estimator.estimateCost(request);
        estimator.recordActual(
          'GEMINI_FLASH',
          est.estimatedInputTokens,
          est.estimatedOutputTokens,
          est.estimatedCostUSD * (0.95 + Math.random() * 0.1),
          est
        );
      }

      // After learning, accuracy should improve
      const estimateFinal = estimator.estimateCost(request);
      expect(estimateFinal.accuracy).toBeGreaterThanOrEqual(accuracy1);
    });
  });

  describe('Statistics', () => {
    it('should calculate total cost', () => {
      const request = { prompt: 'Test' };

      const costs = [0.001, 0.005, 0.01, 0.02, 0.05];
      for (const cost of costs) {
        const estimate = estimator.estimateCost(request);
        estimator.recordActual(
          'GEMINI_FLASH',
          100,
          100,
          cost,
          estimate
        );
      }

      const stats = estimator.getStats();
      expect(stats.totalCost).toBeCloseTo(0.086, 3);
    });

    it('should calculate average cost', () => {
      const request = { prompt: 'Test' };

      const costs = [0.001, 0.005, 0.01, 0.02, 0.05];
      for (const cost of costs) {
        const estimate = estimator.estimateCost(request);
        estimator.recordActual(
          'GEMINI_FLASH',
          100,
          100,
          cost,
          estimate
        );
      }

      const stats = estimator.getStats();
      expect(stats.averageCost).toBeCloseTo(0.0172, 3);
    });

    it('should identify cheapest model used', () => {
      const request = { prompt: 'Test' };

      // Record costs for different models
      const estimate = estimator.estimateCost(request);
      estimator.recordActual('GEMINI_FLASH', 100, 100, 0.0001, estimate);
      estimator.recordActual('CLAUDE_SONNET', 100, 100, 0.05, estimate);

      const stats = estimator.getStats();
      expect(stats.cheapestModel).toBe('GEMINI_FLASH');
    });

    it('should track request count', () => {
      const request = { prompt: 'Test' };
      const estimate = estimator.estimateCost(request);

      estimator.recordActual('GEMINI_FLASH', 100, 100, 0.001, estimate);
      estimator.recordActual('GEMINI_FLASH', 100, 100, 0.001, estimate);

      const stats = estimator.getStats();
      expect(stats.requestCount).toBe(2);
    });
  });

  describe('Cost Comparison', () => {
    it('should provide cost comparison between models', () => {
      const request = { prompt: 'Test query' };
      const costs = estimator.compareModels(request);

      expect(costs.size).toBeGreaterThanOrEqual(5);
      expect(costs.get('GEMINI_FLASH')).toBeLessThan(
        costs.get('CLAUDE_OPUS')!
      );
    });
  });

  describe('History Management', () => {
    it('should maintain cost history', () => {
      const request = { prompt: 'Test' };
      const estimate = estimator.estimateCost(request);

      estimator.recordActual('GEMINI_FLASH', 100, 100, 0.001, estimate);
      estimator.recordActual('GEMINI_FLASH', 100, 100, 0.002, estimate);

      const history = estimator.getHistory();
      expect(history.length).toBe(2);
    });

    it('should clear history when requested', () => {
      const request = { prompt: 'Test' };
      const estimate = estimator.estimateCost(request);

      estimator.recordActual('GEMINI_FLASH', 100, 100, 0.001, estimate);
      estimator.clearHistory();

      const history = estimator.getHistory();
      expect(history.length).toBe(0);
    });
  });
});

describe('Cost Optimization Comparison', () => {
  it('should achieve 99% cost reduction vs Copilot for simple tasks', () => {
    const router = new LLMRouter('test-key');
    const copilotCost = 0.05;  // Copilot: $0.05 per simple query

    const cost = router['calculateCost']('GEMINI_FLASH', 100, 100);
    const savings = ((copilotCost - cost) / copilotCost) * 100;

    expect(savings).toBeGreaterThan(99);
  });

  it('should achieve 80% cost reduction vs Copilot for complex tasks', () => {
    const router = new LLMRouter('test-key');
    const copilotCost = 0.20;  // Copilot: $0.20 per complex query

    const cost = router['calculateCost']('CLAUDE_SONNET', 10000, 10000);
    const savings = ((copilotCost - cost) / copilotCost) * 100;

    expect(savings).toBeGreaterThan(80);
  });
});
