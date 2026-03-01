/// <reference types="mocha" />
import * as assert from 'assert';
import { NLPProcessor } from './nlp-processor.js';

suite('NLP Processor Service', () => {
  let nlpProcessor: NLPProcessor;

  setup(() => {
    nlpProcessor = new NLPProcessor();
  });

  test('Detects ASK intent', async () => {
    const result = await nlpProcessor.detectIntent('How do I center a div?');
    assert.strictEqual(result.intent, 'ASK');
  });

  test('Detects REVIEW intent', async () => {
    const result = await nlpProcessor.detectIntent('Review this code for bugs');
    assert.strictEqual(result.intent, 'REVIEW');
  });

  test('Detects REFACTOR intent', async () => {
    const result = await nlpProcessor.detectIntent('Refactor this function to be cleaner');
    assert.strictEqual(result.intent, 'REFACTOR');
  });

  test('Detects DEBUG intent', async () => {
    const result = await nlpProcessor.detectIntent('Fix this error: undefined is not a function');
    assert.strictEqual(result.intent, 'DEBUG');
  });

  test('Extracts entities (function)', async () => {
    const result = await nlpProcessor.detectIntent('Explain function calculateTotal()');
    const funcEntity = result.entities.find(e => e.type === 'FUNCTION');
    assert.ok(funcEntity);
    assert.strictEqual(funcEntity?.name, 'calculateTotal()');
  });

  test('Detects high complexity for DEBUG intent', async () => {
    const result = await nlpProcessor.detectIntent('Fix this error');
    assert.strictEqual(result.complexity, 'HIGH');
  });
});