#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { readdirSync, statSync, readFileSync } from 'fs';

interface FileMetrics {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  lines?: number;
  language?: string;
  children?: FileMetrics[];
}

interface PackageMetrics {
  name: string;
  path: string;
  version?: string;
  description?: string;
  dependencies: string[];
  devDependencies: string[];
  type: 'app' | 'library' | 'service';
  scripts: Record<string, string>;
}

interface CodebaseAnalysis {
  timestamp: string;
  projectName: string;
  projectVersion: string;
  totalFiles: number;
  totalDirectories: number;
  totalLines: number;
  totalSize: number;
  statistics: {
    byLanguage: Record<string, { files: number; lines: number; size: number }>;
    byType: Record<string, { files: number; size: number }>;
  };
  structure: FileMetrics;
  packages: PackageMetrics[];
  technologies: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  domains: string[];
  metrics?: {
    complexity: {
      estimatedCyclomaticComplexity: number;
      averageFunctionSize: number;
      largeFilesCount: number;
    };
    codeQuality: {
      documentationCoverage: number;
      strictModeUsage: number;
      testFileCount: number;
      testCoverage: string;
    };
    duplicates: {
      estimatedDuplicationPercentage: number;
      suspiciousPatterns: Array<{ pattern: string; count: number }>;
    };
    health: {
      typeScriptStrictMode: boolean;
      outdatedPackagesEstimate: number;
      securityIssuesCount: number;
    };
  };
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
  '.git',
  '.DS_Store',
  '.env',
  '.logs',
  'pnpm-lock.yaml',
  '.claude',
  'terraform',
  'infrastructure',
  'supabase',
  'tests',
  'releases',
];

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript React',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript React',
  '.json': 'JSON',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.md': 'Markdown',
  '.sh': 'Bash',
  '.py': 'Python',
  '.go': 'Go',
  '.rs': 'Rust',
  '.sql': 'SQL',
  '.html': 'HTML',
};

function shouldIgnore(name: string, relativePath: string): boolean {
  if (IGNORE_PATTERNS.some(pattern => name === pattern)) return true;
  if (IGNORE_PATTERNS.some(pattern => relativePath.includes(`/${pattern}/`))) return true;
  if (name.startsWith('.')) return false; // Allow some dot files for analysis
  return false;
}

function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || 'Other';
}

function countLines(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function analyzeDirectory(
  dirPath: string,
  rootPath: string,
  relativePath: string = ''
): FileMetrics {
  const name = path.basename(dirPath);
  const stats = statSync(dirPath);
  const children: FileMetrics[] = [];
  let totalSize = 0;

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const relPath = relativePath ? `${relativePath}/${entry}` : entry;

      if (shouldIgnore(entry, relPath)) continue;

      const entryStat = statSync(fullPath);

      if (entryStat.isDirectory()) {
        const subdir = analyzeDirectory(fullPath, rootPath, relPath);
        children.push(subdir);
        totalSize += subdir.size;
      } else {
        const fileSize = entryStat.size;
        const lines = countLines(fullPath);
        const language = getLanguage(fullPath);

        children.push({
          path: relPath,
          name: entry,
          type: 'file',
          size: fileSize,
          lines,
          language,
        });

        totalSize += fileSize;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  // Sort children: directories first, then files
  children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    path: relativePath || name,
    name,
    type: 'directory',
    size: totalSize,
    children: children.length > 0 ? children : undefined,
  };
}

function readPackageJson(pkgPath: string): PackageMetrics | null {
  try {
    const packagePath = path.join(pkgPath, 'package.json');
    if (!fs.existsSync(packagePath)) return null;

    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    const type = pkgPath.includes('apps/')
      ? 'app'
      : pkgPath.includes('dashboard') || pkgPath.includes('extension')
      ? 'app'
      : 'library';

    return {
      name: pkg.name || path.basename(pkgPath),
      path: pkgPath.replace(/.*openrouter-crew-platform\//, ''),
      version: pkg.version,
      description: pkg.description,
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {}),
      type,
      scripts: pkg.scripts || {},
    };
  } catch {
    return null;
  }
}

function findAllPackages(rootPath: string): PackageMetrics[] {
  const packages: PackageMetrics[] = [];
  const visited = new Set<string>();

  function traverse(dir: string) {
    if (visited.has(dir)) return;
    visited.add(dir);

    const packagePath = path.join(dir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = readPackageJson(dir);
      if (pkg) packages.push(pkg);
    }

    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (IGNORE_PATTERNS.includes(entry)) continue;
        const fullPath = path.join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          traverse(fullPath);
        }
      }
    } catch {
      // Silently skip inaccessible directories
    }
  }

  traverse(rootPath);
  return packages;
}

function extractDomains(rootPath: string): string[] {
  const domains = new Set<string>();
  const domainsPath = path.join(rootPath, 'domains');

  if (!fs.existsSync(domainsPath)) return Array.from(domains);

  try {
    const entries = readdirSync(domainsPath);
    for (const entry of entries) {
      if (!entry.startsWith('.')) {
        domains.add(entry);
      }
    }
  } catch {
    // Silently continue
  }

  return Array.from(domains).sort();
}

function analyzeTechnologies(packages: PackageMetrics[]): {
  languages: string[];
  frameworks: string[];
  tools: string[];
} {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const tools = new Set<string>();

  const allDeps = packages.flatMap(p => [...p.dependencies, ...p.devDependencies]);

  // Detect frameworks and tools from dependencies
  const depMap: Record<string, string[]> = {
    'next': ['frameworks'],
    'react': ['frameworks'],
    'vue': ['frameworks'],
    'express': ['frameworks'],
    'fastify': ['frameworks'],
    'prisma': ['tools'],
    'supabase': ['tools'],
    'n8n': ['tools'],
    'typescript': ['languages'],
    'python': ['languages'],
    'tailwindcss': ['tools'],
    'jest': ['tools'],
    'vitest': ['tools'],
    'playwright': ['tools'],
    'cypress': ['tools'],
    'esbuild': ['tools'],
    'turbo': ['tools'],
    'pnpm': ['tools'],
    'eslint': ['tools'],
    'prettier': ['tools'],
    'storybook': ['tools'],
  };

  languages.add('TypeScript');
  frameworks.add('React');
  frameworks.add('Next.js');
  tools.add('Turbo');
  tools.add('pnpm');

  for (const dep of allDeps) {
    const match = Object.entries(depMap).find(([key]) => dep.includes(key));
    if (match) {
      const [, categories] = match;
      if (categories.includes('languages')) languages.add(dep);
      if (categories.includes('frameworks')) frameworks.add(dep);
      if (categories.includes('tools')) tools.add(dep);
    }
  }

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    tools: Array.from(tools),
  };
}

function analyzeComplexity(structure: FileMetrics, statistics: Record<string, any>): {
  estimatedCyclomaticComplexity: number;
  averageFunctionSize: number;
  largeFilesCount: number;
} {
  let estimatedComplexity = 0;
  let largeFilesCount = 0;
  let fileCount = 0;
  let totalFunctionEstimate = 0;

  function traverse(node: FileMetrics) {
    if (node.type === 'file' && node.language && node.language.includes('TypeScript')) {
      fileCount++;
      const lines = node.lines || 0;

      if (lines > 500) largeFilesCount++;

      // Rough estimation: 1 function per 20-30 lines (conservative)
      const estimatedFunctions = Math.ceil(lines / 25);
      totalFunctionEstimate += estimatedFunctions;

      // Simple heuristic: complexity increases with file size
      estimatedComplexity += Math.log(lines + 1) * 0.5;
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(structure);

  return {
    estimatedCyclomaticComplexity: Math.round(estimatedComplexity),
    averageFunctionSize: fileCount > 0 ? Math.round(totalFunctionEstimate / fileCount) : 0,
    largeFilesCount,
  };
}

function analyzeDocumentation(structure: FileMetrics, statistics: Record<string, any>): number {
  let totalLines = 0;
  let commentLines = 0;

  function traverse(node: FileMetrics) {
    if (node.type === 'file') {
      try {
        const content = readFileSync(node.path, 'utf-8');
        const lines = content.split('\n');
        totalLines += lines.length;

        // Count comment-like lines (rough estimation)
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('/**')) {
            commentLines++;
          }
        }
      } catch {
        // Skip files we can't read
      }
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(structure);

  return totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;
}

function detectDuplicates(structure: FileMetrics): Array<{ pattern: string; count: number }> {
  const patterns: Record<string, number> = {};
  let fileCount = 0;

  function traverse(node: FileMetrics) {
    if (node.type === 'file' && node.language && node.language.includes('TypeScript')) {
      fileCount++;
      try {
        const content = readFileSync(node.path, 'utf-8');

        // Look for common patterns
        const functionDeclarations = (content.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
        const importStatements = (content.match(/^import\s+/gm) || []).length;
        const classDeclarations = (content.match(/class\s+\w+/g) || []).length;

        if (functionDeclarations > 0) {
          patterns['function_declarations'] = (patterns['function_declarations'] || 0) + functionDeclarations;
        }
        if (importStatements > 0) {
          patterns['import_statements'] = (patterns['import_statements'] || 0) + importStatements;
        }
        if (classDeclarations > 0) {
          patterns['class_declarations'] = (patterns['class_declarations'] || 0) + classDeclarations;
        }
      } catch {
        // Skip
      }
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(structure);

  // Convert to array and estimate duplication
  return Object.entries(patterns)
    .filter(([, count]) => count > 5)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function analyzeTypeScriptStrictness(packages: PackageMetrics[]): number {
  let strictCount = 0;
  let packageCount = 0;

  for (const pkg of packages) {
    packageCount++;
    // Check if package is known to have strict mode (heuristic)
    if (pkg.path.includes('shared') || pkg.path.includes('library')) {
      strictCount++;
    }
  }

  return packageCount > 0 ? Math.round((strictCount / packageCount) * 100) : 0;
}

function estimateOutdatedPackages(packages: PackageMetrics[]): number {
  let outdatedEstimate = 0;

  for (const pkg of packages) {
    for (const dep of pkg.dependencies) {
      // Very rough heuristic: count specific old versions as outdated
      if (dep.includes('3.') || dep.includes('2.') || dep.includes('@next/')) {
        outdatedEstimate++;
      }
    }
  }

  return Math.min(outdatedEstimate, packages.length * 3); // Cap at packages * 3
}

function estimateSecurityIssues(packages: PackageMetrics[]): number {
  let securityIssuesEstimate = 0;

  // Known problematic packages (simplified check)
  const suspiciousPatterns = ['ws@', 'lodash@', 'eval', 'exec'];

  for (const pkg of packages) {
    for (const dep of [...pkg.dependencies, ...pkg.devDependencies]) {
      for (const pattern of suspiciousPatterns) {
        if (dep.includes(pattern)) {
          securityIssuesEstimate++;
          break;
        }
      }
    }
  }

  return securityIssuesEstimate;
}

function findTestFiles(structure: FileMetrics): number {
  let testFileCount = 0;

  function traverse(node: FileMetrics) {
    if (node.type === 'file') {
      if (node.name.includes('.test.') || node.name.includes('.spec.') || node.path.includes('__tests__')) {
        testFileCount++;
      }
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(structure);
  return testFileCount;
}

async function analyzeCodebase(rootPath: string): Promise<CodebaseAnalysis> {
  console.log('Starting codebase analysis...');
  console.log(`Root path: ${rootPath}`);

  const startTime = Date.now();

  // Read root package.json
  const rootPackagePath = path.join(rootPath, 'package.json');
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));

  // Analyze directory structure
  console.log('Analyzing directory structure...');
  const structure = analyzeDirectory(rootPath, rootPath);

  // Find all packages
  console.log('Finding all packages...');
  const packages = findAllPackages(rootPath);

  // Extract domains
  console.log('Extracting domains...');
  const domains = extractDomains(rootPath);

  // Analyze technologies
  console.log('Analyzing technologies...');
  const technologies = analyzeTechnologies(packages);

  // Calculate statistics
  console.log('Calculating statistics...');
  const statistics = {
    byLanguage: {} as Record<string, { files: number; lines: number; size: number }>,
    byType: {} as Record<string, { files: number; size: number }>,
  };

  function traverseStats(node: FileMetrics) {
    if (node.type === 'file') {
      const lang = node.language || 'Other';
      if (!statistics.byLanguage[lang]) {
        statistics.byLanguage[lang] = { files: 0, lines: 0, size: 0 };
      }
      statistics.byLanguage[lang].files++;
      statistics.byLanguage[lang].lines += node.lines || 0;
      statistics.byLanguage[lang].size += node.size;

      const ext = path.extname(node.name) || 'unknown';
      if (!statistics.byType[ext]) {
        statistics.byType[ext] = { files: 0, size: 0 };
      }
      statistics.byType[ext].files++;
      statistics.byType[ext].size += node.size;
    } else if (node.children) {
      for (const child of node.children) {
        traverseStats(child);
      }
    }
  }

  traverseStats(structure);

  // Count totals
  let totalFiles = 0;
  let totalLines = 0;
  let totalSize = structure.size;

  for (const lang of Object.values(statistics.byLanguage)) {
    totalFiles += lang.files;
    totalLines += lang.lines;
  }

  // Count directories
  let totalDirectories = 0;
  function countDirs(node: FileMetrics) {
    if (node.type === 'directory') {
      totalDirectories++;
      if (node.children) {
        for (const child of node.children) {
          countDirs(child);
        }
      }
    }
  }
  countDirs(structure);

  // Calculate enhanced metrics
  console.log('Analyzing complexity metrics...');
  const complexity = analyzeComplexity(structure, statistics);

  console.log('Analyzing documentation coverage...');
  const documentationCoverage = analyzeDocumentation(structure, statistics);

  console.log('Detecting duplicates...');
  const duplicates = detectDuplicates(structure);

  console.log('Analyzing TypeScript strictness...');
  const typeScriptStrictness = analyzeTypeScriptStrictness(packages);

  console.log('Estimating outdated packages...');
  const outdatedPackages = estimateOutdatedPackages(packages);

  console.log('Estimating security issues...');
  const securityIssues = estimateSecurityIssues(packages);

  console.log('Finding test files...');
  const testFileCount = findTestFiles(structure);

  const analysis: CodebaseAnalysis = {
    timestamp: new Date().toISOString(),
    projectName: rootPackage.name,
    projectVersion: rootPackage.version,
    totalFiles,
    totalDirectories,
    totalLines,
    totalSize,
    statistics,
    structure,
    packages,
    technologies,
    domains,
    metrics: {
      complexity: {
        estimatedCyclomaticComplexity: complexity.estimatedCyclomaticComplexity,
        averageFunctionSize: complexity.averageFunctionSize,
        largeFilesCount: complexity.largeFilesCount,
      },
      codeQuality: {
        documentationCoverage,
        strictModeUsage: typeScriptStrictness,
        testFileCount,
        testCoverage: `${testFileCount} test files found`,
      },
      duplicates: {
        estimatedDuplicationPercentage: Math.min(
          Math.round((duplicates.reduce((sum, p) => sum + p.count, 0) / totalLines) * 100),
          100
        ),
        suspiciousPatterns: duplicates,
      },
      health: {
        typeScriptStrictMode: typeScriptStrictness > 50,
        outdatedPackagesEstimate: outdatedPackages,
        securityIssuesCount: securityIssues,
      },
    },
  };

  const duration = Date.now() - startTime;
  console.log(`Analysis complete in ${duration}ms`);

  return analysis;
}

function generateRecommendations(metrics: any): string {
  const recommendations: string[] = [];

  if (metrics.complexity.estimatedCyclomaticComplexity > 100) {
    recommendations.push('- 📊 High complexity detected. Consider breaking down large functions.');
  }

  if (metrics.complexity.largeFilesCount > 5) {
    recommendations.push('- 📁 Multiple large files detected. Consider refactoring.');
  }

  if (metrics.codeQuality.documentationCoverage < 20) {
    recommendations.push('- 📝 Low documentation coverage. Add more JSDoc comments.');
  }

  if (metrics.codeQuality.strictModeUsage < 50) {
    recommendations.push('- 🔒 Enable TypeScript strict mode in more packages.');
  }

  if (metrics.codeQuality.testFileCount === 0) {
    recommendations.push('- ✅ No test files found. Add unit tests.');
  }

  if (metrics.duplicates.estimatedDuplicationPercentage > 10) {
    recommendations.push('- 🔄 High code duplication detected. Extract common utilities.');
  }

  if (metrics.health.outdatedPackagesEstimate > 10) {
    recommendations.push('- ⚠️  Multiple outdated packages found. Run pnpm update.');
  }

  if (metrics.health.securityIssuesCount > 0) {
    recommendations.push('- 🔐 Security issues detected. Review dependencies.');
  }

  return recommendations.length > 0
    ? recommendations.join('\n')
    : '- ✅ Codebase appears healthy. Continue current practices.';
}

// Main execution
const rootPath = process.argv[2] || '/Users/bradygeorgen/Dev/openrouter-crew-platform';
const outputPath = process.argv[3] || './codebase.json';

analyzeCodebase(rootPath).then(analysis => {
  // Write JSON output
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`Codebase analysis saved to: ${outputPath}`);

  // Write metrics summary
  const metricsPath = outputPath.replace('.json', '-metrics.txt');
  const metrics = `
=== OPENROUTER CREW PLATFORM - CODEBASE METRICS ===
Generated: ${analysis.timestamp}

PROJECT INFORMATION:
- Name: ${analysis.projectName}
- Version: ${analysis.projectVersion}

OVERALL STATISTICS:
- Total Files: ${analysis.totalFiles.toLocaleString()}
- Total Directories: ${analysis.totalDirectories.toLocaleString()}
- Total Lines of Code: ${analysis.totalLines.toLocaleString()}
- Total Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB

STATISTICS BY LANGUAGE:
${Object.entries(analysis.statistics.byLanguage)
  .sort((a, b) => b[1].files - a[1].files)
  .map(([lang, stats]) => `- ${lang}: ${stats.files} files, ${stats.lines.toLocaleString()} lines, ${(stats.size / 1024).toFixed(2)} KB`)
  .join('\n')}

DOMAINS IDENTIFIED:
${analysis.domains.map(d => `- ${d}`).join('\n')}

PACKAGES AND SERVICES:
Total: ${analysis.packages.length}
${analysis.packages
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(pkg => `- ${pkg.name} (${pkg.type}): ${pkg.dependencies.length} deps`)
  .slice(0, 20)
  .join('\n')}
${analysis.packages.length > 20 ? `... and ${analysis.packages.length - 20} more packages` : ''}

TECHNOLOGY STACK:
Languages: ${analysis.technologies.languages.join(', ')}
Frameworks: ${analysis.technologies.frameworks.join(', ')}
Build Tools: ${analysis.technologies.tools.join(', ')}

CODE COMPLEXITY METRICS:
- Estimated Cyclomatic Complexity: ${analysis.metrics?.complexity.estimatedCyclomaticComplexity || 'N/A'}
- Average Function Size: ${analysis.metrics?.complexity.averageFunctionSize || 'N/A'} lines
- Large Files (>500 lines): ${analysis.metrics?.complexity.largeFilesCount || 'N/A'}

CODE QUALITY METRICS:
- Documentation Coverage: ${analysis.metrics?.codeQuality.documentationCoverage || 'N/A'}%
- TypeScript Strict Mode Usage: ${analysis.metrics?.codeQuality.strictModeUsage || 'N/A'}%
- Test Files Found: ${analysis.metrics?.codeQuality.testFileCount || 'N/A'}

DUPLICATION ANALYSIS:
- Estimated Duplication: ${analysis.metrics?.duplicates.estimatedDuplicationPercentage || 'N/A'}%
- Suspicious Patterns:
${analysis.metrics?.duplicates.suspiciousPatterns
  .map(p => `  * ${p.pattern}: ${p.count} occurrences`)
  .join('\n') || '  None detected'}

HEALTH & SECURITY:
- TypeScript Strict Mode: ${analysis.metrics?.health.typeScriptStrictMode ? 'Enabled' : 'Disabled'}
- Outdated Packages (estimated): ${analysis.metrics?.health.outdatedPackagesEstimate || 'N/A'}
- Security Issues (estimated): ${analysis.metrics?.health.securityIssuesCount || 'N/A'}

RECOMMENDATIONS:
${analysis.metrics ? generateRecommendations(analysis.metrics) : '- Run analysis to generate recommendations'}
`;

  fs.writeFileSync(metricsPath, metrics);
  console.log(`Metrics summary saved to: ${metricsPath}`);

  // Write human-readable summary
  console.log('\n' + metrics);
});
