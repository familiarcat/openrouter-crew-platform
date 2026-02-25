/**
 * File Manager Service
 *
 * Advanced code manipulation via AST parsing.
 * Enables multi-file refactoring, code generation, and analysis.
 */

import * as vscode from 'vscode';
import * as ts from 'typescript';
import { TextEncoder } from 'util';
import Parser from 'web-tree-sitter';
import * as path from 'path';

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
 * Patch operation for file modification
 */
export interface PatchOperation {
  type: 'INSERT' | 'DELETE' | 'REPLACE';
  line: number;
  content?: string;
  count?: number;
}

/**
 * File Manager for code manipulation
 */
export class FileManager {
  private parserInitialized = false;
  private languages: Map<string, Parser.Language> = new Map();

  /**
   * Initialize and get a Tree-sitter parser for the specific language
   */
  private async getParser(language: string): Promise<Parser | undefined> {
    if (!this.parserInitialized) {
      await Parser.init();
      this.parserInitialized = true;
    }

    const langMap: Record<string, string> = {
      'python': 'python',
      'go': 'go',
      'rust': 'rust',
      'java': 'java',
      'csharp': 'c_sharp'
    };

    const treeSitterLang = langMap[language];
    if (!treeSitterLang) return undefined;

    if (!this.languages.has(language)) {
      try {
        // Assumes .wasm files are bundled in a 'parsers' directory
        const wasmPath = path.join(__dirname, '..', 'parsers', `tree-sitter-${treeSitterLang}.wasm`);
        const lang = await Parser.Language.load(wasmPath);
        this.languages.set(language, lang);
      } catch (e) {
        console.warn(`Failed to load tree-sitter language for ${language}`, e);
        return undefined;
      }
    }

    const parser = new Parser();
    parser.setLanguage(this.languages.get(language));
    return parser;
  }

  /**
   * Parse file and extract code nodes
   */
  async analyzeFile(filePath: string, content: string): Promise<FileAnalysis> {
    const language = this.detectLanguage(filePath);
    const nodes = await this.extractNodes(content, language);
    const imports = this.extractImports(content, language);
    const exports = this.extractExports(content, language);
    const complexity = this.calculateComplexity(content, language);
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
  private async extractNodes(content: string, language: string): Promise<CodeNode[]> {
    const nodes: CodeNode[] = [];

    if (language === 'javascript' || language === 'typescript') {
      const sourceFile = ts.createSourceFile(
        'temp.ts', // Placeholder file name
        content,
        ts.ScriptTarget.ES2015,
        true,
        ts.ScriptKind.TS
      );

      // Function to traverse the AST and extract information
      const visit = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node)) {
          const name = node.name ? node.name.text : 'anonymous';
          const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
          const content = node.getText(sourceFile);

          nodes.push({
            type: 'function',
            name,
            startLine,
            endLine,
            content,
          });
        } else if (ts.isClassDeclaration(node)) {
          const name = node.name ? node.name.text : 'anonymous';
          const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
          const content = node.getText(sourceFile);

          nodes.push({
            type: 'class',
            name,
            startLine,
            endLine,
            content,
          });
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

    } else {
      // Use Tree-sitter for other languages
      const parser = await this.getParser(language);
      
      if (parser) {
        const tree = parser.parse(content);
        
        // Define queries for supported languages
        let queryString = '';
        if (language === 'python') {
          queryString = `
            (function_definition name: (identifier) @name) @function
            (class_definition name: (identifier) @name) @class
          `;
        } else if (language === 'go') {
          queryString = `
            (function_declaration name: (identifier) @name) @function
            (method_declaration name: (field_identifier) @name) @function
          `;
        } else if (language === 'rust') {
          queryString = `
            (function_item name: (identifier) @name) @function
          `;
        }

        if (queryString) {
          try {
            const query = parser.getLanguage().query(queryString);
            const matches = query.matches(tree.rootNode);

            for (const match of matches) {
              const capture = match.captures[0]; // @name
              const typeCapture = match.captures.find(c => c.name === 'function' || c.name === 'class');
              const type = typeCapture ? (typeCapture.name as 'function' | 'class') : 'function';
              
              const node = capture.node;
              const startLine = node.startPosition.row + 1;
              const endLine = node.endPosition.row + 1;
              
              nodes.push({
                type,
                name: node.text,
                startLine,
                endLine,
                content: content.split('\n').slice(startLine - 1, endLine).join('\n')
              });
            }
          } catch (e) {
            console.error(`Tree-sitter query failed for ${language}`, e);
          }
        }
        tree.delete();
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
  private calculateComplexity(content: string, language: string = 'unknown'): number {
    let complexity = 1;

    // Common patterns (C-style languages: JS, TS, Java, C#, Rust, Go)
    const commonPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\belse\b/g,
      /\bcase\b/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcatch\s*\(/g,
      /\b\?\s*:/g,  // ternary
    ];

    // Language-specific patterns
    let patterns = commonPatterns;

    if (language === 'python') {
      patterns = [
        /\bif\s+/g,
        /\belif\s+/g,
        /\belse:/g,
        /\bfor\s+/g,
        /\bwhile\s+/g,
        /\bexcept\s+/g,
        /\bwith\s+/g,
        /\bassert\s+/g
      ];
    } else if (language === 'go') {
      patterns = [
        /\bif\s+/g,
        /\belse\s+/g,
        /\bfor\s+/g,
        /\bcase\b/g,
        /\bselect\s*{/g,
        /\bdefer\s+/g,
        /\bgo\s+/g, // goroutines add concurrency complexity
        /\b&&\b/g,
        /\b\|\|\b/g
      ];
    } else if (language === 'sql') {
      patterns = [
        /\bWHERE\b/gi,
        /\bAND\b/gi,
        /\bOR\b/gi,
        /\bCASE\b/gi,
        /\bWHEN\b/gi,
        /\bJOIN\b/gi,
        /\bUNION\b/gi,
        /\bHAVING\b/gi
      ];
    }

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
        const nodeComplexity = this.calculateComplexity(node.content, analysis.language);
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
   * Generate refactoring
   */
  async generateRefactoring(
    original: string,
    refactorType: 'extract-function' | 'simplify-logic' | 'rename-variables',
    context: string
  ): Promise<string> {
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const apiKey = config.get<string>('apiKey');

    if (!apiKey) {
      throw new Error('API Key missing. Please configure openrouterCrew.apiKey.');
    }

    const prompt = `You are an expert software engineer. Refactor the following code.
Refactoring Pattern: ${refactorType}
Context/Instructions: ${context}

Original Code:
\`\`\`
${original}
\`\`\`

Return ONLY the refactored code. Do not include any explanations or markdown formatting outside the code block.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/openrouter-crew/vscode-extension',
          'X-Title': 'OpenRouter Crew VSCode',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Refactoring request failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) return original;

      // Extract code from markdown block if present
      const codeBlockMatch = content.match(/```(?:[\w\d]*)\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }

      // Fallback: return content stripped of backticks if no block found but backticks exist
      return content.replace(/^```[\w-]*\n|^```\n|```$/gm, '').trim();

    } catch (error) {
      console.error('Refactoring failed:', error);
      throw error;
    }
  }

  /**
   * Multi-file analysis
   */
  async analyzeMultipleFiles(
    files: Array<{ path: string; content: string }>
  ): Promise<{
    analyses: FileAnalysis[];
    crossFileDependencies: Map<string, string[]>;
    issues: string[];
  }> {
    const analyses = await Promise.all(files.map(f => this.analyzeFile(f.path, f.content)));

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

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<void> {
    const uri = vscode.Uri.file(path);
    await vscode.workspace.fs.createDirectory(uri);
  }

  /**
   * Delete a file or directory
   */
  async deletePath(path: string, recursive: boolean = false): Promise<void> {
    const uri = vscode.Uri.file(path);
    await vscode.workspace.fs.delete(uri, { recursive });
  }

  /**
   * Rename or move a file/directory
   */
  async movePath(oldPath: string, newPath: string): Promise<void> {
    const oldUri = vscode.Uri.file(oldPath);
    const newUri = vscode.Uri.file(newPath);
    await vscode.workspace.fs.rename(oldUri, newUri, { overwrite: false });
  }

  /**
   * Get project file structure
   * Returns a list of all files in the workspace (excluding gitignored/node_modules)
   */
  async getProjectStructure(): Promise<string[]> {
    // Find all files, excluding node_modules and .git
    const files = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,dist,out,build}/**');
    // Return relative paths
    return files.map(uri => vscode.workspace.asRelativePath(uri));
  }

   /**
   * Get AST of file
   */
  getAST(content: string, language: string = 'typescript'): ts.SourceFile | null {
    return ts.createSourceFile(
      'temp.ts', content, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS
    );
  }

  /**
   * Write content to a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    const uri = vscode.Uri.file(path);
    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(uri, encoder.encode(content));
  }

  /**
   * Apply patches to a file
   */
  async applyPatch(filePath: string, patches: PatchOperation[]): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    const edit = new vscode.WorkspaceEdit();
    
    // Ensure document is open to apply edits
    const document = await vscode.workspace.openTextDocument(uri);

    for (const patch of patches) {
      if (patch.type === 'REPLACE' && patch.content) {
        const range = new vscode.Range(
          new vscode.Position(patch.line - 1, 0),
          new vscode.Position(patch.line - 1 + (patch.count || 1), 0)
        );
        edit.replace(uri, range, patch.content);
      } else if (patch.type === 'INSERT' && patch.content) {
        const position = new vscode.Position(patch.line - 1, 0);
        edit.insert(uri, position, patch.content + '\n');
      } else if (patch.type === 'DELETE') {
        const range = new vscode.Range(
          new vscode.Position(patch.line - 1, 0),
          new vscode.Position(patch.line - 1 + (patch.count || 1), 0)
        );
        edit.delete(uri, range);
      }
    }

    await vscode.workspace.applyEdit(edit);
    await document.save();
  }
}