import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import express from 'express';
import nodemailer from 'nodemailer';
import open from 'open';
import { AnalyticsService } from '../services/analytics-service';

export function registerAnalyticsCommands(program: Command) {
  const analytics = program.command('analytics')
    .description('Fetch and display cost and usage analytics');

  analytics.command('summary')
    .description('Show a summary of costs and usage')
    .option('-p, --period <days>', 'Number of days to look back', '7')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);

      try {
        console.log(chalk.blue(`🚀 Fetching analytics summary for the last ${period} days...`));
        const summary = await service.getCostSummary(period, options.project);

        console.log(chalk.bold.yellow(`\n📊 Analytics Summary (Last ${summary.periodDays} Days)`));
        console.log('----------------------------------------');
        console.log(`  Total Cost:    ${chalk.green(`$${summary.totalCost.toFixed(4)}`)}`);
        console.log(`  Total Tokens:  ${chalk.cyan(summary.totalTokens.toLocaleString())}`);
        console.log('----------------------------------------\n');

        if (summary.byModel.length > 0) {
          console.log(chalk.bold.yellow('💰 Cost by Model'));
          console.table(summary.byModel.map(m => ({
            Model: m.model,
            Cost: `$${m.cost.toFixed(4)}`,
            Tokens: m.tokens.toLocaleString()
          })));
        }

        if (summary.byCrewMember.length > 0) {
          console.log(chalk.bold.yellow('\n👥 Cost by Crew Member'));
          console.table(summary.byCrewMember.map(m => ({
            'Crew Member': m.member,
            Cost: `$${m.cost.toFixed(4)}`,
            Tokens: m.tokens.toLocaleString()
          })));
        }
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error fetching analytics: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('export')
    .description('Export cost and usage summary to a CSV file')
    .option('-p, --period <days>', 'Number of days to look back', '7')
    .option('--type <type>', "Type of data to export ('model' or 'crew')", 'model')
    .option('--project <id>', 'Filter by Project ID')
    .option('-o, --output <file>', 'Output file path')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);

      try {
        console.log(chalk.blue(`🚀 Fetching analytics summary for the last ${period} days...`));
        const summary = await service.getCostSummary(period, options.project);

        let csvContent = '';
        let defaultFilename = '';

        if (options.type === 'model') {
          csvContent = 'Model,Cost,Tokens\n';
          summary.byModel.forEach(m => {
            csvContent += `"${m.model}",${m.cost.toFixed(4)},${m.tokens}\n`;
          });
          defaultFilename = `analytics_by_model_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (options.type === 'crew') {
          csvContent = 'Crew Member,Cost,Tokens\n';
          summary.byCrewMember.forEach(m => {
            csvContent += `"${m.member}",${m.cost.toFixed(4)},${m.tokens}\n`;
          });
          defaultFilename = `analytics_by_crew_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          console.error(chalk.red(`❌ Invalid export type '${options.type}'. Must be 'model' or 'crew'.`));
          process.exit(1);
        }

        const outputPath = options.output ? path.resolve(options.output) : path.resolve(process.cwd(), defaultFilename);
        fs.writeFileSync(outputPath, csvContent);
        console.log(chalk.green(`\n✅ Analytics data exported successfully to ${outputPath}`));
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error exporting analytics: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('trend')
    .description('Show daily cost and usage trends')
    .option('-p, --period <days>', 'Number of days to look back', '14')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);

      try {
        console.log(chalk.blue(`🚀 Fetching cost trend for the last ${period} days...`));
        const trendData = await service.getCostTrend(period, options.project);

        if (trendData.length === 0) {
          console.log('No data found for the specified period.');
          return;
        }

        console.log(chalk.bold.yellow(`\n📈 Cost Trend (Last ${period} Days)`));
        
        const maxCost = Math.max(...trendData.map(d => d.cost));
        const maxTokens = Math.max(...trendData.map(d => d.tokens));
        const barWidth = 40;
        const sparklineChars = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

        trendData.forEach(day => {
          const barLength = maxCost > 0 ? Math.round((day.cost / maxCost) * barWidth) : 0;
          const bar = '█'.repeat(barLength);
          const costStr = `$${day.cost.toFixed(4)}`.padEnd(10);
          
          // Calculate sparkline character for tokens
          const tokenIndex = maxTokens > 0 ? Math.min(Math.floor((day.tokens / maxTokens) * (sparklineChars.length - 1)), sparklineChars.length - 1) : 0;
          const tokenSpark = chalk.cyan(sparklineChars[tokenIndex]);

          console.log(`${day.date} | ${chalk.green(bar)} ${costStr} ${tokenSpark} (${day.tokens.toLocaleString()} tokens)`);
        });
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error fetching trend: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('forecast')
    .description('Forecast future costs using linear regression')
    .option('-d, --days <number>', 'Number of days to forecast', '7')
    .option('--history <days>', 'Number of historical days to use', '30')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const days = parseInt(options.days, 10);
      const history = parseInt(options.history, 10);

      try {
        console.log(chalk.blue(`🚀 Forecasting costs for the next ${days} days (based on last ${history} days)...`));
        const { forecast, totalForecastCost, trend, slope } = await service.forecastCosts(days, history, options.project);

        if (forecast.length === 0) {
          console.log('Insufficient historical data to generate a forecast.');
          return;
        }

        console.log(chalk.bold.yellow(`\n🔮 Cost Forecast (Next ${days} Days)`));
        console.log('----------------------------------------');
        console.log(`  Projected Total: ${chalk.green(`$${totalForecastCost.toFixed(4)}`)}`);
        
        let trendColor = chalk.white;
        let trendIcon = '➡️';
        if (trend === 'increasing') { trendColor = chalk.red; trendIcon = '↗️'; }
        if (trend === 'decreasing') { trendColor = chalk.green; trendIcon = '↘️'; }
        
        console.log(`  Trend:           ${trendColor(`${trend.toUpperCase()} ${trendIcon}`)} (Slope: ${slope.toFixed(5)})`);
        console.log('----------------------------------------\n');

        console.log(chalk.bold.yellow('📅 Daily Projections'));
        forecast.forEach(day => {
           console.log(`  ${day.date}: ${chalk.green(`$${day.cost.toFixed(4)}`)}`);
        });
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error generating forecast: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('detailed')
    .description('Show a detailed breakdown of costs for a specific date range')
    .requiredOption('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .requiredOption('--end-date <date>', 'End date (YYYY-MM-DD)')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);

      try {
        console.log(chalk.blue(`🚀 Fetching detailed analytics from ${options.startDate} to ${options.endDate}...`));
        const summary = await service.getDetailedCostSummary(options.startDate, options.endDate, options.project);

        console.log(chalk.bold.yellow(`\n📊 Detailed Analytics (${summary.startDate} to ${summary.endDate})`));
        console.log('----------------------------------------');
        console.log(`  Total Cost:    ${chalk.green(`$${summary.totalCost.toFixed(4)}`)}`);
        console.log(`  Total Tokens:  ${chalk.cyan(summary.totalTokens.toLocaleString())}`);
        console.log('----------------------------------------\n');

        if (summary.byModel.length > 0) {
          console.log(chalk.bold.yellow('💰 Cost by Model'));
          console.table(summary.byModel.map(m => ({
            Model: m.model,
            Cost: `$${m.cost.toFixed(4)}`,
            Tokens: m.tokens.toLocaleString()
          })));
        }

        if (summary.byCrewMember.length > 0) {
          console.log(chalk.bold.yellow('\n👥 Cost by Crew Member'));
          console.table(summary.byCrewMember.map(m => ({
            'Crew Member': m.member,
            Cost: `$${m.cost.toFixed(4)}`,
            Tokens: m.tokens.toLocaleString()
          })));
        }
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error fetching detailed analytics: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('alert')
    .description('Check if forecasted cost exceeds a budget threshold')
    .requiredOption('--threshold <amount>', 'Budget threshold to check against')
    .option('-d, --days <number>', 'Number of days to forecast', '7')
    .option('--history <days>', 'Number of historical days to use', '30')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const days = parseInt(options.days, 10);
      const history = parseInt(options.history, 10);
      const threshold = parseFloat(options.threshold);

      try {
        console.log(chalk.blue(`Forecasting costs for the next ${days} days to check against threshold of $${threshold}...`));
        const { totalForecastCost, trend } = await service.forecastCosts(days, history, options.project);

        console.log(`\nProjected cost for the next ${days} days: ${chalk.yellow(`$${totalForecastCost.toFixed(4)}`)}`);
        console.log(`Budget Threshold: ${chalk.cyan(`$${threshold.toFixed(4)}`)}`);

        if (totalForecastCost > threshold) {
          const overage = totalForecastCost - threshold;
          console.log(chalk.red.bold(`\n🚨 ALERT: Forecasted cost exceeds threshold by $${overage.toFixed(4)}!`));
          console.log(chalk.red(`   The cost trend is ${trend.toUpperCase()}.`));
          process.exit(1); // Exit with error code for scripting
        } else {
          const headroom = threshold - totalForecastCost;
          console.log(chalk.green.bold(`\n✅ OK: Forecasted cost is within budget.`));
          console.log(chalk.green(`   Budget headroom: $${headroom.toFixed(4)}.`));
        }

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error running budget alert: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('compare')
    .description('Compare costs between two time periods')
    .requiredOption('--p1-start <date>', 'Period 1 Start (YYYY-MM-DD)')
    .requiredOption('--p1-end <date>', 'Period 1 End (YYYY-MM-DD)')
    .requiredOption('--p2-start <date>', 'Period 2 Start (YYYY-MM-DD)')
    .requiredOption('--p2-end <date>', 'Period 2 End (YYYY-MM-DD)')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);

      try {
        console.log(chalk.blue(`🚀 Comparing periods: [${options.p1Start} to ${options.p1End}] vs [${options.p2Start} to ${options.p2End}]...`));
        
        const comparison = await service.comparePeriods(
          options.p1Start, options.p1End,
          options.p2Start, options.p2End,
          options.project
        );

        console.log(chalk.bold.yellow('\n📊 Period Comparison'));
        console.log('--------------------------------------------------');
        console.log(`Metric          | Period 1       | Period 2       | Change`);
        console.log('----------------|----------------|----------------|-------');

        const formatCost = (c: number) => `$${c.toFixed(4)}`.padEnd(14);
        const formatTokens = (t: number) => t.toLocaleString().padEnd(14);
        
        const costChangeColor = comparison.costDiff > 0 ? chalk.red : chalk.green;
        const costChangeIcon = comparison.costDiff > 0 ? '🔺' : '🔻';
        const costChangeStr = costChangeColor(`${costChangeIcon} $${Math.abs(comparison.costDiff).toFixed(4)}`);

        console.log(`Total Cost      | ${formatCost(comparison.period1.totalCost)} | ${formatCost(comparison.period2.totalCost)} | ${costChangeStr}`);
        console.log(`Total Tokens    | ${formatTokens(comparison.period1.totalTokens)} | ${formatTokens(comparison.period2.totalTokens)} | ${comparison.tokenDiff > 0 ? '+' : ''}${comparison.tokenDiff.toLocaleString()}`);
        console.log('--------------------------------------------------\n');

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error comparing periods: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('report')
    .description('Generate a comprehensive PDF report with charts and tables')
    .option('-p, --period <days>', 'Number of days to look back', '30')
    .option('--project <id>', 'Filter by Project ID')
    .option('-o, --output <file>', 'Output file path', 'cost-report.pdf')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);
      const outputPath = path.resolve(options.output);

      try {
        console.log(chalk.blue(`🚀 Generating PDF report for the last ${period} days...`));
        
        const [summary, trend] = await Promise.all([
          service.getCostSummary(period, options.project),
          service.getCostTrend(period, options.project)
        ]);

        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).text('OpenRouter Crew Cost Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { align: 'center' });
        doc.text(`Period: Last ${period} Days`, { align: 'center' });
        if (options.project) doc.text(`Project: ${options.project}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Executive Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Cost: $${summary.totalCost.toFixed(4)}`);
        doc.text(`Total Tokens: ${summary.totalTokens.toLocaleString()}`);
        doc.moveDown(2);

        // Cost Trend Chart
        if (trend.length > 0) {
          doc.fontSize(16).text('Daily Cost Trend', { underline: true });
          doc.moveDown();
          
          const chartHeight = 150;
          const chartWidth = 450;
          const startX = 50;
          const startY = doc.y;
          
          const maxCost = Math.max(...trend.map(d => d.cost));
          const barWidth = (chartWidth / trend.length) - 2;

          // Draw axes
          doc.lineWidth(1).moveTo(startX, startY).lineTo(startX, startY + chartHeight).stroke(); // Y
          doc.moveTo(startX, startY + chartHeight).lineTo(startX + chartWidth, startY + chartHeight).stroke(); // X

          // Draw bars
          trend.forEach((day, i) => {
            const barHeight = maxCost > 0 ? (day.cost / maxCost) * chartHeight : 0;
            const x = startX + (i * (barWidth + 2)) + 2;
            const y = startY + chartHeight - barHeight;
            
            doc.rect(x, y, barWidth, barHeight).fill('#3498db');
          });
          
          // Reset color
          doc.fillColor('black');
          doc.text(`Max Daily: $${maxCost.toFixed(2)}`, startX + 10, startY + 10);
          doc.moveDown(10);
        }

        // Helper for tables
        const drawTable = (title: string, headers: string[], rows: string[][]) => {
          doc.addPage();
          doc.fontSize(16).text(title, { underline: true });
          doc.moveDown();
          
          const colWidth = 150;
          let y = doc.y;

          // Headers
          doc.fontSize(12).font('Helvetica-Bold');
          headers.forEach((h, i) => doc.text(h, 50 + (i * colWidth), y));
          y += 20;
          doc.moveTo(50, y).lineTo(500, y).stroke();
          y += 10;

          // Rows
          doc.font('Helvetica');
          rows.forEach(row => {
            if (y > 700) { doc.addPage(); y = 50; }
            row.forEach((cell, i) => doc.text(cell, 50 + (i * colWidth), y));
            y += 20;
          });
        };

        drawTable('Cost by Model', ['Model', 'Cost', 'Tokens'], summary.byModel.map(m => [m.model, `$${m.cost.toFixed(4)}`, m.tokens.toLocaleString()]));
        drawTable('Cost by Crew Member', ['Member', 'Cost', 'Tokens'], summary.byCrewMember.map(m => [m.member, `$${m.cost.toFixed(4)}`, m.tokens.toLocaleString()]));

        doc.end();

        console.log(chalk.green(`\n✅ Report generated successfully: ${outputPath}`));
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error generating report: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('dashboard')
    .description('Launch a local web dashboard with interactive charts')
    .option('-p, --period <days>', 'Number of days to look back', '30')
    .option('--project <id>', 'Filter by Project ID')
    .option('--port <number>', 'Port to run the server on', '3005')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);
      const port = parseInt(options.port, 10);

      try {
        console.log(chalk.blue(`🚀 Preparing dashboard data for the last ${period} days...`));
        
        const [summary, trend] = await Promise.all([
          service.getCostSummary(period, options.project),
          service.getCostTrend(period, options.project)
        ]);

        const app = express();

        app.get('/', (req, res) => {
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>OpenRouter Crew Analytics</title>
              <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
              <style>
                body { font-family: system-ui, sans-serif; padding: 20px; background: #f4f4f9; }
                .container { max-width: 1200px; margin: 0 auto; }
                .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
                h1 { color: #333; }
                .metrics { display: flex; gap: 20px; margin-bottom: 20px; }
                .metric { flex: 1; background: #3498db; color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .metric h2 { margin: 0; font-size: 2em; }
                .metric p { margin: 0; opacity: 0.9; }
                .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .chart-container { position: relative; height: 300px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>📊 Crew Analytics Dashboard</h1>
                <div class="metrics">
                  <div class="metric">
                    <h2>$${summary.totalCost.toFixed(4)}</h2>
                    <p>Total Cost (${period} days)</p>
                  </div>
                  <div class="metric" style="background: #2ecc71;">
                    <h2>${summary.totalTokens.toLocaleString()}</h2>
                    <p>Total Tokens</p>
                  </div>
                </div>

                <div class="card">
                  <h3>Daily Cost Trend</h3>
                  <div class="chart-container">
                    <canvas id="trendChart"></canvas>
                  </div>
                </div>

                <div class="charts">
                  <div class="card">
                    <h3>Cost by Model</h3>
                    <div class="chart-container">
                      <canvas id="modelChart"></canvas>
                    </div>
                  </div>
                  <div class="card">
                    <h3>Cost by Crew Member</h3>
                    <div class="chart-container">
                      <canvas id="crewChart"></canvas>
                    </div>
                  </div>
                </div>
              </div>

              <script>
                const trendData = ${JSON.stringify(trend)};
                const summaryData = ${JSON.stringify(summary)};

                new Chart(document.getElementById('trendChart'), {
                  type: 'line',
                  data: {
                    labels: trendData.map(d => d.date),
                    datasets: [{
                      label: 'Daily Cost ($)',
                      data: trendData.map(d => d.cost),
                      borderColor: '#3498db',
                      tension: 0.1,
                      fill: true,
                      backgroundColor: 'rgba(52, 152, 219, 0.1)'
                    }]
                  },
                  options: { responsive: true, maintainAspectRatio: false }
                });

                new Chart(document.getElementById('modelChart'), {
                  type: 'doughnut',
                  data: {
                    labels: summaryData.byModel.map(m => m.model),
                    datasets: [{
                      data: summaryData.byModel.map(m => m.cost),
                      backgroundColor: ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6']
                    }]
                  },
                  options: { responsive: true, maintainAspectRatio: false }
                });

                new Chart(document.getElementById('crewChart'), {
                  type: 'bar',
                  data: {
                    labels: summaryData.byCrewMember.map(m => m.member),
                    datasets: [{
                      label: 'Cost ($)',
                      data: summaryData.byCrewMember.map(m => m.cost),
                      backgroundColor: '#9b59b6'
                    }]
                  },
                  options: { responsive: true, maintainAspectRatio: false }
                });
              </script>
            </body>
            </html>
          `;
          res.send(html);
        });

        app.listen(port, async () => {
          const url = `http://localhost:${port}`;
          console.log(chalk.green(`\n✅ Dashboard running at ${url}`));
          console.log(chalk.dim('Press Ctrl+C to stop the server'));
          await open(url);
        });

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error launching dashboard: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('email')
    .description('Generate and email a PDF report to recipients')
    .requiredOption('--to <emails>', 'Comma-separated list of email recipients')
    .option('-p, --period <days>', 'Number of days to look back', '30')
    .option('--project <id>', 'Filter by Project ID')
    .option('--subject <text>', 'Email subject line', 'OpenRouter Crew Cost Report')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      // Email configuration check
      const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        user: process.env.EMAIL_USER || 'apikey',
        pass: process.env.EMAIL_PASS || ''
      };

      if (!emailConfig.pass) {
        console.error(chalk.red('❌ Error: Missing EMAIL_PASS environment variable.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);
      const recipients = options.to.split(',').map((e: string) => e.trim());
      const tempFilePath = path.resolve(process.cwd(), `temp-report-${Date.now()}.pdf`);

      try {
        console.log(chalk.blue(`🚀 Generating PDF report for the last ${period} days...`));
        
        const [summary, trend] = await Promise.all([
          service.getCostSummary(period, options.project),
          service.getCostTrend(period, options.project)
        ]);

        // Generate PDF (Same logic as report command)
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(tempFilePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24).text('OpenRouter Crew Cost Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, { align: 'center' });
        doc.text(`Period: Last ${period} Days`, { align: 'center' });
        if (options.project) doc.text(`Project: ${options.project}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Executive Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Cost: $${summary.totalCost.toFixed(4)}`);
        doc.text(`Total Tokens: ${summary.totalTokens.toLocaleString()}`);
        doc.moveDown(2);

        // Cost Trend Chart
        if (trend.length > 0) {
          doc.fontSize(16).text('Daily Cost Trend', { underline: true });
          doc.moveDown();
          
          const chartHeight = 150;
          const chartWidth = 450;
          const startX = 50;
          const startY = doc.y;
          
          const maxCost = Math.max(...trend.map(d => d.cost));
          const barWidth = (chartWidth / trend.length) - 2;

          doc.lineWidth(1).moveTo(startX, startY).lineTo(startX, startY + chartHeight).stroke();
          doc.moveTo(startX, startY + chartHeight).lineTo(startX + chartWidth, startY + chartHeight).stroke();

          trend.forEach((day, i) => {
            const barHeight = maxCost > 0 ? (day.cost / maxCost) * chartHeight : 0;
            const x = startX + (i * (barWidth + 2)) + 2;
            const y = startY + chartHeight - barHeight;
            doc.rect(x, y, barWidth, barHeight).fill('#3498db');
          });
          
          doc.fillColor('black');
          doc.text(`Max Daily: $${maxCost.toFixed(2)}`, startX + 10, startY + 10);
          doc.moveDown(10);
        }

        doc.end();

        // Wait for PDF to finish writing
        await new Promise((resolve) => stream.on('finish', resolve));

        console.log(chalk.blue(`📧 Sending email to ${recipients.length} recipients...`));

        const transporter = nodemailer.createTransport({
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.port === 465,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'crew-platform@openrouter.local',
          to: recipients,
          subject: options.subject,
          text: `Please find attached the cost report for the last ${period} days.\n\nTotal Cost: $${summary.totalCost.toFixed(4)}\nTotal Tokens: ${summary.totalTokens.toLocaleString()}`,
          attachments: [
            {
              filename: `cost-report-${new Date().toISOString().split('T')[0]}.pdf`,
              path: tempFilePath
            }
          ]
        });

        console.log(chalk.green(`✅ Email sent successfully!`));

        // Cleanup temp file
        fs.unlinkSync(tempFilePath);

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error sending email: ${error.message}`));
        // Cleanup temp file if it exists
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        process.exit(1);
      }
    });

  analytics.command('benchmark')
    .description('Compare project costs against industry averages (simulated)')
    .option('-p, --period <days>', 'Number of days to look back', '30')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);

      try {
        console.log(chalk.blue(`🚀 Benchmarking costs for the last ${period} days...`));
        const benchmark = await service.getBenchmarkComparison(period, options.project);

        console.log(chalk.bold.yellow(`\n📊 Industry Benchmark Comparison`));
        console.log('----------------------------------------');
        
        const ratingColor = {
          'Excellent': chalk.green,
          'Good': chalk.green,
          'Average': chalk.yellow,
          'Poor': chalk.red
        }[benchmark.efficiencyRating];

        console.log(`  Efficiency Rating: ${ratingColor(benchmark.efficiencyRating)}`);
        console.log(`  Your Cost:         $${benchmark.projectCost.toFixed(4)}`);
        console.log(`  Industry Avg:      $${benchmark.industryAverageCost.toFixed(4)}`);
        
        const diffColor = benchmark.costDifference <= 0 ? chalk.green : chalk.red;
        const diffSign = benchmark.costDifference > 0 ? '+' : '';
        console.log(`  Difference:        ${diffColor(`${diffSign}$${benchmark.costDifference.toFixed(4)} (${diffSign}${benchmark.percentDifference.toFixed(1)}%)`)}`);
        
        console.log('----------------------------------------');
        console.log(`  Your Cost/1k Tokens:     $${benchmark.projectCostPer1kTokens.toFixed(5)}`);
        console.log(`  Industry Avg/1k Tokens:  $${benchmark.industryAverageCostPer1kTokens.toFixed(5)}`);
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error running benchmark: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('optimization')
    .description('Suggest cost-saving measures based on usage patterns')
    .option('-p, --period <days>', 'Number of days to analyze', '30')
    .option('--project <id>', 'Filter by Project ID')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);

      try {
        console.log(chalk.blue(`🚀 Analyzing usage patterns for optimization opportunities (last ${period} days)...`));
        const suggestions = await service.getOptimizationSuggestions(period, options.project);

        if (suggestions.length === 0) {
          console.log(chalk.green('\n✅ No significant optimizations found. Your crew is running efficiently!'));
          return;
        }

        console.log(chalk.bold.yellow(`\n💡 Optimization Suggestions`));
        console.log('----------------------------------------');

        let totalPotentialSavings = 0;

        suggestions.forEach((suggestion, index) => {
          totalPotentialSavings += suggestion.potentialSavings;
          const impactColor = suggestion.impact === 'high' ? chalk.green : (suggestion.impact === 'medium' ? chalk.yellow : chalk.dim);

          console.log(`${index + 1}. ${chalk.bold(suggestion.title)}  ${impactColor(`[${suggestion.impact.toUpperCase()} IMPACT]`)}`);
          console.log(`   ${suggestion.description}`);
          console.log(`   Potential Savings: ${chalk.green(`$${suggestion.potentialSavings.toFixed(2)}`)}`);
          console.log('');
        });

        console.log('----------------------------------------');
        console.log(`Total Potential Savings: ${chalk.green.bold(`$${totalPotentialSavings.toFixed(2)}`)}`);
        console.log('');
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error running optimization analysis: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('anomaly')
    .description('Detect cost anomalies using statistical analysis (Z-score)')
    .option('-p, --period <days>', 'Number of days to analyze', '30')
    .option('--project <id>', 'Filter by Project ID')
    .option('--sensitivity <score>', 'Z-score threshold for detection', '2')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);
      const sensitivity = parseFloat(options.sensitivity);

      try {
        console.log(chalk.blue(`🚀 Scanning for cost anomalies (last ${period} days, sensitivity: ${sensitivity})...`));
        const anomalies = await service.detectAnomalies(period, options.project, sensitivity);

        if (anomalies.length === 0) {
          console.log(chalk.green('\n✅ No cost anomalies detected. Spending is within normal variance.'));
          return;
        }

        console.log(chalk.bold.yellow(`\n🚨 Detected Anomalies`));
        console.log('----------------------------------------');

        anomalies.forEach(anomaly => {
          const severityColor = anomaly.severity === 'high' ? chalk.red : (anomaly.severity === 'medium' ? chalk.yellow : chalk.blue);
          console.log(`${anomaly.date}: ${chalk.bold(`$${anomaly.cost.toFixed(4)}`)}  ${severityColor(`[${anomaly.severity.toUpperCase()}]`)} (Z-Score: ${anomaly.zScore.toFixed(2)})`);
        });
        console.log('');

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error detecting anomalies: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('export-json')
    .description('Export raw analytics summary data to a JSON file')
    .option('-p, --period <days>', 'Number of days to look back', '7')
    .option('--project <id>', 'Filter by Project ID')
    .option('-o, --output <file>', 'Output file path (prints to stdout if not provided)')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);

      try {
        if (options.output) {
          console.log(chalk.blue(`🚀 Fetching analytics summary for the last ${period} days...`));
        }
        const summary = await service.getCostSummary(period, options.project);

        const jsonContent = JSON.stringify(summary, null, 2);

        if (options.output) {
          const outputPath = path.resolve(options.output);
          fs.writeFileSync(outputPath, jsonContent);
          console.log(chalk.green(`\n✅ Raw analytics data exported successfully to ${outputPath}`));
        } else {
          console.log(jsonContent);
        }
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error exporting JSON analytics: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('budget-history')
    .description('Show how the budget has changed over time for a project')
    .requiredOption('--project <id>', 'Project ID to show budget history for')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);

      try {
        console.log(chalk.blue(`🚀 Fetching budget history for project ${options.project}...`));
        const history = await service.getBudgetHistory(options.project);

        if (history.length === 0) {
          console.log(chalk.yellow('\nNo budget history found for this project.'));
          return;
        }

        console.log(chalk.bold.yellow(`\n💰 Budget History for Project ${options.project}`));
        
        console.table(history.map(event => ({
          Date: new Date(event.created_at).toLocaleDateString(),
          'New Budget': event.new_budget ? `$${parseFloat(event.new_budget).toFixed(2)}` : 'N/A',
          'Change Reason': event.content,
        })));

      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error fetching budget history: ${error.message}`));
        process.exit(1);
      }
    });

  analytics.command('top-users')
    .description('Identify the most active crew members based on cost and usage')
    .option('-p, --period <days>', 'Number of days to analyze', '30')
    .option('--project <id>', 'Filter by Project ID')
    .option('-l, --limit <number>', 'Limit the number of users shown', '10')
    .action(async (options) => {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error(chalk.red('❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.'));
        process.exit(1);
      }

      const service = new AnalyticsService(supabaseUrl, supabaseKey);
      const period = parseInt(options.period, 10);
      const limit = parseInt(options.limit, 10);

      try {
        console.log(chalk.blue(`🚀 Identifying top crew members for the last ${period} days...`));
        const topUsers = await service.getTopUsers(period, options.project);

        console.log(chalk.bold.yellow(`\n🏆 Top Active Crew Members`));
        console.log('----------------------------------------');

        console.table(topUsers.slice(0, limit).map((user, index) => ({
          Rank: index + 1,
          Member: user.member,
          Cost: `$${user.cost.toFixed(4)}`,
          Tokens: user.tokens.toLocaleString()
        })));
      } catch (error: any) {
        console.error(chalk.red(`\n❌ Error fetching top users: ${error.message}`));
        process.exit(1);
      }
    });
}