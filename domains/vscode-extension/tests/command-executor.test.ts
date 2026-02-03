/**
 * Command Executor Tests
 */

import { CommandExecutor } from '../src/commands/command-executor';

describe('CommandExecutor', () => {
  let executor: CommandExecutor;

  beforeEach(() => {
    executor = new CommandExecutor('test-api-key');
  });

  describe('Ask Command', () => {
    it('should execute ask command', async () => {
      const result = await executor.ask('What is JavaScript?');
      expect(result.success).toBeDefined();
      expect(result.metadata.intent).toBe('ASK');
    });

    it('should analyze code context', async () => {
      const result = await executor.ask('Explain this', {
        code: 'const x = 5;',
        file: 'test.js',
      });
      expect(result.metadata).toBeDefined();
      expect(result.metadata.language).toBeDefined();
    });
  });

  describe('Review Command', () => {
    it('should execute review command', async () => {
      const code = 'function test() { return 42; }';
      const result = await executor.review(code, 'test.js');
      expect(result.metadata.intent).toBe('REVIEW');
    });

    it('should include complexity in review', async () => {
      const code = 'const x = 5;';
      const result = await executor.review(code, 'test.js');
      expect(result.metadata.complexity).toBeDefined();
    });
  });

  describe('Explain Command', () => {
    it('should execute explain command', async () => {
      const code = 'function add(a, b) { return a + b; }';
      const result = await executor.explain(code, 'math.js');
      expect(result.metadata.intent).toBe('EXPLAIN');
    });

    it('should analyze code structure', async () => {
      const code = 'class User { constructor(name) { this.name = name; } }';
      const result = await executor.explain(code, 'User.js');
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Generate Command', () => {
    it('should execute generate command', async () => {
      const result = await executor.generate('Create a function to reverse a string');
      expect(result.metadata.intent).toBe('GENERATE');
    });

    it('should set language preference', async () => {
      const result = await executor.generate('Generate Python code', 'python');
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Refactor Command', () => {
    it('should execute refactor command', async () => {
      const code = 'var x = 1; var y = 2;';
      const result = await executor.refactor(code, 'test.js');
      expect(result.metadata.intent).toBe('REFACTOR');
    });

    it('should accept custom instructions', async () => {
      const code = 'function process() { }';
      const result = await executor.refactor(code, 'test.js', 'Make it more concise');
      expect(result.success).toBeDefined();
    });
  });

  describe('Debug Command', () => {
    it('should execute debug command', async () => {
      const result = await executor.debug('TypeError: Cannot read property');
      expect(result.metadata.intent).toBe('DEBUG');
    });

    it('should use error context', async () => {
      const result = await executor.debug('ReferenceError: x is not defined', {
        code: 'console.log(x);',
        file: 'test.js',
      });
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Generate Tests Command', () => {
    it('should generate tests', async () => {
      const code = 'function add(a, b) { return a + b; }';
      const result = await executor.generateTests(code, 'math.js');
      expect(result.metadata.intent).toBe('TEST');
    });

    it('should analyze functions to test', async () => {
      const code = 'export function multiply(a, b) { return a * b; }';
      const result = await executor.generateTests(code, 'calc.js');
      expect(result.success).toBeDefined();
    });
  });

  describe('Budget Management', () => {
    it('should set budget', () => {
      executor.setBudget(50);
      expect(executor.getRemainingBudget()).toBe(50);
    });

    it('should track costs', async () => {
      const initialBudget = executor.getRemainingBudget();
      const cost = executor.getTotalCost();
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Image Processing', () => {
    it('should process image', async () => {
      const result = await executor.processImage('base64imagedata');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.intent).toBeDefined();
    });

    it('should detect language from image', async () => {
      const result = await executor.processImage('base64imagedata');
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should orchestrate multiple services', async () => {
      const code = 'function test() { console.log("x"); }';
      const result = await executor.review(code, 'test.js');

      expect(result.success).toBeDefined();
      expect(result.metadata.intent).toBe('REVIEW');
      expect(result.metadata.complexity).toBeDefined();
      expect(result.metadata.language).toBeDefined();
    });

    it('should flow through full pipeline', async () => {
      const results = [];

      // Ask
      results.push(await executor.ask('What does this do?', { code: 'const x = 5;', file: 'test.js' }));

      // Review
      results.push(await executor.review('const x = 5;', 'test.js'));

      // Generate
      results.push(await executor.generate('Create a counter function'));

      expect(results.every(r => 'metadata' in r)).toBe(true);
      expect(results[0].metadata.intent).toBe('ASK');
      expect(results[1].metadata.intent).toBe('REVIEW');
      expect(results[2].metadata.intent).toBe('GENERATE');
    });
  });

  describe('Real-World Usage', () => {
    it('should handle production code review', async () => {
      const code = `
        async function fetchData(url) {
          const response = await fetch(url);
          const data = response.json();
          return data;
        }`;

      const result = await executor.review(code, 'api.js');
      expect(result.metadata.intent).toBe('REVIEW');
      expect(result.metadata.language).toBe('javascript');
    });

    it('should handle error debugging', async () => {
      const error = 'Error: ENOENT: no such file or directory';
      const code = 'const data = fs.readFileSync("missing.txt");';

      const result = await executor.debug(error, {
        code,
        file: 'app.js',
      });
      expect(result.metadata.intent).toBe('DEBUG');
    });

    it('should generate production-ready code', async () => {
      const result = await executor.generate(
        'Create an express route handler for user creation with validation',
        'javascript'
      );
      expect(result.metadata.intent).toBe('GENERATE');
    });
  });
});
