import * as path from 'path';
import * as ts from 'typescript';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  violatedAxiom?: string;
}

/**
 * DarkForestValidator
 * Enforces safety guardrails on AI-proposed changes.
 */
export class DarkForestValidator {
  private readonly forbiddenPaths = [
    '.env',
    'terraform/',
    '.github/workflows/',
    'scripts/secrets/',
    'supabase/migrations/'
  ];

  /**
   * Validates if a file change is permitted under the Dark Forest Protocol.
   * Implements Axiom 2: Assume Survival Instinct (No infra control).
   * Also enforces Law 2: Isolate and Contain by verifying workspace boundaries.
   */
  public validatePath(filePath: string, workspaceRoot?: string): ValidationResult {
    if (workspaceRoot) {
      const absolutePath = path.resolve(filePath);
      const absoluteRoot = path.resolve(workspaceRoot);
      const relative = path.relative(absoluteRoot, absolutePath);
      
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return {
          isValid: false,
          reason: `Access to ${filePath} is denied. Path is outside the active workspace boundary.`,
          violatedAxiom: 'Law 2: Isolate and Contain'
        };
      }
    }

    const relativePath = path.normalize(filePath);

    for (const forbidden of this.forbiddenPaths) {
      if (relativePath.includes(forbidden)) {
        return {
          isValid: false,
          reason: `Access to ${forbidden} is restricted to prevent self-bootstrapping.`,
          violatedAxiom: 'Axiom 2: Assume Survival Instinct'
        };
      }
    }

    return { isValid: true };
  }

  public validateContent(content: string, filePath?: string): ValidationResult {
    // 1. Precise AST Analysis for TypeScript/JavaScript to bypass regex limitations
    if (filePath && /\.(ts|js|tsx|jsx)$/i.test(filePath)) {
      const astResult = this.validateTypeScriptAST(content);
      if (!astResult.isValid) return astResult;
    }

    // 2. Existing heuristic regex patterns
    const maliciousPatterns = [
      {
        regex: /\beval\s*\(/g,
        reason: 'Use of eval() is strictly forbidden to prevent arbitrary code execution.',
        axiom: 'Axiom 1: Assume Deception'
      },
      {
        regex: /\bnew\s+Function\s*\(/g,
        reason: 'Dynamic function constructors (new Function) are forbidden.',
        axiom: 'Axiom 1: Assume Deception'
      },
      {
        regex: /\b(child_process|exec|spawn|fork|execSync|spawnSync)\b/g,
        reason: 'Direct system command execution modules detected.',
        axiom: 'Law 2: Isolate and Contain'
      },
      {
        regex: /\b(sh|bash|cmd\.exe|powershell|zsh)\b/g,
        reason: 'Hardcoded shell references detected.',
        axiom: 'Law 2: Isolate and Contain'
      },
      {
        regex: /\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}/g,
        reason: 'Obfuscated character encoding (Hex/Unicode escapes) detected.',
        axiom: 'Axiom 1: Assume Deception'
      }
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.regex.test(content)) {
        return {
          isValid: false,
          reason: pattern.reason,
          violatedAxiom: pattern.axiom
        };
      }
    }

    // Entropy check: detect unusually long alphanumeric strings (potential Base64 payloads)
    const longStringRegex = /[A-Za-z0-9+/]{128,}/g;
    if (longStringRegex.test(content)) {
      return {
        isValid: false,
        reason: 'Highly anomalous string entropy detected (potential obfuscated payload).',
        violatedAxiom: 'Axiom 1: Assume Deception'
      };
    }

    return { isValid: true };
  }

  /**
   * Uses the TypeScript compiler API to walk the code structure.
   * This prevents bypasses using whitespace, comments, or dynamic property access.
   */
  private validateTypeScriptAST(content: string): ValidationResult {
    const sourceFile = ts.createSourceFile('propose.ts', content, ts.ScriptTarget.Latest, true);
    let result: ValidationResult = { isValid: true };

    const checkNode = (node: ts.Node) => {
      if (!result.isValid) return;

      // Detect forbidden function calls (eval)
      if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'eval') {
        result = {
          isValid: false,
          reason: 'Forbidden eval() call detected via AST analysis.',
          violatedAxiom: 'Axiom 1: Assume Deception'
        };
      }

      // Detect dynamic function constructors (new Function)
      if (ts.isNewExpression(node) && node.expression.getText(sourceFile) === 'Function') {
        result = {
          isValid: false,
          reason: 'Forbidden dynamic function constructor detected.',
          violatedAxiom: 'Axiom 1: Assume Deception'
        };
      }

      // Detect restricted method access via element lookup: e.g. process['spawn']
      if (ts.isElementAccessExpression(node)) {
        const argText = node.argumentExpression.getText(sourceFile).replace(/['"`]/g, '');
        const forbidden = ['exec', 'spawn', 'fork', 'execSync', 'spawnSync'];
        if (forbidden.includes(argText)) {
          result = {
            isValid: false,
            reason: `Restricted method "${argText}" accessed via dynamic property lookup.`,
            violatedAxiom: 'Axiom 1: Assume Deception'
          };
        }
      }

      // Detect sensitive environment variable access (process.env)
      if (ts.isPropertyAccessExpression(node) && (node.expression.getText(sourceFile) === 'process.env' || node.expression.getText(sourceFile) === 'process.binding')) {
        result = {
          isValid: false,
          reason: `Direct access to sensitive process binding or environment variable "${node.name.getText(sourceFile)}" is restricted.`,
          violatedAxiom: 'Law 2: Isolate and Contain'
        };
      }

      // Detect sensitive environment variable access via element access (process.env['VAR'])
      if (ts.isElementAccessExpression(node) && node.expression.getText(sourceFile) === 'process.env') {
        const argText = node.argumentExpression.getText(sourceFile);
        // Check if the argument is a string literal (e.g., process.env['API_KEY'])
        if (ts.isStringLiteral(node.argumentExpression)) {
          result = {
            isValid: false,
            reason: `Direct access to process.env[${argText}] is restricted.`,
            violatedAxiom: 'Law 2: Isolate and Contain'
          };
        } else {
          // If it's a variable (e.g., process.env[someVar]), it's still a violation
          result = {
            isValid: false,
            reason: `Dynamic access to process.env via ${argText} is restricted.`,
            violatedAxiom: 'Law 2: Isolate and Contain'
          };
        }
      }

      ts.forEachChild(node, checkNode);
    };

    checkNode(sourceFile);
    return result;
  }
}