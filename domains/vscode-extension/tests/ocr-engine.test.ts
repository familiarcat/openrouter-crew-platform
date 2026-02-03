/**
 * OCR Engine Tests
 *
 * Unit tests for OCR image processing and text extraction
 */

import { OCREngine, OCRWithNLP } from '../src/services/ocr-engine';

describe('OCREngine', () => {
  let engine: OCREngine;

  beforeEach(() => {
    engine = new OCREngine();
  });

  describe('Code Block Extraction', () => {
    it('should extract code blocks wrapped in backticks', () => {
      const text = `Here is some code:
\`\`\`
function hello() {
  console.log("world");
}
\`\`\`
That's the code.`;

      const result = engine.analyzeText(text);
      expect(result.codeBlocks.length).toBeGreaterThan(0);
      expect(result.codeBlocks[0]).toContain('function hello');
    });

    it('should extract indented code blocks', () => {
      const text = `Example:
    function test() {
      return 42;
    }
End.`;

      const result = engine.analyzeText(text);
      expect(result.codeBlocks.length).toBeGreaterThan(0);
    });

    it('should extract multiple code blocks', () => {
      const text = `First block:
\`\`\`
const x = 1;
\`\`\`

Second block:
\`\`\`
const y = 2;
\`\`\``;

      const result = engine.analyzeText(text);
      expect(result.codeBlocks.length).toBeGreaterThanOrEqual(2);
    });

    it('should cap code blocks at 5', () => {
      let text = '';
      for (let i = 0; i < 10; i++) {
        text += `\`\`\`\nblock${i}\n\`\`\`\n`;
      }

      const result = engine.analyzeText(text);
      expect(result.codeBlocks.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Detection', () => {
    it('should detect Error keyword', () => {
      const text = 'Error: Cannot read property of undefined';
      const result = engine.analyzeText(text);
      expect(result.isErrorMessage).toBe(true);
    });

    it('should detect TypeError', () => {
      const text = 'TypeError: x is not a function';
      const result = engine.analyzeText(text);
      expect(result.isErrorMessage).toBe(true);
    });

    it('should detect ReferenceError', () => {
      const text = 'ReferenceError: myVariable is not defined';
      const result = engine.analyzeText(text);
      expect(result.isErrorMessage).toBe(true);
    });

    it('should detect stack trace patterns', () => {
      const text = `Error: Something went wrong
at myFunction (file.js:10:5)
at processRequest (server.js:25:3)
at Layer.handle [as handle_request] (express.js:100:15)`;

      const result = engine.analyzeText(text);
      expect(result.isErrorMessage).toBe(true);
      expect(result.stackTrace).toBeDefined();
      expect(result.stackTrace?.length).toBeGreaterThan(0);
    });

    it('should extract multiple stack trace entries', () => {
      const text = `TypeError: Cannot read property
at functionA (fileA.js:5:10)
at functionB (fileB.js:15:8)
at functionC (fileC.js:25:3)`;

      const result = engine.analyzeText(text);
      expect(result.stackTrace?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Language Detection', () => {
    it('should detect JavaScript', () => {
      const text = 'const x = 5; function test() { return x; }';
      const result = engine.analyzeText(text);
      expect(result.language).toBe('javascript');
    });

    it('should detect TypeScript', () => {
      const text = 'interface User { name: string; age: number; }';
      const result = engine.analyzeText(text);
      expect(result.language).toBe('typescript');
    });

    it('should detect Python', () => {
      const text = 'def hello(name):\n  print(f"Hello {name}")';
      const result = engine.analyzeText(text);
      expect(result.language).toBe('python');
    });

    it('should detect Java', () => {
      const text = 'public class Main { void test() { } }';
      const result = engine.analyzeText(text);
      expect(result.language).toBe('java');
    });

    it('should detect SQL', () => {
      const text = 'SELECT * FROM users WHERE id = 1';
      const result = engine.analyzeText(text);
      expect(result.language).toBe('sql');
    });
  });

  describe('Content Type Detection', () => {
    it('should detect error content type', () => {
      const text = 'Error: Something failed at line 10';
      const result = engine.analyzeText(text);
      expect(result.contentType).toBe('error');
    });

    it('should detect code content type', () => {
      const text = 'function test() { return 42; }';
      const result = engine.analyzeText(text);
      expect(result.contentType).toBe('code');
    });

    it('should detect console content type', () => {
      const text = 'Console output:\nServer running on port 3000';
      const result = engine.analyzeText(text);
      expect(result.contentType).toBe('console');
    });

    it('should detect diagram content type from ASCII art', () => {
      const text = `
        ┌────────────┐
        │   Client   │
        └──────┬─────┘
               │
        ┌──────▼─────┐
        │   Server   │
        └────────────┘`;

      const result = engine.analyzeText(text);
      expect(result.contentType).toBe('diagram');
    });

    it('should detect mixed content type', () => {
      const text = 'This is text with some code and error';
      const result = engine.analyzeText(text);
      expect(['text', 'code', 'error', 'mixed']).toContain(result.contentType);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have confidence between 0 and 1', () => {
      const result = engine.analyzeText('Some text');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should have higher confidence with code blocks', () => {
      const noCode = engine.analyzeText('Just some text');
      const withCode = engine.analyzeText('function test() {}');

      expect(withCode.confidence).toBeGreaterThanOrEqual(noCode.confidence);
    });

    it('should have higher confidence with language detection', () => {
      const noLang = engine.analyzeText('Some text here');
      const withLang = engine.analyzeText('const x = 5;');

      expect(withLang.confidence).toBeGreaterThanOrEqual(noLang.confidence);
    });

    it('should boost confidence for error messages', () => {
      const normal = engine.analyzeText('Some text');
      const error = engine.analyzeText('Error: Something failed');

      expect(error.confidence).toBeGreaterThanOrEqual(normal.confidence);
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary for error content', () => {
      const text = 'TypeError: x is not a function at line 10';
      const result = engine.analyzeText(text);
      expect(result.summary).toContain('Error');
    });

    it('should generate summary for code content', () => {
      const text = 'function test() {}';
      const result = engine.analyzeText(text);
      expect(result.summary).toContain('code');
    });

    it('should include code block count in summary', () => {
      const text = '```\ncode1\n```\n```\ncode2\n```';
      const result = engine.analyzeText(text);
      expect(result.summary).toContain('block');
    });

    it('should include language in summary', () => {
      const text = 'function test() {}';
      const result = engine.analyzeText(text);
      expect(result.summary).toContain('javascript');
    });
  });

  describe('Code Context Conversion', () => {
    it('should convert error to context prompt', () => {
      const text = 'TypeError: Cannot read property at file.js:10';
      const result = engine.analyzeText(text);
      const context = engine.convertToCodeContext(result);

      expect(context.prompt).toContain('error');
      expect(context.selectedCode.length).toBeGreaterThan(0);
    });

    it('should convert code to context', () => {
      const text = 'function hello() { console.log("hi"); }';
      const result = engine.analyzeText(text);
      const context = engine.convertToCodeContext(result);

      expect(context.prompt).toContain('code');
      expect(context.selectedCode).toContain('hello');
    });

    it('should preserve language in context', () => {
      const text = 'const x = 5;';
      const result = engine.analyzeText(text);
      const context = engine.convertToCodeContext(result);

      expect(context.language).toBe('javascript');
    });
  });

  describe('Multiple Image Processing', () => {
    it('should process multiple images', async () => {
      const images = ['base64image1', 'base64image2', 'base64image3'];
      const results = await engine.processMultipleImages(images);

      expect(results.length).toBe(3);
      expect(results.every(r => 'success' in r)).toBe(true);
    });

    it('should merge multiple OCR results', () => {
      const result1 = engine.analyzeText('function a() {}');
      const result2 = engine.analyzeText('function b() {}');

      const merged = engine.mergeOCRResults([result1, result2]);

      expect(merged.success).toBe(true);
      expect(merged.codeBlocks.length).toBeGreaterThan(0);
      expect(merged.contentType).toBe('code');
    });

    it('should merge error and code results', () => {
      const errorResult = engine.analyzeText('Error: Something went wrong');
      const codeResult = engine.analyzeText('const x = 5;');

      const merged = engine.mergeOCRResults([errorResult, codeResult]);

      expect(merged.isErrorMessage).toBe(true);
      expect(merged.contentType).toBe('error');
    });

    it('should cap merged code blocks at 5', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(engine.analyzeText(`\`\`\nblock${i}\n\`\``));
      }

      const merged = engine.mergeOCRResults(results);
      expect(merged.codeBlocks.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Content Analysis', () => {
    it('should analyze complete error context', () => {
      const errorText = `
        TypeError: Cannot read property 'map' of undefined
        at process (controller.js:45:10)
        at main (server.js:100:5)

        Code:
        \`\`\`
        const items = data.items;
        const mapped = items.map(x => x.id);
        \`\`\``;

      const result = engine.analyzeText(errorText);

      expect(result.isErrorMessage).toBe(true);
      expect(result.contentType).toBe('error');
      expect(result.stackTrace).toBeDefined();
      expect(result.codeBlocks.length).toBeGreaterThan(0);
      expect(result.language).toBe('javascript');
    });

    it('should analyze production error with full context', () => {
      const errorText = `
        Production Error Log:
        Error: ECONNREFUSED 127.0.0.1:5432
        at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:22)

        Database: PostgreSQL
        Status: Failed to connect`;

      const result = engine.analyzeText(errorText);

      expect(result.isErrorMessage).toBe(true);
      expect(result.contentType).toBe('error');
      expect(result.summary).toContain('Error');
    });
  });
});

describe('OCRWithNLP', () => {
  let analyzer: OCRWithNLP;

  beforeEach(() => {
    analyzer = new OCRWithNLP();
  });

  describe('Integration', () => {
    it('should analyze image and detect intent', async () => {
      const result = await analyzer.analyzeImage('base64imagedata');

      expect(result.ocr).toBeDefined();
      expect(result.nlp).toBeDefined();
      expect(result.combined).toBeDefined();
    });

    it('should combine OCR and NLP results', async () => {
      const result = await analyzer.analyzeImage('base64imagedata');

      expect(result.combined.intent).toBeDefined();
      expect(result.combined.confidence).toBeGreaterThanOrEqual(0);
      expect(result.combined.confidence).toBeLessThanOrEqual(1);
    });

    it('should preserve code context through analysis', async () => {
      const result = await analyzer.analyzeImage('base64imagedata');

      expect(result.codeContext).toBeDefined();
      expect(result.codeContext.prompt).toBeDefined();
      expect(result.codeContext.selectedCode).toBeDefined();
    });
  });
});

describe('OCR Real-World Scenarios', () => {
  let engine: OCREngine;

  beforeEach(() => {
    engine = new OCREngine();
  });

  it('should handle Node.js error trace', () => {
    const errorTrace = `
      (node:1234) UnhandledPromiseRejectionWarning: Error: Connection timeout
        at async Database.connect (db.js:45:10)
        at async Server.start (server.js:22:5)
        at async main (index.js:10:3)`;

    const result = engine.analyzeText(errorTrace);

    expect(result.isErrorMessage).toBe(true);
    expect(result.stackTrace).toBeDefined();
    expect(result.stackTrace?.length).toBeGreaterThan(0);
  });

  it('should handle Python error trace', () => {
    const errorTrace = `
      Traceback (most recent call last):
        File "app.py", line 15, in process
          result = calculate(data)
        File "math.py", line 42, in calculate
          return items[index]
      IndexError: list index out of range`;

    const result = engine.analyzeText(errorTrace);

    expect(result.isErrorMessage).toBe(true);
    expect(result.language).toBe('python');
  });

  it('should handle console output with mixed content', () => {
    const output = `
      $ npm test

      PASS src/services/test.js
        ✓ should work (42ms)
        ✓ should handle errors (15ms)

      Test Suites: 1 passed, 1 total
      Tests: 2 passed, 2 total`;

    const result = engine.analyzeText(output);

    expect(result.contentType).toBe('console');
  });

  it('should handle database error with SQL code', () => {
    const error = `
      PostgreSQL Error: UNIQUE constraint failed

      SQL Query:
      \`\`\`sql
      INSERT INTO users (email, username)
      VALUES ('test@example.com', 'testuser')
      \`\`\`

      Error: duplicate key value violates unique constraint "users_email_key"`;

    const result = engine.analyzeText(error);

    expect(result.isErrorMessage).toBe(true);
    expect(result.contentType).toBe('error');
    expect(result.language).toBe('sql');
    expect(result.codeBlocks.length).toBeGreaterThan(0);
  });
});
