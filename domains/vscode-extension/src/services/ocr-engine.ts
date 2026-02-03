/**
 * OCR Engine Service
 *
 * Optical Character Recognition for extracting code and text from images.
 * Enables pasting screenshots of:
 * - Code snippets
 * - Error messages and stack traces
 * - Console output
 * - Architecture diagrams (as ASCII art)
 * - UI screenshots with text
 *
 * Uses pattern recognition for common code/error formats.
 * For production use, integrate with Tesseract.js or cloud OCR APIs.
 */

import { NLPProcessor } from './nlp-processor';

/**
 * OCR result from image analysis
 */
export interface OCRResult {
  success: boolean;
  extractedText: string;
  confidence: number;  // 0-1, confidence in extraction accuracy
  contentType: 'code' | 'error' | 'console' | 'diagram' | 'text' | 'mixed';
  language?: string;  // Programming language detected
  isErrorMessage: boolean;
  stackTrace?: string[];
  codeBlocks: string[];
  summary: string;
}

/**
 * OCR Engine for image processing
 */
export class OCREngine {
  private nlpProcessor: NLPProcessor;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
  }

  /**
   * Process an image and extract text
   * In production, this would call Tesseract.js or cloud OCR API
   * For now, we provide pattern-based extraction from base64 data
   */
  async processImage(imageBase64: string): Promise<OCRResult> {
    // In a real implementation, you would:
    // 1. Decode base64 to image data
    // 2. Call OCR library (Tesseract.js, Google Vision API, etc.)
    // 3. Post-process results

    // For now, return a structured result that can be enhanced
    const result: OCRResult = {
      success: false,
      extractedText: '',
      confidence: 0,
      contentType: 'text',
      codeBlocks: [],
      summary: 'OCR requires integration with Tesseract.js or cloud API',
      isErrorMessage: false,
    };

    try {
      // Extract metadata from base64
      const metadata = this.extractImageMetadata(imageBase64);

      result.confidence = metadata.quality;

      // In production: const text = await tesseract.recognize(imageBase64);
      // For now, we provide the framework for integrating real OCR

      return result;
    } catch (error) {
      return result;
    }
  }

  /**
   * Analyze extracted text for code blocks, errors, and structure
   */
  analyzeText(text: string): OCRResult {
    const lines = text.split('\n');
    const codeBlocks = this.extractCodeBlocks(text);
    const isError = this.isErrorMessage(text);
    const stackTrace = isError ? this.extractStackTrace(text) : undefined;
    const contentType = this.detectContentType(text, isError, codeBlocks.length > 0);
    const language = this.detectLanguageFromText(text);

    // Confidence based on content structure
    let confidence = 0.6;
    if (codeBlocks.length > 0) confidence += 0.2;
    if (language) confidence += 0.1;
    if (isError) confidence += 0.1;
    confidence = Math.min(confidence, 1);

    const summary = this.generateSummary(contentType, codeBlocks, isError, language);

    return {
      success: true,
      extractedText: text,
      confidence,
      contentType,
      language,
      isErrorMessage: isError,
      stackTrace,
      codeBlocks,
      summary,
    };
  }

  /**
   * Extract code blocks from text using common patterns
   */
  private extractCodeBlocks(text: string): string[] {
    const blocks: string[] = [];

    // Pattern 1: Code wrapped in triple backticks
    const backtickPattern = /```[\s\S]*?```/g;
    const backtickMatches = text.match(backtickPattern);
    if (backtickMatches) {
      blocks.push(...backtickMatches.map(m => m.replace(/```/g, '').trim()));
    }

    // Pattern 2: Indented code blocks (4+ spaces)
    const indentedPattern = /^    .+$/gm;
    const indentedMatches = text.match(indentedPattern);
    if (indentedMatches) {
      const indentedBlock = indentedMatches.map(l => l.substring(4)).join('\n');
      if (indentedBlock.trim().length > 10) {
        blocks.push(indentedBlock);
      }
    }

    // Pattern 3: Common code keywords (function, class, const, etc.)
    const codeKeywords = /^(function|class|const|let|var|async|await|if|for|while|import|export|return)[\s\S]*?(?=\n(?:function|class|const|let|var|async|if|for|while|import|export|$))/gm;
    const codeMatches = text.match(codeKeywords);
    if (codeMatches) {
      blocks.push(...codeMatches);
    }

    return blocks.slice(0, 5);  // Cap at 5 blocks
  }

  /**
   * Check if text is an error message
   */
  private isErrorMessage(text: string): boolean {
    const errorPatterns = [
      /Error:|Exception:|TypeError:|ReferenceError:|SyntaxError:/i,
      /\[ERROR\]|\[ERR\]|⚠️|❌|Traceback/,
      /at .+:\d+:\d+/,  // Stack trace pattern
      /failed|error|crash|exception/i,
    ];

    return errorPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract stack trace from error message
   */
  private extractStackTrace(text: string): string[] | undefined {
    // Match stack trace patterns like "at function (file.js:10:5)"
    const stackPattern = /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/g;
    const traces: string[] = [];

    let match;
    while ((match = stackPattern.exec(text)) !== null) {
      traces.push(`${match[1]} (${match[2]}:${match[3]}:${match[4]})`);
    }

    return traces.length > 0 ? traces : undefined;
  }

  /**
   * Detect content type from text characteristics
   */
  private detectContentType(
    text: string,
    isError: boolean,
    hasCode: boolean
  ): OCRResult['contentType'] {
    if (isError) return 'error';
    if (hasCode) return 'code';

    const lower = text.toLowerCase();

    if (lower.includes('console') || lower.includes('output')) {
      return 'console';
    }

    // Check for ASCII art / diagrams
    if (/[┌┐└┘─│├┤┬┴┼═║╔╗╚╝]/.test(text) || /[╭╮╰╯─│]/.test(text)) {
      return 'diagram';
    }

    if (hasCode) {
      return 'code';
    }

    return 'text';
  }

  /**
   * Detect programming language from text patterns
   */
  private detectLanguageFromText(text: string): string | undefined {
    const languagePatterns: Record<string, RegExp> = {
      javascript: /\b(const|let|var|function|async|await|=>|require|import)\b/i,
      typescript: /\b(interface|type|as|generic|abstract|private|public)\b/i,
      python: /\b(def|class|import|from|self|__init__|lambda|async)\b/i,
      java: /\b(public|private|class|void|String|new|extends)\b/i,
      csharp: /\b(using|namespace|public|private|async|Task|void)\b/i,
      go: /\b(func|package|import|defer|go|chan|interface)\b/i,
      rust: /\b(fn|let|mut|impl|trait|pub|async)\b/i,
      sql: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i,
    };

    const scores: Record<string, number> = {};

    for (const [lang, pattern] of Object.entries(languagePatterns)) {
      const matches = text.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    }

    const topLang = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return topLang && topLang[1] > 0 ? topLang[0] : undefined;
  }

  /**
   * Generate summary of extracted content
   */
  private generateSummary(
    contentType: OCRResult['contentType'],
    codeBlocks: string[],
    isError: boolean,
    language?: string
  ): string {
    if (contentType === 'error') {
      return `Error message detected. ${codeBlocks.length} code blocks found. ${language ? `Language: ${language}` : ''}`;
    }

    if (contentType === 'code') {
      return `${codeBlocks.length} code block(s) detected. Language: ${language || 'unknown'}`;
    }

    if (contentType === 'console') {
      return `Console output extracted. ${codeBlocks.length} code blocks found.`;
    }

    if (contentType === 'diagram') {
      return `ASCII diagram detected. Text extraction available.`;
    }

    return `Text extracted. ${codeBlocks.length} potential code blocks found.`;
  }

  /**
   * Extract metadata from image base64 for quality estimation
   */
  private extractImageMetadata(base64: string): { quality: number; size: number } {
    const size = Buffer.byteLength(base64, 'base64');

    // Estimate quality based on size and format
    // Larger files typically have better detail for OCR
    let quality = 0.5;

    if (size > 100000) quality = 0.85;  // > 100KB
    else if (size > 50000) quality = 0.75;  // > 50KB
    else if (size > 20000) quality = 0.65;  // > 20KB
    else if (size > 5000) quality = 0.55;  // > 5KB

    return { quality, size };
  }

  /**
   * Convert OCR result to analyzable code context
   * Can be fed directly to NLP processor and LLM router
   */
  convertToCodeContext(result: OCRResult): {
    prompt: string;
    selectedCode: string;
    language?: string;
  } {
    let prompt = '';

    if (result.isErrorMessage) {
      prompt = `I encountered this error and need help fixing it:\n\n${
        result.stackTrace ? result.stackTrace.join('\n') : result.extractedText.substring(0, 200)
      }`;
    } else if (result.contentType === 'code') {
      prompt = `Review and analyze this code${
        result.language ? ` (${result.language})` : ''
      }:`;
    } else {
      prompt = `I pasted an image with this content:\n\n${result.summary}`;
    }

    return {
      prompt,
      selectedCode: result.codeBlocks.join('\n\n---\n\n'),
      language: result.language,
    };
  }

  /**
   * Batch process multiple images
   */
  async processMultipleImages(
    imageBase64Array: string[]
  ): Promise<OCRResult[]> {
    const results = await Promise.all(
      imageBase64Array.map(img => this.processImage(img))
    );
    return results;
  }

  /**
   * Extract and merge text from multiple OCR results
   */
  mergeOCRResults(results: OCRResult[]): OCRResult {
    const allText = results.map(r => r.extractedText).join('\n\n---\n\n');
    const allCodeBlocks = results.flatMap(r => r.codeBlocks);
    const hasError = results.some(r => r.isErrorMessage);
    const languages = results.filter(r => r.language).map(r => r.language);
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      success: results.every(r => r.success),
      extractedText: allText,
      confidence: avgConfidence,
      contentType: hasError ? 'error' : 'mixed',
      language: languages.length > 0 ? languages[0] : undefined,
      isErrorMessage: hasError,
      codeBlocks: allCodeBlocks.slice(0, 5),
      summary: `Processed ${results.length} images. Found ${allCodeBlocks.length} code blocks.`,
    };
  }
}

/**
 * Helper to integrate OCR with NLP for full analysis
 */
export class OCRWithNLP {
  private ocrEngine: OCREngine;
  private nlpProcessor: NLPProcessor;

  constructor() {
    this.ocrEngine = new OCREngine();
    this.nlpProcessor = new NLPProcessor();
  }

  /**
   * Process image and perform full NLP analysis
   */
  async analyzeImage(imageBase64: string) {
    // Step 1: Extract text from image
    const ocrResult = await this.ocrEngine.processImage(imageBase64);

    // Step 2: Analyze extracted text for code/errors
    const analysisResult = this.ocrEngine.analyzeText(ocrResult.extractedText);

    // Step 3: Convert to code context
    const codeContext = this.ocrEngine.convertToCodeContext(analysisResult);

    // Step 4: Perform NLP analysis on the prompt
    const nlpAnalysis = this.nlpProcessor.analyze(codeContext.prompt, {
      selectedCode: codeContext.selectedCode,
    });

    return {
      ocr: analysisResult,
      nlp: nlpAnalysis,
      codeContext,
      combined: {
        intent: nlpAnalysis.intent.intent,
        detectedLanguage: codeContext.language || nlpAnalysis.language,
        confidence: Math.min(analysisResult.confidence, nlpAnalysis.confidence),
      },
    };
  }
}
