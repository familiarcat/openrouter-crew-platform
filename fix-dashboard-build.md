<prompt_configuration>
  <model_preference>anthropic/claude-3-opus</model_preference>
  <temperature>0.2</temperature>
</prompt_configuration>

<system_role>
You are a **Principal Software Architect** specializing in **Next.js** and **Domain-Driven Design (DDD)**.
You are responsible for enforcing strict boundary separation between domains in a monorepo.
</system_role>

<context>
The `alex-ai-universal` dashboard is failing to build. This dashboard was migrated from a legacy structure, and the import paths have not been fully updated to reflect the new DDD architecture.

**Location**: `domains/alex-ai-universal/dashboard`

**Errors**:
1. `Module not found: Can't resolve '../../../../types/constructor'`
2. `Module not found: Can't resolve '@/scripts/utils/unified-service-accessor'`

**Files to Fix**:
- `app/api/events/route.ts`
- `app/api/mcp/crew/roster/route.ts`
- `app/api/mcp/settings/test/route.ts`
- `app/api/mcp/workflows/executions/route.ts`
- `app/api/mcp/workflows/storage/route.ts`
</context>

<task>
Refactor the import paths in the Alex AI Dashboard to align with the Monorepo structure.
</task>

<constraints>
1. **No Relative Climbing**: Do not use deep relative paths (e.g., `../../../../`).
2. **Shared Libraries**: Import shared logic from `@openrouter-crew/shared-*` or `@openrouter-crew/crew-api-client`.
3. **Local Aliases**: Ensure `tsconfig.json` in the dashboard directory correctly maps `@/` to `./src/` or `./`.
4. **Type Safety**: If `types/constructor` is missing, check `domains/shared/schemas` or infer the type definition and create a local declaration if it's domain-specific.
</constraints>

<execution_plan>
1. **Config Audit**: Inspect `domains/alex-ai-universal/dashboard/tsconfig.json`. Ensure `compilerOptions.paths` is configured.
2. **Dependency Check**:
   - Replace references to `unified-service-accessor` with the standard `UnifiedAIRouter` or `CrewAPIClient` from `domains/shared/`.
3. **Refactor Imports**:
   - **Before**: `import { ... } from '../../../../types/constructor'`
   - **After**: `import { ... } from '@openrouter-crew/shared-schemas'` (or appropriate package).
4. **Fix Missing Files**: If a file is completely missing, stub it out with a TODO or implement a minimal version based on the `UnifiedAIRouter` interface.
</execution_plan>

<output_instructions>
1. Output the corrected `tsconfig.json` configuration.
2. Output the corrected code for the failing API routes.
3. Use **Unified Diff** format for all code blocks.
4. If referring to external project files (like the root `package.json`), assume standard Turborepo layout.
</output_instructions>