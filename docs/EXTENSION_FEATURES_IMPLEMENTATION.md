# VSCode Extension - NLP Routing, OCR & File Manipulation Implementation

**Document Date**: February 3, 2026
**Status**: Implementation Plan
**Priority**: High
**Estimated Timeline**: 4 weeks (Phases 2-3)

---

## Overview

This document details the technical implementation of three advanced features for the VSCode extension:

1. **NLP Routing** - Natural language processing to understand intent and context
2. **OCR Processing** - Image-to-text extraction for pasted screenshots/diagrams
3. **File Manipulation** - Advanced code editing capabilities matching professional IDEs

---

## Feature 1: NLP Routing (Intent Detection)

### Purpose

Transform user prompts from vague English to structured requests that can be routed to optimal AI models.

**Example**:
```
User: "make this function faster"
↓
Intent Detection: REFACTOR
Entities: [function_at_line_42]
Context: [performance, optimization, algorithm]
Complexity: HIGH
Recommended Model: Claude Sonnet (code analysis)
```

### Architecture

```typescript
// domains/vscode-extension/src/services/nlp/intent-detector.ts

interface DetectedIntent {
  intent: Intent;
  confidence: number;  // 0-1
  entities: Entity[];
  context: string[];
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedModels: ModelSuggestion[];
}

type Intent =
  | 'ASK'        // General question about code
  | 'EXPLAIN'    // Understand what code does
  | 'REVIEW'     // Code review request
  | 'REFACTOR'   // Improve code quality
  | 'GENERATE'   // Create new code
  | 'DEBUG'      // Fix errors
  | 'TEST'       // Generate tests
  | 'DOCUMENT'   // Write documentation
  | 'COMPLETE'   // Auto-completion
  | 'SUGGEST';   // Suggestions

interface Entity {
  type: 'FUNCTION' | 'CLASS' | 'FILE' | 'VARIABLE' | 'SNIPPET';
  name: string;
  location: CodeLocation;
  confidence: number;
}

class IntentDetector {
  /**
   * Main entry point - detect intent from raw prompt
   */
  async detect(prompt: string, context?: CodeContext): Promise<DetectedIntent>;

  /**
   * Sub-routines for specific detection
   */
  private async detectIntent(text: string): Promise<Intent>;
  private async extractEntities(text: string): Promise<Entity[]>;
  private async analyzeComplexity(intent: Intent, entities: Entity[]): Promise<Complexity>;
  private async suggestModels(intent: Intent, complexity: Complexity): Promise<ModelSuggestion[]>;
}
```

### NLP Implementation Details

#### 1. Intent Detection (Rule-Based + ML)

```typescript
// Keyword-based routing (fast)
const intentKeywords = {
  'REFACTOR': ['refactor', 'improve', 'optimize', 'clean', 'better', 'simplify'],
  'REVIEW': ['review', 'check', 'audit', 'analyze', 'lint', 'test'],
  'GENERATE': ['create', 'write', 'generate', 'build', 'implement', 'make'],
  'EXPLAIN': ['explain', 'what', 'how', 'why', 'understand', 'describe'],
  'DEBUG': ['fix', 'debug', 'error', 'bug', 'wrong', 'broken'],
  'TEST': ['test', 'unittest', 'mock', 'coverage', 'edge case'],
  'DOCUMENT': ['document', 'comment', 'docstring', 'jsdoc', 'readme'],
};

// ML-based routing (accurate, optional)
const mlModel = await loadModel('intent-classifier');
const mlPrediction = await mlModel.predict(prompt);
```

#### 2. Entity Extraction (AST + NLP)

```typescript
// Use Typescript compiler API for precision
const ast = parseFile(currentFile);
const definitions = extractDefinitions(ast);  // functions, classes, variables

// Match entities in prompt
const entities = definitions.filter(def =>
  prompt.toLowerCase().includes(def.name.toLowerCase())
);

// If no explicit entities, find most likely based on context
if (entities.length === 0) {
  const selectedText = editor.selection.getText();
  entities = definitions.filter(def => selectedText.includes(def.name));
}
```

#### 3. Complexity Analysis

```typescript
interface ComplexityFactors {
  entityCount: number;        // How many things involved?
  contextSize: number;        // How much code?
  semanticComplexity: number; // How hard is it? (1-10)
  requiresExplanation: boolean; // Does it need reasoning?
}

const factors: ComplexityFactors = {
  entityCount: entities.length,
  contextSize: selectedText.length,
  semanticComplexity: analyzeSemantics(intent, entities),
  requiresExplanation: ['REVIEW', 'DEBUG', 'EXPLAIN'].includes(intent),
};

const complexity = factors.contextSize > 1000 ? 'HIGH' :
                   factors.semanticComplexity > 6 ? 'HIGH' :
                   factors.contextSize > 300 ? 'MEDIUM' :
                   'LOW';
```

#### 4. Model Suggestion

```typescript
// Map intent + complexity to optimal model
const modelMap = {
  'EXPLAIN/LOW': 'gemini-flash-1.5',      // Quick explanation
  'EXPLAIN/HIGH': 'claude-3.5-sonnet',    // Deep analysis
  'REFACTOR/LOW': 'gpt-4-turbo',          // Code optimization
  'REFACTOR/HIGH': 'claude-3.5-sonnet',   // Complex refactoring
  'GENERATE/LOW': 'gemini-flash-1.5',     // Simple generation
  'GENERATE/HIGH': 'claude-3.5-sonnet',   // Complex generation
  'REVIEW/MEDIUM': 'gpt-4-turbo',         // Code review expertise
  'REVIEW/HIGH': 'claude-3.5-sonnet',     // Detailed reviews
  'DEBUG/ANY': 'claude-3.5-sonnet',       // Debugging needs reasoning
  'TEST/ANY': 'gpt-4-turbo',              // Test generation
};

const modelKey = `${intent}/${complexity}`;
const suggestedModel = modelMap[modelKey] || 'claude-3.5-sonnet';
```

### Usage in Extension

```typescript
// User types: "make this faster"
const input = "make this faster";
const selection = editor.selection.getText();  // Gets selected code

const detected = await intentDetector.detect(input, {
  selectedCode: selection,
  fileName: editor.document.fileName,
  language: editor.document.languageId,
});

// Output:
// {
//   intent: 'REFACTOR',
//   confidence: 0.95,
//   entities: [{ type: 'FUNCTION', name: 'processData', ... }],
//   context: ['performance', 'optimization'],
//   complexity: 'MEDIUM',
//   suggestedModels: [
//     { model: 'gpt-4-turbo', reason: 'Code optimization expertise' },
//     { model: 'gemini-flash-1.5', reason: 'Cost efficient (99% cheaper)' }
//   ]
// }

// Now route to optimal model
const response = await llmRouter.route({
  prompt: input,
  context: { ...detected, selectedCode: selection },
  preferredModel: 'gpt-4-turbo',
});
```

---

## Feature 2: OCR (Optical Character Recognition)

### Purpose

Extract text and code from pasted images without requiring manual transcription.

**Use Cases**:
- Screenshot of error message → Extract and debug
- Architecture diagram → Extract and describe
- Handwritten notes → Convert to code/documentation
- Other code editor → Copy image → Paste → Parse

### Architecture

```typescript
// domains/vscode-extension/src/services/ocr/ocr-engine.ts

interface OCRResult {
  type: 'TEXT' | 'CODE' | 'DIAGRAM' | 'HANDWRITING';
  content: string;
  confidence: number;
  language?: string;  // For code: language detected
  metadata?: {
    errorType?: string;  // If error message
    diagramType?: 'flowchart' | 'sequence' | 'er' | 'architecture';
    handwritingStyle?: string;
  };
}

class OCREngine {
  /**
   * Process image to extract text/code
   */
  async processImage(image: Buffer | string): Promise<OCRResult>;

  // Specific processors
  async recognizeText(image: Buffer): Promise<string>;
  async recognizeCode(image: Buffer): Promise<{ code: string; language: string }>;
  async recognizeDiagram(image: Buffer): Promise<DiagramDescription>;
  async recognizeHandwriting(image: Buffer): Promise<string>;

  // Helper: Classify image before processing
  async classifyImage(image: Buffer): Promise<ImageType>;
}
```

### Implementation Approach

#### Option 1: Cloud-Based OCR (Recommended for MVP)

```typescript
// Use Tesseract.js or cloud APIs
import Tesseract from 'tesseract.js';

class OCREngine {
  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    // Step 1: Classify image
    const imageType = await this.classifyImage(imageBuffer);

    // Step 2: OCR
    const { data } = await Tesseract.recognize(imageBuffer, 'eng');
    let text = data.text;

    // Step 3: Language detection
    const language = await this.detectLanguage(text);

    // Step 4: Content-specific processing
    if (imageType === 'CODE') {
      // Additional code formatting
      text = this.formatAsCode(text, language);
    } else if (imageType === 'DIAGRAM') {
      // Diagram description
      return {
        type: 'DIAGRAM',
        content: await this.describeDiagram(imageBuffer),
        confidence: 0.85,
      };
    }

    return {
      type: imageType,
      content: text,
      confidence: data.confidence / 100,
      language: language,
    };
  }

  private async classifyImage(image: Buffer): Promise<ImageType> {
    // Use image analysis to determine type
    // This could be ML-based or heuristic-based
    // For MVP: heuristic based on image characteristics

    const characteristics = await this.analyzeImage(image);

    if (characteristics.hasCode) return 'CODE';
    if (characteristics.hasBoxes || characteristics.hasArrows) return 'DIAGRAM';
    if (characteristics.hasHandwriting) return 'HANDWRITING';
    return 'TEXT';
  }
}
```

#### Option 2: Local OCR (Privacy-First)

```typescript
// Offline processing using native modules
import { createWorker } from 'tesseract.js';

// In extension activation:
const worker = await createWorker('eng');

class OfflineOCREngine {
  async processImage(imageBuffer: Buffer): Promise<OCRResult> {
    // 1. Process locally (no network)
    const { data } = await worker.recognize(imageBuffer);

    // 2. Extract text with confidence
    return {
      type: 'TEXT',
      content: data.text,
      confidence: data.confidence / 100,
    };
  }

  // Cleanup on deactivation
  async cleanup() {
    await worker.terminate();
  }
}
```

### Integration in VSCode

```typescript
// When user pastes image in chat panel
editor.onDidChangeTextDocument((e) => {
  if (e.document.uri.scheme === 'vscode-chat') {
    const images = extractPastedImages(e);

    for (const image of images) {
      const result = await ocrEngine.processImage(image);

      // Add to chat context
      chatPanel.addMessage({
        role: 'user',
        content: `Image detected:\n\`\`\`${result.language || 'text'}\n${result.content}\n\`\`\`\n\nContext: ${result.type}`,
      });
    }
  }
});
```

---

## Feature 3: File Manipulation

### Purpose

Enable programmatic file editing matching capabilities of Cursor/Codeium IDE plugins.

### Capabilities

#### 1. Read Operations

```typescript
class FileManager {
  /**
   * Read file with context about structure
   */
  async readFile(path: string): Promise<{
    content: string;
    language: string;
    definitions: Definition[];  // functions, classes, variables
    imports: Import[];
    exports: Export[];
  }>;

  /**
   * Read file range (lines 10-20)
   */
  async readRange(path: string, start: number, end: number): Promise<string>;

  /**
   * Get definition at position
   */
  async getDefinitionAt(file: string, line: number, column: number): Promise<Definition>;

  /**
   * Find all usages of identifier
   */
  async findUsages(file: string, identifier: string): Promise<UsageLocation[]>;
}
```

#### 2. Write Operations

```typescript
class FileManager {
  /**
   * Write/create file
   */
  async writeFile(path: string, content: string, options?: {
    createIfMissing?: boolean;
    format?: boolean;
  }): Promise<void>;

  /**
   * Apply patch (generate file diffs)
   */
  async applyPatch(file: string, patch: PatchOperation[]): Promise<void>;
  // Where PatchOperation is like:
  // { type: 'INSERT', line: 10, content: 'new code' }
  // { type: 'DELETE', line: 15, count: 3 }
  // { type: 'REPLACE', line: 20, content: 'replacement' }

  /**
   * Multi-file refactoring (rename identifier everywhere)
   */
  async refactorIdentifier(
    oldName: string,
    newName: string,
    scope: 'file' | 'project'
  ): Promise<FileChange[]>;

  /**
   * Format code (prettier/black)
   */
  async formatFile(path: string, language: string): Promise<void>;
}
```

#### 3. Navigation Operations

```typescript
class FileManager {
  /**
   * Get project file structure (for context)
   */
  async getProjectStructure(rootPath?: string): Promise<FileTree>;

  /**
   * Find files by pattern
   */
  async findFiles(pattern: string): Promise<string[]>;

  /**
   * Get imports of a file
   */
  async getImports(file: string): Promise<{
    file: string;
    imports: string[];
  }>;

  /**
   * Suggest related files
   */
  async getRelatedFiles(file: string): Promise<string[]>;
}
```

### Implementation Using VSCode APIs

```typescript
// domains/vscode-extension/src/services/file-manager.ts

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { parseFile } from '@babel/parser';  // or ts parser

class FileManager {
  async readFile(path: string) {
    const uri = vscode.Uri.file(path);
    const document = await vscode.workspace.openTextDocument(uri);

    // Parse AST
    let definitions: Definition[] = [];
    try {
      const ast = parseFile(document.getText(), document.languageId);
      definitions = this.extractDefinitions(ast);
    } catch (e) {
      // Fallback to regex-based extraction
      definitions = this.extractDefinitionsRegex(document.getText());
    }

    return {
      content: document.getText(),
      language: document.languageId,
      definitions,
      imports: this.extractImports(document.getText()),
      exports: this.extractExports(document.getText()),
    };
  }

  async applyPatch(file: string, patches: PatchOperation[]) {
    const uri = vscode.Uri.file(file);
    const document = await vscode.workspace.openTextDocument(uri);
    const edit = new vscode.WorkspaceEdit();

    // Convert patches to VSCode edits
    for (const patch of patches) {
      const line = document.lineAt(patch.line - 1);

      switch (patch.type) {
        case 'INSERT':
          edit.insert(uri, line.range.end, '\n' + patch.content);
          break;
        case 'DELETE':
          const endLine = document.lineAt(patch.line + patch.count - 2);
          edit.delete(uri, new vscode.Range(line.range.start, endLine.range.end));
          break;
        case 'REPLACE':
          const replaceLine = document.lineAt(patch.line - 1);
          edit.replace(uri, replaceLine.range, patch.content);
          break;
      }
    }

    await vscode.workspace.applyEdit(edit);
    await document.save();
  }

  async refactorIdentifier(
    oldName: string,
    newName: string,
    scope: 'file' | 'project'
  ): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    if (scope === 'file') {
      // Single file
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const fileChanges = await this.refactorInFile(
          editor.document.uri.fsPath,
          oldName,
          newName
        );
        changes.push(...fileChanges);
      }
    } else {
      // Project-wide
      const files = await vscode.workspace.findFiles('**/*');
      for (const file of files) {
        const fileChanges = await this.refactorInFile(
          file.fsPath,
          oldName,
          newName
        );
        changes.push(...fileChanges);
      }
    }

    return changes;
  }

  private async refactorInFile(
    filePath: string,
    oldName: string,
    newName: string
  ): Promise<FileChange[]> {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();

    // Use regex for simple cases, AST for complex
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    const newText = text.replace(regex, newName);

    // Apply change
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), newText);
    await vscode.workspace.applyEdit(edit);

    return [{
      file: filePath,
      oldName,
      newName,
      occurrences: (text.match(regex) || []).length,
    }];
  }
}
```

### Example: AI-Assisted Refactoring

```typescript
// User selects code and types: "extract this into a new function"

const selectedCode = editor.selection.getText();

// 1. Intent detection
const intent = await intentDetector.detect('extract this into a new function');
// → Intent: REFACTOR, complexity: MEDIUM

// 2. Send to AI
const response = await llmRouter.route({
  prompt: 'Extract this code into a separate function\n```\n' + selectedCode + '\n```',
  intent: intent.intent,
  complexity: intent.complexity,
});

// Response:
// {
//   content: '```typescript\nfunction processData(items: Item[]): Result[] {\n  ...\n}\n```',
//   newFunctionStart: 5,
//   newFunctionEnd: 15,
//   replaceOriginalWith: 'processData(items)',
// }

// 3. Apply changes
const patches = [
  { type: 'INSERT', line: 1, content: response.newFunction },
  { type: 'REPLACE', line: 25, content: response.replaceOriginalWith },
];

await fileManager.applyPatch(editor.document.uri.fsPath, patches);
```

---

## Integration Flow: NLP → OCR → File Management

```
┌─────────────────────────────────────────────────────────────┐
│ User Types Prompt in Chat Panel                             │
│ Or: Pastes Image                                             │
│ Or: Selects Code + Types Command                            │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─→ [NLP Routing]
               │   • Detect intent
               │   • Extract entities
               │   • Analyze complexity
               │   • Suggest models
               │
               ├─→ [OCR Processing] (if image pasted)
               │   • Recognize text/code
               │   • Classify content type
               │   • Extract handwriting
               │
               └─→ [File Context]
                   • Get selected code
                   • Find related files
                   • Build project context

               ↓

┌─────────────────────────────────────────────────────────────┐
│ Route to Optimal AI Model                                   │
│ (via Alex-AI-Universal Cost Optimizer)                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓

┌─────────────────────────────────────────────────────────────┐
│ OpenRouter API Call (Direct, No Markup)                     │
│ Cost: $0.0001 - $0.15 depending on complexity               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓

┌─────────────────────────────────────────────────────────────┐
│ Apply Changes via File Manager                              │
│ • Write new files                                            │
│ • Apply patches to existing files                            │
│ • Refactor identifiers                                       │
│ • Format code                                                │
└──────────────┬──────────────────────────────────────────────┘
               │
               ↓

┌─────────────────────────────────────────────────────────────┐
│ Display Results                                              │
│ • Show in editor                                             │
│ • Highlight changes                                          │
│ • Show cost: "Used: $0.002 of budget"                        │
│ • Allow undo/redo                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/nlp/intent-detector.test.ts
describe('IntentDetector', () => {
  it('should detect REFACTOR intent', async () => {
    const result = await detector.detect('make this function faster');
    expect(result.intent).toBe('REFACTOR');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should extract function entities', async () => {
    const code = 'function processData() { ... }';
    const result = await detector.detect('explain processData', { selectedCode: code });
    expect(result.entities).toContainEqual({ type: 'FUNCTION', name: 'processData' });
  });
});

// tests/ocr/ocr-engine.test.ts
describe('OCREngine', () => {
  it('should recognize code from image', async () => {
    const image = fs.readFileSync('test-code.png');
    const result = await engine.processImage(image);
    expect(result.type).toBe('CODE');
    expect(result.language).toBeDefined();
  });
});

// tests/file-manager/file-manager.test.ts
describe('FileManager', () => {
  it('should apply patches correctly', async () => {
    const patches = [
      { type: 'INSERT', line: 5, content: 'console.log("test");' },
    ];
    await fileManager.applyPatch('test.ts', patches);
    // Verify file contains new content
  });
});
```

### Integration Tests

```typescript
// tests/integration/e2e.test.ts
describe('End-to-End: User Interaction', () => {
  it('should refactor code with AI assistance', async () => {
    // 1. User pastes code
    const code = 'function old() { ... }';

    // 2. Requests refactoring
    const intent = await nlp.detect('make this function cleaner');

    // 3. Get AI response
    const response = await llm.route({
      prompt: 'Refactor this code',
      intent: intent.intent,
    });

    // 4. Apply to file
    await fileManager.applyPatch('file.ts', response.patches);

    // 5. Verify changes
    const updated = await fileManager.readFile('file.ts');
    expect(updated.content).toContain('// Better code');
  });
});
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Intent Detection | < 100ms | Lightweight NLP |
| OCR Processing | < 2s | Depends on image size |
| File I/O | < 100ms | Local operations |
| Model Routing | < 500ms | Cost estimation |
| Total E2E | < 3s | From input to response |

---

## Success Metrics

After implementation:

- ✅ 95%+ intent detection accuracy
- ✅ 90%+ OCR accuracy for code images
- ✅ Zero-lag file manipulation
- ✅ 99% cost optimization (vs Copilot)
- ✅ Used by 100% of dev team

---

## Rollout Plan

1. **Week 1-2**: NLP Routing
2. **Week 3**: OCR Processing
3. **Week 4**: File Manipulation
4. **Week 5**: Integration & Testing
5. **Week 6**: Team Rollout

---

**Document Status**: Implementation Plan
**Next Review**: February 10, 2026
