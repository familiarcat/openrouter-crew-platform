import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { WeeklyReportGenerator } from '../services/weekly-report-generator';

export function registerReportCommands(program: Command) {
  const report = program.command('report')
    .description('Generate system reports');

  report.command('generate-weekly')
    .description('Generate weekly cost and observation report')
    .option('--email-to <email>', 'Email recipient', process.env.PM_EMAIL || 'pm@openrouter.local')
    .option('--project <id>', 'Project ID')
    .action(async (options) => {
      // Validate required environment variables
      const requiredEnv = ['SUPABASE_URL', 'SUPABASE_KEY'];
      const missingEnv = requiredEnv.filter(env => !process.env[env]);
      
      if (missingEnv.length > 0) {
        console.error(`❌ Error: Missing required environment variables: ${missingEnv.join(', ')}`);
        process.exit(1);
      }

      console.log('🚀 Generating weekly cost report...');

      const generator = new WeeklyReportGenerator(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_KEY || '',
        {
          host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          user: process.env.EMAIL_USER || 'apikey',
          pass: process.env.EMAIL_PASS || ''
        }
      );

      try {
        const report = await generator.generateReport(options.project);
        const html = generator.generateHtmlReport(report);

        // Send email
        await generator.sendEmail(options.emailTo, report, html);

        // Store in memory
        if (options.project) {
          await generator.storeReportInMemory(report, options.project);
        }

        // Save to file for backup
        const reportPath = path.join(
          process.cwd(),
          `weekly-report-${report.reportDate}.html`
        );
        fs.writeFileSync(reportPath, html);
        console.log(`✅ Report saved to ${reportPath}`);

        console.log(`✅ Report generation complete!`);
      } catch (error) {
        console.error('❌ Failed to generate report:', error);
        process.exit(1);
      }
    });
}