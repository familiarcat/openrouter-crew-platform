import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

interface CodebaseMetrics {
  totalFiles: number
  totalDirectories: number
  totalLines: number
  totalSize: number
  filesByLanguage: Record<string, number>
  topPackages: Array<{ name: string; type: string; dependencies: number }>
  domains: string[]
  technologies: {
    languages: string[]
    frameworks: string[]
    tools: string[]
  }
}

export class CodebaseAnalysisWebview {
  public static readonly viewId = 'openrouter-crew.codebase-analysis'
  private static instance: CodebaseAnalysisWebview

  private panel: vscode.WebviewPanel | undefined
  private metrics: CodebaseMetrics | undefined
  private refreshInterval: NodeJS.Timer | undefined

  private constructor() {}

  static getInstance(): CodebaseAnalysisWebview {
    if (!CodebaseAnalysisWebview.instance) {
      CodebaseAnalysisWebview.instance = new CodebaseAnalysisWebview()
    }
    return CodebaseAnalysisWebview.instance
  }

  async show(extensionContext: vscode.ExtensionContext): Promise<void> {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two)
      return
    }

    this.panel = vscode.window.createWebviewPanel(
      CodebaseAnalysisWebview.viewId,
      'Codebase Analysis',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        enableForms: true,
        localResourceRoots: [vscode.Uri.file(path.join(extensionContext.extensionPath, 'media'))],
      }
    )

    this.panel.onDidDispose(() => {
      this.panel = undefined
      this.stopAutoRefresh()
    })

    this.panel.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message, extensionContext)
    })

    // Load metrics
    await this.loadMetrics()
    this.updateWebview(extensionContext)

    // Auto-refresh every 30 seconds
    this.startAutoRefresh(extensionContext)
  }

  private async loadMetrics(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) return

      const analysisPath = path.join(workspaceFolder.uri.fsPath, 'codebase.json')
      if (fs.existsSync(analysisPath)) {
        const content = fs.readFileSync(analysisPath, 'utf-8')
        const analysis = JSON.parse(content)

        // Extract metrics from analysis
        const filesByLanguage: Record<string, number> = {}
        for (const [lang, stats] of Object.entries(analysis.statistics.byLanguage || {})) {
          filesByLanguage[lang] = (stats as any).files || 0
        }

        this.metrics = {
          totalFiles: analysis.totalFiles,
          totalDirectories: analysis.totalDirectories,
          totalLines: analysis.totalLines,
          totalSize: analysis.totalSize,
          filesByLanguage,
          topPackages: (analysis.packages || [])
            .slice(0, 10)
            .map((pkg: any) => ({
              name: pkg.name,
              type: pkg.type,
              dependencies: (pkg.dependencies || []).length,
            })),
          domains: analysis.domains || [],
          technologies: analysis.technologies || {
            languages: [],
            frameworks: [],
            tools: [],
          },
        }
      } else {
        vscode.window.showWarningMessage(
          'Codebase analysis not found. Run "pnpm analyze" to generate metrics.'
        )
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load codebase metrics: ${error}`)
    }
  }

  private updateWebview(extensionContext: vscode.ExtensionContext): void {
    if (!this.panel) return

    this.panel.webview.html = this.getHtmlContent(extensionContext)
  }

  private getHtmlContent(extensionContext: vscode.ExtensionContext): string {
    if (!this.metrics) {
      return this.getEmptyStateHtml()
    }

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const formatNumber = (num: number): string => num.toLocaleString()

    const languageCharts = Object.entries(this.metrics.filesByLanguage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(
        ([lang, count]) =>
          `<div class="chart-bar">
        <div class="bar-label">${lang}</div>
        <div class="bar-container">
          <div class="bar" style="width: ${(count / Math.max(...Object.values(this.metrics!.filesByLanguage))) * 100}%"></div>
          <div class="bar-value">${count}</div>
        </div>
      </div>`
      )
      .join('')

    const packagesHtml = this.metrics.topPackages
      .map(
        (pkg) =>
          `<tr>
        <td class="pkg-name">${pkg.name}</td>
        <td class="pkg-type">${pkg.type}</td>
        <td class="pkg-deps">${pkg.dependencies} deps</td>
      </tr>`
      )
      .join('')

    const domainsHtml = this.metrics.domains
      .map((domain) => `<span class="domain-badge">${domain}</span>`)
      .join('')

    const techHtml = `
      <div class="tech-section">
        <h4>Languages</h4>
        <div class="tech-list">${this.metrics.technologies.languages.slice(0, 5).join(', ')}</div>
        <h4>Frameworks</h4>
        <div class="tech-list">${this.metrics.technologies.frameworks.slice(0, 5).join(', ')}</div>
        <h4>Build Tools</h4>
        <div class="tech-list">${this.metrics.technologies.tools.slice(0, 5).join(', ')}</div>
      </div>
    `

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codebase Analysis</title>
  <style>
    :root {
        /* Universal Dark Theme Variable Mapping */
        --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
        --color-bg-secondary: var(--vscode-editor-inactiveSelectionBackground, #252526);
        --color-text-primary: var(--vscode-editor-foreground, #cccccc);
        --color-text-secondary: var(--vscode-descriptionForeground, #858585);
        --color-border: var(--vscode-widget-border, #3e3e42);
        --color-primary-500: var(--vscode-textLink-foreground, #3b82f6);
        --color-button-bg: var(--vscode-button-background, #3b82f6);
        --color-button-hover: var(--vscode-button-hoverBackground, #2563eb);
        --color-input-bg: var(--vscode-input-background, #3c3c3c);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
        'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      color: var(--color-text-primary);
      background-color: var(--color-bg-primary);
      padding: 16px;
      font-size: 12px;
      line-height: 1.5;
    }

    .container {
      max-width: 100%;
    }

    h1 {
      font-size: 18px;
      margin-bottom: 16px;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 8px;
    }

    h2 {
      font-size: 14px;
      margin-top: 16px;
      margin-bottom: 8px;
      color: var(--color-text-secondary);
    }

    h3 {
      font-size: 12px;
      margin-top: 12px;
      margin-bottom: 6px;
      font-weight: 600;
    }

    h4 {
      font-size: 11px;
      margin-top: 8px;
      margin-bottom: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-secondary);
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .metric-card {
      background-color: var(--color-input-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 12px;
      text-align: center;
    }

    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: var(--color-primary-500);
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--color-text-secondary);
      letter-spacing: 0.5px;
    }

    .chart-container {
      background-color: var(--color-input-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .chart-bar {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }

    .bar-label {
      width: 80px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }

    .bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      height: 20px;
      background-color: var(--color-bg-primary);
      border-radius: 2px;
      overflow: hidden;
      gap: 4px;
    }

    .bar {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-500), var(--color-button-bg));
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .bar-value {
      font-size: 10px;
      min-width: 30px;
      text-align: right;
      color: var(--color-text-secondary);
    }

    .domains-section {
      margin-bottom: 16px;
    }

    .domain-badge {
      display: inline-block;
      background-color: var(--color-button-bg);
      color: var(--vscode-button-foreground);
      padding: 2px 6px;
      border-radius: 2px;
      margin-right: 4px;
      margin-bottom: 4px;
      font-size: 10px;
    }

    .tech-section {
      background-color: var(--color-input-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .tech-list {
      font-size: 11px;
      color: var(--color-text-secondary);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }

    th {
      background-color: var(--color-input-bg);
      padding: 6px 4px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }

    td {
      padding: 6px 4px;
      border-bottom: 1px solid var(--color-border);
    }

    tr:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .pkg-name {
      font-weight: 500;
      color: var(--color-primary-500);
    }

    .pkg-type {
      color: var(--color-text-secondary);
    }

    .pkg-deps {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .button-group {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    button {
      flex: 1;
      padding: 6px 8px;
      background-color: var(--color-button-bg);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--color-text-secondary);
    }

    .empty-state p {
      margin-bottom: 16px;
    }

    .last-updated {
      font-size: 10px;
      color: var(--color-text-secondary);
      text-align: right;
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Codebase Analysis Dashboard</h1>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value">${formatNumber(this.metrics.totalFiles)}</div>
        <div class="metric-label">Total Files</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatNumber(this.metrics.totalLines)}</div>
        <div class="metric-label">Lines of Code</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatNumber(this.metrics.totalDirectories)}</div>
        <div class="metric-label">Directories</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatBytes(this.metrics.totalSize)}</div>
        <div class="metric-label">Total Size</div>
      </div>
    </div>

    <h2>Files by Language</h2>
    <div class="chart-container">
      ${languageCharts}
    </div>

    <h2>Domains</h2>
    <div class="domains-section">
      ${domainsHtml}
    </div>

    <h2>Technology Stack</h2>
    ${techHtml}

    <h2>Top Packages</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Type</th>
          <th>Dependencies</th>
        </tr>
      </thead>
      <tbody>
        ${packagesHtml}
      </tbody>
    </table>

    <div class="button-group">
      <button onclick="refresh()">Refresh</button>
      <button onclick="openDashboard()">Full Dashboard</button>
    </div>

    <div class="last-updated">
      Updated: <span id="timestamp">${new Date().toLocaleTimeString()}</span>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi()

    function refresh() {
      vscode.postMessage({ command: 'refresh' })
    }

    function openDashboard() {
      vscode.postMessage({ command: 'openDashboard' })
    }

    // Update timestamp
    setInterval(() => {
      document.getElementById('timestamp').textContent = new Date().toLocaleTimeString()
    }, 1000)

    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      if (event.data.command === 'updateMetrics') {
        location.reload()
      }
    })
  </script>
</body>
</html>`
  }

  private getEmptyStateHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Codebase Analysis</title>
  <style>
    :root {
        /* Universal Dark Theme Variable Mapping */
        --color-bg-primary: var(--vscode-editor-background, #1e1e1e);
        --color-bg-secondary: var(--vscode-editor-inactiveSelectionBackground, #252526);
        --color-text-primary: var(--vscode-editor-foreground, #cccccc);
        --color-text-secondary: var(--vscode-descriptionForeground, #858585);
        --color-border: var(--vscode-widget-border, #3e3e42);
        --color-primary-500: var(--vscode-textLink-foreground, #3b82f6);
        --color-button-bg: var(--vscode-button-background, #3b82f6);
        --color-button-hover: var(--vscode-button-hoverBackground, #2563eb);
        --color-input-bg: var(--vscode-input-background, #3c3c3c);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      color: var(--color-text-primary);
      background-color: var(--color-bg-primary);
      padding: 40px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .empty-state {
      text-align: center;
      color: var(--color-text-secondary);
      max-width: 400px;
    }
    h1 {
      font-size: 16px;
      margin-bottom: 12px;
      color: var(--color-text-primary);
    }
    p {
      margin-bottom: 16px;
      line-height: 1.5;
    }
    code {
      background-color: var(--color-input-bg);
      padding: 2px 4px;
      border-radius: 2px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
    }
    button {
      padding: 8px 16px;
      background-color: var(--color-button-bg);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }
    button:hover {
      background-color: var(--color-button-hover);
    }
  </style>
</head>
<body>
  <div class="empty-state">
    <h1>No Codebase Analysis Data</h1>
    <p>Run the codebase analyzer to generate metrics:</p>
    <code>pnpm analyze && pnpm build:dashboard</code>
    <p style="margin-top: 20px;">
      <button onclick="runAnalysis()">Run Analysis Now</button>
    </p>
  </div>

  <script>
    const vscode = acquireVsCodeApi()

    function runAnalysis() {
      vscode.postMessage({ command: 'runAnalysis' })
    }
  </script>
</body>
</html>`
  }

  private handleMessage(
    message: { command: string },
    extensionContext: vscode.ExtensionContext
  ): void {
    switch (message.command) {
      case 'refresh':
        this.loadMetrics().then(() => this.updateWebview(extensionContext))
        break
      case 'openDashboard':
        this.openFullDashboard()
        break
      case 'runAnalysis':
        this.runAnalyzer()
        break
    }
  }

  private async openFullDashboard(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found')
        return
      }

      const dashboardPath = path.join(workspaceFolder.uri.fsPath, 'codebase-analyzer', 'output', 'index.html')
      if (!fs.existsSync(dashboardPath)) {
        vscode.window.showWarningMessage(
          'Dashboard HTML not found. Run "pnpm build:dashboard" first.'
        )
        return
      }

      // Open in browser
      const fileUri = vscode.Uri.file(dashboardPath)
      vscode.commands.executeCommand('vscode.open', fileUri)
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open dashboard: ${error}`)
    }
  }

  private async runAnalyzer(): Promise<void> {
    try {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Running codebase analysis...',
          cancellable: true,
        },
        async () => {
          const terminal = vscode.window.createTerminal('Codebase Analyzer')
          terminal.show()
          terminal.sendText('pnpm --filter @openrouter-crew/codebase-analyzer analyze && pnpm --filter @openrouter-crew/codebase-analyzer build:dashboard')
        }
      )
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to run analyzer: ${error}`)
    }
  }

  private startAutoRefresh(extensionContext: vscode.ExtensionContext): void {
    this.refreshInterval = setInterval(() => {
      // Check if analysis file has been updated
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (workspaceFolder) {
        const analysisPath = path.join(workspaceFolder.uri.fsPath, 'codebase.json')
        if (fs.existsSync(analysisPath)) {
          const stats = fs.statSync(analysisPath)
          // Refresh if file was modified in the last 2 minutes
          if (Date.now() - stats.mtimeMs < 120000) {
            this.loadMetrics().then(() => this.updateWebview(extensionContext))
          }
        }
      }
    }, 30000) // Every 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = undefined
    }
  }

  dispose(): void {
    this.stopAutoRefresh()
    if (this.panel) {
      this.panel.dispose()
    }
  }
}
