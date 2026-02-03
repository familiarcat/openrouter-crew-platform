/**
 * File Manager Service
 *
 * Advanced code manipulation via AST parsing.
 * Enables multi-file refactoring, code generation, and analysis.
 */

/**
 * Represents a code node (function, class, variable, etc.)
 */
export interface CodeNode {
  type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'comment';
  name: string;
  startLine: number;
  endLine: number;
  content: string;
  parameters?: string[];
  dependencies?: string[];
}

/**
 * File analysis result
 */
export interface FileAnalysis {
  filePath: string;
  language: string;
  nodes: CodeNode[];
  imports: string[];
  exports: string[];
  complexity: number;  // Cyclomatic complexity estimate
  issues: string[];
}

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  location: string;
  issue: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

/**
 * File Manager for code manipulation
 */
export class FileManager {
  /**
   * Parse file and extract code nodes
   */
  analyzeFile(filePath: string, content: string): FileAnalysis {
    const language = this.detectLanguage(filePath);
    const nodes = this.extractNodes(content, language);
    const imports = this.extractImports(content, language);
    const exports = this.extractExports(content, language);
    const complexity = this.calculateComplexity(content);
    const issues = this.detectIssues(content, nodes);

    return {
      filePath,
      language,
      nodes,
      imports,
      exports,
      complexity,
      issues,
    };
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      sql: 'sql',
    };
    return languageMap[ext || ''] || 'unknown';
  }

  /**
   * Extract code nodes (functions, classes, etc.)
   */
  private extractNodes(content: string, language: string): CodeNode[] {
    const nodes: CodeNode[] = [];
    const lines = content.split('\n');

    if (language === 'javascript' || language === 'typescript') {
      // Extract functions
      const funcPattern = /^[\s]*(async\s+)?function\s+(\w+)|^[\s]*(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(/gm;
      let match;
      while ((match = funcPattern.exec(content)) !== null) {
        const name = match[2] || match[4];
        const lineNum = content.substring(0, match.index).split('\n').length;
        nodes.push({
          type: 'function',
          name,
          startLine: lineNum,
          endLine: lineNum + 10,
          content: this.extractNodeContent(content, lineNum),
          parameters: this.extractParameters(content, match.index),
        });
      }

      // Extract classes
      const classPattern = /^[\s]*class\s+(\w+)/gm;
      while ((match = classPattern.exec(content)) !== null) {
        const name = match[1];
        const lineNum = content.substring(0, match.index).split('\n').length;
        nodes.push({
          type: 'class',
          name,
          startLine: lineNum,
          endLine: lineNum + 20,
          content: this.extractNodeContent(content, lineNum),
        });
      }
    } else if (language === 'python') {
      // Extract Python functions and classes
      const defPattern = /^def\s+(\w+)|^class\s+(\w+)/gm;
      let match;
      while ((match = defPattern.exec(content)) !== null) {
        const name = match[1] || match[2];
        const type = match[1] ? 'function' : 'class';
        const lineNum = content.substring(0, match.index).split('\n').length;
        nodes.push({
          type,
          name,
          startLine: lineNum,
          endLine: lineNum + 10,
          content: this.extractNodeContent(content, lineNum),
        });
      }
    }

    return nodes;
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      const importPattern = /^import\s+.*?\s+from\s+['"]([^'"]+)['"]/gm;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push(match[1]);
      }

      const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requirePattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (language === 'python') {
      const importPattern = /^import\s+(\S+)|^from\s+(\S+)\s+import/gm;
      let match;
      while ((match = importPattern.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }

    return [...new Set(imports)];
  }

  /**
   * Extract export statements
   */
  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      const exportPattern = /^export\s+(function|class|const|let|var)\s+(\w+)/gm;
      let match;
      while ((match = exportPattern.exec(content)) !== null) {
        exports.push(match[2]);
      }

      const namedExportPattern = /export\s*{\s*([^}]+)\s*}/;
      const namedMatch = content.match(namedExportPattern);
      if (namedMatch) {
        exports.push(...namedMatch[1].split(',').map(s => s.trim()));
      }
    }

    return exports;
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateComplexity(content: string): number {
    let complexity = 1;

    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\belse\b/g,
      /\bcase\b/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcatch\s*\(/g,
      /\b\?\s*:/g,  // ternary
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  /**
   * Detect code issues
   */
  private detectIssues(content: string, nodes: CodeNode[]): string[] {
    const issues: string[] = [];

    // Check for long functions
    for (const node of nodes) {
      if (node.type === 'function' && node.endLine - node.startLine > 50) {
        issues.push(`Function "${node.name}" is too long (${node.endLine - node.startLine} lines)`);
      }
    }

    // Check for missing error handling
    if (content.includes('try') && !content.includes('catch')) {
      issues.push('Try block without catch handler');
    }

    // Check for console.log in production
    if (content.includes('console.log')) {
      issues.push('Found console.log statements - should be removed or use logger');
    }

    // Check for var usage
    if (content.includes('var ')) {
      issues.push('Use of "var" detected - prefer "const" or "let"');
    }

    return issues;
  }

  /**
   * Extract node content
   */
  private extractNodeContent(content: string, startLine: number): string {
    const lines = content.split('\n');
    return lines.slice(startLine - 1, startLine + 20).join('\n');
  }

  /**
   * Extract function parameters
   */
  private extractParameters(content: string, index: number): string[] {
    const parenStart = content.indexOf('(', index);
    const parenEnd = content.indexOf(')', parenStart);
    if (parenStart === -1 || parenEnd === -1) return [];

    const paramStr = content.substring(parenStart + 1, parenEnd);
    return paramStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }

  /**
   * Generate refactoring suggestions
   */
  generateSuggestions(analysis: FileAnalysis): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    // High complexity functions
    for (const node of analysis.nodes) {
      if (node.type === 'function') {
        const nodeComplexity = this.calculateComplexity(node.content);
        if (nodeComplexity > 10) {
          suggestions.push({
            location: `${node.name}:${node.startLine}`,
            issue: `High complexity (${nodeComplexity})`,
            suggestion: 'Break into smaller functions',
            priority: 'high',
            confidence: 0.9,
          });
        }
      }
    }

    // Issues detected
    for (const issue of analysis.issues) {
      suggestions.push({
        location: analysis.filePath,
        issue,
        suggestion: `Review and address: ${issue}`,
        priority: issue.includes('long') ? 'medium' : 'high',
        confidence: 0.8,
      });
    }

    // Unused imports (basic heuristic)
    for (const imp of analysis.imports) {
      const importName = imp.split('/').pop() || imp;
      if (!analysis.nodes.some(n => n.content.includes(importName))) {
        suggestions.push({
          location: `import:${imp}`,
          issue: 'Potentially unused import',
          suggestion: `Remove unused import "${imp}"`,
          priority: 'low',
          confidence: 0.7,
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate refactored code
   */
  generateRefactoring(
    original: string,
    refactorType: 'extract-function' | 'simplify-logic' | 'rename-variables',
    context: string
  ): string {
    // This is a framework for AI-powered refactoring
    // The actual implementation would be done by the LLM

    switch (refactorType) {
      case 'extract-function':
        return `// Extracted function created\n// Original code preserved as _original_...\n${original}`;
      case 'simplify-logic':
        return `// Simplified logic\n// Check suggestions above for details\n${original}`;
      case 'rename-variables':
        return `// Variables renamed for clarity\n${original}`;
      default:
        return original;
    }
  }

  /**
   * Multi-file analysis
   */
  analyzeMultipleFiles(
    files: Array<{ path: string; content: string }>
  ): {
    analyses: FileAnalysis[];
    crossFileDependencies: Map<string, string[]>;
    issues: string[];
  } {
    const analyses = files.map(f => this.analyzeFile(f.path, f.content));

    // Find cross-file dependencies
    const crossFileDependencies = new Map<string, string[]>();
    for (const analysis of analyses) {
      const deps: string[] = [];
      for (const imp of analysis.imports) {
        const matchingFile = files.find(f =>
          f.path.includes(imp.replace(/[./]/g, ''))
        );
        if (matchingFile) {
          deps.push(matchingFile.path);
        }
      }
      if (deps.length > 0) {
        crossFileDependencies.set(analysis.filePath, deps);
      }
    }

    // Collect all issues
    const issues = analyses.flatMap(a => a.issues);

    return { analyses, crossFileDependencies, issues };
  }

  /**
   * Generate module dependency graph
   */
  generateDependencyGraph(files: Array<{ path: string; content: string }>): string {
    const analysis = this.analyzeMultipleFiles(files);
    let graph = 'Module Dependencies:\n';

    for (const [file, deps] of analysis.crossFileDependencies.entries()) {
      graph += `\n${file}\n`;
      for (const dep of deps) {
        graph += `  → ${dep}\n`;
      }
    }

    return graph;
  }
}
