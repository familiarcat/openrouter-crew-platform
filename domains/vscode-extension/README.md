# VSCode Extension Domain

**Status**: Phase 8A - Domain Migration Complete ✅
**Version**: 1.0.0
**Role**: AI-powered IDE hub for the OpenRouter Crew Platform

---

## Overview

The VSCode extension is now a first-class domain providing seamless IDE integration for the entire platform. It serves as the **AI assistance hub** connecting:

- **Alex-AI-Universal**: Cost optimization & crew coordination
- **Product Factory**: Project management & planning
- **Shared Services**: Crew members, cost tracking, schemas

---

## Architecture

```
domains/vscode-extension/
├── src/
│   ├── extension.ts             # Main entry point
│   │
│   ├── commands/                # Command implementations
│   │   ├── index.ts             # Command registration
│   │   ├── ask.ts               # Ask command
│   │   ├── review.ts            # Code review
│   │   ├── explain.ts           # Explain code
│   │   ├── generate.ts          # Generate code
│   │   ├── refactor.ts          # Refactor code
│   │   └── ...                  # More commands (coming Phase 8F)
│   │
│   ├── services/                # Core services (Phase 8B-8G)
│   │   ├── llm-router.ts        # Routes to optimal model
│   │   ├── nlp-processor.ts     # Intent detection
│   │   ├── ocr-engine.ts        # Image processing
│   │   ├── file-manager.ts      # Code manipulation
│   │   ├── context-builder.ts   # Build code context
│   │   └── cost-tracker.ts      # Cost tracking
│   │
│   ├── providers/               # VSCode API integration
│   │   ├── tree-view.ts
│   │   ├── hover.ts
│   │   ├── completion.ts
│   │   └── diagnostics.ts
│   │
│   ├── ui/                      # UI components (Phase 8H)
│   │   ├── chat-panel.ts
│   │   ├── cost-meter.ts
│   │   └── tree-views.ts
│   │
│   ├── storage/                 # Local persistence
│   │   ├── history.ts
│   │   ├── cache.ts
│   │   └── settings.ts
│   │
│   └── utils/
│       ├── logging.ts
│       ├── formatting.ts
│       └── validators.ts
│
├── webview/                     # HTML/CSS/JS for panels
│   ├── chat.html
│   ├── chat.css
│   └── chat.js
│
├── tests/                       # Test suite (Phase 8I)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── extension.json               # Extension manifest
├── SETUP.md                     # Setup guide
└── README.md                    # This file
```

---

## Key Features (Implemented/Planned)

### Phase 8A: Domain Migration ✅
- ✅ Created as independent domain
- ✅ Moved from alex-ai-universal
- ✅ Updated workspace configuration
- ✅ Ready for core service development

### Phase 8B-8G: Core Services 📋
- LLM Router - Cost-optimized model selection
- NLP Processor - Intent detection from prompts
- OCR Engine - Extract code from images
- File Manager - Advanced code manipulation
- Context Builder - Build rich code context
- Cost Tracker - Real-time budget enforcement

### Phase 8H: UI & Webviews 📋
- Chat panel with markdown support
- Real-time cost meter in status bar
- Tree views for crew, cost, projects
- Webview integration

### Phase 8I-J: Testing & Release 📋
- 80%+ test coverage
- Comprehensive documentation
- VSIX packaging for distribution

---

## Development Setup

### Prerequisites
```bash
# Node.js 18+
node --version

# pnpm 8+
pnpm --version

# VSCode 1.85+
```

### Installation
```bash
# Install dependencies
pnpm install

# Build extension
pnpm --filter "@openrouter-crew/vscode-extension" build

# Watch mode
pnpm --filter "@openrouter-crew/vscode-extension" dev

# Package VSIX
pnpm --filter "@openrouter-crew/vscode-extension" package
```

### Testing Locally
```bash
# In VSCode, press F5 to start debugger
# Or:
code --extensionDevelopmentPath=domains/vscode-extension
```

---

## Available Commands

### Current (Phase 8A)
- `openrouter-crew.crew.roster` - Show crew members
- `openrouter-crew.crew.consult` - Consult crew member
- `openrouter-crew.project.create` - Create project
- `openrouter-crew.cost.report` - Show cost report
- `openrouter-crew.cost.optimize` - Optimize costs

### Coming (Phase 8F)
- `openrouter-crew.ask` - Ask AI anything
- `openrouter-crew.review` - Code review
- `openrouter-crew.explain` - Explain code
- `openrouter-crew.generate` - Generate code
- `openrouter-crew.refactor` - Refactor code
- `openrouter-crew.test` - Generate tests
- `openrouter-crew.document` - Generate docs
- `openrouter-crew.debug` - Debugging help
- `openrouter-crew.optimize` - Performance optimization

---

## Integration with Other Domains

### Alex-AI-Universal
```typescript
// LLM router integrates with cost optimizer
import { costOptimizer } from '@openrouter-crew/shared-cost-tracking';

class LLMRouter {
  async route(request: LLMRequest) {
    const estimate = await costOptimizer.estimate(request);
    // Select model based on cost/quality trade-off
  }
}
```

### Product Factory
```typescript
// Can create and manage projects from extension
import { projectService } from '@openrouter-crew/shared-schemas';

class ProjectCommands {
  async createProject(name: string) {
    return projectService.create(name);
  }
}
```

### Shared Services
```typescript
// Uses crew coordination and schemas
import { crewCoordinator } from '@openrouter-crew/shared-crew-coordination';
import { Database } from '@openrouter-crew/shared-schemas';
```

---

## Real-Time Cost Display

The extension shows a cost meter in the status bar:

```
💰 $12.50 / $100.00 (12%)  ← Click for details
```

**Color Coding**:
- 🟢 Green: < 75% of budget
- 🟡 Yellow: 75-90% of budget
- 🔴 Red: > 90% of budget

---

## Configuration

Users can configure the extension via VSCode settings:

```json
{
  "openrouter-crew.cliPath": "crew",
  "openrouter-crew.budgetLimit": 100,
  "openrouter-crew.refreshInterval": 5000,
  "openrouter-crew.supabaseUrl": "...",
  "openrouter-crew.n8nUrl": "..."
}
```

---

## Roadmap

### Phase 8 Timeline
- **Week 1**: Domain Migration (✅ DONE)
- **Week 1-2**: LLM Router implementation
- **Week 2**: NLP Intent Detection
- **Week 2-3**: OCR Processing
- **Week 3**: File Manipulation
- **Week 4**: Commands + Cost Tracking
- **Week 5**: UI & Webviews
- **Week 5-6**: Testing, Docs, Packaging

### Success Metrics
- 80%+ test coverage
- < 2s response time for queries
- 99%+ cost optimization vs Copilot
- Zero TypeScript errors
- VSIX packaging complete

---

## Contributing

This is an active domain under Phase 8 development. To contribute:

1. Create feature branch: `git checkout -b extension/feature-name`
2. Implement in Phase 8 sub-phases
3. Maintain 80%+ test coverage
4. Update documentation
5. Submit PR to release branch

---

## References

- [Phase 8 Implementation Plan](../../PHASE_8_IMPLEMENTATION_PLAN.md)
- [VSCode Extension Architecture](../../docs/VSCODE_EXTENSION_ARCHITECTURE.md)
- [Extension Features Implementation](../../docs/EXTENSION_FEATURES_IMPLEMENTATION.md)
- [Setup Guide](SETUP.md)

---

## Support

For issues or questions about the extension domain:

1. Check the [SETUP.md](SETUP.md) guide
2. Review the [Phase 8 Implementation Plan](../../PHASE_8_IMPLEMENTATION_PLAN.md)
3. See [Extension Architecture docs](../../docs/VSCODE_EXTENSION_ARCHITECTURE.md)

---

**Status**: Phase 8A Complete - Ready for Phase 8B
**Last Updated**: 2026-02-03
**Version**: 1.0.0
