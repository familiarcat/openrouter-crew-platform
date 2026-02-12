# Known Issues

## Domain Dashboard Build Issues

### Alex-AI-Universal Dashboard

**Status**: Needs dependency fixes
**Priority**: Medium

**Issues**:
```
Module not found: Can't resolve '../../../../types/constructor'
Module not found: Can't resolve '@/scripts/utils/unified-service-accessor'
```

**Cause**:
The Alex-AI-Universal dashboard was imported from an existing project with different path structures. Some API routes reference paths that don't exist in the new DDD structure.

**Resolution**:
1. Update tsconfig.json paths in `domains/alex-ai-universal/dashboard/tsconfig.json`
2. Create missing type files or update imports to use shared types
3. Create missing utility files or refactor to use shared utilities

**Files to fix**:
- `app/api/events/route.ts`
- `app/api/mcp/crew/roster/route.ts`
- `app/api/mcp/settings/test/route.ts`
- `app/api/mcp/workflows/executions/route.ts`
- `app/api/mcp/workflows/storage/route.ts`

**Workaround**:
The unified dashboard and other domains work correctly. Alex-AI-Universal features can be accessed through its running dev server until build issues are resolved.

### Product-Factory Dashboard

**Status**: Build in progress (no errors yet)
**Priority**: Low

**Notes**:
Build was still running when verification was done. May need similar path updates as Alex-AI-Universal.

## Next Steps

1. Fix Alex-AI-Universal build issues
2. Verify Product-Factory builds completely
3. Update domain-specific `tsconfig.json` paths
4. Create shared type definitions for common patterns
5. Document any remaining migration issues

## Verified Working

- ✅ Unified Dashboard builds and runs
- ✅ Shared packages build without errors
- ✅ 123 workflows imported
- ✅ Domain route proxies functional
- ✅ Feature federation script working
- ✅ pnpm workspace configured correctly

## VSCode Extension Issues

### Chat Feature Encoding Error

**Status**: Known Error
**Priority**: High

**Issue**:
`Error: Cannot convert argument to a ByteString because the character at index 7 has a value of 9989 which is greater than 255.`

**Cause**:
The chat feature attempts to Base64 encode strings containing emojis (specifically `✅` at index 7, likely from log prefixes like `[INFO] ✅`) using `btoa()`, which fails on characters > 255.

**Resolution**:
Update the extension code to properly handle UTF-8 characters before encoding:
`btoa(unescape(encodeURIComponent(string)))` or use `Buffer.from(string, 'utf-8').toString('base64')`.
