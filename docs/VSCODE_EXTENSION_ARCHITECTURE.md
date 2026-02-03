# VSCode Extension Architecture & Enhancement Plan

**Document Date**: February 3, 2026
**Status**: Design Phase
**Proposed Implementation**: Q1 2026

---

## Executive Summary

The VSCode extension currently exists as a sub-component within `domains/alex-ai-universal/vscode-extension/`. This document proposes elevating it to its own domain while maintaining tight integration with alex-ai-universal's cost optimization and crew coordination systems.

**Key Goal**: Make VSCode extension the primary interface for AI-powered code assistance with optimized OpenRouter calls, eliminating the need for other code assistants.

---

## Current State vs. Proposed State

### Current Architecture

```
domains/alex-ai-universal/
└── vscode-extension/           ← Sub-component
    ├── src/
    ├── package.json
    └── SETUP.md
```

**Limitations**:
- Coupled with alex-ai-universal domain
- Limited ability to share code with other domains
- Can't evolve independently
- Unclear separation of concerns

### Proposed Architecture

```
domains/
├── vscode-extension/            ← NEW DOMAIN
│   ├── dashboard/               # Extension management UI
│   ├── core/                    # Extension core logic
│   ├── providers/               # VSCode API integration
│   ├── services/                # Service layer
│   │   ├── llm-router/          # Routes to alex-ai-universal
│   │   ├── file-manager/        # File manipulation
│   │   ├── ocr-engine/          # Image recognition
│   │   └── prompt-processor/    # NLP processing
│   ├── workflows/               # n8n integrations
│   ├── schema/                  # Database (extension settings, history)
│   └── README.md
│
├── alex-ai-universal/
│   ├── dashboard/               # Crew management
│   ├── cost-optimizer/          # Cost analysis
│   └── mcp-server/              # MCP server
│
└── shared/
    └── llm-router/              # SHARED: Model routing logic
```

**Benefits**:
- Clear separation of concerns
- Can be built/deployed independently
- Shared logic with alex-ai-universal
- Better code reuse
- Evolution flexibility

---

## Design: VSCode Extension as a Domain

### 1. Extension Core Architecture

```
domains/vscode-extension/
├── src/
│   ├── extension.ts             # Extension entry point
│   ├── index.ts                 # Exports
│   │
│   ├── providers/               # VSCode API providers
│   │   ├── commands/            # Command implementations
│   │   │   ├── ask.ts          # Ask LLM command
│   │   │   ├── review.ts       # Code review command
│   │   │   ├── explain.ts      # Explain code command
│   │   │   ├── generate.ts     # Generate code command
│   │   │   └── refactor.ts     # Refactor command
│   │   │
│   │   ├── ui/                 # UI components
│   │   │   ├── chat-panel.ts   # Chat webview
│   │   │   ├── cost-meter.ts   # Real-time cost display
│   │   │   ├── file-tree.ts    # File selector
│   │   │   └── settings.ts     # Extension settings UI
│   │   │
│   │   ├── languages/          # Language-specific
│   │   │   ├── typescript.ts   # TypeScript helpers
│   │   │   ├── python.ts       # Python helpers
│   │   │   └── markdown.ts     # Markdown helpers
│   │   │
│   │   └── hover.ts            # Hover tooltip provider
│   │
│   ├── services/               # Business logic layer
│   │   ├── llm-router.ts       # Routes prompts to alex-ai-universal
│   │   ├── file-manager.ts     # File I/O and AST manipulation
│   │   ├── ocr-engine.ts       # Image-to-text processing
│   │   ├── prompt-processor.ts # NLP preprocessing
│   │   ├── context-builder.ts  # Builds rich context from files
│   │   └── cost-tracker.ts     # Local cost tracking
│   │
│   ├── storage/                # Local extension storage
│   │   ├── history.ts          # Conversation history
│   │   ├── cache.ts            # Response caching
│   │   └── settings.ts         # User preferences
│   │
│   └── utils/                  # Utilities
│       ├── logging.ts          # Debug logging
│       ├── formatting.ts       # Text formatting
│       └── validators.ts       # Input validation
│
├── package.json
├── tsconfig.json
├── .vscodeignore
├── extension.json              # VSCode manifest
└── README.md
```

### 2. Key Integration: LLM Router Service

The `llm-router.ts` service is the bridge between extension and alex-ai-universal:

```typescript
// domains/vscode-extension/src/services/llm-router.ts

interface PromptRequest {
  prompt: string;
  files?: FileContext[];
  images?: ImageContext[];
  language?: string;
  context?: CodeContext;
}

interface PromptResponse {
  content: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  cached: boolean;
}

class LLMRouter {
  /**
   * Route prompt through optimization pipeline
   * 1. Cost estimation
   * 2. Model selection (Claude vs OpenRouter)
   * 3. Execution with budget check
   * 4. Response processing
   */
  async route(request: PromptRequest): Promise<PromptResponse> {
    // Step 1: Analyze prompt complexity
    const complexity = this.analyzePrompt(request.prompt);

    // Step 2: Get file context via AST parsing
    const enhancedContext = await this.buildContext(request);

    // Step 3: Call alex-ai-universal cost optimizer
    const costEstimate = await this.estimateCost({
      complexity,
      contextSize: enhancedContext.size,
      hasImages: !!request.images,
    });

    // Step 4: Check budget
    if (!await this.checkBudget(costEstimate)) {
      return this.suggestAlternatives(request);
    }

    // Step 5: Route to optimal provider
    const response = await this.executeOptimized(
      request,
      enhancedContext,
      costEstimate
    );

    // Step 6: Cache result
    await this.cache(request, response);

    // Step 7: Track cost
    await this.trackCost(response.costUSD);

    return response;
  }
}
```

### 3. File Manipulation Capabilities

Like a proper code assistant, the extension can:

```typescript
// domains/vscode-extension/src/services/file-manager.ts

class FileManager {
  /**
   * Read files with syntax highlighting awareness
   */
  async readFile(path: string): Promise<FileContent>;

  /**
   * Write files with formatting
   */
  async writeFile(path: string, content: string): Promise<void>;

  /**
   * Create files from templates
   */
  async createFile(path: string, template: string): Promise<void>;

  /**
   * Delete files with confirmation
   */
  async deleteFile(path: string): Promise<void>;

  /**
   * Refactor - rename identifiers across project
   */
  async refactorIdentifier(
    oldName: string,
    newName: string,
    scope: string
  ): Promise<FileChange[]>;

  /**
   * Apply diff patches (for AI-generated code)
   */
  async applyPatch(filePath: string, patch: string): Promise<void>;

  /**
   * Parse AST (TypeScript, JavaScript, Python, etc.)
   */
  async parseAST(filePath: string): Promise<ASTNode>;

  /**
   * Find usage of identifier across codebase
   */
  async findUsages(identifier: string): Promise<UsageLocation[]>;

  /**
   * Get file structure (tree of definitions)
   */
  async getFileStructure(filePath: string): Promise<Definition[]>;
}
```

### 4. OCR Capabilities

Enable image-to-context processing:

```typescript
// domains/vscode-extension/src/services/ocr-engine.ts

class OCREngine {
  /**
   * Extract text from pasted images
   * Useful for: screenshots, diagrams, wireframes, error messages
   */
  async recognizeText(image: ImageData): Promise<string>;

  /**
   * Recognize code snippets from images
   */
  async recognizeCode(image: ImageData): Promise<{
    language: string;
    code: string;
    confidence: number;
  }>;

  /**
   * Parse diagrams (architecture, flow, ER)
   */
  async parseDiagram(image: ImageData): Promise<{
    type: string;  // flowchart, sequence, er, architecture
    description: string;
    elements: DiagramElement[];
  }>;

  /**
   * Extract handwritten notes
   */
  async recognizeHandwriting(image: ImageData): Promise<string>;
}
```

### 5. Prompt Processing Pipeline

Natural language processing for better understanding:

```typescript
// domains/vscode-extension/src/services/prompt-processor.ts

class PromptProcessor {
  /**
   * Process user prompt through NLP pipeline
   * 1. Intent detection (ask, code, review, refactor)
   * 2. Entity extraction (files, variables, functions)
   * 3. Context enrichment (adds file info automatically)
   * 4. Complexity analysis (determines model selection)
   */
  async process(rawPrompt: string): Promise<ProcessedPrompt>;

  /**
   * Detect user intent from prompt
   */
  async detectIntent(prompt: string): Promise<Intent>;

  /**
   * Extract mentioned entities (files, variables, etc.)
   */
  async extractEntities(prompt: string): Promise<Entity[]>;

  /**
   * Auto-select relevant files based on prompt
   */
  async selectRelevantFiles(prompt: string): Promise<FilePath[]>;
}
```

---

## Enhanced Commands

### Core Commands (Available in Command Palette)

```
openrouter-crew.ask
  └─ Ask AI anything (with file context)

openrouter-crew.code-review
  └─ Review selected code with AI feedback

openrouter-crew.explain
  └─ Explain selected code/file

openrouter-crew.generate
  └─ Generate code from description

openrouter-crew.refactor
  └─ Refactor selected code

openrouter-crew.test
  └─ Generate tests for selected code

openrouter-crew.document
  └─ Generate documentation

openrouter-crew.debug
  └─ Help debug issue with context
```

### Context-Aware Commands

Triggered by selection or hover:

```
openrouter-crew.hover-explain
  └─ When hovering: Show AI explanation
  └─ Triggered automatically on hover

openrouter-crew.selection-review
  └─ When selecting code block: Review button
  └─ Shows issues and improvements

openrouter-crew.quick-fix
  └─ When on error: AI-powered quick fix
  └─ Better than IDE's built-in quick fixes
```

---

## Cost Optimization: Zero-Markup OpenRouter Calls

Unlike Copilot or Claude VSCode extension (both add markup on costs), the integrated extension makes optimized calls:

### Current Approach (Other Assistants)

```
User Prompt → Service Backend → OpenRouter API
                    ↓
              +15-50% markup
              +Rate limiting
              +Privacy concerns
```

**Problems**:
- You're paying 15-50% markup
- Your prompts go through third-party servers
- Limited to their model selection
- No cost optimization

### Our Approach (Integrated Extension)

```
User Prompt
  ↓
[Local Processing]
  • Intent detection (free)
  • Entity extraction (free)
  • Auto file selection (free)
  • Context building (free)
  ↓
Cost Estimation (alex-ai-universal)
  • Complexity analysis
  • Model comparison
  • Budget check
  • Savings calculation
  ↓
[Decision]
  • Use Claude? → OpenRouter
  • Use Gemini? → 99% cheaper
  • Wait? → Cache hit (free)
  ↓
[Execution with Budget]
  • Direct OpenRouter call
  • Zero markup
  • Cost tracking
  ↓
[Response]
  • Instant display in editor
  • Cost shown: $0.002
  • Cached for reuse
```

### Pricing Comparison

| Task | Copilot | Claude VSCode | Our Extension |
|------|---------|--------------|---------------|
| Simple Prompt | $0.05-0.10 | $0.03-0.08 | $0.0001 (Gemini) |
| Code Review (500 lines) | $0.20 | $0.12-0.15 | $0.002 (Gemini) |
| Generate Function | $0.15 | $0.10 | $0.003 (Gemini) |
| Complex Refactor | $0.50 | $0.30 | $0.01 (Claude*) |
| **Monthly Average** | **$50-100** | **$30-60** | **~$2-5** |

*Only uses Claude when complexity warrants; otherwise Gemini

---

## Data Flow: Extension → Alex-AI-Universal → OpenRouter

```
┌─────────────────────────────────────────────────────────────┐
│ VSCode Extension (New Domain)                               │
├─────────────────────────────────────────────────────────────┤
│ Chat Panel + File Tree + Cost Meter + Settings              │
│                                                             │
│ Commands: Ask, Review, Explain, Generate, Refactor...      │
└────────────────┬────────────────────────────────────────────┘
                 │ User Prompt + File Context + Images
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Local Processing (Extension Service Layer)                  │
├─────────────────────────────────────────────────────────────┤
│ • Intent Detection (NLP)                                     │
│ • Entity Extraction (AST)                                    │
│ • File Context Building                                      │
│ • Complexity Analysis                                        │
│ • OCR for images → text                                      │
└────────────────┬────────────────────────────────────────────┘
                 │ Enhanced Request + Context
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Alex-AI-Universal Domain (Cost Optimization)               │
├─────────────────────────────────────────────────────────────┤
│ Cost Estimator:                                              │
│ • Estimate with Claude Sonnet: $0.15                        │
│ • Estimate with OpenRouter Gemini: $0.0001                  │
│ • Estimate with OpenRouter GPT-4: $0.08                     │
│                                                             │
│ Model Selector:                                              │
│ • Simple task → Gemini Flash (99% cheaper)                  │
│ • Complex task → Claude Sonnet (best quality)               │
│ • Code review → GPT-4 (better at code)                      │
│                                                             │
│ Budget Enforcer:                                             │
│ • Check remaining budget for project                         │
│ • Reject if over limit                                       │
│ • Suggest cheaper alternatives                              │
└────────────────┬────────────────────────────────────────────┘
                 │ Selected Model + Route Decision
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ N8N Workflow (Orchestration)                                │
├─────────────────────────────────────────────────────────────┤
│ • Execute via selected provider                              │
│ • Apply retries with exponential backoff                     │
│ • Cache response for future use                              │
│ • Record actual cost vs estimate                             │
└────────────────┬────────────────────────────────────────────┘
                 │ API Call with Optimization
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ OpenRouter API (Direct LLM Calls)                           │
├─────────────────────────────────────────────────────────────┤
│ Supported Models:                                             │
│ • Claude 3.5 Sonnet (Best quality)                           │
│ • Claude 3 Opus (Complex tasks)                              │
│ • Gemini Flash 1.5 (99% cheaper, fast)                       │
│ • GPT-4 Turbo (Code analysis)                                │
│ • More models available                                      │
└────────────────┬────────────────────────────────────────────┘
                 │ Response + Usage metrics
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ VSCode Extension (Display & Tracking)                       │
├─────────────────────────────────────────────────────────────┤
│ • Display response in editor                                 │
│ • Show: Model + Cost + Time                                  │
│ • Update Cost Meter: $X used of $Budget                      │
│ • Cache for next similar query                               │
│ • Log to project cost tracking                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Domain Migration (Week 1-2)
- Move vscode-extension to its own domain
- Implement shared LLM router with alex-ai-universal
- Basic file management capabilities
- Cost meter integration

### Phase 2: NLP & OCR (Week 3-4)
- Intent detection from prompts
- Entity extraction (files, variables, functions)
- Image OCR capability
- Automatic file selection

### Phase 3: Advanced Commands (Week 5-6)
- Code review command with detailed feedback
- Code generation from descriptions
- Refactor with cross-file changes
- Test generation

### Phase 4: Caching & Learning (Week 7-8)
- Response caching for identical/similar prompts
- Learning from past queries
- Personalized suggestions
- Cost analytics per developer

---

## Configuration & Settings

Users can customize the extension through:

```json
// .vscode/settings.json
{
  "openrouter-crew.provider": "openrouter",  // or "claude"
  "openrouter-crew.model.simple": "gemini-flash-1.5",
  "openrouter-crew.model.complex": "claude-3-5-sonnet",
  "openrouter-crew.budget.monthly": 50,
  "openrouter-crew.costThreshold": 0.01,  // Alert if single call > $0.01
  "openrouter-crew.autoSelectFiles": true,
  "openrouter-crew.enableOCR": true,
  "openrouter-crew.enableCaching": true,
  "openrouter-crew.cacheExpiry": 86400,  // 24 hours
  "openrouter-crew.logLevel": "info"
}
```

---

## Success Metrics

After implementation:

1. **Cost Reduction**: 90% cheaper than Copilot or Claude VSCode
2. **Feature Parity**: All features of commercial extensions
3. **Integration**: Seamless with Product Factory for project management
4. **Adoption**: Used by 100% of developers on the team
5. **Productivity**: 25-30% faster development (measured in commits/day)
6. **Reliability**: 99.9% uptime for extension
7. **Privacy**: Zero prompts sent to third parties

---

## Security & Privacy

The integrated extension has strong privacy guarantees:

- ✅ All file reading is local (no uploads)
- ✅ Prompts sent only to OpenRouter (not through third parties)
- ✅ Prompts can be encrypted with user's API key
- ✅ No telemetry collected (unlike Copilot)
- ✅ Cost tracking is local and/or in user's own Supabase
- ✅ Images are processed locally (OCR), not sent to LLMs unless needed

---

## Repository Structure After Implementation

```
domains/
├── vscode-extension/           ← NEW: Extension as domain
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── alex-ai-universal/
│   ├── core/                   # Moved here: cost-optimizer, mcp-server
│   ├── dashboard/
│   └── README.md
│
├── product-factory/
│   ├── dashboard/
│   └── project-templates/
│
└── shared/
    ├── crew-coordination/
    ├── cost-tracking/
    └── llm-router/            ← NEW: Shared routing logic
```

---

## Next Steps

1. **Architecture Review**: Get team approval
2. **Domain Migration**: Create `domains/vscode-extension/`
3. **Shared Logic Extraction**: Identify code to share with alex-ai-universal
4. **Prototype Build**: Implement Phase 1 (domain migration)
5. **Testing**: Verify cost optimization works end-to-end
6. **Team Rollout**: Train developers on new capabilities

---

**Document Status**: Architecture Design
**Next Review**: February 10, 2026
**Implementation Start**: February 17, 2026 (tentative)
