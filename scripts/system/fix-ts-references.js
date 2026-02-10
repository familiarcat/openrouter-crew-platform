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

function fixTsConfig(filePath, rootModuleResolution, referencedProjects = new Set()) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Config file not found: ${filePath}`);
    return { changed: false, isNextProject: false };
  }

  const projectDir = path.dirname(filePath);

  // Check if this project is referenced from root
  const isReferencedFromRoot = [...referencedProjects].some(refPath =>
    path.resolve(ROOT_DIR, refPath) === projectDir
  );

  let content = fs.readFileSync(filePath, 'utf8');
  let config;
  try {
    config = parseJsonC(content);
  } catch (e) {
    console.warn(`⚠️ Failed to parse ${filePath}: ${e.message}`);
    return { changed: false, isNextProject: false };
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
  const hasNextConfig = fs.existsSync(path.join(projectDir, 'next.config.js')) || 
                        fs.existsSync(path.join(projectDir, 'next.config.mjs')) ||
                        fs.existsSync(path.join(projectDir, 'next.config.ts'));

  // 4. Fix: Ensure Next.js projects have path aliases configured
  // Detect Next.js by config file, "next" plugin, or "next-env.d.ts" in include
  const isNextProject = hasNextConfig || 
                        (config.compilerOptions && config.compilerOptions.plugins && config.compilerOptions.plugins.some(p => p.name === 'next')) || 
                        (config.include && config.include.some(i => i.includes('next-env.d.ts')));

  // 3. Fix: Composite setting
  const isLibraryPackage = config.compilerOptions.outDir !== undefined &&
                           config.compilerOptions.outDir !== null;

  if (isNextProject) {
    // Next.js projects cannot be composite if they are noEmit: true
    if (config.compilerOptions.composite === true) {
      console.log(`🔧 [Fix] Setting 'composite': false for Next.js project in ${path.relative(ROOT_DIR, filePath)}`);
      config.compilerOptions.composite = false;
      changed = true;
    }
  } else if (isReferencedFromRoot) {
    // Projects referenced from root MUST be composite
    if (config.compilerOptions.composite !== true) {
      console.log(`🔧 [Fix] Setting 'composite': true for referenced project in ${path.relative(ROOT_DIR, filePath)}`);
      config.compilerOptions.composite = true;
      changed = true;
    }
    // Ensure incremental is not explicitly disabled
    if (config.compilerOptions.incremental === false) {
      console.log(`🔧 [Fix] Removing 'incremental': false for referenced project in ${path.relative(ROOT_DIR, filePath)}`);
      delete config.compilerOptions.incremental;
      changed = true;
    }
  } else if (isLibraryPackage) {
    // Library packages not referenced from root can be non-composite
    if (config.compilerOptions.composite !== false) {
      console.log(`🔧 [Fix] Setting 'composite': false for library package in ${path.relative(ROOT_DIR, filePath)}`);
      config.compilerOptions.composite = false;
      changed = true;
    }
  } else if (filePath !== ROOT_TSCONFIG) {
    // Other non-library, non-Next.js projects should be composite if they are part of the monorepo structure
    if (config.compilerOptions.composite !== true) {
      console.log(`🔧 [Fix] Setting 'composite': true in ${path.relative(ROOT_DIR, filePath)}`);
      config.compilerOptions.composite = true;
      changed = true;
    }
  }

  if (isNextProject) {
    // Next.js projects NEED baseUrl: "." for path aliases to work
    // Only remove baseUrl if there are no path aliases configured
    if (!config.compilerOptions.paths || Object.keys(config.compilerOptions.paths).length === 0) {
      if (config.compilerOptions.baseUrl === '.' || config.compilerOptions.baseUrl === './') {
         console.log(`🔧 [Fix] Removing deprecated 'baseUrl' in ${path.relative(ROOT_DIR, filePath)}`);
         delete config.compilerOptions.baseUrl;
         changed = true;
      }
    } else {
      // Path aliases are configured; ensure baseUrl is set
      if (!config.compilerOptions.baseUrl || config.compilerOptions.baseUrl === '') {
         console.log(`🔧 [Fix] Setting 'baseUrl': "." for path aliases in ${path.relative(ROOT_DIR, filePath)}`);
         config.compilerOptions.baseUrl = '.';
         changed = true;
      }
    }

    if (!config.compilerOptions.paths) {
       config.compilerOptions.paths = {};
    }
    if (!config.compilerOptions.paths["@/*"]) {
       console.log(`🔧 [Fix] Setting path alias '@/*' in ${path.relative(ROOT_DIR, filePath)}`);
       config.compilerOptions.paths["@/*"] = ["./*"];
       changed = true;
    }

    // Next.js projects should not emit files via tsc; Next.js handles it.
    if (config.compilerOptions.noEmit !== true) {
      console.log(`🔧 [Fix] Setting 'noEmit': true for Next.js project in ${path.relative(ROOT_DIR, filePath)}`);
      config.compilerOptions.noEmit = true;
      changed = true;
    }
  }

  // 5. Fix: Ensure module matches moduleResolution for Node16/NodeNext
  if (config.compilerOptions && config.compilerOptions.moduleResolution) {
    const mr = config.compilerOptions.moduleResolution.toLowerCase();
    if (mr === 'node16' || mr === 'nodenext') {
      const m = (config.compilerOptions.module || '').toLowerCase();
      if (m !== mr) {
         console.log(`🔧 [Fix] Setting 'module': "${config.compilerOptions.moduleResolution}" to match 'moduleResolution' in ${path.relative(ROOT_DIR, filePath)}`);
         config.compilerOptions.module = config.compilerOptions.moduleResolution;
         changed = true;
      }
    }
  }

  // 6. Fix: Ensure moduleResolution is compatible with module when extending from a "node16" root
  if (rootModuleResolution && ['node16', 'nodenext'].includes(rootModuleResolution.toLowerCase())) {
    if (config.compilerOptions?.module?.toLowerCase() === 'commonjs') {
      // This config has module: commonjs but the root has an incompatible moduleResolution.
      // This is only a problem if this config does NOT override moduleResolution itself.
      if (!config.compilerOptions.moduleResolution) {
        console.log(`🔧 [Fix] Setting 'moduleResolution': "node" to be compatible with "commonjs" in ${path.relative(ROOT_DIR, filePath)}`);
        config.compilerOptions.moduleResolution = "node";
        changed = true;
      }
    }
  }

  // 7. Fix: Ensure "scripts" folder is in exclude for Next.js projects
  if (isNextProject && fs.existsSync(path.join(projectDir, 'scripts'))) {
    if (!config.exclude) {
      config.exclude = [];
    }
    if (!config.exclude.includes('scripts')) {
      console.log(`🔧 [Fix] Adding 'scripts' to exclude in ${path.relative(ROOT_DIR, filePath)}`);
      config.exclude.push('scripts');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n');
    return { changed: true, isNextProject };
  }
  return { changed: false, isNextProject };
}

function findAllTsConfigs(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === 'node_modules' || file === '.next' || file === 'dist' || file === 'build' || file.startsWith('.')) continue;
        findAllTsConfigs(filePath, fileList);
      } else {
        if (file === 'tsconfig.json') {
          fileList.push(filePath);
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return fileList;
}

function main() {
  console.log('🤖 Alex AI: Unifying TypeScript configurations...');

  if (!fs.existsSync(ROOT_TSCONFIG)) {
    console.error('❌ Root tsconfig.json not found.');
    process.exit(1);
  }

  let fixedCount = 0;
  const nextProjects = new Set();
  const referencedProjects = new Set();

  const rootConfigRaw = fs.readFileSync(ROOT_TSCONFIG, 'utf8');
  const rootConfigParsed = parseJsonC(rootConfigRaw);
  const rootModuleResolution = rootConfigParsed.compilerOptions?.moduleResolution;

  // Extract referenced projects from root config
  if (rootConfigParsed.references && Array.isArray(rootConfigParsed.references)) {
    rootConfigParsed.references.forEach(ref => {
      referencedProjects.add(ref.path);
    });
  }

  // Find ALL tsconfig.json files to ensure comprehensive patching
  const allTsConfigs = findAllTsConfigs(ROOT_DIR);
  for (const configPath of allTsConfigs) {
    const result = fixTsConfig(configPath, rootModuleResolution, referencedProjects);
    if (result.changed) fixedCount++;
    if (result.isNextProject) {
      // Store relative path from root to project dir
      const rel = path.relative(ROOT_DIR, path.dirname(configPath));
      nextProjects.add(rel);
    }
  }

  // Fix Root References: Remove Next.js projects
  // Next.js projects with noEmit: true cannot be referenced by a composite root
  const rootContent = fs.readFileSync(ROOT_TSCONFIG, 'utf8');
  let rootConfig = parseJsonC(rootContent);
  let rootChanged = false;

  if (rootConfig.references && Array.isArray(rootConfig.references)) {
    const originalLength = rootConfig.references.length;
    rootConfig.references = rootConfig.references.filter(ref => {
      // Resolve the absolute path of the reference
      const absoluteRefPath = path.resolve(ROOT_DIR, ref.path);
      // Check if this path corresponds to any identified Next.js project
      // We check if the set of Next.js project directories contains this reference path
      if ([...nextProjects].some(nextProj => path.resolve(ROOT_DIR, nextProj) === absoluteRefPath)) {
         console.log(`🔧 [Fix] Removing Next.js project from root references: ${ref.path}`);
         return false;
      }
      return true;
    });
    if (rootConfig.references.length !== originalLength) {
      rootChanged = true;
    }
  }

  if (rootChanged) {
    fs.writeFileSync(ROOT_TSCONFIG, JSON.stringify(rootConfig, null, 2));
    fixedCount++;
  }

  if (fixedCount > 0) {
    console.log(`✅ Scan complete. Fixed ${fixedCount} configuration(s).`);
  } else {
    console.log(`✅ Scan complete. All configurations are in alignment.`);
  }
}

main();