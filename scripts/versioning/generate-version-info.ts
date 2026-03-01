import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Generate version information including badges, APIs, and metadata
 * Produces:
 * - Version badge SVG (for README)
 * - Version JSON API
 * - Build metadata file
 * - Deployment status file
 */

interface VersionInfo {
  version: string;
  stage: 'alpha' | 'beta' | 'rc' | 'release';
  buildDate: string;
  gitCommit: string;
  gitBranch: string;
  nodeVersion: string;
  npmVersion: string;
  typescriptVersion: string;
}

interface BuildMetadata {
  timestamp: string;
  version: string;
  stage: string;
  git: {
    commit: string;
    branch: string;
    tag: string;
    upstream: string;
  };
  environment: {
    node: string;
    npm: string;
    typescript: string;
    platform: string;
  };
  codebase: {
    files: number;
    lines: number;
    packages: number;
  };
}

interface DeploymentStatus {
  version: string;
  lastDeployed: string;
  environments: {
    local: {
      status: 'ready' | 'building' | 'failed';
      path: string;
      builtAt: string;
    };
    staging?: {
      status: 'deployed' | 'deploying' | 'failed';
      url: string;
      deployedAt: string;
    };
    production?: {
      status: 'deployed' | 'deploying' | 'failed';
      url: string;
      deployedAt: string;
    };
  };
}

class VersionInfoGenerator {
  private baseDir: string;
  private outputDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
    this.outputDir = path.join(baseDir, '.version-info');
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Get current version info
   */
  private getVersionInfo(): VersionInfo {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(this.baseDir, 'package.json'), 'utf-8'));

    let gitCommit = 'unknown';
    let gitBranch = 'unknown';

    try {
      gitCommit = execSync('git rev-parse HEAD', {
        encoding: 'utf-8',
        cwd: this.baseDir,
      }).trim();
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        cwd: this.baseDir,
      }).trim();
    } catch {
      // Git not available
    }

    let nodeVersion = 'unknown';
    let npmVersion = 'unknown';
    let typescriptVersion = 'unknown';

    try {
      nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
      const tsPkgJson = JSON.parse(
        fs.readFileSync(path.join(this.baseDir, 'node_modules/typescript/package.json'), 'utf-8')
      );
      typescriptVersion = tsPkgJson.version;
    } catch {
      // Versions not available
    }

    return {
      version: pkgJson.version || '0.0.0',
      stage: 'alpha',
      buildDate: new Date().toISOString(),
      gitCommit,
      gitBranch,
      nodeVersion,
      npmVersion,
      typescriptVersion,
    };
  }

  /**
   * Generate version badge SVG
   */
  public generateVersionBadge(version: string, stage: 'alpha' | 'beta' | 'rc' | 'release'): string {
    const colors: Record<string, string> = {
      alpha: 'ff6b6b',
      beta: 'ffd93d',
      rc: '6bcf7f',
      release: '4ecdc4',
    };
    const color = colors[stage] || '95a5a6';
    const label = stage.toUpperCase();

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="140" height="20" role="img" aria-label="version: ${version}">
  <title>version: ${version}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb"/>
    <stop offset="1" stop-color="#999"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="140" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="70" height="20" fill="#555"/>
    <rect x="70" width="70" height="20" fill="#${color}"/>
    <rect width="140" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="360" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="600">version</text>
    <text x="360" y="140" transform="scale(.1)" fill="#fff" textLength="600">version</text>
    <text aria-hidden="true" x="990" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="600">${version}-${label}</text>
    <text x="990" y="140" transform="scale(.1)" fill="#fff" textLength="600">${version}-${label}</text>
  </g>
</svg>`;
  }

  /**
   * Write version badge to file
   */
  public writeBadge(version: string, stage: 'alpha' | 'beta' | 'rc' | 'release'): string {
    const badgeContent = this.generateVersionBadge(version, stage);
    const badgePath = path.join(this.outputDir, 'version-badge.svg');
    fs.writeFileSync(badgePath, badgeContent);
    console.log(`Version badge written to: ${badgePath}`);
    return badgePath;
  }

  /**
   * Generate version JSON API
   */
  public generateVersionApi(): Record<string, unknown> {
    const versionInfo = this.getVersionInfo();

    return {
      version: versionInfo.version,
      stage: versionInfo.stage,
      buildDate: versionInfo.buildDate,
      git: {
        commit: versionInfo.gitCommit,
        branch: versionInfo.gitBranch,
      },
      environment: {
        node: versionInfo.nodeVersion,
        npm: versionInfo.npmVersion,
        typescript: versionInfo.typescriptVersion,
      },
    };
  }

  /**
   * Write version API to file
   */
  public writeVersionApi(): string {
    const api = this.generateVersionApi();
    const apiPath = path.join(this.outputDir, 'version.json');
    fs.writeFileSync(apiPath, JSON.stringify(api, null, 2));
    console.log(`Version API written to: ${apiPath}`);
    return apiPath;
  }

  /**
   * Generate build metadata
   */
  public generateBuildMetadata(): BuildMetadata {
    const versionInfo = this.getVersionInfo();

    // Calculate codebase metrics
    let files = 0;
    let lines = 0;
    let packages = 0;

    try {
      files = parseInt(
        execSync(
          `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" | wc -l`,
          { encoding: 'utf-8', cwd: this.baseDir }
        ).trim() || '0'
      );

      lines = parseInt(
        execSync(
          `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" -exec wc -l {} + | tail -1 | awk '{print $1}'`,
          { encoding: 'utf-8', cwd: this.baseDir }
        ).trim() || '0'
      );

      packages = parseInt(
        execSync(
          `find . -name "package.json" ! -path "*/node_modules/*" | wc -l`,
          { encoding: 'utf-8', cwd: this.baseDir }
        ).trim() || '0'
      );
    } catch {
      // Metrics calculation failed, use defaults
    }

    return {
      timestamp: new Date().toISOString(),
      version: versionInfo.version,
      stage: versionInfo.stage,
      git: {
        commit: versionInfo.gitCommit,
        branch: versionInfo.gitBranch,
        tag: `v${versionInfo.version}-${versionInfo.stage}`,
        upstream: this.getGitRemote(),
      },
      environment: {
        node: versionInfo.nodeVersion,
        npm: versionInfo.npmVersion,
        typescript: versionInfo.typescriptVersion,
        platform: process.platform,
      },
      codebase: {
        files,
        lines,
        packages,
      },
    };
  }

  /**
   * Write build metadata to file
   */
  public writeBuildMetadata(): string {
    const metadata = this.generateBuildMetadata();
    const metadataPath = path.join(this.outputDir, 'build-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Build metadata written to: ${metadataPath}`);
    return metadataPath;
  }

  /**
   * Get git remote URL
   */
  private getGitRemote(): string {
    try {
      return execSync('git config --get remote.origin.url', {
        encoding: 'utf-8',
        cwd: this.baseDir,
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate deployment status
   */
  public generateDeploymentStatus(): DeploymentStatus {
    const versionInfo = this.getVersionInfo();
    const distDir = path.join(this.baseDir, 'dist', versionInfo.version);
    const distExists = fs.existsSync(distDir);

    return {
      version: versionInfo.version,
      lastDeployed: new Date().toISOString(),
      environments: {
        local: {
          status: distExists ? 'ready' : 'failed',
          path: distDir,
          builtAt: distExists ? fs.statSync(distDir).mtime.toISOString() : 'never',
        },
      },
    };
  }

  /**
   * Write deployment status to file
   */
  public writeDeploymentStatus(): string {
    const status = this.generateDeploymentStatus();
    const statusPath = path.join(this.outputDir, 'deployment-status.json');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    console.log(`Deployment status written to: ${statusPath}`);
    return statusPath;
  }

  /**
   * Generate version info HTML page
   */
  public generateVersionPage(): string {
    const versionInfo = this.getVersionInfo();
    const metadata = this.generateBuildMetadata();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenRouter Crew Platform - Version ${versionInfo.version}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
        }
        .version {
            font-size: 24px;
            color: #667eea;
            font-weight: bold;
            margin-bottom: 30px;
        }
        .stage {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .stage.alpha { background: #ff6b6b; color: white; }
        .stage.beta { background: #ffd93d; color: #333; }
        .stage.rc { background: #6bcf7f; color: white; }
        .stage.release { background: #4ecdc4; color: white; }
        .info-group {
            margin-bottom: 25px;
        }
        .info-label {
            color: #999;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        .info-value {
            color: #333;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #eee;
        }
        .metric {
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OpenRouter Crew Platform</h1>
        <div class="version">
            v${versionInfo.version}
            <span class="stage ${versionInfo.stage}">${versionInfo.stage.toUpperCase()}</span>
        </div>

        <div class="info-group">
            <div class="info-label">Build Date</div>
            <div class="info-value">${new Date(versionInfo.buildDate).toLocaleString()}</div>
        </div>

        <div class="info-group">
            <div class="info-label">Git Commit</div>
            <div class="info-value">${versionInfo.gitCommit.substring(0, 7)}</div>
        </div>

        <div class="info-group">
            <div class="info-label">Git Branch</div>
            <div class="info-value">${versionInfo.gitBranch}</div>
        </div>

        <div class="info-group">
            <div class="info-label">Environment</div>
            <div class="info-value">Node ${versionInfo.nodeVersion} | TypeScript ${versionInfo.typescriptVersion}</div>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${metadata.codebase.files}</div>
                <div class="metric-label">Files</div>
            </div>
            <div class="metric">
                <div class="metric-value">${metadata.codebase.lines.toLocaleString()}</div>
                <div class="metric-label">Lines of Code</div>
            </div>
            <div class="metric">
                <div class="metric-value">${metadata.codebase.packages}</div>
                <div class="metric-label">Packages</div>
            </div>
        </div>

        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>OpenRouter Crew Platform © 2026</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Write version info page to file
   */
  public writeVersionPage(): string {
    const versionInfo = this.getVersionInfo();
    const pagePath = path.join(
      this.outputDir,
      `version-${versionInfo.version}-${versionInfo.stage}.html`
    );
    const pageContent = this.generateVersionPage();
    fs.writeFileSync(pagePath, pageContent);
    console.log(`Version page written to: ${pagePath}`);
    return pagePath;
  }

  /**
   * Generate all version info files
   */
  public generateAll(): {
    badge: string;
    api: string;
    metadata: string;
    status: string;
    page: string;
  } {
    const versionInfo = this.getVersionInfo();

    console.log('\n=== Generating Version Information ===\n');
    console.log(`Version: ${versionInfo.version}`);
    console.log(`Stage: ${versionInfo.stage}`);
    console.log(`Git Commit: ${versionInfo.gitCommit.substring(0, 7)}`);
    console.log(`Build Date: ${new Date(versionInfo.buildDate).toLocaleString()}`);
    console.log('\n');

    return {
      badge: this.writeBadge(versionInfo.version, versionInfo.stage),
      api: this.writeVersionApi(),
      metadata: this.writeBuildMetadata(),
      status: this.writeDeploymentStatus(),
      page: this.writeVersionPage(),
    };
  }
}

/**
 * CLI Entry Point
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  const generator = new VersionInfoGenerator();

  switch (command) {
    case 'all':
      generator.generateAll();
      break;
    case 'badge':
      generator.writeBadge('1.0.0', 'alpha');
      break;
    case 'api':
      generator.writeVersionApi();
      break;
    case 'metadata':
      generator.writeBuildMetadata();
      break;
    case 'status':
      generator.writeDeploymentStatus();
      break;
    case 'page':
      generator.writeVersionPage();
      break;
    default:
      console.log('Generate version information for OpenRouter Crew Platform');
      console.log('\nUsage: ts-node scripts/versioning/generate-version-info.ts <command>');
      console.log('\nCommands:');
      console.log('  all       - Generate all version information files');
      console.log('  badge     - Generate version badge SVG');
      console.log('  api       - Generate version API JSON');
      console.log('  metadata  - Generate build metadata');
      console.log('  status    - Generate deployment status');
      console.log('  page      - Generate version info HTML page');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

export { VersionInfoGenerator };
