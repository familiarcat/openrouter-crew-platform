import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Comprehensive Milestone/Versioning System for OpenRouter Crew Platform
 * Tracks development stages, semantic versioning, and deployment metadata
 */

export interface VersionMetrics {
  files: number;
  lines: number;
  packages: number;
  commitCount: number;
}

export interface DeploymentInfo {
  local: string;
  remote: string;
  timestamp?: string;
  status?: 'pending' | 'active' | 'archived';
}

export interface Milestone {
  version: string; // e.g., 1.0.0
  stage: 'alpha' | 'beta' | 'rc' | 'release';
  date: string; // ISO date
  features: string[];
  fixes: string[];
  breaking: string[];
  metrics: VersionMetrics;
  deployed: DeploymentInfo;
  gitTag: string;
  commitHash: string;
  contributors: string[];
}

export interface MilestoneHistory {
  current: Milestone;
  previous: Milestone[];
  nextPlanned?: {
    version: string;
    stage: 'alpha' | 'beta' | 'rc' | 'release';
    targetDate?: string;
  };
}

export class MilestoneManager {
  private milestonesDir: string;
  private historyFile: string;
  private metricsFile: string;

  constructor(baseDir: string = process.cwd()) {
    this.milestonesDir = path.join(baseDir, 'milestones');
    this.historyFile = path.join(this.milestonesDir, 'history.json');
    this.metricsFile = path.join(this.milestonesDir, 'metrics.json');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.milestonesDir)) {
      fs.mkdirSync(this.milestonesDir, { recursive: true });
    }
  }

  /**
   * Calculate current codebase metrics
   */
  private async calculateMetrics(): Promise<VersionMetrics> {
    try {
      // Count files (excluding node_modules and dist)
      const fileCount = parseInt(
        execSync(
          `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" | wc -l`,
          { encoding: 'utf-8', cwd: path.dirname(this.milestonesDir) }
        ).trim()
      );

      // Count lines of code
      const lineCount = parseInt(
        execSync(
          `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" -exec wc -l {} + | tail -1 | awk '{print $1}'`,
          { encoding: 'utf-8', cwd: path.dirname(this.milestonesDir) }
        ).trim() || '0'
      );

      // Count packages
      const packageCount = parseInt(
        execSync(
          `find . -name "package.json" ! -path "*/node_modules/*" | wc -l`,
          { encoding: 'utf-8', cwd: path.dirname(this.milestonesDir) }
        ).trim()
      );

      // Count commits
      const commitCount = parseInt(
        execSync(
          `git rev-list --count HEAD`,
          { encoding: 'utf-8', cwd: path.dirname(this.milestonesDir) }
        ).trim() || '0'
      );

      return {
        files: fileCount || 0,
        lines: lineCount || 0,
        packages: packageCount || 0,
        commitCount: commitCount || 0,
      };
    } catch (error) {
      console.warn('Could not calculate metrics:', error);
      return {
        files: 0,
        lines: 0,
        packages: 0,
        commitCount: 0,
      };
    }
  }

  /**
   * Parse semantic version string
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.');
    return {
      major: parseInt(parts[0]) || 0,
      minor: parseInt(parts[1]) || 0,
      patch: parseInt(parts[2]) || 0,
    };
  }

  /**
   * Increment version based on change type
   */
  public incrementVersion(
    currentVersion: string,
    changeType: 'major' | 'minor' | 'patch'
  ): string {
    const { major, minor, patch } = this.parseVersion(currentVersion);

    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return currentVersion;
    }
  }

  /**
   * Detect change type from commits or breaking changes
   */
  public detectChangeType(milestone: Partial<Milestone>): 'major' | 'minor' | 'patch' {
    if (milestone.breaking && milestone.breaking.length > 0) {
      return 'major';
    }
    if (milestone.features && milestone.features.length > 0) {
      return 'minor';
    }
    return 'patch';
  }

  /**
   * Create a new milestone
   */
  public async createMilestone(
    stage: 'alpha' | 'beta' | 'rc' | 'release',
    input: Partial<Milestone> & { currentVersion: string }
  ): Promise<Milestone> {
    const metrics = await this.calculateMetrics();
    const changeType = this.detectChangeType(input);
    const newVersion = this.incrementVersion(input.currentVersion, changeType);

    const now = new Date().toISOString();
    const commitHash = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      cwd: path.dirname(this.milestonesDir),
    }).trim();

    const contributors = this.getContributors();

    const milestone: Milestone = {
      version: newVersion,
      stage,
      date: now,
      features: input.features || [],
      fixes: input.fixes || [],
      breaking: input.breaking || [],
      metrics,
      deployed: input.deployed || {
        local: `/dist/${newVersion}`,
        remote: '',
      },
      gitTag: `v${newVersion}-${stage}`,
      commitHash,
      contributors,
    };

    return milestone;
  }

  /**
   * Get contributors from git log
   */
  private getContributors(): string[] {
    try {
      const output = execSync(
        `git log --format='%aN' --uniq | head -50`,
        { encoding: 'utf-8', cwd: path.dirname(this.milestonesDir) }
      );
      return output
        .split('\n')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Save milestone to file
   */
  public saveMilestone(milestone: Milestone): void {
    const filePath = path.join(this.milestonesDir, `${milestone.version}.json`);
    fs.writeFileSync(filePath, JSON.stringify(milestone, null, 2));
    console.log(`Milestone saved: ${filePath}`);
  }

  /**
   * Save milestone history
   */
  public saveHistory(history: MilestoneHistory): void {
    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    console.log(`History saved: ${this.historyFile}`);
  }

  /**
   * Load milestone history
   */
  public loadHistory(): MilestoneHistory | null {
    if (!fs.existsSync(this.historyFile)) {
      return null;
    }
    const content = fs.readFileSync(this.historyFile, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Load specific milestone
   */
  public loadMilestone(version: string): Milestone | null {
    const filePath = path.join(this.milestonesDir, `${version}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Update history with new milestone
   */
  public addToHistory(newMilestone: Milestone): void {
    const history = this.loadHistory() || {
      current: newMilestone,
      previous: [],
    };

    // Move current to previous
    if (history.current) {
      history.previous.unshift(history.current);
      // Keep only last 20 milestones in history
      if (history.previous.length > 20) {
        history.previous = history.previous.slice(0, 20);
      }
    }

    history.current = newMilestone;
    this.saveHistory(history);
  }

  /**
   * Get all milestones
   */
  public getAllMilestones(): Milestone[] {
    const files = fs.readdirSync(this.milestonesDir).filter((f) => f.endsWith('.json') && f !== 'history.json');
    return files
      .map((file) => {
        try {
          const content = fs.readFileSync(path.join(this.milestonesDir, file), 'utf-8');
          return JSON.parse(content) as Milestone;
        } catch {
          return null;
        }
      })
      .filter((m) => m !== null) as Milestone[];
  }

  /**
   * Generate milestone changelog
   */
  public generateChangelog(milestone: Milestone): string {
    const lines = [
      `# Version ${milestone.version} (${milestone.stage.toUpperCase()})`,
      `Released: ${new Date(milestone.date).toLocaleDateString()}`,
      `Commit: ${milestone.commitHash.substring(0, 7)}`,
      '',
      `## Features`,
      ...milestone.features.map((f) => `- ${f}`),
      '',
      `## Bug Fixes`,
      ...milestone.fixes.map((f) => `- ${f}`),
      '',
      ...(milestone.breaking.length > 0
        ? [
            `## Breaking Changes`,
            ...milestone.breaking.map((b) => `- ${b}`),
            '',
          ]
        : []),
      `## Metrics`,
      `- Files: ${milestone.metrics.files}`,
      `- Lines of Code: ${milestone.metrics.lines}`,
      `- Packages: ${milestone.metrics.packages}`,
      `- Total Commits: ${milestone.metrics.commitCount}`,
      '',
      `## Contributors`,
      ...milestone.contributors.map((c) => `- ${c}`),
      '',
    ];
    return lines.join('\n');
  }

  /**
   * Generate version badge SVG
   */
  public generateVersionBadge(version: string, stage: string): string {
    const colors: Record<string, string> = {
      alpha: 'ff6b6b',
      beta: 'ffd93d',
      rc: '6bcf7f',
      release: '4ecdc4',
    };
    const color = colors[stage] || '95a5a6';

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="120" height="20" role="img" aria-label="version: ${version}">
  <title>version: ${version}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb"/>
    <stop offset="1" stop-color="#999"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="120" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="70" height="20" fill="#555"/>
    <rect x="70" width="50" height="20" fill="#${color}"/>
    <rect width="120" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="360" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="600">version</text>
    <text x="360" y="140" transform="scale(.1)" fill="#fff" textLength="600">version</text>
    <text aria-hidden="true" x="940" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="400">${version}</text>
    <text x="940" y="140" transform="scale(.1)" fill="#fff" textLength="400">${version}</text>
  </g>
</svg>`;
  }

  /**
   * Generate version JSON API
   */
  public generateVersionApi(milestone: Milestone): Record<string, unknown> {
    return {
      version: milestone.version,
      stage: milestone.stage,
      releaseDate: milestone.date,
      gitTag: milestone.gitTag,
      commitHash: milestone.commitHash,
      deployed: milestone.deployed,
      metrics: milestone.metrics,
      features: {
        count: milestone.features.length,
        items: milestone.features,
      },
      fixes: {
        count: milestone.fixes.length,
        items: milestone.fixes,
      },
      breaking: {
        count: milestone.breaking.length,
        items: milestone.breaking,
      },
      contributors: {
        count: milestone.contributors.length,
        list: milestone.contributors,
      },
    };
  }
}

/**
 * Initialize milestone system or update with new milestone
 */
export async function initializeOrUpdateMilestone(): Promise<Milestone> {
  const manager = new MilestoneManager();
  const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
  const currentVersion = pkgJson.version;

  // Create example milestone data
  const newMilestone = await manager.createMilestone('alpha', {
    currentVersion,
    features: ['Platform initialization', 'Core dashboard infrastructure'],
    fixes: [],
    breaking: [],
    deployed: {
      local: `/dist/${currentVersion}`,
      remote: '',
    },
  });

  manager.saveMilestone(newMilestone);
  manager.addToHistory(newMilestone);

  return newMilestone;
}

export default MilestoneManager;
