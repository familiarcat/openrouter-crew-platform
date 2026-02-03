# Phase 8: VSCode Extension Implementation Plan

**Plan Date**: February 3, 2026
**Status**: Implementation Starting
**Estimated Duration**: 4-6 weeks (10 phases)
**Team Size**: 1-2 engineers
**Priority**: HIGH

---

## Overview

Phase 8 transforms the VSCode extension from a simple UI wrapper into a professional, AI-powered code assistant that rivals Cursor, Codeium, and GitHub Copilot - while being **90% cheaper** than commercial alternatives.

**Key Innovation**: All LLM calls routed through alex-ai-universal's cost optimization system, making OpenRouter the most cost-effective choice without paying markup.

---

## Phase 8 Breakdown (10 Sub-Phases)

### Phase 8A: Domain Migration (Week 1)
**Goal**: Elevate VSCode extension from sub-component to first-class domain

**Tasks**:
1. Create new domain directory structure
2. Move extension from `alex-ai-universal/vscode-extension/` → `domains/vscode-extension/`
3. Update package.json with correct namespace
4. Update workspace configuration
5. Update all import paths
6. Add to pnpm-workspace.yaml
7. Verify builds successfully

**Files to Create**:
```
domains/vscode-extension/
├── src/
│   ├── extension.ts              # Entry point
│   ├── activation.ts             # Activation logic
│   ├── deactivation.ts           # Cleanup
│   ├── index.ts                  # Exports
│   │
│   ├── commands/
│   │   ├── index.ts              # Command registration
│   │   ├── ask.ts                # Ask command
│   │   ├── review.ts             # Code review
│   │   ├── explain.ts            # Explain code
│   │   ├── generate.ts           # Generate code
│   │   ├── refactor.ts           # Refactor code
│   │   ├── test.ts               # Generate tests
│   │   ├── document.ts           # Generate docs
│   │   └── quick-fix.ts          # Quick fix from error
│   │
│   ├── providers/
│   │   ├── tree-view.ts          # Cost/crew tree views
│   │   ├── hover.ts              # Hover provider
│   │   ├── completion.ts         # Code completion
│   │   └── diagnostics.ts        # Problem diagnostics
│   │
│   ├── services/
│   │   ├── llm-router.ts         # Routes to optimal model
│   │   ├── file-manager.ts       # File I/O & AST
│   │   ├── ocr-engine.ts         # Image recognition
│   │   ├── nlp-processor.ts      # Intent detection
│   │   ├── context-builder.ts    # Build code context
│   │   └── cost-tracker.ts       # Local cost tracking
│   │
│   ├── storage/
│   │   ├── history.ts            # Conversation history
│   │   ├── cache.ts              # Response caching
│   │   └── settings.ts           # User preferences
│   │
│   ├── ui/
│   │   ├── chat-panel.ts         # Chat webview
│   │   ├── cost-meter.ts         # Status bar cost meter
│   │   ├── tree-views.ts         # Tree view UI
│   │   └── webviews.ts           # Webview management
│   │
│   └── utils/
│       ├── logging.ts
│       ├── formatting.ts
│       └── validators.ts
│
├── webview/                      # HTML/CSS/JS for webviews
│   ├── chat.html
│   ├── chat.css
│   ├── chat.js
│   └── styles.css
│
├── package.json                  # @openrouter-crew/vscode-extension
├── tsconfig.json
├── .vscodeignore
├── extension.json                # VSCode manifest
├── CHANGELOG.md
└── README.md
```

**Success Criteria**:
- ✅ Extension builds without errors
- ✅ Workspace includes new domain
- ✅ All imports resolved
- ✅ Ready for Phase 8B

---

### Phase 8B: LLM Router Service (Week 1-2)
**Goal**: Build intelligent routing between Claude and OpenRouter models

**Architecture**:
```typescript
// domains/vscode-extension/src/services/llm-router.ts

interface LLMRequest {
  prompt: string;
  files?: FileContext[];
  images?: ImageContext[];
  language?: string;
  intent?: Intent;
  complexity?: Complexity;
}

interface LLMResponse {
  content: string;
  model: string;
  provider: 'claude' | 'openrouter';
  costUSD: number;
  executionTimeMs: number;
  cached: boolean;
}

class LLMRouter {
  async route(request: LLMRequest): Promise<LLMResponse>;
  async estimateCost(request: LLMRequest): Promise<CostEstimate>;
  async selectModel(intent: Intent, complexity: Complexity): Promise<ModelChoice>;
  async checkBudget(costEstimate: number): Promise<boolean>;
}
```

**Implementation Steps**:
1. Create LLMRouter class
2. Integrate with alex-ai-universal cost optimizer
3. Implement model selection logic
4. Add budget checking
5. Implement retry logic with exponential backoff
6. Add response caching
7. Create unit tests

**Models Supported**:
- Claude Sonnet 3.5 ($0.003/$0.015 per 1K tokens)
- Claude Opus ($0.015/$0.06)
- Gemini Flash 1.5 ($0.0001/$0.0004) ← Cheapest
- GPT-4 Turbo ($0.01/$0.03)
- Mistral ($0.0001/$0.0003)

**Cost Optimization Rules**:
```typescript
// Complexity-based routing
'LOW'    → Gemini Flash       ($0.0001, 99% cheaper)
'MEDIUM' → Gemini or Claude   (balance cost/quality)
'HIGH'   → Claude Sonnet      (best quality)

// Intent-based routing
'REVIEW' → GPT-4 (best at code analysis)
'DEBUG'  → Claude (best at reasoning)
'TEST'   → Any model works (use cheapest)
```

**Success Criteria**:
- ✅ Routes prompts to optimal model
- ✅ Cost estimates within 10% of actual
- ✅ Budget enforcement prevents overspend
- ✅ Unit tests pass (90%+ coverage)

---

### Phase 8C: NLP Intent Detection (Week 2)
**Goal**: Understand user intent from natural language prompts

**Intent Types**:
```typescript
type Intent =
  | 'ASK'        // General question
  | 'REVIEW'     // Code review
  | 'EXPLAIN'    // Explain code
  | 'REFACTOR'   // Improve quality
  | 'GENERATE'   // Create code
  | 'DEBUG'      // Fix errors
  | 'TEST'       // Generate tests
  | 'DOCUMENT'   // Write docs
  | 'COMPLETE'   // Auto-complete
  | 'OPTIMIZE';  // Performance optimization
```

**Implementation**:
```typescript
// domains/vscode-extension/src/services/nlp-processor.ts

class NLPProcessor {
  async detectIntent(prompt: string): Promise<DetectedIntent>;
  async extractEntities(prompt: string, code?: string): Promise<Entity[]>;
  async analyzeComplexity(intent: Intent, entities: Entity[]): Promise<Complexity>;
  async selectRelevantFiles(prompt: string): Promise<string[]>;
}

interface DetectedIntent {
  intent: Intent;
  confidence: 0-1;
  entities: Entity[];
  context: string[];
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedModel: string;
}
```

**Detection Methods**:
1. **Keyword-based** (fast, 80% accuracy)
   - Look for intent keywords
   - Simple regex pattern matching

2. **ML-based** (optional, 95% accuracy)
   - Pre-trained intent classifier
   - Using transformers.js (runs locally, no network)

3. **Context-aware** (90%+ accuracy)
   - Consider selected code
   - Consider file type
   - Consider previous prompts

**Sample Detections**:
```
"make this faster"
  → REFACTOR, complexity: MEDIUM, suggested: GPT-4

"explain this function"
  → EXPLAIN, complexity: LOW, suggested: Gemini

"write a test for this"
  → TEST, complexity: MEDIUM, suggested: Gemini

"fix the error in line 42"
  → DEBUG, complexity: HIGH, suggested: Claude
```

**Success Criteria**:
- ✅ 90%+ accuracy on common intents
- ✅ Auto-selects relevant files
- ✅ Suggests appropriate models
- ✅ < 100ms detection time

---

### Phase 8D: OCR Image Processing (Week 2-3)
**Goal**: Extract code/text from pasted images

**Use Cases**:
- Paste screenshot of error → Extract and debug
- Paste code from another editor → Recognize and refactor
- Paste architecture diagram → Extract and describe
- Paste handwritten notes → Convert to code

**Implementation**:
```typescript
// domains/vscode-extension/src/services/ocr-engine.ts

class OCREngine {
  async processImage(imageBuffer: Buffer): Promise<OCRResult>;
  async recognizeText(image: Buffer): Promise<string>;
  async recognizeCode(image: Buffer): Promise<{ code: string; language: string }>;
  async parseDiagram(image: Buffer): Promise<DiagramDescription>;
  async recognizeHandwriting(image: Buffer): Promise<string>;
}

interface OCRResult {
  type: 'TEXT' | 'CODE' | 'DIAGRAM' | 'ERROR' | 'HANDWRITING';
  content: string;
  confidence: 0-1;
  language?: string;  // For code
  errorType?: string; // For error messages
}
```

**Library Choice**:
- **Tesseract.js** - Open source, runs locally, no network
- **Sharp** - Image processing
- **Canvas** - Image manipulation

**Workflow**:
1. User pastes image in chat
2. OCR detects image type
3. Extracts text with language detection
4. Adds to prompt as context
5. Sends to LLM router

**Success Criteria**:
- ✅ 90%+ accuracy for code extraction
- ✅ < 2 seconds processing time
- ✅ Runs locally (no network)
- ✅ Supports all major image formats

---

### Phase 8E: File Manipulation Service (Week 3)
**Goal**: Enable programmatic code editing

**Capabilities**:
```typescript
class FileManager {
  // Read operations
  async readFile(path: string): Promise<FileContent>;
  async readRange(path: string, start: number, end: number): Promise<string>;
  async getDefinitionAt(file: string, line: number, col: number): Promise<Definition>;
  async findUsages(file: string, identifier: string): Promise<UsageLocation[]>;

  // Write operations
  async writeFile(path: string, content: string): Promise<void>;
  async applyPatch(file: string, patches: PatchOperation[]): Promise<void>;
  async refactorIdentifier(oldName: string, newName: string, scope: 'file'|'project'): Promise<FileChange[]>;

  // Navigation
  async getProjectStructure(): Promise<FileTree>;
  async findFiles(pattern: string): Promise<string[]>;
  async getRelatedFiles(file: string): Promise<string[]>;
}

interface PatchOperation {
  type: 'INSERT' | 'DELETE' | 'REPLACE';
  line: number;
  content?: string;
  count?: number;
}
```

**Implementation**:
1. Use VSCode API for file operations
2. Use TypeScript compiler for AST parsing
3. Implement refactoring algorithms
4. Support multi-file changes

**Example: Refactor Function Name**:
```typescript
// User: "rename processData to handleData everywhere"
const changes = await fileManager.refactorIdentifier(
  'processData',
  'handleData',
  'project'
);
// Returns: [
//   { file: 'utils.ts', occurrences: 3 },
//   { file: 'types.ts', occurrences: 1 },
//   { file: 'app.ts', occurrences: 5 }
// ]
```

**Success Criteria**:
- ✅ Read/write files correctly
- ✅ Apply patches without data loss
- ✅ Refactor across multiple files
- ✅ 100% accuracy on simple cases

---

### Phase 8F: Command Implementations (Week 4)
**Goal**: Build end-to-end commands

**Core Commands** (Register in VSCode):
```
openrouter-crew.ask               # Ask LLM anything
openrouter-crew.review            # Code review
openrouter-crew.explain           # Explain code
openrouter-crew.generate          # Generate code
openrouter-crew.refactor          # Refactor code
openrouter-crew.test              # Generate tests
openrouter-crew.document          # Generate docs
openrouter-crew.debug             # Debug issue
openrouter-crew.quickFix          # AI-powered quick fix
```

**Command Flow Example: Code Review**:
```typescript
// 1. User selects code and runs: "Code Review"

// 2. Extension captures context
const context = {
  selectedCode: editor.selection.getText(),
  fileName: editor.document.fileName,
  language: editor.document.languageId,
  fileContent: editor.document.getText(),
};

// 3. NLP detects intent
const intent = await nlpProcessor.detectIntent('review');

// 4. Build enhanced prompt
const prompt = `Review this ${language} code for:\n- Performance\n- Security\n- Best practices\n- Maintainability\n\n\`\`\`${language}\n${selectedCode}\n\`\`\``;

// 5. Route to optimal model (GPT-4 for code review)
const response = await llmRouter.route({
  prompt,
  language,
  intent: 'REVIEW',
  complexity: 'MEDIUM',
});

// 6. Display results in webview
chatPanel.addMessage({
  role: 'assistant',
  content: response.content,
  meta: {
    model: response.model,
    cost: response.costUSD,
    time: response.executionTimeMs,
  },
});

// 7. Track cost
await costTracker.record({
  command: 'review',
  cost: response.costUSD,
  model: response.model,
  timestamp: Date.now(),
});
```

**Implementation Sequence**:
1. Week 4A: Ask + Review commands
2. Week 4B: Explain + Generate + Refactor
3. Week 4C: Test + Document + Debug
4. Week 4D: Quick fixes + Hover integration

**Success Criteria**:
- ✅ All commands work end-to-end
- ✅ < 2 second response time for simple tasks
- ✅ Proper error handling
- ✅ User-friendly prompts

---

### Phase 8G: Cost Tracking Integration (Week 4)
**Goal**: Real-time budget enforcement and cost metrics

**Features**:
```typescript
class CostTracker {
  // Tracking
  async recordUsage(usage: UsageRecord): Promise<void>;
  async getCostMetrics(period: 'daily'|'weekly'|'monthly'): Promise<CostMetrics>;

  // Enforcement
  async checkBudget(estimatedCost: number): Promise<{ allowed: boolean; reason?: string }>;
  async updateRemainingBudget(cost: number): Promise<void>;
  async alertBudgetWarning(): Promise<void>;

  // Analytics
  async getModelDistribution(): Promise<ModelStats[]>;
  async getIntentDistribution(): Promise<IntentStats[]>;
  async getCommandStats(): Promise<CommandStats[]>;
}

interface UsageRecord {
  timestamp: number;
  command: string;
  prompt: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  cached: boolean;
}

interface CostMetrics {
  totalCost: number;
  remaining: number;
  percentUsed: number;
  averagePerDay: number;
  byModel: { [key: string]: number };
  byCommand: { [key: string]: number };
}
```

**Status Bar Display**:
```
💰 $12.50 / $100.00 (12%)  ← Real-time cost meter
├─ Click to show details
└─ Color: Green (< 75%), Yellow (75-90%), Red (> 90%)
```

**Budget Alerts**:
- 75% threshold: "Budget 75% consumed"
- 90% threshold: "Budget 90% consumed - only 10 requests left"
- 100% threshold: "Budget exceeded - requests blocked"

**Local Storage**:
- Store in VSCode's globalStorageUri
- Survives extension updates
- Syncs periodically with backend

**Success Criteria**:
- ✅ Real-time cost tracking
- ✅ Budget enforcement
- ✅ Visual indicators
- ✅ Usage analytics

---

### Phase 8H: Webview UI & Chat Panel (Week 5)
**Goal**: Build beautiful chat interface

**Architecture**:
```
Extension Process
  ├─ extension.ts (main thread)
  ├─ commands/ (command handlers)
  ├─ services/ (logic)
  │
  └─ Webview Process
     ├─ chat.html (UI)
     ├─ chat.css (styling)
     └─ chat.js (interaction)
```

**Chat Panel Features**:
```html
<!-- Message History -->
<div class="messages">
  <div class="message user">
    <span class="role">You</span>
    <span class="text">Explain this function</span>
    <span class="time">2:34 PM</span>
  </div>

  <div class="message assistant">
    <span class="role">Claude Sonnet</span>
    <span class="meta">
      💰 $0.003 • 🤖 claude-3.5-sonnet • ⏱️ 1.2s
    </span>
    <span class="text">This function takes two numbers...</span>
    <span class="actions">
      <button class="copy">📋 Copy</button>
      <button class="apply">✅ Apply</button>
    </span>
  </div>
</div>

<!-- Input Area -->
<div class="input-area">
  <textarea placeholder="Ask anything... (Cmd+K)"></textarea>
  <div class="actions">
    <button class="attach">📎 Attach Files</button>
    <button class="image">🖼️ Paste Image</button>
    <button class="send">Send</button>
  </div>
  <div class="status">
    💰 $12.50 / $100.00 • 📊 56 requests today
  </div>
</div>
```

**Command Palette Integration**:
```
Cmd+Shift+P → "Ask" → Type question
Cmd+Shift+P → "Review" → Reviews selected code
Cmd+Shift+P → "Generate" → Describe what you want
```

**Tree Views**:
1. **Crew View** - Show available agents
2. **Cost View** - Show spending breakdown
3. **History View** - Show past conversations

**Success Criteria**:
- ✅ Responsive chat UI
- ✅ Markdown support
- ✅ Code block syntax highlighting
- ✅ Smooth animations
- ✅ Mobile-friendly design (for future)

---

### Phase 8I: Testing & Documentation (Week 5-6)
**Goal**: Ensure quality and provide comprehensive guides

**Testing Strategy**:
```typescript
// Unit Tests (80% coverage)
describe('LLMRouter', () => {
  it('should route simple task to Gemini', async () => {
    const request = { prompt: 'what is 2+2?', complexity: 'LOW' };
    const response = await router.route(request);
    expect(response.model).toContain('gemini');
  });

  it('should enforce budget limit', async () => {
    const request = { prompt: 'complex', complexity: 'HIGH' };
    costTracker.setBudget(0.001);  // $0.001 budget
    const response = await router.route(request);
    expect(response).toHaveProperty('error');
  });
});

// Integration Tests
describe('End-to-End: Code Review', () => {
  it('should review code and apply suggestions', async () => {
    // 1. User reviews code
    // 2. Gets feedback
    // 3. Applies changes
    // 4. Verifies file modified
  });
});

// E2E Tests (VSCode UI)
describe('VSCode Integration', () => {
  it('should show cost meter in status bar', async () => {
    // Launch extension
    // Check status bar
    // Verify cost displayed
  });
});
```

**Documentation**:
```markdown
# VSCode Extension Documentation

## User Guide
- Installation
- Getting started
- Command reference
- Settings & customization
- Keyboard shortcuts
- FAQ

## Developer Guide
- Architecture overview
- Adding new commands
- Custom model setup
- Building locally
- Debugging

## API Reference
- LLMRouter
- FileManager
- NLPProcessor
- OCREngine
- CostTracker
```

**Success Criteria**:
- ✅ 80%+ test coverage
- ✅ Zero known bugs
- ✅ Comprehensive documentation
- ✅ All commands tested

---

### Phase 8J: Packaging & Release (Week 6)
**Goal**: Create distributable VSIX file

**Steps**:
```bash
# 1. Install dependencies
cd domains/vscode-extension
pnpm install

# 2. Compile TypeScript
pnpm run compile

# 3. Package VSIX
pnpm run package
# → Creates: openrouter-crew-1.0.0.vsix (5-10 MB)

# 4. Test VSIX
code --install-extension openrouter-crew-1.0.0.vsix

# 5. Publish (optional)
vsce publish
```

**Distribution**:
- ✅ VSIX file (for manual installation)
- ✅ VS Marketplace listing (long-term)
- ✅ GitHub releases
- ✅ Internal distribution

**Version**: 1.0.0
- Semver versioning (1.MINOR.PATCH)
- Update with each release
- Document in CHANGELOG.md

**Success Criteria**:
- ✅ VSIX builds without errors
- ✅ Extension loads in VSCode
- ✅ All features work
- ✅ Ready for production

---

## Phase 8 Timeline

```
Week 1:    Phase 8A (Domain Migration)
Week 1-2:  Phase 8B (LLM Router)
Week 2:    Phase 8C (NLP Intent Detection)
Week 2-3:  Phase 8D (OCR Processing)
Week 3:    Phase 8E (File Management)
Week 4:    Phase 8F (Commands) + Phase 8G (Cost Tracking)
Week 5:    Phase 8H (UI) + Phase 8I (Testing)
Week 6:    Phase 8J (Packaging & Release)
```

**Total**: 6 weeks, 1-2 engineers

---

## Success Criteria: Phase 8 Complete

**Technical**:
- ✅ Extension as independent domain
- ✅ All services implemented
- ✅ 80%+ test coverage
- ✅ Zero TypeScript errors
- ✅ Builds successfully

**Feature Complete**:
- ✅ 10+ commands working
- ✅ Cost optimization functional
- ✅ NLP routing accurate
- ✅ File manipulation working
- ✅ OCR processing working

**Quality**:
- ✅ < 2s response time
- ✅ 99%+ uptime (local)
- ✅ Graceful error handling
- ✅ Comprehensive documentation

**Deployment**:
- ✅ VSIX packaged
- ✅ Ready for distribution
- ✅ Installation guide
- ✅ Support documentation

---

## Deliverables by Phase

| Phase | Deliverable | Files | Size |
|-------|-------------|-------|------|
| 8A | Domain structure | 35+ | - |
| 8B | LLM Router service | 500 LOC | - |
| 8C | NLP Processor | 400 LOC | - |
| 8D | OCR Engine | 300 LOC | - |
| 8E | File Manager | 600 LOC | - |
| 8F | Command implementations | 1200 LOC | - |
| 8G | Cost tracking | 400 LOC | - |
| 8H | Webview UI | 800 LOC + HTML/CSS | - |
| 8I | Tests & docs | 1500 LOC + markdown | - |
| 8J | VSIX package | 1 file | 5-10 MB |
| **Total** | **Complete extension** | **5000+ LOC** | **~5-10 MB** |

---

## Cost of Implementation

### Development Cost
- **Time**: 4-6 weeks (200-240 hours)
- **Engineers**: 1-2
- **Model**: Claude Sonnet
- **Estimated tokens**: ~100K
- **Estimated cost**: ~$1-2

### Return on Investment (Monthly)
- **Cost savings**: $500-1000 (vs Copilot)
- **Productivity gains**: 50+ hours
- **ROI**: 250x-500x per month

---

## Next: Start Phase 8A

Ready to begin Phase 8A - Domain Migration?

**Phase 8A Tasks**:
1. Create domains/vscode-extension/ directory structure
2. Move extension code from alex-ai-universal
3. Update all imports and dependencies
4. Register in pnpm-workspace.yaml
5. Verify builds successfully

**Estimated completion**: ~2 hours

---

**Plan Status**: Ready for Implementation ✅
**Next Step**: Approve Phase 8A to begin
**Date**: 2026-02-03
