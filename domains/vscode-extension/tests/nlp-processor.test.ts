/**
 * NLP Processor Tests
 *
 * Unit tests for NLP intent detection and entity extraction
 */

import { NLPProcessor } from '../src/services/nlp-processor';

describe('NLPProcessor', () => {
  let processor: NLPProcessor;

  beforeEach(() => {
    processor = new NLPProcessor();
  });

  describe('Intent Detection', () => {
    it('should detect REVIEW intent from code review keywords', () => {
      const analysis = processor.analyze('Review this code for issues');
      expect(analysis.intent.intent).toBe('REVIEW');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect DEBUG intent from debugging keywords', () => {
      const analysis = processor.analyze('Why is this function not working?');
      expect(analysis.intent.intent).toBe('DEBUG');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect GENERATE intent from creation keywords', () => {
      const analysis = processor.analyze('Write a function that sorts an array');
      expect(analysis.intent.intent).toBe('GENERATE');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect REFACTOR intent from improvement keywords', () => {
      const analysis = processor.analyze('Refactor this to be more efficient');
      expect(analysis.intent.intent).toBe('REFACTOR');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect TEST intent from testing keywords', () => {
      const analysis = processor.analyze('Write unit tests for this function');
      expect(analysis.intent.intent).toBe('TEST');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect EXPLAIN intent from explanation keywords', () => {
      const analysis = processor.analyze('Explain what this code does');
      expect(analysis.intent.intent).toBe('EXPLAIN');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect DOCUMENT intent from documentation keywords', () => {
      const analysis = processor.analyze('Add documentation to this function');
      expect(analysis.intent.intent).toBe('DOCUMENT');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect OPTIMIZE intent from performance keywords', () => {
      const analysis = processor.analyze('Optimize this for better performance');
      expect(analysis.intent.intent).toBe('OPTIMIZE');
      expect(analysis.intent.confidence).toBeGreaterThan(0.3);
    });

    it('should detect ASK intent for general questions', () => {
      const analysis = processor.analyze('What is a closure in JavaScript?');
      expect(analysis.intent.intent).toBe('ASK');
    });

    it('should provide alternative intents', () => {
      const analysis = processor.analyze('Review and refactor this code');
      expect(analysis.intent.alternatives.length).toBeGreaterThan(0);
    });

    it('should have confidence scores between 0 and 1', () => {
      const analysis = processor.analyze('Review this code');
      expect(analysis.intent.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.intent.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract function names from prompt', () => {
      const analysis = processor.analyze('Review the calculateTotal() function');
      const functionEntity = analysis.entities.find(e => e.type === 'function');
      expect(functionEntity).toBeDefined();
      expect(functionEntity?.name).toBe('calculateTotal');
    });

    it('should extract variable names from prompt', () => {
      const analysis = processor.analyze('Fix the bug in userCount variable');
      const varEntity = analysis.entities.find(e => e.type === 'variable');
      expect(varEntity).toBeDefined();
    });

    it('should extract class names from code context', () => {
      const code = 'class UserManager { }';
      const analysis = processor.analyze('Review this', { selectedCode: code });
      const classEntity = analysis.entities.find(e => e.type === 'class');
      expect(classEntity?.name).toBe('UserManager');
    });

    it('should extract file names from prompt', () => {
      const analysis = processor.analyze('Check the utils.ts file');
      const fileEntity = analysis.entities.find(e => e.type === 'file');
      expect(fileEntity).toBeDefined();
      expect(fileEntity?.name).toBe('utils.ts');
    });

    it('should deduplicate entities', () => {
      const analysis = processor.analyze('Review func() and func() again');
      const funcEntities = analysis.entities.filter(
        e => e.type === 'function' && e.name === 'func'
      );
      expect(funcEntities.length).toBeLessThanOrEqual(1);
    });

    it('should cap entities at 10', () => {
      const manyFunctions = 'a() b() c() d() e() f() g() h() i() j() k() l()';
      const analysis = processor.analyze(manyFunctions);
      expect(analysis.entities.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Language Detection', () => {
    it('should detect JavaScript from keywords', () => {
      const analysis = processor.analyze('const x = 5; function test() {}');
      expect(analysis.language).toBe('javascript');
    });

    it('should detect TypeScript from keywords', () => {
      const code = 'interface User { name: string; }';
      const analysis = processor.analyze('Review', { selectedCode: code });
      expect(analysis.language).toBe('typescript');
    });

    it('should detect Python from keywords', () => {
      const code = 'def hello():\n  print("hi")';
      const analysis = processor.analyze('Review', { selectedCode: code });
      expect(analysis.language).toBe('python');
    });

    it('should detect Java from keywords', () => {
      const code = 'public class Main { void test() {} }';
      const analysis = processor.analyze('Review', { selectedCode: code });
      expect(analysis.language).toBe('java');
    });

    it('should return undefined for unknown language', () => {
      const analysis = processor.analyze('just some text');
      expect(analysis.language).toBeUndefined();
    });
  });

  describe('Urgency Detection', () => {
    it('should detect high urgency from urgent keywords', () => {
      const analysis = processor.analyze('URGENT: Fix this critical issue now');
      expect(analysis.urgency).toBe('high');
    });

    it('should detect medium urgency from medium keywords', () => {
      const analysis = processor.analyze('This is important and needed soon');
      expect(analysis.urgency).toBe('medium');
    });

    it('should detect low urgency by default', () => {
      const analysis = processor.analyze('Review this code when you get a chance');
      expect(analysis.urgency).toBe('low');
    });

    it('should prioritize high over medium', () => {
      const analysis = processor.analyze('ASAP - important fix needed');
      expect(analysis.urgency).toBe('high');
    });
  });

  describe('Sentiment Detection', () => {
    it('should detect frustrated sentiment', () => {
      const analysis = processor.analyze('This is broken and why does it keep failing?');
      expect(analysis.sentiment).toBe('frustrated');
    });

    it('should detect negative sentiment', () => {
      const analysis = processor.analyze('This code is terrible and awful');
      expect(analysis.sentiment).toBe('negative');
    });

    it('should detect positive sentiment', () => {
      const analysis = processor.analyze('This is great and awesome code');
      expect(analysis.sentiment).toBe('positive');
    });

    it('should detect neutral sentiment by default', () => {
      const analysis = processor.analyze('Review this code');
      expect(analysis.sentiment).toBe('neutral');
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract important keywords', () => {
      const analysis = processor.analyze('Review the async function implementation');
      expect(analysis.keywords.length).toBeGreaterThan(0);
    });

    it('should include intent keywords', () => {
      const analysis = processor.analyze('Review this code');
      expect(analysis.keywords).toContain('review');
    });

    it('should cap keywords at 10', () => {
      const manyWords = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11';
      const analysis = processor.analyze(manyWords);
      expect(analysis.keywords.length).toBeLessThanOrEqual(10);
    });

    it('should filter out common words', () => {
      const analysis = processor.analyze('the and or is a an');
      // Should be empty or mostly empty
      expect(analysis.keywords.length).toBeLessThan(3);
    });
  });

  describe('Complexity Estimation', () => {
    it('should estimate LOW complexity for simple prompts', () => {
      const analysis = processor.analyze('What is 2+2?');
      expect(analysis.complexity).toBe('LOW');
    });

    it('should estimate MEDIUM complexity for moderate prompts', () => {
      const analysis = processor.analyze('Refactor this 50-line function to be cleaner');
      expect(analysis.complexity).toBe('MEDIUM');
    });

    it('should estimate HIGH complexity for complex prompts', () => {
      const analysis = processor.analyze(
        'Debug this race condition in the async function. ' +
        'Analyze the event loop and optimize the architecture.'
      );
      expect(analysis.complexity).toBe('HIGH');
    });

    it('should consider code context size', () => {
      const largeCode = 'function test() {\n' + '  console.log("line");\n'.repeat(100) + '}';
      const analysis = processor.analyze('Review', { selectedCode: largeCode });
      expect(analysis.complexity).toBe('MEDIUM');
    });

    it('should boost complexity for algorithmic keywords', () => {
      const analysis = processor.analyze('Design a distributed architecture for this system');
      expect(analysis.complexity).toBe('HIGH');
    });
  });

  describe('Overall Analysis', () => {
    it('should provide complete analysis with all fields', () => {
      const analysis = processor.analyze('Review this code');
      expect(analysis.originalPrompt).toBe('Review this code');
      expect(analysis.intent).toBeDefined();
      expect(analysis.entities).toBeDefined();
      expect(analysis.urgency).toBeDefined();
      expect(analysis.sentiment).toBeDefined();
      expect(analysis.keywords).toBeDefined();
      expect(analysis.complexity).toBeDefined();
      expect(analysis.confidence).toBeDefined();
    });

    it('should have confidence between 0 and 1', () => {
      const analysis = processor.analyze('Review this code');
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty prompt', () => {
      const analysis = processor.analyze('');
      expect(analysis.intent).toBeDefined();
      expect(analysis.entities).toBeDefined();
    });

    it('should handle very long prompt', () => {
      const longPrompt = 'word '.repeat(1000);
      const analysis = processor.analyze(longPrompt);
      expect(analysis.complexity).toBe('HIGH');
    });
  });

  describe('Integration with Code Context', () => {
    it('should extract entities from code context', () => {
      const code = 'function calculateSum(arr) { return arr.reduce((a, b) => a + b); }';
      const analysis = processor.analyze('Optimize this', { selectedCode: code });
      expect(analysis.entities.length).toBeGreaterThan(0);
    });

    it('should detect language from code context', () => {
      const code = 'async function main() { const data = await fetch(); }';
      const analysis = processor.analyze('Fix this', { selectedCode: code });
      expect(analysis.language).toBe('javascript');
    });

    it('should boost complexity for large code context', () => {
      const smallCode = 'function a() {}';
      const largeCode = 'function test() {\n' + 'console.log("x");\n'.repeat(200) + '}';

      const smallAnalysis = processor.analyze('Review', { selectedCode: smallCode });
      const largeAnalysis = processor.analyze('Review', { selectedCode: largeCode });

      // Large code should have higher or equal complexity
      const complexityScore = { LOW: 0, MEDIUM: 1, HIGH: 2 };
      expect(
        complexityScore[largeAnalysis.complexity]
      ).toBeGreaterThanOrEqual(
        complexityScore[smallAnalysis.complexity]
      );
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical code review request', () => {
      const analysis = processor.analyze(
        'Review this function for performance issues and security vulnerabilities'
      );
      expect(analysis.intent.intent).toBe('REVIEW');
      expect(analysis.keywords).toContain('review');
    });

    it('should handle debugging request', () => {
      const analysis = processor.analyze(
        'This async function crashes with a timeout error. Can you help debug?'
      );
      expect(analysis.intent.intent).toBe('DEBUG');
      expect(analysis.sentiment).not.toBe('positive');
    });

    it('should handle refactoring request', () => {
      const analysis = processor.analyze(
        'Can you refactor this 200-line method into smaller, more testable functions?'
      );
      expect(analysis.intent.intent).toBe('REFACTOR');
      expect(analysis.complexity).toBe('MEDIUM');
    });

    it('should handle urgent production issue', () => {
      const analysis = processor.analyze(
        'URGENT: Production is down. Fix the database connection issue immediately!'
      );
      expect(analysis.urgency).toBe('high');
      expect(analysis.sentiment).toBe('frustrated');
    });

    it('should handle feature request', () => {
      const analysis = processor.analyze(
        'Generate a new API endpoint for user authentication with JWT tokens'
      );
      expect(analysis.intent.intent).toBe('GENERATE');
      expect(analysis.complexity).toBe('MEDIUM');
    });
  });

  describe('Multi-Intent Detection', () => {
    it('should detect primary intent when multiple are present', () => {
      const analysis = processor.analyze('Review and refactor this function');
      expect(['REVIEW', 'REFACTOR']).toContain(analysis.intent.intent);
    });

    it('should provide alternatives for mixed intents', () => {
      const analysis = processor.analyze('Review and refactor and test this code');
      expect(analysis.intent.alternatives.length).toBeGreaterThan(0);
    });

    it('should handle conflicting keywords gracefully', () => {
      const analysis = processor.analyze('Write a test to debug this issue');
      expect(['TEST', 'DEBUG']).toContain(analysis.intent.intent);
      expect(analysis.intent.confidence).toBeGreaterThan(0);
    });
  });
});
