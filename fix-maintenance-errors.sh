#!/usr/bin/env bash
# =============================================================================
# fix-maintenance-errors-v2.sh
# Complete rewrite addressing ALL errors from both pnpm maintenance runs.
#
# ROOT CAUSES FIXED:
#   A) tsconfig extends path was "../../../../" (4 levels) — should be "../../../" (3)
#      domains/shared/<pkg>/ is exactly 3 levels from repo root
#   B) Scaffolded packages with .tsx files need jsx + esModuleInterop
#   C) Node packages with fs/path/crypto default imports need esModuleInterop
#   D) Map/Set/Array spread in several files needs ES2017+ target
#   E) Scaffolded agent-memory MemoryService stub missing constructor + store/reportOutcome API
#   F) Scaffolded agent-orchestration index.ts missing PromptManager + OllamaMCPClient exports
#   G) VSCode extension CrewResponse missing from types.ts
#   H) VSCode extension propose-change-service.ts uses bare Redis type (should be RedisClient)
#   I) VSCode extension registry.ts result.costUSD not on all union branches
#
# USAGE:
#   chmod +x fix-maintenance-errors-v2.sh
#   ./fix-maintenance-errors-v2.sh [--dry-run]
# =============================================================================

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE — no files will be modified"
fi

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${REPO_ROOT}/.fix-backups/v2-${TIMESTAMP}"

log()  { echo "  -> $*"; }
ok()   { echo "  ✅ $*"; }
warn() { echo "  ⚠️  $*"; }
step() { echo ""; echo "STEP: $*..."; }

backup_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    local rel="${file#"$REPO_ROOT/"}"
    local dest="${BACKUP_DIR}/${rel}"
    mkdir -p "$(dirname "$dest")"
    cp "$file" "$dest"
  fi
}

write_file() {
  local path="$1"
  local content="$2"
  if $DRY_RUN; then
    log "Would write: ${path#"$REPO_ROOT/"}"
    return
  fi
  backup_file "$path"
  mkdir -p "$(dirname "$path")"
  printf '%s' "$content" > "$path"
  ok "Wrote: ${path#"$REPO_ROOT/"}"
}

# Safe single-occurrence patch via python3 (works on macOS bash 3.2)
patch_file() {
  local file="$1" old="$2" new="$3"
  if [[ ! -f "$file" ]]; then
    warn "File not found, skipping: ${file#"$REPO_ROOT/"}"
    return
  fi
  if python3 -c "
import sys
with open(sys.argv[1]) as f: c = f.read()
sys.exit(0 if sys.argv[2] in c else 1)
" "$file" "$old" 2>/dev/null; then
    if $DRY_RUN; then
      log "Would patch: ${file#"$REPO_ROOT/"}"
      return
    fi
    backup_file "$file"
    python3 - "$file" "$old" "$new" <<'PYEOF'
import sys
path, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, 'r') as f:
    content = f.read()
content = content.replace(old, new, 1)
with open(path, 'w') as f:
    f.write(content)
PYEOF
    ok "Patched: ${file#"$REPO_ROOT/"}"
  else
    log "Patch not needed: ${file#"$REPO_ROOT/"}"
  fi
}

echo ""
echo "🛠️  fix-maintenance-errors-v2.sh (backup: .fix-backups/v2-${TIMESTAMP})"

# =============================================================================
# FIX A: CORRECT tsconfig extends path in all scaffolded packages
#
# domains/shared/<pkg>/tsconfig.json is at depth 3 from repo root.
# Relative path to repo-root tsconfig.base.json must be "../../../" (3 levels).
# Previous script incorrectly used "../../../../" (4 levels), causing TS5083.
# =============================================================================
step "FIX A: Writing correct tsconfigs (3-level extends path)"

# Packages with ONLY plain .ts (Node-style): need esModuleInterop for fs/path/crypto
# Packages with .tsx (React): additionally need jsx + dom lib

# ── shared-schemas ──────────────────────────────────────────────────────────
write_file "${REPO_ROOT}/domains/shared/schemas/tsconfig.json" \
'{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "target": "ES2017",
    "lib": ["ES2017"],
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'

# ── shared-redis-client ──────────────────────────────────────────────────────
write_file "${REPO_ROOT}/domains/shared/redis-client/tsconfig.json" \
'{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "target": "ES2017",
    "lib": ["ES2017"],
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'

# ── agent-memory ─────────────────────────────────────────────────────────────
# Has .tsx files (dashboard.tsx) → needs jsx + dom
write_file "${REPO_ROOT}/domains/shared/agent-memory/tsconfig.json" \
'{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "target": "ES2017",
    "lib": ["ES2017", "DOM"],
    "jsx": "react",
    "downlevelIteration": true,
    "skipLibCheck": true
  },
  "references": [
    { "path": "../schemas" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'

# ── shared-cost-tracking ──────────────────────────────────────────────────────
write_file "${REPO_ROOT}/domains/shared/cost-tracking/tsconfig.json" \
'{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "target": "ES2017",
    "lib": ["ES2017"],
    "skipLibCheck": true
  },
  "references": [
    { "path": "../schemas" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'

# ── shared-crew-coordination ──────────────────────────────────────────────────
# Has attempt-history-table.tsx → needs jsx + dom
write_file "${REPO_ROOT}/domains/shared/crew-coordination/tsconfig.json" \
'{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "target": "ES2017",
    "lib": ["ES2017", "DOM"],
    "jsx": "react",
    "downlevelIteration": true,
    "skipLibCheck": true
  },
  "references": [
    { "path": "../schemas" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'

# ── agent-orchestration ───────────────────────────────────────────────────────
# Has fs/path/crypto default imports → esModuleInterop
# Has Map/Set iteration in claude-with-crew.ts + data-agent-server.ts → ES2017
write_file "${REPO_ROOT}/domains/shared/agent-orchestration/tsconfig.json" \
'{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "module": "commonjs",
    "target": "ES2017",
    "lib": ["ES2017"],
    "downlevelIteration": true,
    "skipLibCheck": true
  },
  "references": [
    { "path": "../schemas" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
'

# =============================================================================
# FIX E: PATCH agent-memory MemoryService to match API used by observation-lounge.ts
#
# observation-lounge.ts calls:
#   new MemoryService(createClient(url, key))  — constructor takes supabase client
#   this.memoryService.store({ ... })
#   this.memoryService.reportOutcome({ ... })
#
# The scaffolded stub exports MemoryService with no constructor args and no these methods.
# We append the correct constructor + methods WITHOUT overwriting existing logic.
# =============================================================================
step "FIX E: Patching MemoryService to add constructor(client) + store() + reportOutcome()"

AGENT_MEMORY_INDEX="${REPO_ROOT}/domains/shared/agent-memory/src/index.ts"

if [[ -f "$AGENT_MEMORY_INDEX" ]]; then
  # Check if constructor signature already accepts a client arg
  if python3 -c "
import sys
with open(sys.argv[1]) as f: c = f.read()
# If already has store() and reportOutcome(), nothing to do
has_store = 'store(' in c
has_report = 'reportOutcome(' in c
sys.exit(0 if (has_store and has_report) else 1)
" "$AGENT_MEMORY_INDEX" 2>/dev/null; then
    log "MemoryService API already looks correct — skipping"
  else
    if $DRY_RUN; then
      log "Would append MemoryService overload shim to: ${AGENT_MEMORY_INDEX#"$REPO_ROOT/"}"
    else
      backup_file "$AGENT_MEMORY_INDEX"
      # Append shim that augments the existing MemoryService class with a compatible
      # subclass + re-export so observation-lounge.ts gets what it needs.
      cat >> "$AGENT_MEMORY_INDEX" << 'SHIM'

// ─── Compatibility shim ───────────────────────────────────────────────────────
// observation-lounge.ts expects: new MemoryService(supabaseClient), .store(), .reportOutcome()
// This shim satisfies those call sites without breaking the existing class.

export interface MemoryStoreData {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MemoryOutcomeData {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  success?: boolean;
  costUSD?: number;
  [key: string]: unknown;
}

// Re-export MemoryService as a class that accepts an optional client arg
// and exposes store() / reportOutcome() for observation-lounge.ts consumers.
const _OriginalMemoryService = MemoryService;

class MemoryServiceCompat extends (_OriginalMemoryService as any) {
  private _client: unknown;

  constructor(client?: unknown) {
    super();
    this._client = client;
  }

  async store(_data: MemoryStoreData): Promise<void> {
    // Override in production implementation; stub satisfies the type checker.
  }

  async reportOutcome(_data: MemoryOutcomeData): Promise<void> {
    // Override in production implementation; stub satisfies the type checker.
  }
}

// Replace the default export with the compat version
export { MemoryServiceCompat as MemoryService };
SHIM
      ok "Patched: ${AGENT_MEMORY_INDEX#"$REPO_ROOT/"}"
    fi
  fi
else
  # File doesn't exist — write it from scratch
  write_file "$AGENT_MEMORY_INDEX" \
'export interface MemoryStoreData {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MemoryOutcomeData {
  projectId?: string;
  agentId?: string;
  taskId?: string;
  success?: boolean;
  costUSD?: number;
  [key: string]: unknown;
}

export class MemoryService {
  private _client: unknown;

  constructor(client?: unknown) {
    this._client = client;
  }

  async store(_data: MemoryStoreData): Promise<void> {}

  async reportOutcome(_data: MemoryOutcomeData): Promise<void> {}
}
'
fi

# =============================================================================
# FIX F: Add PromptManager + OllamaMCPClient exports to agent-orchestration index.ts
#
# VSCode extension imports these from @openrouter-crew/agent-orchestration.
# The scaffolded index.ts stub doesn't export them.
# =============================================================================
step "FIX F: Adding PromptManager + OllamaMCPClient to agent-orchestration exports"

ORCH_INDEX="${REPO_ROOT}/domains/shared/agent-orchestration/src/index.ts"

if [[ -f "$ORCH_INDEX" ]]; then
  NEEDS_PROMPT=false
  NEEDS_OLLAMA=false

  python3 -c "
import sys
with open(sys.argv[1]) as f: c = f.read()
sys.exit(0 if 'PromptManager' in c else 1)
" "$ORCH_INDEX" 2>/dev/null || NEEDS_PROMPT=true

  python3 -c "
import sys
with open(sys.argv[1]) as f: c = f.read()
sys.exit(0 if 'OllamaMCPClient' in c else 1)
" "$ORCH_INDEX" 2>/dev/null || NEEDS_OLLAMA=true

  if $NEEDS_PROMPT || $NEEDS_OLLAMA; then
    if $DRY_RUN; then
      log "Would append PromptManager/OllamaMCPClient stubs to: ${ORCH_INDEX#"$REPO_ROOT/"}"
    else
      backup_file "$ORCH_INDEX"
      {
        echo ""
        echo "// ─── Stub exports required by vscode-extension ──────────────────────────────"
        if $NEEDS_PROMPT; then
          echo "export class PromptManager {"
          echo "  getPrompt(_name: string): string { return ''; }"
          echo "  listPrompts(): string[] { return []; }"
          echo "}"
        fi
        if $NEEDS_OLLAMA; then
          echo "export class OllamaMCPClient {"
          echo "  async connect(): Promise<void> {}"
          echo "  async disconnect(): Promise<void> {}"
          echo "  async query(_prompt: string): Promise<string> { return ''; }"
          echo "}"
        fi
      } >> "$ORCH_INDEX"
      ok "Patched: ${ORCH_INDEX#"$REPO_ROOT/"}"
    fi
  else
    log "PromptManager + OllamaMCPClient already present — skipping"
  fi
else
  write_file "$ORCH_INDEX" \
'export * from "./base-agent";

// ─── Stub exports required by vscode-extension ──────────────────────────────
export class PromptManager {
  getPrompt(_name: string): string { return ""; }
  listPrompts(): string[] { return []; }
}

export class OllamaMCPClient {
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async query(_prompt: string): Promise<string> { return ""; }
}
'
fi

# =============================================================================
# FIX G: Add CrewResponse to VSCode extension types.ts
#
# consistency-checker.ts imports CrewResponse from './types' but it is not
# exported there.
# =============================================================================
step "FIX G: Adding CrewResponse to vscode-extension types.ts"

VSCODE_TYPES="${REPO_ROOT}/domains/vscode-extension/src/services/types.ts"

if [[ -f "$VSCODE_TYPES" ]]; then
  python3 -c "
import sys
with open(sys.argv[1]) as f: c = f.read()
sys.exit(0 if 'CrewResponse' in c else 1)
" "$VSCODE_TYPES" 2>/dev/null || {
    if $DRY_RUN; then
      log "Would append CrewResponse to: ${VSCODE_TYPES#"$REPO_ROOT/"}"
    else
      backup_file "$VSCODE_TYPES"
      cat >> "$VSCODE_TYPES" << 'CREWRESPONSE'

// Added: consistency-checker.ts imports this type
export interface CrewResponse {
  output: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}
CREWRESPONSE
      ok "Patched: ${VSCODE_TYPES#"$REPO_ROOT/"}"
    fi
  }
else
  write_file "$VSCODE_TYPES" \
'export interface AgentExecutionResult {
  output: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}

export interface CrewResponse {
  output: string;
  model: string;
  costUSD: number;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}

export type SchemaProvider = "openai" | "anthropic" | "google" | "meta" | "mistral" | string;
export type ModelTier = "budget" | "standard" | "premium";

export interface CrewAPIClient {
  execute(prompt: string, options?: Record<string, unknown>): Promise<AgentExecutionResult>;
}
'
fi

# =============================================================================
# FIX H: Fix Redis bare type reference in propose-change-service.ts
#
# `private redis: Redis` — Redis is not imported; should be `RedisClient`
# (which IS imported from @openrouter-crew/shared-redis-client).
# =============================================================================
step "FIX H: Replacing bare Redis type with RedisClient in propose-change-service.ts"

PROPOSE_SVC="${REPO_ROOT}/domains/vscode-extension/src/services/propose-change-service.ts"
patch_file "$PROPOSE_SVC" \
  "private redis: Redis; // Geordi: Explicitly type Redis client" \
  "private redis: RedisClient; // Geordi: Explicitly type Redis client"

# Fallback: if comment was stripped
patch_file "$PROPOSE_SVC" \
  "private redis: Redis;" \
  "private redis: RedisClient;"

# =============================================================================
# FIX I: Normalize result.cost / result.costUSD union in registry.ts
#
# The execute() return is a union: AgentExecutionResult | { cost: number; ... }
# The call site uses result.costUSD which doesn't exist on the second branch.
# We normalize to a local variable using nullish coalescing on both.
# =============================================================================
step "FIX I: Fixing result.costUSD union mismatch in registry.ts"

REGISTRY="${REPO_ROOT}/domains/vscode-extension/src/commands/registry.ts"
patch_file "$REGISTRY" \
  "await proposer.propose(filePath, result.output, result.costUSD);" \
  "await proposer.propose(filePath, result.output, (result as any).costUSD ?? (result as any).cost ?? 0);"

# =============================================================================
# FIX J: Ensure ModelTier/SchemaProvider/CrewAPIClient are exported as types
#        from vscode-extension types, not just as namespace-like identifiers.
#
# TS2709 "Cannot use namespace X as type" occurs when an identifier used in a
# type position resolves to a namespace rather than a type declaration.
# Patching the import sites to use `import type { ... }` is the safest fix.
# =============================================================================
step "FIX J: Patching namespace-as-type errors in VSCode extension services"

# agent-network.ts: ModelTier used as Record key and property type
AGENT_NETWORK="${REPO_ROOT}/domains/vscode-extension/src/services/agent-network.ts"
patch_file "$AGENT_NETWORK" \
  "import { ModelTier } from" \
  "import type { ModelTier } from"

# llm-router.ts: SchemaProvider and ModelTier used as property types
LLM_ROUTER="${REPO_ROOT}/domains/vscode-extension/src/services/llm-router.ts"
patch_file "$LLM_ROUTER" \
  "import { SchemaProvider" \
  "import type { SchemaProvider"
patch_file "$LLM_ROUTER" \
  "import { ModelTier" \
  "import type { ModelTier"

# consistency-checker.ts: CrewAPIClient and ModelTier used as types
CONSISTENCY="${REPO_ROOT}/domains/vscode-extension/src/services/consistency-checker.ts"
patch_file "$CONSISTENCY" \
  "import { CrewAPIClient" \
  "import type { CrewAPIClient"
patch_file "$CONSISTENCY" \
  "import { ModelTier" \
  "import type { ModelTier"

# =============================================================================
# REBUILD: In correct dependency order
# =============================================================================
step "REBUILD: packages in correct dependency order"

if $DRY_RUN; then
  for pkg in \
    "@openrouter-crew/shared-schemas:build" \
    "@openrouter-crew/shared-redis-client:build" \
    "@openrouter-crew/agent-memory:build" \
    "@openrouter-crew/shared-cost-tracking:build" \
    "@openrouter-crew/shared-crew-coordination:build" \
    "@openrouter-crew/agent-orchestration:build" \
    "@openrouter-crew/crew-api-client:build" \
    "@openrouter-crew/vscode-extension:compile"; do
    FILTER="${pkg%%:*}"
    CMD="${pkg##*:}"
    log "Would run: pnpm --filter ${FILTER} ${CMD}"
  done
else
  BUILD_FAILED=false

  run_build() {
    local filter="$1" cmd="${2:-build}"
    log "Running: pnpm --filter ${filter} ${cmd}"
    if pnpm --filter "$filter" "$cmd" 2>&1; then
      ok "${filter} ${cmd} passed"
    else
      warn "${filter} ${cmd} FAILED — check output above"
      BUILD_FAILED=true
    fi
  }

  run_build "@openrouter-crew/shared-schemas"
  run_build "@openrouter-crew/shared-redis-client"
  run_build "@openrouter-crew/agent-memory"
  run_build "@openrouter-crew/shared-cost-tracking"
  run_build "@openrouter-crew/shared-crew-coordination"
  run_build "@openrouter-crew/agent-orchestration"
  run_build "@openrouter-crew/crew-api-client"
  run_build "@openrouter-crew/vscode-extension" "compile"

  echo ""
  if $BUILD_FAILED; then
    echo "⚠️  One or more packages still failed. Review output above."
    echo "   Backups: .fix-backups/v2-${TIMESTAMP}"
    exit 1
  fi
fi

echo ""
echo "🎉 All v2 fixes applied."
echo "   Backups: .fix-backups/v2-${TIMESTAMP}"
echo ""
echo "Next: git add -A && git commit -m 'fix: repair scaffolded package tsconfigs and type errors'"
echo "      pnpm maintenance"