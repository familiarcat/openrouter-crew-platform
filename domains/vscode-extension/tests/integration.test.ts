/**
 * Integration Tests
 *
 * End-to-end tests for complete Alex AI workflows
 */

import { CommandExecutor } from '../src/commands/command-executor';
import { CostTracker } from '../src/services/cost-tracker';
import { NLPProcessor } from '../src/services/nlp-processor';
import { ChatPanel } from '../src/ui/chat-panel';

describe('Integration: Full Workflow', () => {
  let executor: CommandExecutor;
  let tracker: CostTracker;
  let nlp: NLPProcessor;
  let chatPanel: ChatPanel;

  beforeEach(() => {
    executor = new CommandExecutor('test-api-key');
    tracker = new CostTracker(100);
    nlp = new NLPProcessor();
    chatPanel = new ChatPanel();
  });

  describe('Code Review Workflow', () => {
    it('should complete full code review pipeline', async () => {
      const code = `
        function process(data) {
          console.log(data);
          var result = data.map(x => x * 2);
          return result;
        }`;

      // Step 1: NLP analysis
      const nlpAnalysis = nlp.analyze('Review this code', { selectedCode: code });
      expect(nlpAnalysis.intent.intent).toBe('REVIEW');

      // Step 2: Execute command
      const result = await executor.review(code, 'script.js');
      expect(result.success).toBeDefined();
      expect(result.metadata.intent).toBe('REVIEW');

      // Step 3: Track cost
      tracker.recordTransaction(
        result.model,
        result.metadata.intent,
        1000,
        500,
        result.costUSD
      );
      expect(tracker.getRemainingBudget()).toBeLessThan(100);

      // Step 4: Update UI
      chatPanel.addMessage('user', 'Review this code', { code });
      chatPanel.addMessage('assistant', result.output, {
        cost: result.costUSD,
        intent: result.metadata.intent,
      });
      expect(chatPanel.getHistory().length).toBe(2);
    });
  });

  describe('Debugging Workflow', () => {
    it('should complete error debugging pipeline', async () => {
      const error = 'TypeError: Cannot read property of undefined at line 42';
      const code = 'const user = data[0]; return user.name;';

      // Step 1: NLP analysis
      const nlpAnalysis = nlp.analyze(error, { selectedCode: code });
      expect(nlpAnalysis.intent.intent).toBe('DEBUG');
      expect(nlpAnalysis.sentiment).not.toBe('positive');

      // Step 2: Execute debug command
      const result = await executor.debug(error, { code, file: 'app.js' });
      expect(result.metadata.intent).toBe('DEBUG');

      // Step 3: Track cost
      tracker.recordTransaction(
        result.model,
        'DEBUG',
        2000,
        1000,
        result.costUSD
      );
      const analytics = tracker.getAnalytics();
      expect(analytics.costByIntent['DEBUG']).toBeGreaterThan(0);

      // Step 4: Display in chat
      chatPanel.addMessage('user', error);
      chatPanel.addMessage('assistant', result.output, {
        cost: result.costUSD,
      });
    });
  });

  describe('Code Generation Workflow', () => {
    it('should generate and track code creation', async () => {
      const description = 'Create a function to validate email addresses';

      // Step 1: NLP analysis
      const nlpAnalysis = nlp.analyze(description);
      expect(nlpAnalysis.intent.intent).toBe('GENERATE');

      // Step 2: Generate code
      const result = await executor.generate(description, 'javascript');
      expect(result.metadata.intent).toBe('GENERATE');

      // Step 3: Track higher cost for generation
      tracker.recordTransaction(
        result.model,
        'GENERATE',
        1000,
        2048,
        result.costUSD
      );
      const analytics = tracker.getAnalytics();
      expect(analytics.costByIntent['GENERATE']).toBeGreaterThan(0);

      // Step 4: Show in UI
      chatPanel.addMessage('user', description);
      chatPanel.addMessage('assistant', result.output);
    });
  });

  describe('Multi-Query Session', () => {
    it('should handle multiple requests with cost tracking', async () => {
      const costs = [0.0001, 0.018, 0.04, 0.0002];

      for (const cost of costs) {
        tracker.recordTransaction('claude-sonnet', 'ASK', 100, 50, cost);
        chatPanel.addMessage('user', 'Question');
        chatPanel.addMessage('assistant', 'Answer', { cost });
      }

      const analytics = tracker.getAnalytics();
      expect(analytics.transactionCount).toBe(4);
      expect(chatPanel.getHistory().length).toBe(8);

      // Verify budget tracking
      const savings = tracker.estimateCopilotSavings();
      expect(savings.savingsPercent).toBeGreaterThan(90);
    });
  });

  describe('Budget Enforcement', () => {
    it('should prevent execution when budget exceeded', async () => {
      tracker.setBudget(0.01);  // $0.01 budget

      // First request succeeds
      const result1 = tracker.recordTransaction(
        'claude-sonnet',
        'REVIEW',
        1000,
        500,
        0.009
      );
      expect(result1.success).toBe(true);

      // Second request fails
      const result2 = tracker.recordTransaction(
        'claude-sonnet',
        'REVIEW',
        1000,
        500,
        0.005  // Would exceed budget
      );
      expect(result2.success).toBe(false);
      expect(result2.alert).toBeDefined();
      expect(result2.alert?.type).toBe('exceeded');
    });
  });

  describe('Image Processing Workflow', () => {
    it('should process image through full pipeline', async () => {
      // Simulate image with error
      const imageResult = await executor.processImage('base64imagedata');

      // Should have detected intent
      expect(imageResult.metadata.intent).toBeDefined();

      // Track the cost
      tracker.recordTransaction(
        imageResult.model,
        imageResult.metadata.intent,
        500,
        200,
        imageResult.costUSD
      );

      // Add to chat
      chatPanel.addMessage('user', '[Image: error.png]');
      chatPanel.addMessage('assistant', imageResult.output, {
        cost: imageResult.costUSD,
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution metrics', async () => {
      const code = 'function test() { return 42; }';

      const startTime = Date.now();
      const result = await executor.review(code, 'test.js');
      const duration = Date.now() - startTime;

      // Should complete reasonably fast
      expect(duration).toBeLessThan(5000);  // 5 second timeout for mocked execution
      expect(result.executionTimeMs).toBeLessThan(5000);
    });
  });

  describe('Real-World Session', () => {
    it('should handle typical developer workflow', async () => {
      // 1. Ask about concepts
      await executor.ask('How do I use async/await?', {
        code: 'async function fetch() {}',
        file: 'api.js',
      });
      chatPanel.addMessage('user', 'How do I use async/await?');

      // 2. Review some code
      const code = `
        function fetchData(url) {
          return fetch(url).then(r => r.json());
        }`;
      await executor.review(code, 'api.js');
      chatPanel.addMessage('user', 'Review this');

      // 3. Generate tests
      await executor.generateTests(code, 'api.js');
      chatPanel.addMessage('user', 'Generate tests');

      // 4. Refactor
      await executor.refactor(code, 'api.js');
      chatPanel.addMessage('user', 'Refactor it');

      // Check chat history
      expect(chatPanel.getHistory().length).toBeGreaterThan(0);

      // Check cost accumulation
      const startBudget = 100;
      const finalBudget = tracker.getRemainingBudget();
      expect(finalBudget).toBeLessThan(startBudget);
    });
  });

  describe('Error Recovery', () => {
    it('should handle command failures gracefully', async () => {
      // Attempt invalid operation
      const result = await executor.ask('Invalid prompt', {
        code: null as any,  // Invalid context
      });

      // Should have result object even on failure
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();

      // Chat should still accept the message
      chatPanel.addMessage('user', 'Query');
      chatPanel.addMessage('assistant', 'Handled gracefully', {});
    });
  });
});

describe('Integration: UI and Services', () => {
  it('should render chat panel HTML', () => {
    const chatPanel = new ChatPanel();
    const html = chatPanel.generateHTML();

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Alex AI');
    expect(html).toContain('messages');
    expect(html).toContain('input');
    expect(html).toContain('send');
  });

  it('should manage chat state correctly', () => {
    const chatPanel = new ChatPanel();
    chatPanel.setBudget(100);

    const message1 = chatPanel.addMessage('user', 'Hello');
    expect(message1.role).toBe('user');
    expect(message1.id).toBeDefined();

    const message2 = chatPanel.addMessage('assistant', 'Hi there!', {
      cost: 0.01,
    });
    expect(message2.role).toBe('assistant');

    const state = chatPanel.getState();
    expect(state.messages.length).toBe(2);
    expect(state.totalCost).toBe(0.01);
    expect(state.budgetRemaining).toBe(99.99);
  });
});
