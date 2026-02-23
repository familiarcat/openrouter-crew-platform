/**
 * Command Executor
 *
 * Orchestrates all services (LLM Router, NLP, OCR, File Manager)
 * Provides unified interface for VSCode extension commands.
 */

import { LLMRouter, LLMRequest, LLMResponse } from '../services/llm-router.js';
import { NLPProcessor } from '../services/nlp-processor.js';
import { OCREngine, OCRWithNLP } from '../services/ocr-engine.js';
import { FileManager } from '../services/file-manager.js';
import { TerminalManager } from '../services/terminal-manager.js';
import { CostTracker } from '../services/cost-tracker.js';
import { ContextBuilder } from '../services/context-builder.js';

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  output: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  metadata: {
    intent: string;
    complexity: string;
    language?: string;
    confidence: number;
  };
}

/**
 * Command Executor orchestrates all services
 */
export class CommandExecutor {
  private router: LLMRouter;
  private nlp: NLPProcessor;
  private ocr: OCRWithNLP;
  private fileManager: FileManager;
  private terminalManager: TerminalManager;
  private contextBuilder: ContextBuilder;
  private costBuffer: number = 0;

  constructor(costTracker: CostTracker, contextBuilder: ContextBuilder) {
    this.router = new LLMRouter(costTracker);
    this.nlp = new NLPProcessor();
    this.ocr = new OCRWithNLP();
    this.fileManager = new FileManager();
    this.terminalManager = new TerminalManager();
    this.contextBuilder = contextBuilder;
  }

  /**
   * Execute Ask command - general question answering
   */
  async ask(prompt: string, context?: { code?: string; file?: string }): Promise<CommandResult> {
    const startTime = Date.now();

    // Step 1: NLP Analysis
    const nlpAnalysis = this.nlp.analyze(prompt, { selectedCode: context?.code });

    // Step 2: File Analysis if provided
    let fileAnalysis = null;
    if (context?.code && context?.file) {
      fileAnalysis = this.fileManager.analyzeFile(context.file, context.code);
    }

    // Step 3: Build request
    const request: LLMRequest = {
      prompt: this.buildPrompt('ASK', prompt, fileAnalysis),
      intent: 'ASK',
      complexity: nlpAnalysis.complexity,
      language: nlpAnalysis.language,
      context: context?.code ? { selectedCode: context.code } : undefined,
    };

    // Step 4: Route and execute
    const response = await this.executeViaRouter(request);

    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Review command - code review
   */
  async review(code: string, file: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze(`Review this code for issues and improvements`, {
      selectedCode: code,
    });

    const fileAnalysis = this.fileManager.analyzeFile(file, code);
    const suggestions = this.fileManager.generateSuggestions(fileAnalysis);

    const reviewPrompt = `Review this code and provide feedback on:
- Code quality and best practices
- Potential bugs or issues
- Performance optimizations
- Security concerns

Issues detected: ${fileAnalysis.issues.join(', ')}
Complexity: ${fileAnalysis.complexity}

${suggestions.slice(0, 3).map(s => `- ${s.issue}: ${s.suggestion}`).join('\n')}`;

    const request: LLMRequest = {
      prompt: reviewPrompt,
      intent: 'REVIEW',
      complexity: nlpAnalysis.complexity,
      language: fileAnalysis.language,
      context: { selectedCode: code },
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Explain command - explain code
   */
  async explain(code: string, file: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze('Explain what this code does', { selectedCode: code });
    const fileAnalysis = this.fileManager.analyzeFile(file, code);

    const explainPrompt = `Explain what this code does in detail:
- What is the purpose?
- How does it work?
- What are the key components?
- What dependencies does it have?

File: ${file}
Language: ${fileAnalysis.language}
Complexity: ${fileAnalysis.complexity}
Main functions: ${fileAnalysis.nodes.filter(n => n.type === 'function').map(n => n.name).join(', ')}`;

    const request: LLMRequest = {
      prompt: explainPrompt,
      intent: 'EXPLAIN',
      complexity: nlpAnalysis.complexity,
      language: fileAnalysis.language,
      context: { selectedCode: code },
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Generate command - generate code
   */
  async generate(description: string, language?: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze(description);

    const generatePrompt = `Generate code based on this description:
${description}

${language ? `Language: ${language}` : 'Auto-detect language based on description'}

Requirements:
- Production-ready code
- Clear variable names
- Basic error handling
- Comments for complex logic`;

    const request: LLMRequest = {
      prompt: generatePrompt,
      intent: 'GENERATE',
      complexity: nlpAnalysis.complexity,
      language: language || nlpAnalysis.language,
      maxTokens: 2048,
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Refactor command - refactor code
   */
  async refactor(code: string, file: string, instructions?: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze(instructions || 'Refactor this code for better quality', {
      selectedCode: code,
    });

    const fileAnalysis = this.fileManager.analyzeFile(file, code);
    const suggestions = this.fileManager.generateSuggestions(fileAnalysis);

    const refactorPrompt = `Refactor this code with these priorities:
${instructions || '- Improve readability\n- Reduce complexity\n- Better naming'}

Current metrics:
- Complexity: ${fileAnalysis.complexity}
- Issues: ${fileAnalysis.issues.join(', ')}
- Top suggestions: ${suggestions.slice(0, 2).map(s => s.suggestion).join('; ')}

Provide:
1. Refactored code
2. Explanation of changes
3. Before/after comparison`;

    const request: LLMRequest = {
      prompt: refactorPrompt,
      intent: 'REFACTOR',
      complexity: nlpAnalysis.complexity,
      language: fileAnalysis.language,
      context: { selectedCode: code },
      maxTokens: 2048,
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Debug command - debugging assistance
   */
  async debug(error: string, context?: { code?: string; file?: string }): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze(`Help debug this error: ${error}`, {
      selectedCode: context?.code,
    });

    const debugPrompt = `Help me debug this error:
${error}

${context?.code ? `Code context:\n${context.code}` : ''}

Please:
1. Identify the root cause
2. Explain why it's happening
3. Provide a fix
4. Suggest prevention`;

    const request: LLMRequest = {
      prompt: debugPrompt,
      intent: 'DEBUG',
      complexity: 'HIGH',  // Errors are usually complex
      language: context?.code ? this.fileManager.analyzeFile(context.file || 'unknown', context.code).language : undefined,
      context: context?.code ? { selectedCode: context.code } : undefined,
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Test Generation command
   */
  async generateTests(code: string, file: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze('Generate unit tests for this code', { selectedCode: code });
    const fileAnalysis = this.fileManager.analyzeFile(file, code);

    const testPrompt = `Generate comprehensive unit tests for this code:
${code}

Language: ${fileAnalysis.language}
Functions to test: ${fileAnalysis.nodes.filter(n => n.type === 'function').map(n => n.name).join(', ')}

Include:
- Happy path tests
- Edge case tests
- Error handling tests
- Use appropriate testing framework for ${fileAnalysis.language}`;

    const request: LLMRequest = {
      prompt: testPrompt,
      intent: 'TEST',
      complexity: nlpAnalysis.complexity,
      language: fileAnalysis.language,
      context: { selectedCode: code },
      maxTokens: 2048,
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Document command - generate documentation for code
   */
  async document(code: string, file: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze('Generate documentation for this code', { selectedCode: code });
    const fileAnalysis = this.fileManager.analyzeFile(file, code);
    const docStyle = (fileAnalysis.language === 'javascript' || fileAnalysis.language === 'typescript') ? 'JSDoc' : 'docstring';

    const documentPrompt = `Generate a comprehensive ${docStyle} for the following ${fileAnalysis.language} code.

Code to document:
\`\`\`${fileAnalysis.language}
${code}
\`\`\`

Requirements:
1. Describe the function's purpose.
2. Document all parameters with their types and descriptions.
3. Document the return value.
4. Include an example of usage if applicable.
5. Return ONLY the **complete, updated code block** with the new documentation inserted. Do not provide any other text, explanations, or markdown formatting.`;

    const request: LLMRequest = {
      prompt: documentPrompt,
      intent: 'DOCUMENT',
      complexity: nlpAnalysis.complexity,
      language: fileAnalysis.language,
      context: { selectedCode: code },
      maxTokens: 2048,
    };

    const response = await this.executeViaRouter(request);
    if (response) {
        response.content = this.cleanCodeBlock(response.content);
    }
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Explain Terminal command - explain terminal output/error
   */
  async explainTerminal(terminalOutput: string): Promise<CommandResult> {
    const startTime = Date.now();
    const nlpAnalysis = this.nlp.analyze(`Explain this terminal output: ${terminalOutput}`);

    const prompt = `Explain the following terminal output or error.
If it's an error, identify the root cause and suggest a fix.
If it's a command's output, explain what it means.

Output:
\`\`\`
${terminalOutput}
\`\`\`
`;

    const request: LLMRequest = {
      prompt,
      intent: 'EXPLAIN_TERMINAL',
      complexity: nlpAnalysis.complexity,
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute Structure command - analyze project structure
   */
  async structure(): Promise<CommandResult> {
    const startTime = Date.now();
    const nlpAnalysis = this.nlp.analyze('Analyze project structure');

    const files = await this.fileManager.getProjectStructure();
    
    const fileList = files.length > 500 
      ? files.slice(0, 500).join('\n') + `\n...and ${files.length - 500} more files`
      : files.join('\n');

    const prompt = `Analyze the following project file structure and suggest improvements for better organization, scalability, and maintainability.
      
Current Structure:
\`\`\`
${fileList}
\`\`\`

Provide:
1. Analysis of the current organization (strengths/weaknesses)
2. Specific suggestions for moving/renaming files or folders to improve architecture
3. Recommendations for missing directories (e.g., tests, docs, types, utils)`;

    const request: LLMRequest = {
      prompt,
      intent: 'STRUCTURE',
      complexity: 'HIGH',
      maxTokens: 2048,
    };

    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Execute restructuring plan
   */
  async applyRestructuring(operations: Array<{ type: 'move' | 'delete' | 'create'; path: string; to?: string }>): Promise<CommandResult> {
    const startTime = Date.now();
    let output = 'Restructuring applied:\n';
    
    for (const op of operations) {
      try {
        if (op.type === 'move' && op.to) {
          await this.fileManager.movePath(op.path, op.to);
          output += `✅ Moved ${op.path} -> ${op.to}\n`;
        } else if (op.type === 'delete') {
          await this.fileManager.deletePath(op.path);
          output += `✅ Deleted ${op.path}\n`;
        } else if (op.type === 'create') {
          await this.fileManager.createDirectory(op.path);
          output += `✅ Created ${op.path}\n`;
        }
      } catch (error) {
        output += `❌ Failed to ${op.type} ${op.path}: ${error instanceof Error ? error.message : String(error)}\n`;
      }
    }

    return {
      success: true,
      output,
      model: 'local',
      costUSD: 0,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        intent: 'STRUCTURE',
        complexity: 'MEDIUM',
        confidence: 1,
        language: 'system',
      },
    };
  }

  /**
   * Execute Terminal command - generate and run shell command
   */
  async terminal(instruction: string): Promise<CommandResult> {
    const startTime = Date.now();
    const nlpAnalysis = this.nlp.analyze(instruction);

    const prompt = `Generate a shell command for the following request: "${instruction}".
      
      Requirements:
      1. Return ONLY the command(s) to be executed.
      2. Do not use markdown formatting (no backticks).
      3. Do not provide explanations.
      4. If multiple commands are needed, chain them appropriately (&& or ;).
      5. Assume a standard Linux/macOS environment (bash/zsh) unless specified otherwise.
      `;

    const request: LLMRequest = {
      prompt,
      intent: 'TERMINAL',
      complexity: nlpAnalysis.complexity,
      maxTokens: 1024,
    };

    const response = await this.executeViaRouter(request);

    if (response && response.content) {
      let command = response.content.trim();
      if (command.startsWith('```') && command.endsWith('```')) {
        command = command.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
      } else if (command.startsWith('`') && command.endsWith('`')) {
        command = command.slice(1, -1);
      }

      await this.terminalManager.executeCommand(command, instruction);
    }

    return this.formatResult(response, startTime, nlpAnalysis);
  }

  /**
   * Process image/screenshot for analysis
   */
  async processImage(imageBase64: string): Promise<CommandResult> {
    const startTime = Date.now();

    // Step 1: OCR + NLP analysis
    const analysis = await this.ocr.analyzeImage(imageBase64);

    // Step 2: Route based on detected intent
    const request: LLMRequest = {
      prompt: analysis.codeContext.prompt,
      intent: analysis.combined.intent,
      complexity: analysis.nlp.complexity,
      language: analysis.combined.detectedLanguage,
      context: { selectedCode: analysis.codeContext.selectedCode },
    };

    // Step 3: Execute
    const response = await this.executeViaRouter(request);

    return {
      success: response ? true : false,
      output: response?.content || 'Failed to process image',
      model: response?.model || 'unknown',
      costUSD: response?.costUSD || 0,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        intent: analysis.combined.intent,
        complexity: analysis.nlp.complexity,
        language: analysis.combined.detectedLanguage,
        confidence: analysis.combined.confidence,
      },
    };
  }

  /**
   * Execute request via router
   */
  private async executeViaRouter(request: LLMRequest): Promise<LLMResponse | null> {
    try {
      return await this.router.route(request);
    } catch (error) {
      console.error('Router execution failed:', error);
      return null;
    }
  }

  /**
   * Build command-specific prompt
   */
  private buildPrompt(intent: string, prompt: string, fileAnalysis: any = null): string {
    if (!fileAnalysis) {
      return prompt;
    }

    return `${prompt}

File: ${fileAnalysis.filePath}
Language: ${fileAnalysis.language}
Complexity: ${fileAnalysis.complexity}
Issues: ${fileAnalysis.issues.length > 0 ? fileAnalysis.issues.join('; ') : 'None detected'}`;
  }

  /**
   * Cleans a string to extract code from a markdown block.
   */
  private cleanCodeBlock(content: string): string {
    if (!content) return '';
    const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)```/s);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    // Fallback for content that might just be the code itself without markdown
    return content.trim();
  }

  /**
   * Format execution result
   */
  private formatResult(
    response: LLMResponse | null,
    startTime: number,
    nlpAnalysis: any
  ): CommandResult {
    if (!response) {
      return {
        success: false,
        output: 'Execution failed',
        model: 'unknown',
        costUSD: 0,
        executionTimeMs: Date.now() - startTime,
        metadata: {
          intent: nlpAnalysis.intent.intent,
          complexity: nlpAnalysis.complexity,
          confidence: nlpAnalysis.confidence,
        },
      };
    }

    this.costBuffer += response.costUSD ?? 0;

    return {
      success: true,
      output: response.content,
      model: response.model,
      costUSD: response.costUSD ?? 0,
      executionTimeMs: response.executionTimeMs ?? 0,
      metadata: {
        intent: nlpAnalysis.intent.intent,
        complexity: nlpAnalysis.complexity,
        language: response.model,
        confidence: nlpAnalysis.confidence,
      },
    };
  }

  /**
   * Get total cost buffer
   */
  getTotalCost(): number {
    return this.costBuffer;
  }

  /**
   * Set budget limit
   */
  setBudget(amount: number): void {
    // Budget is now managed via configuration/CostTracker
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return 0; // Placeholder, should use CostTracker.getMetrics().remainingBudget
  }
}
