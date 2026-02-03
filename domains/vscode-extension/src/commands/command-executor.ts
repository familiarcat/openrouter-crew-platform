/**
 * Command Executor
 *
 * Orchestrates all services (LLM Router, NLP, OCR, File Manager)
 * Provides unified interface for VSCode extension commands.
 */

import { LLMRouter, LLMRequest, LLMResponse } from '../services/llm-router';
import { NLPProcessor } from '../services/nlp-processor';
import { OCREngine, OCRWithNLP } from '../services/ocr-engine';
import { FileManager } from '../services/file-manager';

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
  private costBuffer: number = 0;

  constructor(apiKey: string) {
    this.router = new LLMRouter(apiKey);
    this.nlp = new NLPProcessor();
    this.ocr = new OCRWithNLP();
    this.fileManager = new FileManager();
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

    this.costBuffer += response.costUSD;

    return {
      success: true,
      output: response.content,
      model: response.model,
      costUSD: response.costUSD,
      executionTimeMs: response.executionTimeMs,
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
    this.router.setBudget(amount);
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return this.router.getBudgetRemaining();
  }
}
