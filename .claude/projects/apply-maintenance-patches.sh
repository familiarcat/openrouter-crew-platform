#!/bin/bash
# /Users/bradygeorgen/Dev/openrouter-crew-platform/apply-maintenance-patches.sh
# This script applies the specific patches to maintenance-service.ts
# to fix RangeError and other persistent build issues.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAINTENANCE_SERVICE_FILE="${REPO_ROOT}/scripts/maintenance-service.ts"
PATCH_FILE="${REPO_ROOT}/maintenance-service.patch"

echo "Applying patches to ${MAINTENANCE_SERVICE_FILE}..."

# Create the patch file inline
cat << 'EOF_PATCH' > "${PATCH_FILE}"
--- a/scripts/maintenance-service.ts
++++ b/scripts/maintenance-service.ts
@@ -31,7 +31,14 @@
     const fullPath = path.join(this.rootDir, filePath);
     if (fs.existsSync(fullPath)) {
       console.log(chalk.blue(`  -> Patching ${filePath}...`));
-      let content = fs.readFileSync(fullPath, 'utf8');
+      let content = fs.readFileSync(fullPath, 'utf8');
+
+      // EMERGENCY PURGE: If file is bloated (> 1MB), collapse infinite-loop patterns first
+      if (content.length > 1024 * 1024) {
+        console.warn(chalk.red(`  ⚠️  BLOATED FILE DETECTED (${(content.length/1024/1024).toFixed(2)}MB). Purging corruption: ${filePath}`));
+        content = content.replace(/(?:\(data\.estimated_cost as any\) \|\| \(data as any\)\.cost \|\| 0,)+/g, '(data.estimated_cost as any) || (data as any).cost || 0,');
+        content = content.replace(/(?:\\+\${(lang|encodedCode|pathHint|displayPath|code)})+/g, '\\$${$1}');
+      }
 
       const newContent = content.replace(find, replace);
       if (content !== newContent) {
@@ -339,7 +346,7 @@
     );
     this.patchFile(
       'domains/shared/crew-coordination/src/consistency-checker.ts',
-      /\): ModelTier/g,
+      /\): (?!any)ModelTier/g,
       '): any'
     );
 
     // Standardize cost property naming in extension
     this.patchFile(
       'domains/vscode-extension/src/commands/command-executor.ts',
-      /cost:\s*number/g,
-      'costUSD: number'
+      /async executeTask\(task: string, context\?: any\): Promise<{ output: string; model: string; cost: number; executionTimeMs: number; success: boolean }>/g,
+      'async executeTask(task: string, context?: any): Promise<{ output: string; model: string; costUSD: number; executionTimeMs: number; success: boolean }>'
     );
 
     this.patchFile(
       'domains/vscode-extension/src/commands/command-executor.ts',
       /cost: 0.004/g,
       'costUSD: 0.004'
     );
 
     this.patchFile(
       'domains/vscode-extension/src/commands/command-executor.ts',
       /cost:\s*number/g,
       'costUSD: number'
     );
 
     this.patchFile(
       'domains/vscode-extension/src/ui/treatment-plan-view.ts',
       /result\.cost\.toFixed/g,
       '(result as any).costUSD.toFixed'
     );
 
     this.patchFile(
       'domains/vscode-extension/src/ui/chat-panel.ts',
-      /cost = result\.cost;/g,
-      'cost = (result as any).costUSD || (result as any).cost;'
-    );
-
-    // Escape template literal variables in chat-panel webview (Fixes TS2304)
-    this.patchFile(
-      'domains/vscode-extension/src/ui/chat-panel.ts',
-      /\${lang/g, '\\${lang'
-    );
+      /cost = result\.cost;/g,
+      'cost = (result as any).costUSD || (result as any).cost;'
+    );
+
+    // Escape template literal variables in chat-panel webview (Idempotent Fix)
+    this.patchFile(
+      'domains/vscode-extension/src/ui/chat-panel.ts',
+      /(?<!\\)\${(lang|encodedCode|pathHint|displayPath|code)/g,
+      '\\${$1'
+    );
 
     this.patchFile(
       'domains/shared/crew-coordination/src/consistency-checker.ts',
EOF_PATCH

# Apply the patch
patch -p1 -d "${REPO_ROOT}" < "${PATCH_FILE}"

# Clean up the patch file
rm "${PATCH_FILE}"

echo "Patches applied successfully. Now run 'pnpm maintenance' to execute the fixed script."
