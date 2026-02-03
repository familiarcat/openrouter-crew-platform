/**
 * File Manager Tests
 */

import { FileManager } from '../src/services/file-manager';

describe('FileManager', () => {
  let manager: FileManager;

  beforeEach(() => {
    manager = new FileManager();
  });

  describe('Language Detection', () => {
    it('should detect JavaScript', () => {
      const analysis = manager.analyzeFile('app.js', 'const x = 5;');
      expect(analysis.language).toBe('javascript');
    });

    it('should detect TypeScript', () => {
      const analysis = manager.analyzeFile('app.ts', 'const x: number = 5;');
      expect(analysis.language).toBe('typescript');
    });

    it('should detect Python', () => {
      const analysis = manager.analyzeFile('app.py', 'x = 5');
      expect(analysis.language).toBe('python');
    });
  });

  describe('Node Extraction', () => {
    it('should extract JavaScript functions', () => {
      const code = 'function hello() { return 42; }';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.nodes.length).toBeGreaterThan(0);
      expect(analysis.nodes.some(n => n.name === 'hello')).toBe(true);
    });

    it('should extract classes', () => {
      const code = 'class User { constructor() {} }';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.nodes.some(n => n.type === 'class')).toBe(true);
    });

    it('should extract arrow functions', () => {
      const code = 'const add = (a, b) => a + b;';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.nodes.length).toBeGreaterThan(0);
    });

    it('should extract Python functions', () => {
      const code = 'def calculate(x):\n  return x * 2';
      const analysis = manager.analyzeFile('test.py', code);
      expect(analysis.nodes.some(n => n.type === 'function')).toBe(true);
    });
  });

  describe('Import/Export Detection', () => {
    it('should extract ES6 imports', () => {
      const code = "import { useState } from 'react';\nimport axios from 'axios';";
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.imports).toContain('react');
      expect(analysis.imports).toContain('axios');
    });

    it('should extract CommonJS requires', () => {
      const code = "const express = require('express');";
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.imports).toContain('express');
    });

    it('should extract exports', () => {
      const code = 'export function hello() {}\nexport class User {}';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.exports).toContain('hello');
      expect(analysis.exports).toContain('User');
    });

    it('should extract Python imports', () => {
      const code = 'import os\nfrom flask import Flask';
      const analysis = manager.analyzeFile('test.py', code);
      expect(analysis.imports).toContain('os');
      expect(analysis.imports).toContain('flask');
    });
  });

  describe('Complexity Calculation', () => {
    it('should calculate low complexity for simple code', () => {
      const code = 'function add(a, b) { return a + b; }';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.complexity).toBeLessThan(5);
    });

    it('should calculate higher complexity for conditional logic', () => {
      const code = `
        function process(x) {
          if (x > 0) return 'positive';
          else if (x < 0) return 'negative';
          else return 'zero';
        }`;
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.complexity).toBeGreaterThan(1);
    });

    it('should detect loops increase complexity', () => {
      const code = `
        function loop() {
          for (let i = 0; i < 10; i++) {
            while (true) { break; }
          }
        }`;
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.complexity).toBeGreaterThan(2);
    });
  });

  describe('Issue Detection', () => {
    it('should detect long functions', () => {
      const code = 'function long() {\n' + 'x = 1;\n'.repeat(60) + '}';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.issues.some(i => i.includes('too long'))).toBe(true);
    });

    it('should detect console.log', () => {
      const code = 'console.log("debug");';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.issues.some(i => i.includes('console'))).toBe(true);
    });

    it('should detect var usage', () => {
      const code = 'var x = 5;';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.issues.some(i => i.includes('var'))).toBe(true);
    });

    it('should detect missing catch blocks', () => {
      const code = 'try { riskyFunction(); }';
      const analysis = manager.analyzeFile('test.js', code);
      expect(analysis.issues.some(i => i.includes('catch'))).toBe(true);
    });
  });

  describe('Refactoring Suggestions', () => {
    it('should suggest breaking down complex functions', () => {
      const code = `function complex() {
        if (a) if (b) if (c) if (d) if (e)
        if (f) if (g) if (h) if (i) if (j) { }
      }`;
      const analysis = manager.analyzeFile('test.js', code);
      const suggestions = manager.generateSuggestions(analysis);
      expect(suggestions.some(s => s.issue.includes('complexity'))).toBe(true);
    });

    it('should suggest removing unused imports', () => {
      const code = "import { unused } from 'module';\nconst x = 5;";
      const analysis = manager.analyzeFile('test.js', code);
      const suggestions = manager.generateSuggestions(analysis);
      expect(suggestions.some(s => s.issue.includes('unused'))).toBe(true);
    });

    it('should prioritize high complexity', () => {
      const code = `function test() {
        if (a) if (b) if (c) if (d) if (e)
        if (f) if (g) if (h) if (i) if (j) { }
      }`;
      const analysis = manager.analyzeFile('test.js', code);
      const suggestions = manager.generateSuggestions(analysis);
      const highPriority = suggestions.filter(s => s.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-File Analysis', () => {
    it('should analyze multiple files', () => {
      const files = [
        { path: 'app.js', content: 'function main() {}' },
        { path: 'utils.js', content: 'function helper() {}' },
      ];
      const result = manager.analyzeMultipleFiles(files);
      expect(result.analyses.length).toBe(2);
    });

    it('should detect cross-file dependencies', () => {
      const files = [
        { path: 'index.js', content: "import { helper } from './utils';" },
        { path: 'utils.js', content: 'export function helper() {}' },
      ];
      const result = manager.analyzeMultipleFiles(files);
      expect(result.crossFileDependencies.size).toBeGreaterThan(0);
    });

    it('should collect all issues', () => {
      const files = [
        { path: 'app.js', content: 'console.log("x");' },
        { path: 'test.js', content: 'var x = 5;' },
      ];
      const result = manager.analyzeMultipleFiles(files);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Dependency Graph', () => {
    it('should generate dependency graph', () => {
      const files = [
        { path: 'app.js', content: "import { x } from './utils';" },
        { path: 'utils.js', content: 'export const x = 1;' },
      ];
      const graph = manager.generateDependencyGraph(files);
      expect(graph).toContain('Module Dependencies');
    });

    it('should show file relationships', () => {
      const files = [
        { path: 'main.js', content: "require('./helpers')" },
        { path: 'helpers.js', content: '' },
      ];
      const graph = manager.generateDependencyGraph(files);
      expect(graph.length).toBeGreaterThan(0);
    });
  });

  describe('Refactoring Generation', () => {
    it('should generate extract-function refactoring', () => {
      const result = manager.generateRefactoring(
        'original code',
        'extract-function',
        'some context'
      );
      expect(result).toContain('Extracted function');
    });

    it('should preserve original code', () => {
      const original = 'const x = 5;';
      const result = manager.generateRefactoring(original, 'simplify-logic', '');
      expect(result).toContain(original);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should analyze Express server file', () => {
      const code = `
        const express = require('express');
        const app = express();

        app.get('/api/users', (req, res) => {
          console.log('request');
          const users = db.query('SELECT * FROM users');
          res.json(users);
        });

        app.listen(3000);
      `;
      const analysis = manager.analyzeFile('server.js', code);
      expect(analysis.imports).toContain('express');
      expect(analysis.issues.some(i => i.includes('console'))).toBe(true);
    });

    it('should analyze React component', () => {
      const code = `
        import React, { useState } from 'react';

        export function Counter() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }
      `;
      const analysis = manager.analyzeFile('Counter.jsx', code);
      expect(analysis.imports).toContain('react');
      expect(analysis.exports).toContain('Counter');
    });

    it('should analyze Python module', () => {
      const code = `
        import os
        from typing import List

        def process_files(path: str) -> List[str]:
          return os.listdir(path)

        class FileHandler:
          def __init__(self, path):
            self.path = path
      `;
      const analysis = manager.analyzeFile('handler.py', code);
      expect(analysis.language).toBe('python');
      expect(analysis.nodes.some(n => n.type === 'class')).toBe(true);
    });
  });
});
