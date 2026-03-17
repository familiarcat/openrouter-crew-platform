import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { MemoryService } from '@openrouter-crew/agent-memory';
import type {
  LlmUsageEvent,
  ObservationLoungeFinding,
  WeeklyCostReport
} from '@openrouter-crew/schemas';

export class WeeklyReportGenerator {
  private supabase: ReturnType<typeof createClient>;
  private memoryService: MemoryService;
  private emailTransporter: nodemailer.Transporter;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    emailConfig: {
      host: string;
      port: number;
      user: string;
      pass: string;
    }
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.memoryService = new MemoryService({
      supabaseUrl,
      supabaseKey
    });
    this.emailTransporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });
  }

  /**
   * Fetch cost data for the past week
   */
  async fetchWeeklyCosts(projectId?: string): Promise<LlmUsageEvent[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let query = this.supabase
      .from('llm_usage_events')
      .select('*')
      .gte('created_at', oneWeekAgo.toISOString());

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch crew observations from the observation lounge
   */
  async fetchObservations(
    projectId?: string
  ): Promise<ObservationLoungeFinding[]> {
    let query = this.supabase
      .from('observation_lounge_findings')
      .select('*')
      .eq('status', 'published');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate the weekly report from cost and observation data
   */
  async generateReport(projectId?: string): Promise<WeeklyCostReport> {
    const costs: LlmUsageEvent[] = await this.fetchWeeklyCosts(projectId);
    const observations: ObservationLoungeFinding[] =
      await this.fetchObservations(projectId);

    // Calculate summary statistics
    const totalCost = costs.reduce(
      (sum, cost) => sum + (cost.estimated_cost_usd || 0),
      0
    );

    // Group costs by crew member
    const costsByCrewMember = new Map<string, LlmUsageEvent[]>();
    costs.forEach(cost => {
      const member = cost.crew_member || 'unknown';
      if (!costsByCrewMember.has(member)) {
        costsByCrewMember.set(member, []);
      }
      costsByCrewMember.get(member)?.push(cost);
    });

    // Build crew member summaries
    const byCrewMember = Array.from(costsByCrewMember.entries()).map(
      ([name, memberCosts]) => {
        const totalTokens = memberCosts.reduce(
          (sum, c) => sum + (c.total_tokens || 0),
          0
        );
        const memberCost = memberCosts.reduce(
          (sum, c) => sum + (c.estimated_cost_usd || 0),
          0
        );
        const modelsUsed = [...new Set(memberCosts.map(c => c.model))];

        // Find relevant observations for this crew member
        const memberObservations = observations
          .filter(obs => obs.crew_member === name)
          .map(obs => obs.finding);

        return {
          name,
          role: memberCosts[0]?.crew_member ?? 'unknown',
          costsIncurred: memberCost,
          tokensUsed: totalTokens,
          modelsUsed,
          observations: memberObservations
        };
      }
    );

    // Extract insights from observations
    const insights = observations
      .filter(obs => obs.insight_type === 'insight')
      .map(obs => obs.finding)
      .slice(0, 10);

    const recommendations = observations
      .filter(obs => obs.insight_type === 'recommendation')
      .map(obs => obs.finding)
      .slice(0, 5);

    const anomalies = observations
      .filter(obs => obs.insight_type === 'anomaly')
      .map(obs => obs.finding)
      .slice(0, 5);

    // Determine cost trend
    const halfwayPoint = Math.floor(costs.length / 2);
    const firstHalf = costs.slice(0, halfwayPoint);
    const secondHalf = costs.slice(halfwayPoint);
    const firstHalfAvg =
      firstHalf.reduce((sum, c) => sum + (c.estimated_cost_usd || 0), 0) /
      Math.max(firstHalf.length, 1);
    const secondHalfAvg =
      secondHalf.reduce((sum, c) => sum + (c.estimated_cost_usd || 0), 0) /
      Math.max(secondHalf.length, 1);

    let costTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) costTrend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.9) costTrend = 'decreasing';

    // Get budget info (you'll need to implement this based on your budget system)
    const budgetUsed = totalCost; // Simplified
    const budgetRemaining = 0; // Should be calculated from actual budget config

    return {
      reportDate: new Date().toISOString().split('T')[0],
      period: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      summary: {
        totalCost,
        budgetUsed,
        budgetRemaining,
        costTrend,
        projectedMonthly: (totalCost / 7) * 30
      },
      byCrewMember,
      observations: {
        insights,
        recommendations,
        anomalies
      },
      topWorkflows: [] // Can be populated from cost data
    };
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(report: WeeklyCostReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weekly Cost Report - ${report.reportDate}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #333; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .summary { background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: inline-block; margin-right: 30px; }
    .metric { font-size: 24px; font-weight: bold; color: #2980b9; }
    .metric-label { color: #7f8c8d; font-size: 12px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #3498db; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .trending-up { color: #e74c3c; }
    .trending-down { color: #27ae60; }
    .observation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 10px 0; }
    .recommendation { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 12px; margin: 10px 0; }
    .anomaly { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>📊 Weekly Cost Report</h1>
  <p><strong>Period:</strong> ${report.period.startDate} to ${report.period.endDate}</p>

  <div class="summary">
    <div class="summary-item">
      <div class="metric">$${report.summary.totalCost.toFixed(2)}</div>
      <div class="metric-label">Weekly Cost</div>
    </div>
    <div class="summary-item">
      <div class="metric">$${report.summary.projectedMonthly.toFixed(2)}</div>
      <div class="metric-label">Projected Monthly</div>
    </div>
    <div class="summary-item">
      <div class="metric ${report.summary.costTrend === 'increasing' ? 'trending-up' : 'trending-down'}">
        ${report.summary.costTrend.toUpperCase()}
      </div>
      <div class="metric-label">Trend</div>
    </div>
  </div>

  <h2>👥 Crew Member Costs</h2>
  <table>
    <tr>
      <th>Crew Member</th>
      <th>Role</th>
      <th>Cost</th>
      <th>Tokens Used</th>
      <th>Models</th>
    </tr>
    ${report.byCrewMember
      .map(
        member => `
      <tr>
        <td>${member.name}</td>
        <td>${member.role}</td>
        <td>$${member.costsIncurred.toFixed(2)}</td>
        <td>${member.tokensUsed.toLocaleString()}</td>
        <td>${member.modelsUsed.join(', ')}</td>
      </tr>
    `
      )
      .join('')}
  </table>

  <h2>💡 Key Insights</h2>
  ${report.observations.insights.map(insight => `<div class="observation">${insight}</div>`).join('')}

  <h2>✅ Recommendations</h2>
  ${report.observations.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}

  <h2>⚠️ Anomalies Detected</h2>
  ${report.observations.anomalies.map(anomaly => `<div class="anomaly">${anomaly}</div>`).join('')}

  <hr>
  <p style="color: #7f8c8d; font-size: 12px;">
    Generated by OpenRouter Crew Platform • ${new Date().toLocaleString()}
  </p>
</body>
</html>
    `;
  }

  /**
   * Store report findings in agent memory
   */
  async storeReportInMemory(report: WeeklyCostReport, projectId: string) {
    const summary = `
Weekly Cost Report (${report.period.startDate} to ${report.period.endDate})
Total Cost: $${report.summary.totalCost.toFixed(2)}
Projected Monthly: $${report.summary.projectedMonthly.toFixed(2)}
Trend: ${report.summary.costTrend.toUpperCase()}

Top Findings:
${report.observations.insights.slice(0, 3).map(i => `- ${i}`).join('\n')}
    `.trim();

    // Store in agent memory as institutional knowledge (Layer 4)
    await this.memoryService.insertMemory({
      projectId,
      layer: 4,
      content: summary,
      tags: ['weekly-report', 'cost-analysis', 'crew-metrics'],
      retentionTier: 'standard',
      contextKeywords: ['cost', 'report', 'metrics', 'crew-performance']
    });
  }

  /**
   * Send report via email
   */
  async sendEmail(
    to: string,
    report: WeeklyCostReport,
    htmlContent: string
  ) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'crew-platform@openrouter.local',
      to,
      subject: `Weekly Cost Report - ${report.reportDate}`,
      html: htmlContent,
      text: `
Weekly Cost Report (${report.period.startDate} to ${report.period.endDate})
Total Cost: $${report.summary.totalCost.toFixed(2)}
Projected Monthly: $${report.summary.projectedMonthly.toFixed(2)}
Cost Trend: ${report.summary.costTrend.toUpperCase()}

For detailed information, see the HTML version of this report.
      `
    };

    try {
      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}