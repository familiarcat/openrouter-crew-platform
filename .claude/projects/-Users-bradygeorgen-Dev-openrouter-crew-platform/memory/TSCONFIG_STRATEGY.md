# TypeScript Configuration Strategy

## Overview
The monorepo uses a unified, inheritance-based TypeScript configuration system designed for 2026 standards (TypeScript 7.0 ready).

## Inheritance Hierarchy

```
tsconfig.base.json (foundation: ES2020, strict mode, declaration maps)
├── tsconfig.server.json (Node.js packages: commonjs, node resolution)
│   ├── apps/cli
│   ├── domains/shared/crew-api-client
│   ├── domains/shared/schemas
│   ├── domains/shared/cost-tracking
│   └── domains/shared/crew-coordination
├── tsconfig.web.json (Next.js apps: esnext, bundler resolution)
│   └── apps/unified-dashboard (+ path aliases, noEmit)
└── tsconfig.extension.json (VSCode: node16, commonjs)
    └── domains/vscode-extension
```

## Key Rules

### Rule 1: Composite Mode
- **Projects referenced from root** (`tsconfig.references`): `composite: true` + `incremental: true`
- **Non-referenced library packages**: `composite: false` (optional)
- **Next.js applications**: `composite: false` + `noEmit: true` (Next.js handles output)

### Rule 2: TypeScript 7.0 Compatibility
- **All configs**: Add `"ignoreDeprecations": "6.0"` at root level
- **No deprecated options**: Avoid `node10` moduleResolution, use `"node"` or `"bundler"`

### Rule 3: Module Resolution
- **CLI/servers**: `moduleResolution: "node"`, `module: "commonjs"`
- **VSCode extensions**: `moduleResolution: "node16"`, `module: "node16"`
- **Web apps**: `moduleResolution: "bundler"`, `module: "esnext"`

### Rule 4: Path Aliases
- Next.js projects with `@/*` aliases MUST have `baseUrl: "."`
- Library packages should NOT use path aliases (breaks monorepo resolution)

### Rule 5: Special Folders
- Exclude `scripts/` folder in Next.js projects from TypeScript compilation
- Use `"exclude": ["node_modules", ".next", "scripts"]`

## Configuration Patterns

### Pattern: Referenced Library Package
```json
{
  "extends": "../../../tsconfig.server.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "incremental": true
  },
  "ignoreDeprecations": "6.0"
}
```

### Pattern: Next.js Application
```json
{
  "extends": "../../tsconfig.web.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "noEmit": true
  },
  "exclude": ["node_modules", ".next", "scripts"],
  "ignoreDeprecations": "6.0"
}
```

### Pattern: VSCode Extension
```json
{
  "extends": "../../tsconfig.extension.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "incremental": true,
    "module": "node16",
    "moduleResolution": "node16"
  }
}
```

## Configuration Script Behavior

The `fix-ts-references.js` script automatically:
1. Detects if a project is referenced from root
2. Sets `composite: true` for referenced projects
3. Sets `composite: false` for non-referenced libraries
4. Ensures Next.js projects stay `composite: false`
5. Adds `ignoreDeprecations: "6.0"` to all configs
6. Excludes `scripts/` folder from Next.js projects
7. Preserves path aliases with proper baseUrl

## Build Validation

Run `pnpm build` to verify:
- ✅ All referenced projects compile
- ✅ All library packages emit to dist/
- ✅ Next.js apps compile without errors
- ⚠️ Non-TypeScript issues (PostCSS, etc.) may still fail

## Current Status

**10/13 packages successfully compiling:**
- ✅ All 6 server/library packages (CLI, VSCode, shared)
- ✅ All 3 main Next.js dashboards
- ⚠️ alex-ai-universal-dashboard (PostCSS config issue)

## Troubleshooting

### Issue: "composite projects may not disable incremental"
**Solution:** If `composite: true`, don't set `incremental: false`

### Issue: Module not found for path alias
**Solution:** Check Next.js project has `baseUrl: "."` in tsconfig

### Issue: Reference must have composite: true
**Solution:** If project is in root's references array, set `composite: true`

### Issue: Scripts being type-checked in Next.js
**Solution:** Add `"scripts"` to exclude array in next.js tsconfig

## Future Improvements

- Consider moving to `tsconfig.config.json` for shared config generation
- Evaluate tsconfig auto-generation tools
- Monitor TypeScript 7.0 RC release for new options
