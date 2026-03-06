#!/usr/bin/env node

/**
 * Observation Lounge CLI
 *
 * Allows crew members to submit findings to the observation lounge
 * from the command line, including MCP service integration.
 *
 * Usage Examples:
 *   # Submit an insight
 *   pnpm obs submit-insight "Found pattern in cost data" \
 *     --crew-member "Alex Data" \
 *     --role "data-analytics" \
 *     --project PROJECT_ID \
 *     --confidence 0.85 \
 *     --mcp-service "mcp-cost-forecaster"
 *
 *   # Submit a recommendation
 *   pnpm obs submit-recommendation "Implement caching layer" \
 *     --crew-member "Casey Pragmatic" \
 *     --role "pragmatic-solutions" \
 *     --project PROJECT_ID
 *
 *   # Submit an anomaly
 *   pnpm obs submit-anomaly "Unusual spike in API costs" \
 *     --crew-member "Alex Data" \
 *     --role "data-analytics" \
 *     --project PROJECT_ID \
 *     --confidence 0.95
 *
 *   # View findings
 *   pnpm obs list --project PROJECT_ID --role data-analytics
 *
 *   # View MCP services for your role
 *   pnpm obs mcp-services --role data-analytics
 */

import { program } from 'commander';
import * as chalk from 'chalk';
import { ObservationLounge, Finding, InsightType } from './observation-lounge';

// Initialize CLI
const obs = program
  .name('obs')
  .description('Observation Lounge CLI - Share findings with your crew')
  .version('1.0.0');

/**
 * Submit an insight
 */
obs
  .command('submit-insight <finding>')
  .description('Submit an insight to the observation lounge')
  .option('--crew-member <name>', 'Your crew member name', process.env.CREW_MEMBER || 'Unknown')
  .option('--crew-id <id>', 'Your crew member ID', process.env.CREW_ID || 'unknown')
  .option('--role <role>', 'Your crew role', 'pragmatic-solutions')
  .option('--project <id>', 'Project ID', process.env.PROJECT_ID)
  .option('--confidence <n>', 'Confidence score 0-1', '0.8')
  .option('--mcp-service <name>', 'MCP service used')
  .option('--source <name>', 'Data source')
  .option('--tags <items>', 'Comma-separated tags')
  .option('--draft', 'Save as draft instead of publishing', false)
  .action(async (finding: string, options: any) => {
    try {
      const lounge = new ObservationLounge({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_ANON_KEY || ''
      });

      if (!options.project) {
        throw new Error('--project is required');
      }

      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

      const result = await lounge.submitFinding({
        projectId: options.project,
        crewMemberId: options.crewId,
        crewMemberName: options.crewMember,
        crewMemberRole: options.role,
        finding,
        insightType: 'insight',
        confidence: parseFloat(options.confidence),
        tags,
        mcp_service_used: options.mcpService,
        data_source: options.source,
        status: options.draft ? 'draft' : 'published'
      });

      console.log(chalk.green('✅ Insight submitted!'));
      console.log(`   ID: ${result.id}`);
      console.log(`   Status: ${result.status}`);
      if (result.status === 'draft') {
        console.log(`   Tip: Publish with: pnpm obs publish ${result.id}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Submit a recommendation
 */
obs
  .command('submit-recommendation <finding>')
  .description('Submit a recommendation to the observation lounge')
  .option('--crew-member <name>', 'Your crew member name', process.env.CREW_MEMBER || 'Unknown')
  .option('--crew-id <id>', 'Your crew member ID', process.env.CREW_ID || 'unknown')
  .option('--role <role>', 'Your crew role', 'pragmatic-solutions')
  .option('--project <id>', 'Project ID', process.env.PROJECT_ID)
  .option('--confidence <n>', 'Confidence score 0-1', '0.8')
  .option('--mcp-service <name>', 'MCP service used')
  .option('--source <name>', 'Data source')
  .option('--tags <items>', 'Comma-separated tags')
  .action(async (finding: string, options: any) => {
    try {
      const lounge = new ObservationLounge({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_ANON_KEY || ''
      });

      if (!options.project) {
        throw new Error('--project is required');
      }

      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

      const result = await lounge.submitFinding({
        projectId: options.project,
        crewMemberId: options.crewId,
        crewMemberName: options.crewMember,
        crewMemberRole: options.role,
        finding,
        insightType: 'recommendation',
        confidence: parseFloat(options.confidence),
        tags,
        mcp_service_used: options.mcpService,
        data_source: options.source,
        status: 'published'
      });

      console.log(chalk.green('✅ Recommendation submitted!'));
      console.log(`   ID: ${result.id}`);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Submit an anomaly
 */
obs
  .command('submit-anomaly <finding>')
  .description('Submit an anomaly to the observation lounge')
  .option('--crew-member <name>', 'Your crew member name', process.env.CREW_MEMBER || 'Unknown')
  .option('--crew-id <id>', 'Your crew member ID', process.env.CREW_ID || 'unknown')
  .option('--role <role>', 'Your crew role', 'pragmatic-solutions')
  .option('--project <id>', 'Project ID', process.env.PROJECT_ID)
  .option('--confidence <n>', 'Confidence score 0-1', '0.95')
  .option('--mcp-service <name>', 'MCP service used')
  .option('--source <name>', 'Data source')
  .option('--severity <level>', 'Severity: low|medium|high', 'medium')
  .option('--tags <items>', 'Comma-separated tags')
  .action(async (finding: string, options: any) => {
    try {
      const lounge = new ObservationLounge({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_ANON_KEY || ''
      });

      if (!options.project) {
        throw new Error('--project is required');
      }

      const tags = [
        options.severity,
        ...(options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [])
      ];

      const result = await lounge.submitFinding({
        projectId: options.project,
        crewMemberId: options.crewId,
        crewMemberName: options.crewMember,
        crewMemberRole: options.role,
        finding,
        insightType: 'anomaly',
        confidence: parseFloat(options.confidence),
        tags,
        mcp_service_used: options.mcpService,
        data_source: options.source,
        status: 'published'
      });

      const emojiMap: Record<string, string> = {
        low: '⚠️',
        medium: '⚠️⚠️',
        high: '🚨'
      };
      const severityEmoji = emojiMap[options.severity] || '⚠️';

      console.log(chalk.yellow(`${severityEmoji} Anomaly submitted!`));
      console.log(`   ID: ${result.id}`);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * List findings
 */
obs
  .command('list')
  .description('List findings in the observation lounge')
  .option('--project <id>', 'Project ID', process.env.PROJECT_ID)
  .option('--role <role>', 'Filter by crew role')
  .option('--type <type>', 'Filter by insight type', 'all')
  .option('--limit <n>', 'Limit results', '20')
  .option('--confidence <n>', 'Minimum confidence', '0.1')
  .action(async (options: any) => {
    try {
      const lounge = new ObservationLounge({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_ANON_KEY || ''
      });

      if (!options.project) {
        throw new Error('--project is required');
      }

      const findings = await lounge.getFindings(options.project, {
        role: options.role,
        insightType: options.type === 'all' ? undefined : (options.type as InsightType),
        minConfidence: parseFloat(options.confidence),
        limit: parseInt(options.limit)
      });

      if (findings.length === 0) {
        console.log(chalk.dim('No findings found.'));
        return;
      }

      console.log(chalk.bold(`\n📊 Findings (${findings.length} total)\n`));

      const typeEmoji = {
        insight: '💡',
        recommendation: '✅',
        anomaly: '⚠️',
        pattern: '🔄',
        opportunity: '🎯'
      };

      findings.forEach(finding => {
        const emoji = (typeEmoji as Record<string, string>)[finding.insightType] || '📝';
        const date = new Date(finding.created_at).toLocaleDateString();

        console.log(`${emoji} ${finding.insightType.toUpperCase()}`);
        console.log(`   ${chalk.bold(finding.crewMemberName)} (${finding.crewMemberRole})`);
        console.log(`   ${finding.finding.substring(0, 100)}${finding.finding.length > 100 ? '...' : ''}`);
        console.log(
          `   ${chalk.dim(`Confidence: ${(finding.confidence * 100).toFixed(0)}% | ${date}`)}`
        );
        console.log(`   ${chalk.dim(`ID: ${finding.id}`)}`);
        console.log();
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Show statistics
 */
obs
  .command('stats')
  .description('Show observation lounge statistics')
  .option('--project <id>', 'Project ID', process.env.PROJECT_ID)
  .action(async (options: any) => {
    try {
      const lounge = new ObservationLounge({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_ANON_KEY || ''
      });

      if (!options.project) {
        throw new Error('--project is required');
      }

      const stats = await lounge.getStatistics(options.project);

      console.log(chalk.bold('\n📈 Observation Lounge Statistics\n'));
      console.log(`Total Findings: ${chalk.cyan(stats.totalFindings)}`);
      console.log(`Average Confidence: ${chalk.cyan((stats.averageConfidence * 100).toFixed(1) + '%')}`);

      console.log(chalk.bold('\nBy Crew Role:'));
      Object.entries(stats.byRole).forEach(([role, count]) => {
        console.log(`  ${role}: ${chalk.cyan(count)}`);
      });

      console.log(chalk.bold('\nBy Type:'));
      Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${chalk.cyan(count)}`);
      });

      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Show MCP services for a role
 */
obs
  .command('mcp-services')
  .description('Show recommended MCP services for your crew role')
  .option('--role <role>', 'Your crew role', 'pragmatic-solutions')
  .action((options: any) => {
    const lounge = new ObservationLounge({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_ANON_KEY || ''
    });

    const services = lounge.getMCPServicesForRole(options.role);

    console.log(chalk.bold(`\n🔧 MCP Services for ${options.role}\n`));

    console.log(chalk.bold('Primary Services (must-have):'));
    services.primary.forEach(service => {
      console.log(`  ✓ ${chalk.cyan(service)}`);
    });

    if (services.secondary && services.secondary.length > 0) {
      console.log(chalk.bold('\nSecondary Services (optional):'));
      services.secondary.forEach(service => {
        console.log(`  ○ ${chalk.dim(service)}`);
      });
    }

    if (services.frequency) {
      console.log(chalk.bold('\nRecommended Frequency:'));
      console.log(`  ${chalk.yellow(services.frequency.toUpperCase())}`);
    }

    console.log();
  });

/**
 * Publish a draft finding
 */
obs
  .command('publish <findingId>')
  .description('Publish a draft finding')
  .option('--project <id>', 'Project ID', process.env.PROJECT_ID)
  .action(async (findingId: string, options: any) => {
    try {
      const lounge = new ObservationLounge({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_ANON_KEY || ''
      });

      const result = await lounge.publishFinding(findingId);
      console.log(chalk.green(`✅ Published finding ${result.id}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

export { obs };
