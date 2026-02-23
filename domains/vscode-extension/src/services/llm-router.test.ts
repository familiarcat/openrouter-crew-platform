/// <reference types="mocha" />
import * as assert from 'assert';
import { LLMRouter, LLMRequest } from './llm-router.js';
import { CostTracker } from './cost-tracker.js';
import { ResponseCache } from './cache.js';

// Mock dependencies since we are only testing the complexity logic
class MockCostTracker {}
class MockResponseCache {}

suite('LLMRouter Complexity Estimation', () => {
  let router: LLMRouter;

  setup(() => {
    // Cast mocks to unknown/any to satisfy constructor types without full implementation
    router = new LLMRouter(
      new MockCostTracker() as unknown as CostTracker, 
      new MockResponseCache() as unknown as ResponseCache
    );
  });

  test('Manual Override: Should return provided complexity', () => {
    const request: LLMRequest = { prompt: 'test', complexity: 'HIGH' };
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'HIGH');
  });

  test('Low Complexity: Short prompt (< 500 chars), simple intent', () => {
    const request: LLMRequest = { prompt: 'How do I center a div?', intent: 'ASK' };
    // Score: 0
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'LOW');
  });

  test('Low Complexity: Medium length (> 500 chars) (Score 1)', () => {
    const request: LLMRequest = { prompt: 'a'.repeat(600), intent: 'ASK' };
    // Score: 1 (Length > 500 adds 1 point) -> Still LOW (< 2)
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'LOW');
  });

  test('Medium Complexity: Complex Intent (Score 2)', () => {
    const request: LLMRequest = { prompt: 'Fix this', intent: 'REFACTOR' };
    // Score: 2 (Intent REFACTOR adds 2 points) -> MEDIUM (>= 2)
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'MEDIUM');
  });

  test('Medium Complexity: Long prompt (> 2000 chars) (Score 3)', () => {
    const request: LLMRequest = { prompt: 'a'.repeat(2100), intent: 'ASK' };
    // Score: 3 (Length > 2000 adds 3 points) -> MEDIUM (>= 2 but < 4)
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'MEDIUM');
  });

  test('Medium Complexity: Keywords (Score 2)', () => {
    const request: LLMRequest = { prompt: 'Check algorithm and database', intent: 'ASK' };
    // Score: 2 (Keywords: "algorithm" +1, "database" +1) -> MEDIUM
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'MEDIUM');
  });

  test('High Complexity: Long prompt + Keyword (Score 4)', () => {
    const request: LLMRequest = { 
      prompt: 'a'.repeat(2100) + ' algorithm', 
      intent: 'ASK' 
    };
    // Score: 3 (Length) + 1 (Keyword) = 4 -> HIGH (>= 4)
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'HIGH');
  });

  test('High Complexity: Complex Intent + Keywords (Score 4)', () => {
    const request: LLMRequest = { prompt: 'Optimize this database architecture', intent: 'OPTIMIZE' };
    // Score: 2 (Intent) + 2 (Keywords: "database", "architecture") = 4 -> HIGH
    const result = router.estimateComplexity(request);
    assert.strictEqual(result, 'HIGH');
  });
});