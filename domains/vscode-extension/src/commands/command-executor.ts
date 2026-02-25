/**
 * Command Executor
 *
 * Orchestrates all services (LLM Router, NLP, OCR, File Manager)
 * Provides unified interface for VSCode extension commands.
 */

import { LLMRouter, LLMRequest, LLMResponse, ExtendedIntent } from '../services/llm-router.js';
import { NLPProcessor } from '../services/nlp-processor.js';
import { OCREngine, OCRWithNLP } from '../services/ocr-engine.js';
import { FileManager } from '../services/file-manager.js';
import { CostTracker } from '../services/cost-tracker.js';
import { ContextBuilder } from '../services/context-builder.js';
import { CostEstimator, CostEstimate } from '../services/cost-estimator.js';
import { AgentNetworkService } from '../services/agent-network.js';

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
  private contextBuilder: ContextBuilder;
  private costEstimator: CostEstimator;
  private agentNetwork: AgentNetworkService;
  private costBuffer: number = 0;

  constructor(costTracker: CostTracker, contextBuilder: ContextBuilder) {
    this.router = new LLMRouter(costTracker);
    this.nlp = new NLPProcessor();
    this.ocr = new OCRWithNLP();
    this.fileManager = new FileManager();
    this.contextBuilder = contextBuilder;
    this.costEstimator = new CostEstimator(this.router, costTracker);
    this.agentNetwork = new AgentNetworkService(costTracker);
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

    return this.execute(request, startTime, nlpAnalysis);
  }

  /**
   * Execute Review command - code review
   */
  async review(code: string, file: string, targetName?: string): Promise<CommandResult> {
    const startTime = Date.now();

    const targetDescription = targetName ? `the "${targetName}" function/class` : 'this code';

    const nlpAnalysis = this.nlp.analyze(`Review ${targetDescription} for issues and improvements`, {
      selectedCode: code,
    });

    const fileAnalysis = this.fileManager.analyzeFile(file, code);
    const suggestions = this.fileManager.generateSuggestions(fileAnalysis);

    const reviewPrompt = `Review ${targetDescription} and provide feedback on:
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

    return this.execute(request, startTime, nlpAnalysis);
  }

  /**
   * Execute Explain command - explain code
   */
  async explain(code: string, file: string, targetName?: string): Promise<CommandResult> {
    const startTime = Date.now();

    const targetDescription = targetName ? `the "${targetName}" function/class` : 'this code';

    const nlpAnalysis = this.nlp.analyze(`Explain what ${targetDescription} does`, { selectedCode: code });
    const fileAnalysis = this.fileManager.analyzeFile(file, code);

    const explainPrompt = `Explain what ${targetDescription} does in detail:
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

    return this.execute(request, startTime, nlpAnalysis);
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

    return this.execute(request, startTime, nlpAnalysis);
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

    return this.execute(request, startTime, nlpAnalysis);
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

    return this.execute(request, startTime, nlpAnalysis);
  }

  /**
   * Execute Test Generation command
   */
  async generateTests(code: string, file: string, targetName?: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze('Generate unit tests for this code', { selectedCode: code });
    const fileAnalysis = this.fileManager.analyzeFile(file, code);

    const targetDescription = targetName ? `the "${targetName}" function/class` : 'this code';

    const testPrompt = `Generate comprehensive unit tests for ${targetDescription}:
${code}

Language: ${fileAnalysis.language}
Functions to test: ${targetName 
    ? targetName 
    : fileAnalysis.nodes.filter(n => n.type === 'function').map(n => n.name).join(', ')}

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

    return this.execute(request, startTime, nlpAnalysis);
  }

  /**
   * Execute Document command - generate documentation for code
   */
  async document(code: string, file: string, targetNodeName?: string): Promise<CommandResult> {
    const startTime = Date.now();

    const nlpAnalysis = this.nlp.analyze('Generate documentation for this code', { selectedCode: code });
    const fileAnalysis = this.fileManager.analyzeFile(file, code);
    const docStyle = (fileAnalysis.language === 'javascript' || fileAnalysis.language === 'typescript') ? 'JSDoc' : 'docstring';

    const promptTarget = targetNodeName
      ? `the function/class named "${targetNodeName}" within the following code`
      : `the following ${fileAnalysis.language} code`;
    
    const returnInstruction = targetNodeName
      ? "Return ONLY the **complete, updated file content** with the new documentation inserted."
      : "Return ONLY the **complete, updated code block** with the new documentation inserted.";

    const documentPrompt = `Generate a comprehensive ${docStyle} for ${promptTarget}.

Code to document:
\`\`\`${fileAnalysis.language}
${code}
\`\`\`

Requirements:
1. Describe the function's purpose.
2. Document all parameters with their types and descriptions.
3. Document the return value.
4. Include an example of usage if applicable.
5. ${returnInstruction} Do not provide any other text, explanations, or markdown formatting.`;

    const request: LLMRequest = {
      prompt: documentPrompt,
      intent: 'DOCUMENT',
      complexity: nlpAnalysis.complexity,
      language: fileAnalysis.language,
      context: { selectedCode: code },
      maxTokens: 2048,
    };

    const result = await this.execute(request, startTime, nlpAnalysis);
    if (result.success) {
        const extracted = this.extractCode(result.output, false);
        result.output = extracted || result.output;
    }
    return result;
  }

  /**
   * Execute Translate command - translate comments
   */
  async translate(code: string, targetLanguage: string): Promise<CommandResult> {
    const startTime = Date.now();

    const prompt = `Translate all comments and documentation strings in the following code to ${targetLanguage}.

Rules:
1. Do NOT translate variable names, function names, classes, or logic.
2. ONLY translate comments (// ...), multi-line comments (/* ... */), and JSDoc/docstrings.
3. Preserve the original code structure and indentation exactly.
4. Return ONLY the code block with translated comments.

Code:
\`\`\`
${code}
\`\`\`
`;

    const request: LLMRequest = {
      prompt,
      intent: 'TRANSLATE',
      complexity: 'LOW',
      context: { selectedCode: code },
    };

    return this.execute(request, startTime, { intent: { intent: 'TRANSLATE' }, complexity: 'LOW', confidence: 1.0 });
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
      intent: 'EXPLAIN_TERMINAL' as ExtendedIntent,
      complexity: nlpAnalysis.complexity,
    };

    return this.execute(request, startTime, nlpAnalysis);
  }

  /**
   * Analyze Code Complexity command - local analysis
   */
  async analyzeComplexity(code: string, filePath?: string): Promise<CommandResult> {
    const startTime = Date.now();
    const nlpAnalysis = this.nlp.analyze(code, { selectedCode: code });

    let output = `Estimated Complexity: ${nlpAnalysis.complexity}`;
    let complexityLevel = nlpAnalysis.complexity;

    if (filePath) {
      const fileAnalysis = this.fileManager.analyzeFile(filePath, code);
      const cyclomatic = fileAnalysis.complexity;
      
      if (cyclomatic > 20) complexityLevel = 'HIGH';
      else if (cyclomatic > 10) complexityLevel = 'MEDIUM';
      else complexityLevel = 'LOW';

      output = `Complexity Level: ${complexityLevel}\nCyclomatic Complexity: ${cyclomatic}\nLanguage: ${fileAnalysis.language}\nIssues Detected: ${fileAnalysis.issues.length}`;
      
      if (fileAnalysis.issues.length > 0) {
        output += `\n\nIssues:\n- ${fileAnalysis.issues.slice(0, 3).join('\n- ')}`;
      }
    }

    return {
      success: true,
      output,
      model: 'local-analysis',
      costUSD: 0,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        intent: nlpAnalysis.intent.intent,
        complexity: complexityLevel,
        confidence: nlpAnalysis.confidence,
        language: nlpAnalysis.language,
      },
    };
  }


  /**
   * Execute Structure command - analyze project structure
   */
  async structure(focus?: string): Promise<CommandResult> {
    const startTime = Date.now();
    const nlpAnalysis = this.nlp.analyze('Analyze project structure');

    const files = await this.fileManager.getProjectStructure();
    
    const fileList = files.length > 500
      ? files.slice(0, 500).join('\n') + `\n...and ${files.length - 500} more files`
      : files.join('\n');

    const focusPrompt = focus
        ? `The user has a specific focus for this analysis: "${focus}". Prioritize your answer around this focus.`
        : `Provide a general analysis of the project structure.`;

    const prompt = `Analyze the following project file structure and suggest improvements for better organization, scalability, and maintainability.
      
${focusPrompt}

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

    return this.execute(request, startTime, nlpAnalysis);
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
      2. Wrap the command in a markdown code block (e.g. \`\`\`bash ... \`\`\`).
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

    return this.execute(request, startTime, nlpAnalysis);
  }

  /**
   * Process image/screenshot for analysis
   */
  async processImage(imageBase64: string): Promise<CommandResult> {
    const startTime = Date.now();

    // Step 1: OCR + NLP analysis
    const analysis = await this.ocr.analyzeImage(imageBase64);

    // Step 2: Build request for LLM router
    const request: LLMRequest = {
      prompt: analysis.codeContext.prompt,
      intent: analysis.combined.intent,
      complexity: analysis.nlp.complexity,
      language: analysis.combined.detectedLanguage,
      context: { selectedCode: analysis.codeContext.selectedCode },
    };

    // Step 3: Create a compatible analysis object for the formatter
    const nlpAnalysisForFormatting = {
        intent: { intent: analysis.combined.intent },
        complexity: analysis.nlp.complexity,
        confidence: analysis.combined.confidence,
        language: analysis.combined.detectedLanguage,
    };

    // Step 4: Execute using the centralized method
    return this.execute(request, startTime, nlpAnalysisForFormatting);
  }

  /**
   * Estimate cost for an image analysis before processing
   */
  async estimateImageCost(imageBase64: string): Promise<CostEstimate> {
    // Step 1: OCR to get text context. This is required to understand what's in the image.
    const analysis = await this.ocr.analyzeImage(imageBase64);
    
    // The prompt from OCR is the text we need to estimate
    const textForEstimation = analysis.codeContext.prompt;
    const intent = analysis.combined.intent;

    // Step 2: Use CostEstimator to get a cost projection without executing the LLM call
    // The type for intent is string, which is compatible.
    return this.costEstimator.estimateRequestCost(textForEstimation, intent as ExtendedIntent);
  }

  /**
   * Execute Consult Network command - Uses the modern Agent Network (No n8n)
   * This activates the "Central Mind" architecture where agents form sub-teams.
   */
  async consultNetwork(instruction: string, department: string = 'data'): Promise<CommandResult> {
    const startTime = Date.now();
    
    // 1. Get the Department Lead (Crew Member)
    const leadAgent = this.agentNetwork.getDepartment(department);

    // 2. Execute the task (Agent will decide to spawn sub-teams or act directly)
    const output = await leadAgent.executeTask(instruction);

    // 3. Calculate theoretical cost (since we are mocking the actual API call in this step)
    // In production, the AgentNetwork would return actual usage metrics.
    const estimatedCost = 0.01; 

    return {
      success: true,
      output: output,
      model: leadAgent.profile.model,
      costUSD: estimatedCost,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        intent: 'CONSULT_NETWORK',
        complexity: 'HIGH', // Network tasks are assumed complex
        confidence: 1.0,
        language: 'natural-language'
      }
    };
  }

  /**
   * Centralized execution method combining routing and result formatting
   */
  private async execute(
    request: LLMRequest,
    startTime: number,
    nlpAnalysis: any
  ): Promise<CommandResult> {
    const response = await this.executeViaRouter(request);
    return this.formatResult(response, startTime, nlpAnalysis);
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
   * Helper to extract code from a response.
   * @param content The full response string
   * @param requireMarkdown If true, returns null if no markdown blocks are found.
   */
  public extractCode(content: string, requireMarkdown: boolean = false): string | null {
    if (!content) return requireMarkdown ? null : '';
    
    // Match code blocks
    const codeBlockMatch = content.match(/```[\w\s]*\n?([\s\S]*?)```/s);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }
    
    // Match single backticks (often used for short commands)
    const singleBacktickMatch = content.match(/^`([^`]+)`$/);
    if (singleBacktickMatch && singleBacktickMatch[1]) {
        return singleBacktickMatch[1].trim();
    }

    return requireMarkdown ? null : content.trim();
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
        language: nlpAnalysis.language,
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
