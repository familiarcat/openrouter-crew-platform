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
    // Match strings, comments, OR trailing commas
    return json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)|,\s*([}\]])/g, (m, g1, g2) => {
        if (g1) return ""; // Comment
        if (g2) return g2; // Trailing comma: return the closing brace/bracket
        return m; // String
    });
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

function fixConfig(configPath) {
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
        // Differentiate between Next.js projects and standard Node.js packages.
        const projectDir = path.dirname(configPath);
        const isNextProject = fs.existsSync(path.join(projectDir, 'next.config.js')) ||
                              fs.existsSync(path.join(projectDir, 'next.config.mjs'));

        if (isNextProject) {
            if (co.moduleResolution !== 'Bundler') {
                co.moduleResolution = 'Bundler';
                co.module = 'ESNext'; // Next.js projects use ES Modules
                modified = true;
                console.log(`   [${relPath}] Updated moduleResolution to 'Bundler' for Next.js project`);
            }
        } else { // For Node.js libraries, CLI, and VSCode extension
            if (co.moduleResolution !== 'Node' && co.moduleResolution !== 'NodeNext') {
                co.moduleResolution = 'Node'; // Align with documented strategy
                modified = true;
                console.log(`   [${relPath}] Updated moduleResolution to 'Node' for Node.js project`);
            }
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
}

if (require.main === module) {
    console.log('🔍 Scanning for tsconfig.json files...');
    const configs = findTsConfigs(ROOT_DIR);
    console.log(`Found ${configs.length} configuration files.`);

    configs.forEach(configPath => fixConfig(configPath));
}

module.exports = { stripJsonComments, findTsConfigs, fixConfig };