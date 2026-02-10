# TypeScript Configuration Unification Plan

## Problems Identified

### 1. Missing Root References
The root `tsconfig.json` is missing critical package references:
- ❌ apps/unified-dashboard
- ❌ domains/shared/crew-api-client
- ❌ domains/vscode-extension
- ❌ packages/n8n-nodes
- ❌ domains/shared/semantic-clustering
- ❌ domains/shared/memory-compression
- ❌ domains/shared/batch-processor

### 2. Inconsistent Module Configurations

| Package | Target | Module | ModuleResolution |
|---------|--------|--------|------------------|
| Root | ES2020 | node16 | node16 |
| apps/cli | ES2020 | **commonjs** | node |
| apps/unified-dashboard | **es2015** | **esnext** | **bundler** |
| domains/vscode-extension | ES2020 | node16 | node16 |
| crew-api-client | ES2020 | commonjs | node |

### 3. Inconsistent Compiler Options

| Package | composite | incremental | sourceMap | declaration |
|---------|-----------|-------------|-----------|-------------|
| Root | true | true | true | true |
| cli | true | true | ❌ no | true |
| unified-dashboard | **false** | true | ❌ no | ❌ no |
| vscode-extension | true | ❌ no | true | true |
| crew-api-client | true | ❌ no | true | true |

### 4. Non-Standard Inheritance

- 🔴 crew-api-client: Does NOT extend root
- ❌ unified-dashboard: Overrides too many settings
- ❌ Different include/exclude patterns across packages
- ❌ No path aliases defined in root

## Solution Strategy

### Option 1: Multi-Tier Configuration (Recommended)

Create specialized base configs for different package types:

```
tsconfig.json (Root - Base compiler settings)
├── tsconfig.base.json (Shared base for all packages)
├── tsconfig.server.json (CLI, API servers, services)
├── tsconfig.web.json (React/Next.js applications)
├── tsconfig.extension.json (VSCode extensions)
└── tsconfig.template.json (Project templates)
```

### Option 2: Single Root Extension

Update root `tsconfig.json` to handle all cases with proper overrides.

---

## Implementation (Option 1 - Recommended)

### Step 1: Create Base Configurations

```typescript
// tsconfig.base.json - Shared foundation
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "baseUrl": "."
  }
}

// tsconfig.server.json - CLI, API, Services
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}

// tsconfig.web.json - React/Next.js
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "es2015",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "noEmit": true,
    "isolatedModules": true,
    "allowJs": true,
    "composite": false
  }
}

// tsconfig.extension.json - VSCode Extensions
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2020", "DOM"]
  }
}
```

### Step 2: Update Package tsconfigs

```typescript
// apps/cli/tsconfig.json
{
  "extends": "../../tsconfig.server.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

// apps/unified-dashboard/tsconfig.json
{
  "extends": "../../tsconfig.web.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next"]
}

// domains/vscode-extension/tsconfig.json
{
  "extends": "../../tsconfig.extension.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}

// domains/shared/crew-api-client/tsconfig.json
{
  "extends": "../../tsconfig.server.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 3: Update Root tsconfig.json

```typescript
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@crew/*": ["domains/shared/crew-api-client/src/*"],
      "@shared/*": ["domains/shared/*/src/*"],
      "@vscode/*": ["domains/vscode-extension/src/*"]
    }
  },
  "ignoreDeprecations": "6.0",
  "exclude": ["node_modules", "dist", ".next", "out"],
  "references": [
    { "path": "./apps/cli" },
    { "path": "./apps/unified-dashboard" },
    { "path": "./domains/shared/crew-coordination" },
    { "path": "./domains/shared/cost-tracking" },
    { "path": "./domains/shared/schemas" },
    { "path": "./domains/shared/crew-api-client" },
    { "path": "./domains/vscode-extension" },
    { "path": "./packages/n8n-nodes" },
    { "path": "./domains/shared/semantic-clustering" },
    { "path": "./domains/shared/memory-compression" }
  ]
}
```

---

## Migration Path

### Phase 1: Create Base Configs
1. Create tsconfig.base.json
2. Create tsconfig.server.json
3. Create tsconfig.web.json
4. Create tsconfig.extension.json

### Phase 2: Update Root tsconfig.json
1. Add all missing package references
2. Add path aliases
3. Maintain core settings

### Phase 3: Update Individual Packages
1. Update apps/cli
2. Update apps/unified-dashboard
3. Update domains/vscode-extension
4. Update domains/shared/* packages
5. Update domains/product-factory packages
6. Update domains/alex-ai-universal packages

### Phase 4: Verification
```bash
# Check for type errors
tsc --noEmit

# Check project references
tsc -b

# Build all packages
pnpm build
```

---

## Benefits

✅ **Consistency**: All packages follow same inheritance model
✅ **Maintainability**: Single source of truth for compiler options
✅ **Flexibility**: Type-specific configs for different package types
✅ **Scalability**: Easy to add new packages following patterns
✅ **Performance**: Better incremental compilation with composite: true
✅ **Path Aliases**: Consistent module resolution across monorepo
✅ **Type Safety**: Stricter mode enforcement across all packages

---

## Risks to Mitigate

⚠️ **Changing module targets**: May require code updates
⚠️ **Composite mode changes**: Affects build performance
⚠️ **Path alias adoption**: Requires updating imports in existing code

---

## Files to Create
- tsconfig.base.json (NEW)
- tsconfig.server.json (NEW)
- tsconfig.web.json (NEW)
- tsconfig.extension.json (NEW)

## Files to Update
- tsconfig.json (Root)
- apps/cli/tsconfig.json
- apps/unified-dashboard/tsconfig.json
- domains/vscode-extension/tsconfig.json
- domains/shared/crew-api-client/tsconfig.json
- (+ all other domains/shared/* packages)
- (+ domains/product-factory templates)
- (+ domains/alex-ai-universal packages)

---

## Rollback Plan

If issues arise:
1. Commit all changes before applying
2. Test incrementally (one package at a time)
3. If failures occur, revert to previous branch
4. Identify compatibility issues
5. Adjust configs and reapply
