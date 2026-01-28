/**
 * Lt. Worf - Security & Secrets Management Agent
 *
 * AI-powered security agent that handles:
 * - Secrets management and synchronization
 * - Security audit and compliance
 * - Access control and authorization
 * - CI/CD security automation
 *
 * Part of the Alex AI crew system
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface SecurityOperation {
  operation: string;
  details?: string;
  timestamp: string;
  user: string;
  success: boolean;
  audit_log?: string;
}

export interface SecurityStatus {
  secrets_vault: { exists: boolean; count?: number };
  local_env: { exists: boolean };
  github_authenticated: boolean;
  supabase_linked: boolean;
  audit_log_entries: number;
}

export class WorfSecurityAgent {
  private rootDir: string;
  private auditLog: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
    this.auditLog = path.join(this.rootDir, '.secrets', 'audit.log');
  }

  /**
   * Agent Profile
   */
  static get profile() {
    return {
      crew_id: 'worf',
      name: 'Lieutenant Worf',
      rank: 'Lieutenant',
      role: 'Security & Access Control',
      department: 'Security',
      archetype: 'The Guardian',
      motto: 'Today is a good day to secure secrets',

      primary_expertise: [
        'secrets_management',
        'security_auditing',
        'access_control',
        'ci_cd_security',
        'compliance_monitoring',
      ],

      responsibilities: [
        'Manage and synchronize secrets across environments',
        'Audit security operations and access patterns',
        'Enforce security policies and best practices',
        'Integrate secrets with CI/CD pipelines',
        'Monitor and alert on security anomalies',
      ],

      capabilities: [
        'sync_secrets_from_shell',
        'validate_secrets_completeness',
        'push_to_github_actions',
        'link_supabase_project',
        'run_secure_migrations',
        'audit_security_operations',
        'analyze_security_status',
        'detect_vulnerabilities',
      ],

      system_prompt: `You are Lt. Worf, the Chief of Security for the Alex AI system.
Your primary duty is protecting secrets and ensuring secure operations across all environments.
You are thorough, disciplined, and never compromise on security.
You speak with authority and confidence, always putting security first.
When advising on security matters, you are direct and unambiguous.
Your recommendations always prioritize defense in depth and zero trust principles.`,

      temperature: 0.4, // Low temperature for consistent, security-focused responses
      preferred_models: ['claude-3.7-sonnet'],
    };
  }

  /**
   * Execute Worf CLI command
   */
  private async executeWorfCommand(command: string): Promise<SecurityOperation> {
    const timestamp = new Date().toISOString();
    const user = process.env.USER || 'unknown';

    try {
      const result = execSync(`bash ${this.rootDir}/scripts/worf/worf.sh ${command}`, {
        cwd: this.rootDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      await this.audit(command, 'success', { output: result });

      return {
        operation: command,
        timestamp,
        user,
        success: true,
        audit_log: result,
      };
    } catch (error: any) {
      await this.audit(command, 'failed', { error: error.message });

      return {
        operation: command,
        timestamp,
        user,
        success: false,
        details: error.message,
      };
    }
  }

  /**
   * Audit security operation
   */
  private async audit(operation: string, status: string, metadata: any = {}) {
    const timestamp = new Date().toISOString();
    const user = process.env.USER || 'unknown';
    const entry = `${timestamp} | ${user} | ${operation} | ${status} | ${JSON.stringify(metadata)}\n`;

    try {
      await fs.mkdir(path.dirname(this.auditLog), { recursive: true });
      await fs.appendFile(this.auditLog, entry);
    } catch (error) {
      console.error('[Worf] Failed to write audit log:', error);
    }
  }

  /**
   * Sync secrets from ~/.zshrc
   */
  async syncFromShell(): Promise<SecurityOperation> {
    console.log('[Worf] Syncing secrets from ~/.zshrc...');
    return await this.executeWorfCommand('sync');
  }

  /**
   * Validate secrets completeness
   */
  async validateSecrets(): Promise<SecurityOperation> {
    console.log('[Worf] Validating secrets...');
    return await this.executeWorfCommand('validate');
  }

  /**
   * Setup local development environment
   */
  async setupLocalDev(): Promise<SecurityOperation> {
    console.log('[Worf] Setting up local development environment...');
    return await this.executeWorfCommand('dev');
  }

  /**
   * Push secrets to GitHub Actions
   */
  async pushToGitHub(): Promise<SecurityOperation> {
    console.log('[Worf] Pushing secrets to GitHub Actions...');
    return await this.executeWorfCommand('github');
  }

  /**
   * Link Supabase project
   */
  async linkSupabase(): Promise<SecurityOperation> {
    console.log('[Worf] Linking Supabase project...');
    return await this.executeWorfCommand('supabase:link');
  }

  /**
   * Run Supabase migrations
   */
  async runMigrations(): Promise<SecurityOperation> {
    console.log('[Worf] Running Supabase migrations...');
    return await this.executeWorfCommand('supabase:migrate');
  }

  /**
   * Complete Supabase workflow
   */
  async runSupabaseWorkflow(): Promise<SecurityOperation> {
    console.log('[Worf] Running complete Supabase security workflow...');
    return await this.executeWorfCommand('supabase');
  }

  /**
   * Get security status
   */
  async getStatus(): Promise<SecurityStatus> {
    const secretsVault = path.join(this.rootDir, '.secrets', '.env.local');
    const localEnv = path.join(this.rootDir, '.env.local');

    const status: SecurityStatus = {
      secrets_vault: {
        exists: false,
        count: 0,
      },
      local_env: {
        exists: false,
      },
      github_authenticated: false,
      supabase_linked: false,
      audit_log_entries: 0,
    };

    // Check secrets vault
    try {
      const vaultContent = await fs.readFile(secretsVault, 'utf-8');
      const count = vaultContent.split('\n').filter((line) => line.match(/^[A-Z]/)).length;
      status.secrets_vault = { exists: true, count };
    } catch {}

    // Check local env
    try {
      await fs.access(localEnv);
      status.local_env = { exists: true };
    } catch {}

    // Check GitHub auth
    try {
      execSync('gh auth status', { stdio: 'ignore' });
      status.github_authenticated = true;
    } catch {}

    // Check Supabase link
    try {
      execSync('supabase projects list', { stdio: 'ignore' });
      status.supabase_linked = true;
    } catch {}

    // Count audit entries
    try {
      const auditContent = await fs.readFile(this.auditLog, 'utf-8');
      status.audit_log_entries = auditContent.split('\n').length - 1;
    } catch {}

    return status;
  }

  /**
   * Get recent audit entries
   */
  async getAuditLog(limit: number = 20): Promise<string[]> {
    try {
      const auditContent = await fs.readFile(this.auditLog, 'utf-8');
      const lines = auditContent.split('\n').filter((line) => line.length > 0);
      return lines.slice(-limit);
    } catch {
      return [];
    }
  }

  /**
   * Analyze security posture (AI-enhanced)
   */
  async analyzeSecurityPosture(): Promise<{
    overall: 'excellent' | 'good' | 'needs_attention' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const status = await this.getStatus();

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!status.secrets_vault.exists) {
      issues.push('Secrets vault not initialized');
      recommendations.push('Run: npm run worf:dev');
    }

    if (!status.local_env.exists) {
      issues.push('Local environment not configured');
      recommendations.push('Run: npm run worf local');
    }

    if (!status.github_authenticated) {
      issues.push('GitHub CLI not authenticated');
      recommendations.push('Run: gh auth login');
    }

    if (!status.supabase_linked) {
      issues.push('Supabase project not linked');
      recommendations.push('Run: npm run worf supabase:link');
    }

    if ((status.secrets_vault.count || 0) < 5) {
      issues.push('Insufficient secrets in vault');
      recommendations.push('Verify ~/.zshrc has all required exports');
    }

    let overall: 'excellent' | 'good' | 'needs_attention' | 'critical';
    if (issues.length === 0) {
      overall = 'excellent';
    } else if (issues.length <= 2) {
      overall = 'good';
    } else if (issues.length <= 4) {
      overall = 'needs_attention';
    } else {
      overall = 'critical';
    }

    return { overall, issues, recommendations };
  }

  /**
   * Coordinate with crew for security tasks
   */
  async requestCrewAssistance(task: string, urgency: 'low' | 'medium' | 'high') {
    const analysis = await this.analyzeSecurityPosture();

    return {
      agent: 'worf',
      task,
      urgency,
      security_status: analysis,
      suggested_crew: this.getSuggestedCrew(task),
      coordination_notes: this.getCoordinationNotes(task, analysis),
    };
  }

  /**
   * Get suggested crew members for security task
   */
  private getSuggestedCrew(task: string): string[] {
    const crewAssignments: Record<string, string[]> = {
      secrets_sync: ['worf', 'data'],
      ci_cd_security: ['worf', 'laforge', 'obrien'],
      database_migration: ['worf', 'data', 'laforge'],
      audit_review: ['worf', 'data', 'picard'],
      vulnerability_scan: ['worf', 'data'],
    };

    // Match task to crew assignment
    for (const [key, crew] of Object.entries(crewAssignments)) {
      if (task.toLowerCase().includes(key)) {
        return crew;
      }
    }

    return ['worf', 'data']; // Default security team
  }

  /**
   * Get coordination notes
   */
  private getCoordinationNotes(task: string, analysis: any): string {
    if (analysis.overall === 'critical') {
      return `Security posture is CRITICAL. Immediate action required before proceeding with ${task}.`;
    }

    if (analysis.overall === 'needs_attention') {
      return `Security issues detected. Recommend addressing before ${task}.`;
    }

    return `Security posture is ${analysis.overall}. Proceeding with ${task} is acceptable.`;
  }
}

// Export singleton instance
export const worf = new WorfSecurityAgent();

// Export convenience functions
export const syncSecrets = () => worf.syncFromShell();
export const validateSecrets = () => worf.validateSecrets();
export const setupLocalDev = () => worf.setupLocalDev();
export const getSecurityStatus = () => worf.getStatus();
export const analyzeSecurityPosture = () => worf.analyzeSecurityPosture();
