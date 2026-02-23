/// <reference types="mocha" />
import * as assert from 'assert';
import { NLPProcessor } from './nlp-processor.js';

suite('NLP Processor Service', () => {
  let nlpProcessor: NLPProcessor;

  setup(() => {
    nlpProcessor = new NLPProcessor();
  });

  test('Detects ASK intent', () => {
    const result = nlpProcessor.analyze('How do I center a div?');
    assert.strictEqual(result.intent.intent, 'ASK');
  });

  test('Detects REVIEW intent', () => {
    const result = nlpProcessor.analyze('Review this code for bugs');
    assert.strictEqual(result.intent.intent, 'REVIEW');
  });

  test('Detects REFACTOR intent', () => {
    const result = nlpProcessor.analyze('Refactor this function to be cleaner');
    assert.strictEqual(result.intent.intent, 'REFACTOR');
  });

  test('Detects DEBUG intent', () => {
    const result = nlpProcessor.analyze('Fix this error: undefined is not a function');
    assert.strictEqual(result.intent.intent, 'DEBUG');
  });

  test('Extracts entities (function)', () => {
    const result = nlpProcessor.analyze('Explain function calculateTotal()');
    const funcEntity = result.entities.find(e => e.type === 'function');
    assert.ok(funcEntity);
    assert.strictEqual(funcEntity?.name, 'calculateTotal');
  });

  test('Detects language from context', () => {
    const result = nlpProcessor.analyze('Explain this code', {
      selectedCode: 'function test() { console.log("hello"); }'
    });
    assert.strictEqual(result.language, 'javascript');
  });
});