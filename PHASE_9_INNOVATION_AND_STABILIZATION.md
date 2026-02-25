# Phase 9: Innovation Expansion & Stabilization

**Plan Date**: February 2026
**Status**: Planning / Ready for Implementation
**Pre-requisite**: Phase 8 (Partial/Complete)

---

## 1. Overview

This phase addresses the successful **innovations** discovered during Phase 8 (specifically the Agent Network/Central Mind architecture) and corrects **deviations** where implementation drifted from the original plan (e.g., Regex-based parsing vs AST). It serves as the roadmap for maturing the VSCode extension into a fully autonomous "Agentic IDE".

---

## 2. Current State Analysis (Gemini Context)

### 2.1 Innovations (To Expand)

**Agent Network Service (`src/services/agent-network.ts`)**
- **Concept**: A "Central Mind" orchestration layer replacing static workflows.
- **Current State**: Implemented with `CrewAgent` class and hardcoded tool definitions.
- **Innovation**: Recursive delegation and dynamic tool usage.
- **Next Step**: Formalize tool registry and add memory persistence via Supabase.

**Terminal Manager (`src/services/terminal-manager.ts`)**
- **Concept**: Safe execution of shell commands with user confirmation.
- **Current State**: Implemented with modal safety checks.
- **Next Step**: Integrate deeply with Agent Network for autonomous debugging loops.

### 2.2 Deviations (To Fix)

**File Manager Parsing (`src/services/file-manager.ts`)**
- **Plan**: Use TypeScript Compiler / AST.
- **Actual**: Uses Regex patterns.
- **Impact**: Less robust for complex refactoring; prone to syntax errors.
- **Fix**: Migrate to `typescript` or `tree-sitter` in Phase 9C.

**LLM Router Wiring (`src/services/llm-router.ts`)**
- **Plan**: Full integration with `CostTracker`.
- **Actual**: Partial wiring; `checkBudget` contains placeholder logic.
- **Fix**: Complete dependency injection and strict enforcement in Phase 9A.

---

## 3. Phase 9 Breakdown

### Phase 9A: Core Stabilization (Immediate)
**Goal**: Ensure the foundation is solid before expanding.

1.  **Wire Cost Tracker**:
    -   Update `LLMRouter` to accept `CostTracker` in constructor.
    -   Implement `checkBudget` to query `CostTracker` and throw errors if limits exceeded.
2.  **Complete Webview UI (Phase 8H)**:
    -   Implement the React-based chat panel to replace `showInputBox`.
    -   Establish message passing between Webview and `CommandExecutor`.
3.  **Integration Tests**:
    -   Verify the full loop: Command -> Router -> Agent -> Response.

### Phase 9B: Agent Network "Central Mind"
**Goal**: Elevate the Agent Network to a primary feature.

1.  **Modular Tool Registry**:
    -   Extract tools (e.g., `gitCommit`, `runTests`) from `agent-network.ts` into `src/tools/`.
    -   Create a `ToolRegistry` service to dynamically load tools based on Agent Profile.
2.  **Memory Integration**:
    -   Connect `CrewAPIService` (RAG) to `CrewAgent` context.
    -   Allow agents to read/write memories to Supabase during execution.
3.  **Autonomous Loops**:
    -   Implement "Plan -> Act -> Observe -> Correct" loops for complex tasks (e.g., "Fix this failing test").

### Phase 9C: Robust AST Analysis
**Goal**: Replace Regex heuristics with true code understanding.

1.  **AST Migration**:
    -   Integrate `typescript` compiler API for JS/TS files.
    -   Use `web-tree-sitter` for other languages (Python, Go, Rust).
2.  **Semantic Refactoring**:
    -   Implement `findReferences` and `renameSymbol` using AST.
    -   Ensure refactoring operations are syntax-safe.

---

## 4. Development Prompts for Gemini

Use these prompts to guide future development sessions:

### For Stabilization (Phase 9A)
> "Update `LLMRouter` in `src/services/llm-router.ts` to correctly integrate `CostTracker`. Implement the `checkBudget` method to enforce daily limits before routing requests. Ensure `CommandExecutor` passes the tracker correctly."

### For UI Implementation (Phase 9A/8H)
> "Scaffold the Webview UI for the VSCode extension. Create `src/ui/ChatPanel.ts` and the corresponding React components in `webview/`. Implement the message passing protocol to send prompts from the UI to `CommandExecutor`."

### For Agent Network (Phase 9B)
> "Refactor `AgentNetworkService`. Extract the hardcoded tools in `performWork` into a separate `ToolRegistry` class. Create a `GitTool` class that implements the `AgentTool` interface."

### For AST Migration (Phase 9C)
> "Refactor `FileManager` to use the TypeScript Compiler API for `analyzeFile` instead of Regex. Implement a `getAST` method that returns the source file object."

---

## 5. Success Criteria

- [ ] **Zero Regex Parsing** for TypeScript/JavaScript files.
- [ ] **Strict Budget Enforcement** active in `LLMRouter`.
- [ ] **Rich Chat UI** replacing input boxes.
- [ ] **Modular Agents** capable of loading tools dynamically.