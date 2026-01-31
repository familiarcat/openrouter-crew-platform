#!/usr/bin/env node
/**
 * Link Audit Script
 * Scans all TSX files for Link components and checks if their routes exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_DIR = path.join(__dirname, '../app');
const COMPONENTS_DIR = path.join(__dirname, '../components');

// Known routes in the app
const VALID_ROUTES = new Set([
  '/',
  '/projects',
  '/projects/new',
  '/projects/[id]',
  '/domains',
  '/domains/[domain]',
  '/api/health',
]);

// Route patterns that are dynamic
const DYNAMIC_PATTERNS = [
  /^\/projects\/[a-f0-9-]+$/,
  /^\/domains\/[a-z-]+$/,
];

// Links that should be redirected
const LINK_REDIRECTS = {
  '/portfolio': '/projects',
  '/sprints': '/projects',
  '/categories': '/domains',
  '/create': '/projects/new',
  '/ask': '/',
  '/diagnostics': '/',
  '/deploy-metrics': '/',
  '/env': '/',
  '/crew': '/',
  '/observation-lounge': '/',
  '/docs/overview': '/',
  '/docs/timeline': '/',
  '/docs/categories': '/domains',
  '/docs/portfolio': '/projects',
  '/docs/roadmap': '/',
  '/docs/nextjs_product_factory_best_practices': '/',
  '/docs/assumptions': '/',
};

function findFiles(dir, extension = '.tsx') {
  let results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(findFiles(filePath, extension));
      }
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  }

  return results;
}

function extractLinks(content) {
  const links = [];

  // Match Link components with href
  const linkRegex = /<Link[^>]+href=["']([^"']+)["']/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }

  // Match useRouter().push calls
  const pushRegex = /router\.push\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = pushRegex.exec(content)) !== null) {
    links.push(match[1]);
  }

  return links;
}

function isValidRoute(href) {
  // Check if it's a template literal or variable
  if (href.includes('${') || href.includes('`')) {
    return { valid: true, reason: 'dynamic' };
  }

  // Check exact match
  if (VALID_ROUTES.has(href)) {
    return { valid: true, reason: 'exact' };
  }

  // Check dynamic patterns
  for (const pattern of DYNAMIC_PATTERNS) {
    if (pattern.test(href)) {
      return { valid: true, reason: 'pattern' };
    }
  }

  // Check if it should be redirected
  if (LINK_REDIRECTS[href]) {
    return { valid: false, reason: 'redirect', redirect: LINK_REDIRECTS[href] };
  }

  // Check if it's an external link
  if (href.startsWith('http')) {
    return { valid: true, reason: 'external' };
  }

  // Check if it's a hash link
  if (href.startsWith('#')) {
    return { valid: true, reason: 'hash' };
  }

  return { valid: false, reason: '404' };
}

function auditLinks() {
  console.log('🔍 Auditing links in unified-dashboard...\n');

  const appFiles = findFiles(APP_DIR);
  const componentFiles = findFiles(COMPONENTS_DIR);
  const allFiles = [...appFiles, ...componentFiles];

  const issues = [];
  const summary = {
    totalFiles: allFiles.length,
    totalLinks: 0,
    validLinks: 0,
    redirects: 0,
    broken: 0,
  };

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const links = extractLinks(content);

    if (links.length === 0) continue;

    const relativePath = path.relative(path.join(__dirname, '..'), file);

    for (const link of links) {
      summary.totalLinks++;

      const result = isValidRoute(link);

      if (result.valid) {
        summary.validLinks++;
      } else if (result.reason === 'redirect') {
        summary.redirects++;
        issues.push({
          file: relativePath,
          link,
          type: 'redirect',
          redirect: result.redirect,
        });
      } else {
        summary.broken++;
        issues.push({
          file: relativePath,
          link,
          type: '404',
        });
      }
    }
  }

  // Print summary
  console.log('📊 Summary:');
  console.log(`   Files scanned: ${summary.totalFiles}`);
  console.log(`   Total links: ${summary.totalLinks}`);
  console.log(`   ✅ Valid: ${summary.validLinks}`);
  console.log(`   🔄 Redirects needed: ${summary.redirects}`);
  console.log(`   ❌ Broken: ${summary.broken}\n`);

  // Print issues
  if (issues.length > 0) {
    console.log('🔧 Issues found:\n');

    const byFile = {};
    for (const issue of issues) {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    }

    for (const [file, fileIssues] of Object.entries(byFile)) {
      console.log(`📄 ${file}`);
      for (const issue of fileIssues) {
        if (issue.type === 'redirect') {
          console.log(`   🔄 ${issue.link} → ${issue.redirect}`);
        } else {
          console.log(`   ❌ ${issue.link} (404)`);
        }
      }
      console.log();
    }

    // Generate fixes
    console.log('💡 Suggested fixes:\n');
    console.log('Replace these links:');
    for (const [oldLink, newLink] of Object.entries(LINK_REDIRECTS)) {
      const count = issues.filter(i => i.link === oldLink).length;
      if (count > 0) {
        console.log(`   "${oldLink}" → "${newLink}" (${count} occurrences)`);
      }
    }
  } else {
    console.log('✅ No broken links found!');
  }

  return issues;
}

// Run audit
const issues = auditLinks();
process.exit(issues.length > 0 ? 1 : 0);
