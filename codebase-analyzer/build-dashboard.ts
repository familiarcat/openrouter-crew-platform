#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

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
  structure: any;
  packages: any[];
  technologies: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  domains: string[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function loadAnalysis(): CodebaseAnalysis {
  const filePath = './codebase.json';
  if (!fs.existsSync(filePath)) {
    throw new Error(`Analysis file not found: ${filePath}. Run 'pnpm analyze' first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function generateFileTree(node: any, indent: number = 0): string {
  const prefix = '  '.repeat(indent);
  const icon = node.type === 'directory' ? '📁' : '📄';
  let html = `<div class="tree-node" style="margin-left: ${indent * 20}px">`;
  html += `<span class="tree-icon">${icon}</span>`;
  html += `<span class="tree-name">${escapeHtml(node.name)}</span>`;

  if (node.type === 'file' && node.language) {
    html += `<span class="tree-language">${node.language}</span>`;
  }
  if (node.size) {
    html += `<span class="tree-size">${formatBytes(node.size)}</span>`;
  }
  html += '</div>';

  if (node.children && node.children.length > 0) {
    html += '<div class="tree-children">';
    for (const child of node.children.slice(0, 50)) {
      html += generateFileTree(child, indent + 1);
    }
    if (node.children.length > 50) {
      html += `<div class="tree-node" style="margin-left: ${(indent + 1) * 20}px; color: #888;">... and ${node.children.length - 50} more items</div>`;
    }
    html += '</div>';
  }

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function generateChart(
  id: string,
  title: string,
  data: Record<string, number>,
  maxItems: number = 8
): string {
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);

  const maxValue = Math.max(...sorted.map(([, v]) => v));
  const bars = sorted
    .map(([label, value]) => {
      const percentage = (value / maxValue) * 100;
      return `<div class="chart-bar">
      <div class="bar-label">${escapeHtml(label)}</div>
      <div class="bar-container">
        <div class="bar" style="width: ${percentage}%"></div>
        <div class="bar-value">${value}</div>
      </div>
    </div>`;
    })
    .join('');

  return `<div class="chart">
    <h3>${title}</h3>
    <div class="chart-bars">
      ${bars}
    </div>
  </div>`;
}

function buildDashboard(analysis: CodebaseAnalysis): string {
  const languageData = Object.entries(analysis.statistics.byLanguage).reduce(
    (acc, [lang, stats]) => ({ ...acc, [lang]: stats.files }),
    {}
  );

  const typeData = Object.entries(analysis.statistics.byType).reduce(
    (acc, [type, stats]) => ({ ...acc, [type || 'unknown']: stats.files }),
    {}
  );

  const languageLines = Object.entries(analysis.statistics.byLanguage).reduce(
    (acc, [lang, stats]) => ({ ...acc, [lang]: stats.lines }),
    {}
  );

  const packageTypeData = analysis.packages.reduce(
    (acc, pkg) => {
      const current = acc[pkg.type] || 0;
      return { ...acc, [pkg.type]: current + 1 };
    },
    {} as Record<string, number>
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRouter Crew Platform - Codebase Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --bg-primary: #1e1e1e;
      --bg-secondary: #252526;
      --bg-tertiary: #2d2d30;
      --border: #3e3e42;
      --text-primary: #cccccc;
      --text-secondary: #858585;
      --accent: #007acc;
      --accent-light: #0e639c;
      --success: #13c313;
      --warning: #ce9178;
      --error: #f48771;
      --info: #4ec9b0;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
    }

    header {
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      border-bottom: 1px solid var(--border);
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--accent) 0%, var(--info) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .meta {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .meta span {
      margin-right: 2rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    section {
      margin-bottom: 3rem;
    }

    h2 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      color: var(--accent);
      border-bottom: 2px solid var(--border);
      padding-bottom: 0.5rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 122, 204, 0.2);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .chart {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart h3 {
      color: var(--accent);
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .chart-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chart-bar {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .bar-label {
      min-width: 150px;
      color: var(--text-secondary);
      font-size: 0.9rem;
      word-break: break-all;
    }

    .bar-container {
      flex: 1;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      min-height: 24px;
      display: flex;
      align-items: center;
    }

    .bar {
      background: linear-gradient(90deg, var(--accent) 0%, var(--info) 100%);
      height: 100%;
      transition: width 0.3s ease;
    }

    .bar-value {
      margin-left: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .tech-stack {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .tech-group {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .tech-group h4 {
      color: var(--accent);
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tech-tag {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      color: var(--info);
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }

    .tech-tag:hover {
      border-color: var(--info);
      background: var(--bg-primary);
    }

    .domains-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .domain-item {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      transition: all 0.2s ease;
    }

    .domain-item:hover {
      border-color: var(--accent);
      background: var(--bg-tertiary);
    }

    .domain-name {
      color: var(--accent);
      font-weight: bold;
    }

    .tree-container {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      max-height: 600px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .tree-node {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      user-select: none;
    }

    .tree-icon {
      display: inline-block;
      width: 20px;
    }

    .tree-name {
      color: var(--text-primary);
      flex: 1;
    }

    .tree-language {
      color: var(--info);
      font-size: 0.85rem;
      margin-left: 1rem;
    }

    .tree-size {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-left: 1rem;
    }

    .tree-children {
      margin-top: 0.25rem;
    }

    .packages-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .packages-table th {
      background: var(--bg-tertiary);
      color: var(--accent);
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-weight: 600;
    }

    .packages-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }

    .packages-table tr:hover {
      background: var(--bg-tertiary);
    }

    .type-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .type-badge.app {
      background: rgba(0, 122, 204, 0.2);
      color: var(--accent);
    }

    .type-badge.library {
      background: rgba(19, 195, 19, 0.2);
      color: var(--success);
    }

    .type-badge.service {
      background: rgba(206, 145, 120, 0.2);
      color: var(--warning);
    }

    .search-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: var(--text-primary);
      font-size: 1rem;
      width: 100%;
      max-width: 400px;
      margin-bottom: 1.5rem;
      transition: all 0.2s ease;
    }

    .search-box:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 8px rgba(0, 122, 204, 0.3);
    }

    .cost-analysis {
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .cost-metric {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .cost-item {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 4px;
      border-left: 3px solid var(--accent);
    }

    .cost-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .cost-value {
      color: var(--info);
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 0.5rem;
    }

    footer {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      padding: 1.5rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 3rem;
    }

    .tabs {
      display: flex;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .tab-button {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 0.75rem 1rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      font-size: 1rem;
    }

    .tab-button:hover {
      color: var(--text-primary);
    }

    .tab-button.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 1.8rem;
      }

      h2 {
        font-size: 1.3rem;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      .tree-container {
        max-height: 400px;
      }

      .packages-table {
        font-size: 0.85rem;
      }

      .packages-table th,
      .packages-table td {
        padding: 0.5rem;
      }
    }

    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--bg-secondary);
    }

    ::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary);
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <h1>OpenRouter Crew Platform</h1>
      <p class="subtitle">Comprehensive Codebase Dashboard</p>
      <div class="meta">
        <span>Version: ${analysis.projectVersion}</span>
        <span>Generated: ${new Date(analysis.timestamp).toLocaleString()}</span>
      </div>
    </div>
  </header>

  <div class="container">
    <!-- Overall Statistics -->
    <section>
      <h2>Overall Statistics</h2>
      <div class="grid">
        <div class="stat-card">
          <div class="stat-value">${formatNumber(analysis.totalFiles)}</div>
          <div class="stat-label">Total Files</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatNumber(analysis.totalLines)}</div>
          <div class="stat-label">Lines of Code</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatBytes(analysis.totalSize)}</div>
          <div class="stat-label">Total Size</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatNumber(analysis.totalDirectories)}</div>
          <div class="stat-label">Directories</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatNumber(analysis.packages.length)}</div>
          <div class="stat-label">Packages</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatNumber(analysis.domains.length)}</div>
          <div class="stat-label">Domains</div>
        </div>
      </div>
    </section>

    <!-- Cost Analysis -->
    <section>
      <h2>Cost Optimization Analysis</h2>
      <div class="cost-analysis">
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          Based on the codebase structure and API call patterns, here's an estimated cost breakdown:
        </p>
        <div class="cost-metric">
          <div class="cost-item">
            <div class="cost-label">Estimated Monthly API Calls</div>
            <div class="cost-value">~${(analysis.packages.length * 500000).toLocaleString()}</div>
          </div>
          <div class="cost-item">
            <div class="cost-label">Primary Model (Claude 3.5 Sonnet)</div>
            <div class="cost-value">$${((analysis.packages.length * 500000 * 0.003) / 1000000).toFixed(2)}K</div>
          </div>
          <div class="cost-item">
            <div class="cost-label">Secondary Model (Claude 3 Haiku)</div>
            <div class="cost-value">$${((analysis.packages.length * 500000 * 0.00025) / 1000000).toFixed(2)}K</div>
          </div>
          <div class="cost-item">
            <div class="cost-label">Optimization Potential</div>
            <div class="cost-value">~${((analysis.packages.length * 500000 * 0.002) / 1000000).toFixed(2)}K/mo</div>
          </div>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 4px; border-left: 3px solid var(--success);">
          <strong style="color: var(--success);">Optimization Recommendations:</strong>
          <ul style="margin-top: 0.5rem; margin-left: 1.5rem; color: var(--text-secondary);">
            <li>Use batched API calls for ${analysis.packages.length} packages during deployment</li>
            <li>Cache frequently accessed domain contexts (${analysis.domains.length} domains)</li>
            <li>Implement request deduplication across ${formatNumber(analysis.totalLines)} lines of code</li>
            <li>Consider streaming responses for large file operations</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Technology Stack -->
    <section>
      <h2>Technology Stack</h2>
      <div class="tech-stack">
        <div class="tech-group">
          <h4>Languages</h4>
          <div class="tech-tags">
            ${analysis.technologies.languages.map(lang => `<span class="tech-tag">${lang}</span>`).join('')}
          </div>
        </div>
        <div class="tech-group">
          <h4>Frameworks</h4>
          <div class="tech-tags">
            ${analysis.technologies.frameworks.map(fw => `<span class="tech-tag">${fw}</span>`).join('')}
          </div>
        </div>
        <div class="tech-group">
          <h4>Build Tools & Infrastructure</h4>
          <div class="tech-tags">
            ${analysis.technologies.tools.map(tool => `<span class="tech-tag">${tool}</span>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Domains & Bounded Contexts -->
    <section>
      <h2>Domains & Bounded Contexts</h2>
      <div class="domains-list">
        ${analysis.domains
          .map(
            domain => `
          <div class="domain-item">
            <div class="domain-name">${domain}</div>
            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem;">
              ${domain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </section>

    <!-- Code Metrics -->
    <section>
      <h2>Code Metrics</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
        <div>
          ${generateChart('languages', 'Files by Language', languageData)}
          ${generateChart('lines', 'Lines of Code by Language', languageLines)}
        </div>
        <div>
          ${generateChart('types', 'Files by Type', typeData)}
          ${generateChart('packages', 'Packages by Type', packageTypeData)}
        </div>
      </div>
    </section>

    <!-- Project Structure -->
    <section>
      <h2>Project Structure (Tree View)</h2>
      <div class="tree-container">
        ${generateFileTree(analysis.structure)}
      </div>
    </section>

    <!-- Packages Overview -->
    <section>
      <h2>Packages & Services (${analysis.packages.length} Total)</h2>
      <input type="text" class="search-box" id="packageSearch" placeholder="Search packages...">
      <table class="packages-table">
        <thead>
          <tr>
            <th>Package Name</th>
            <th>Type</th>
            <th>Version</th>
            <th>Dependencies</th>
            <th>Dev Dependencies</th>
          </tr>
        </thead>
        <tbody id="packagesBody">
          ${analysis.packages
            .slice(0, 50)
            .map(
              pkg => `
            <tr class="package-row" data-name="${escapeHtml(pkg.name.toLowerCase())}">
              <td><code>${escapeHtml(pkg.name)}</code></td>
              <td><span class="type-badge ${pkg.type}">${pkg.type}</span></td>
              <td>${pkg.version || 'N/A'}</td>
              <td>${pkg.dependencies.length}</td>
              <td>${pkg.devDependencies.length}</td>
            </tr>
          `
            )
            .join('')}
          ${analysis.packages.length > 50 ? `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">... and ${analysis.packages.length - 50} more packages</td></tr>` : ''}
        </tbody>
      </table>
    </section>
  </div>

  <footer>
    <p>OpenRouter Crew Platform - Codebase Analysis Dashboard</p>
    <p style="font-size: 0.85rem; margin-top: 0.5rem;">
      Generated on ${new Date(analysis.timestamp).toLocaleDateString()} at ${new Date(analysis.timestamp).toLocaleTimeString()}
    </p>
  </footer>

  <script>
    // Package search functionality
    document.getElementById('packageSearch').addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('.package-row');
      rows.forEach(row => {
        const name = row.dataset.name || '';
        row.style.display = name.includes(searchTerm) ? '' : 'none';
      });
    });

    // Add animation on load
    document.addEventListener('DOMContentLoaded', () => {
      const cards = document.querySelectorAll('.stat-card');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'all 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 50);
      });
    });
  </script>
</body>
</html>`;

  return html;
}

// Main execution
console.log('Building dashboard...');

try {
  const analysis = loadAnalysis();
  const dashboard = buildDashboard(analysis);

  // Ensure output directory exists
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write dashboard HTML
  const dashboardPath = `${outputDir}/index.html`;
  fs.writeFileSync(dashboardPath, dashboard);
  console.log(`Dashboard built successfully: ${dashboardPath}`);

  // Copy analysis JSON to output
  fs.copyFileSync('./codebase.json', `${outputDir}/codebase.json`);
  console.log(`Analysis data copied to output directory`);

  console.log(`\nDashboard is ready! Open ${dashboardPath} in your browser.`);
} catch (error) {
  console.error('Error building dashboard:', error);
  process.exit(1);
}
