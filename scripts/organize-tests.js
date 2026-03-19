const fs = require('fs');
const path = require('path');

/**
 * Configuration:
 * Directories to search for the test files.
 * Defaults to current directory and standard apps/cli location.
 */
const TARGET_PATHS = ['.', 'apps/cli', 'apps/cli/src'];

const TEST_FILES = [
  'memory.test.ts', 'sprint.test.ts', 'team.test.ts', 'project.test.ts',
  'budget.test.ts', 'cost.test.ts', 'history.test.ts', 'analytics.test.ts',
  'config.test.ts', 'unify.test.ts', 'story.test.ts'
];

function findTargetDir() {
  for (const dir of TARGET_PATHS) {
    const fullPath = path.resolve(process.cwd(), dir);
    if (TEST_FILES.some(f => fs.existsSync(path.join(fullPath, f)))) {
      return fullPath;
    }
  }
  return null;
}

const targetDir = findTargetDir();

if (!targetDir) {
  console.error('Could not locate the directory containing the test files.');
  process.exit(1);
}

const testsDir = path.join(targetDir, 'tests');

if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
  console.log(`Created directory: ${testsDir}`);
}

TEST_FILES.forEach(file => {
  const srcPath = path.join(targetDir, file);
  
  if (fs.existsSync(srcPath)) {
    const destPath = path.join(testsDir, file);
    let content = fs.readFileSync(srcPath, 'utf8');

    // Update imports to point to parent directory
    // e.g. from './index' -> from '../index'
    // e.g. jest.mock('./apiClient') -> jest.mock('../apiClient')
    content = content.replace(/from '\.\//g, "from '../");
    content = content.replace(/require\('\.\//g, "require('../");
    content = content.replace(/jest\.mock\('\.\//g, "jest.mock('../");

    fs.writeFileSync(destPath, content);
    fs.unlinkSync(srcPath);
    console.log(`Moved: ${file} -> tests/${file}`);
  } else {
    console.warn(`Warning: ${file} not found in ${targetDir}`);
  }
});

console.log('✅ Test organization complete.');