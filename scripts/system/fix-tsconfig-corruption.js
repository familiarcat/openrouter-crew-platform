/**
 * TSConfig Corruption Fixer
 * 
 * Scans the monorepo for tsconfig.json files and enforces modern TypeScript 5.x standards.
 * Fixes common AI hallucinations such as:
 * - Using 'baseUrl' unnecessarily (deprecated practice)
 * - Using legacy 'moduleResolution' (Node) instead of 'Bundler' or 'NodeNext'
 * - Incorrect target versions
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', '.turbo'];

function stripJsonComments(json) {
    // Simple regex to strip // and /* */ comments
    return json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
}

function findTsConfigs(dir, fileList = []) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            if (IGNORE_DIRS.includes(file)) return;
            
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                findTsConfigs(filePath, fileList);
            } else if (file === 'tsconfig.json') {
                fileList.push(filePath);
            }
        });
    } catch (e) {
        // Ignore access errors
    }
    return fileList;
}

console.log('🔍 Scanning for tsconfig.json files...');
const configs = findTsConfigs(ROOT_DIR);
console.log(`Found ${configs.length} configuration files.`);

configs.forEach(configPath => {
    try {
        const rawContent = fs.readFileSync(configPath, 'utf8');
        const jsonContent = stripJsonComments(rawContent);
        const config = JSON.parse(jsonContent);
        
        let modified = false;
        
        if (!config.compilerOptions) {
            config.compilerOptions = {};
            modified = true;
        }
        
        const co = config.compilerOptions;
        const relPath = path.relative(ROOT_DIR, configPath);

        // 1. Fix Module Resolution (The "Current Compiler Options" issue)
        // Modern Next.js/Vite apps should use 'Bundler'. Pure Node scripts 'NodeNext'.
        // Defaulting to Bundler as it's the most permissive for monorepos.
        if (co.moduleResolution !== 'Bundler' && co.moduleResolution !== 'NodeNext') {
            co.moduleResolution = 'Bundler';
            co.module = 'ESNext';
            modified = true;
            console.log(`   [${relPath}] Updated moduleResolution to 'Bundler'`);
        }

        // 2. Fix baseUrl Deprecation
        // baseUrl is only required if 'paths' is defined. Otherwise it complicates resolution.
        if (co.baseUrl && (!co.paths || Object.keys(co.paths).length === 0)) {
            delete co.baseUrl;
            modified = true;
            console.log(`   [${relPath}] Removed unnecessary 'baseUrl'`);
        } else if (co.paths && !co.baseUrl) {
            // If paths exist, baseUrl must exist (usually '.')
            co.baseUrl = '.';
            modified = true;
            console.log(`   [${relPath}] Added missing 'baseUrl' for paths`);
        }

        // 3. Enforce Modern Target
        if (!['ES2020', 'ES2021', 'ES2022', 'ESNext'].includes(co.target)) {
            co.target = 'ES2022';
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`✅ Fixed: ${relPath}`);
        }
    } catch (e) {
        console.error(`❌ Error processing ${path.relative(ROOT_DIR, configPath)}: ${e.message}`);
    }
});