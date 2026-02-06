/**
 * Alex AI - TypeScript Configuration Unifier
 * 
 * Scans the root tsconfig.json and all referenced projects to ensure universal alignment:
 * 1. Ensures "composite": true is enabled (required for monorepos).
 * 2. Ensures "ignoreDeprecations": "6.0" is at the top level (not in compilerOptions).
 * 3. Fixes malformed configurations automatically.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const ROOT_TSCONFIG = path.join(ROOT_DIR, 'tsconfig.json');

// Helper to strip comments from JSONC (tsconfig files often have comments)
function parseJsonC(content) {
  // Simple regex to strip single-line and multi-line comments
  const json = content.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
  return JSON.parse(json);
}

function fixTsConfig(filePath, isRoot = false) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Config file not found: ${filePath}`);
    return 0;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let config;
  try {
    config = parseJsonC(content);
  } catch (e) {
    console.warn(`⚠️ Failed to parse ${filePath}: ${e.message}`);
    return 0;
  }

  let changed = false;

  // Ensure compilerOptions exists
  if (!config.compilerOptions) {
    config.compilerOptions = {};
  }

  // 1. Fix: ignoreDeprecations must be at top level, not in compilerOptions
  if (config.compilerOptions.ignoreDeprecations) {
    console.log(`🔧 [Fix] Moving 'ignoreDeprecations' out of compilerOptions in ${path.relative(ROOT_DIR, filePath)}`);
    delete config.compilerOptions.ignoreDeprecations;
    changed = true;
  }

  // 2. Fix: Ensure ignoreDeprecations is set to "6.0"
  if (config.ignoreDeprecations !== "6.0") {
    console.log(`🔧 [Fix] Setting 'ignoreDeprecations': "6.0" in ${path.relative(ROOT_DIR, filePath)}`);
    config.ignoreDeprecations = "6.0";
    changed = true;
  }

  // 3. Fix: Ensure composite is true (required for project references)
  // We apply this to all referenced projects. Root usually has it too.
  if (config.compilerOptions.composite !== true) {
    console.log(`🔧 [Fix] Setting 'composite': true in ${path.relative(ROOT_DIR, filePath)}`);
    config.compilerOptions.composite = true;
    changed = true;
  }

  // 4. Fix: Ensure Next.js projects have path aliases configured
  // Detect Next.js by "next" plugin or "next-env.d.ts" in include
  const isNextProject = (config.compilerOptions && config.compilerOptions.plugins && config.compilerOptions.plugins.some(p => p.name === 'next')) || 
                        (config.include && config.include.some(i => i.includes('next-env.d.ts')));

  if (isNextProject) {
    if (!config.compilerOptions.baseUrl) {
       console.log(`🔧 [Fix] Setting 'baseUrl': "." in ${path.relative(ROOT_DIR, filePath)}`);
       config.compilerOptions.baseUrl = ".";
       changed = true;
    }
    if (!config.compilerOptions.paths) {
       config.compilerOptions.paths = {};
    }
    if (!config.compilerOptions.paths["@/*"]) {
       console.log(`🔧 [Fix] Setting path alias '@/*' in ${path.relative(ROOT_DIR, filePath)}`);
       config.compilerOptions.paths["@/*"] = ["./*"];
       changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n');
    return 1;
  }
  return 0;
}

function main() {
  console.log('🤖 Alex AI: Unifying TypeScript configurations...');

  if (!fs.existsSync(ROOT_TSCONFIG)) {
    console.error('❌ Root tsconfig.json not found.');
    process.exit(1);
  }

  let fixedCount = 0;

  // 1. Fix Root Config
  fixedCount += fixTsConfig(ROOT_TSCONFIG, true);

  // 2. Fix Referenced Configs
  const rootConfigRaw = fs.readFileSync(ROOT_TSCONFIG, 'utf8');
  const rootConfig = parseJsonC(rootConfigRaw);

  if (rootConfig.references && Array.isArray(rootConfig.references)) {
    for (const ref of rootConfig.references) {
      const refPath = path.resolve(ROOT_DIR, ref.path);
      const refTsConfigPath = path.join(refPath, 'tsconfig.json');
      fixedCount += fixTsConfig(refTsConfigPath);
    }
  }

  if (fixedCount > 0) {
    console.log(`✅ Scan complete. Fixed ${fixedCount} configuration(s).`);
  } else {
    console.log(`✅ Scan complete. All configurations are in alignment.`);
  }
}

main();