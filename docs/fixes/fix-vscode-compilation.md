<prompt_configuration>
  <model_preference>anthropic/claude-3.5-sonnet</model_preference>
  <temperature>0.1</temperature>
</prompt_configuration>

<system_role>
You are a **TypeScript Compiler Expert** and **VSCode Extension Developer**.
Your goal is to fix a broken build in the `vscode-extension` domain.
You understand strict type checking, namespace vs. type usage, and VSCode API constraints.
</system_role>

<context>
The command `pnpm compile` is failing for `@openrouter-crew/vscode-extension`.

**Error Summary:**
1. **Namespace as Type**: `TS2709: Cannot use namespace 'LLMUsageEvent' as a type` (and `CrewAPIClient`, `AuthContext`).
   - Occurs in `shared/cost-tracking` imports and `services/crew-api-service.ts`.
2. **Access Violation**: `TS2341: Property 'performWork' is private` in `src/tools/analysis.ts`.
3. **Type Mismatch**: `TS2339: Property 'match' does not exist on type 'AgentExecutionResult'` in `src/tools/analysis.ts`.
4. **Platform Mismatch**: `TS2769: clearInterval` overload mismatch in `src/ui/CodebaseAnalysisWebview.ts`.
5. **Missing Property**: `TS2339: Property 'language' does not exist` in `src/services/ocr-engine.ts`.
</context>

<task>
Apply fixes to the following files to resolve all TypeScript errors.
</task>

<execution_plan>

### 1. Fix Configuration (Root Cause for Shared Types)
**File**: `domains/vscode-extension/tsconfig.json`
- **Action**: Add `"skipLibCheck": true` to `compilerOptions`.
- **Reason**: This often resolves namespace/type conflicts when consuming workspace packages that might map to source files instead of declarations.

### 2. Fix `src/tools/analysis.ts`
- **Issue**: `agent.performWork(...)` is private.
- **Fix**: Check `CrewAgent` class. If `performWork` is intended for external use, make it `public`. Otherwise, use the public entry point (e.g., `executeTask`).
- **Issue**: `generatedContent.match(...)` fails.
- **Fix**: `performWork` returns an object (`AgentExecutionResult`). Extract the text content before matching:
  ```typescript
  const result = await agent.performWork(...);
  const content = typeof result === 'string' ? result : result.output || result.content;
  const match = content.match(...);
  ```

### 3. Fix `src/services/crew-api-service.ts`
- **Issue**: `Cannot use namespace 'CrewAPIClient' as a type`.
- **Fix**: Verify import. If imported as `import * as CrewAPIClient`, change to `import { CrewAPIClient }`.
  - If `CrewAPIClient` is a value/namespace only, find the corresponding interface (e.g., `CrewAPIClientType` or `InstanceType<typeof CrewAPIClient>`).

### 4. Fix `src/ui/CodebaseAnalysisWebview.ts`
- **Issue**: `clearInterval` timer type mismatch (Node vs DOM).
- **Fix**: Explicitly use `window.clearInterval(this.refreshInterval)` or cast the ID:
  ```typescript
  clearInterval(this.refreshInterval as unknown as number);
  ```

### 5. Fix `src/services/ocr-engine.ts`
- **Issue**: `detectedLanguage` property missing.
- **Fix**: Add a fallback or safe check: `(codeContext as any).language || ...` if the type definition is outdated.

</execution_plan>

<output_instructions>
1. Modify `domains/vscode-extension/tsconfig.json` first.
2. Apply code fixes to the TypeScript files listed.
3. Run `pnpm --filter @openrouter-crew/vscode-extension compile` to verify.
</output_instructions>