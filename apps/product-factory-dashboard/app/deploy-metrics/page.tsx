'use client';
import { useState, useEffect } from 'react';

// Crew colors
const colors = {
  quark: { accent: '#27ae60', glow: 'rgba(39,174,96,.3)' },
  troi: { accent: '#9b59b6', glow: 'rgba(155,89,182,.3)' },
  main: { accent: '#00d4ff', glow: 'rgba(0,212,255,.3)' },
  warning: { accent: '#f59e0b', glow: 'rgba(245,158,11,.3)' },
  success: { accent: '#28d99a', glow: 'rgba(40,217,154,.3)' },
};

interface DeploymentMetric {
  id: string;
  timestamp: string;
  duration: number;
  imageSize: number;
  imageSizeFormatted: string;
  trigger: string;
  success: boolean;
  commitSha?: string;
  costs: {
    ecrStorage: number;
    dataTransfer: number;
    ec2Compute: number;
    githubActions: number;
  };
  totalCost: number;
  cumulativeCost?: number;
}

interface DeploymentSummary {
  totalDeploys: number;
  successfulDeploys: number;
  failedDeploys: number;
  totalCost: number;
  averageCostPerDeploy: number;
  averageDuration: number;
  costByTrigger: { manual: number; cicd: number; 'natural-language': number };
  deploysToday: number;
  deploysThisWeek: number;
  deploysThisMonth: number;
}

const cardStyle = (accent: string, glow: string) => ({
  background: `linear-gradient(180deg, rgba(13,16,34,.92), rgba(11,15,29,.75)), radial-gradient(ellipse 600px 350px at 0% 0%, ${glow} 0%, transparent 60%)`,
  border: `1px solid ${accent}40`,
  borderRadius: '16px',
  padding: '20px',
});

function formatCost(cost: number): string {
  if (cost < 0.01) return `${(cost * 100).toFixed(3)}¢`;
  return `$${cost.toFixed(4)}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function DeployMetricsPage() {
  const [data, setData] = useState<{
    metrics: DeploymentMetric[];
    summary: DeploymentSummary;
    insights: { quark: string; troi: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/deploy-metrics');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle(colors.main.accent, colors.main.glow)}>
          <h1 style={{ color: colors.main.accent }}>📊 Loading Deployment Metrics...</h1>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const metrics = data?.metrics || [];
  const insights = data?.insights;

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* Header */}
      <div className="card span-12" style={cardStyle(colors.main.accent, colors.main.glow)}>
        <h1 style={{ marginTop: 0, color: colors.main.accent }}>
          📊 Deployment Metrics
        </h1>
        <p className="small" style={{ opacity: 0.7 }}>
          Real-time cost tracking and insights from Quark & Troi
        </p>
      </div>

      {/* Summary Cards */}
      <div className="card span-3" style={cardStyle(colors.success.accent, colors.success.glow)}>
        <div style={{ fontSize: 32, fontWeight: 700, color: colors.success.accent }}>
          {summary?.totalDeploys || 0}
        </div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Total Deploys</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <span style={{ color: colors.success.accent }}>✓ {summary?.successfulDeploys || 0}</span>
          {' / '}
          <span style={{ color: '#ff5c93' }}>✗ {summary?.failedDeploys || 0}</span>
        </div>
      </div>

      <div className="card span-3" style={cardStyle(colors.quark.accent, colors.quark.glow)}>
        <div style={{ fontSize: 32, fontWeight: 700, color: colors.quark.accent }}>
          {formatCost(summary?.totalCost || 0)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Total Cost</div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          Avg: {formatCost(summary?.averageCostPerDeploy || 0)}/deploy
        </div>
      </div>

      <div className="card span-3" style={cardStyle(colors.warning.accent, colors.warning.glow)}>
        <div style={{ fontSize: 32, fontWeight: 700, color: colors.warning.accent }}>
          {formatDuration(summary?.averageDuration || 0)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Avg Duration</div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          Today: {summary?.deploysToday || 0} deploys
        </div>
      </div>

      <div className="card span-3" style={cardStyle(colors.main.accent, colors.main.glow)}>
        <div style={{ fontSize: 32, fontWeight: 700, color: colors.main.accent }}>
          {summary?.deploysThisMonth || 0}
        </div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>This Month</div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          Week: {summary?.deploysThisWeek || 0}
        </div>
      </div>

      {/* Quark's Insight */}
      <div className="card span-6" style={cardStyle(colors.quark.accent, colors.quark.glow)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 48 }}>💰</div>
          <div>
            <h3 style={{ margin: 0, color: colors.quark.accent }}>Quark&apos;s Analysis</h3>
            <p style={{ margin: '12px 0 0', lineHeight: 1.7, fontSize: 14 }}>
              {insights?.quark || 'Waiting for deployment data...'}
            </p>
          </div>
        </div>
      </div>

      {/* Troi's Insight */}
      <div className="card span-6" style={cardStyle(colors.troi.accent, colors.troi.glow)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 48 }}>💜</div>
          <div>
            <h3 style={{ margin: 0, color: colors.troi.accent }}>Troi&apos;s Insight</h3>
            <p style={{ margin: '12px 0 0', lineHeight: 1.7, fontSize: 14 }}>
              {insights?.troi || 'Sensing the deployment patterns...'}
            </p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown by Trigger */}
      <div className="card span-4" style={cardStyle(colors.quark.accent, colors.quark.glow)}>
        <h3 style={{ marginTop: 0, color: colors.quark.accent }}>Cost by Trigger</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🤖 CI/CD</span>
            <span style={{ fontWeight: 600 }}>{formatCost(summary?.costByTrigger.cicd || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>👆 Manual</span>
            <span style={{ fontWeight: 600 }}>{formatCost(summary?.costByTrigger.manual || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💬 Natural Language</span>
            <span style={{ fontWeight: 600 }}>{formatCost(summary?.costByTrigger['natural-language'] || 0)}</span>
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="card span-8" style={cardStyle(colors.main.accent, colors.main.glow)}>
        <h3 style={{ marginTop: 0, color: colors.main.accent }}>Recent Deployments</h3>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', opacity: 0.7 }}>Time</th>
                <th style={{ textAlign: 'left', padding: '8px 0', opacity: 0.7 }}>Trigger</th>
                <th style={{ textAlign: 'right', padding: '8px 0', opacity: 0.7 }}>Duration</th>
                <th style={{ textAlign: 'right', padding: '8px 0', opacity: 0.7 }}>Size</th>
                <th style={{ textAlign: 'right', padding: '8px 0', opacity: 0.7 }}>Cost</th>
                <th style={{ textAlign: 'center', padding: '8px 0', opacity: 0.7 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.slice().reverse().map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <td style={{ padding: '10px 0' }}>
                    {new Date(m.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 0' }}>
                    {m.trigger === 'cicd' && '🤖'}
                    {m.trigger === 'manual' && '👆'}
                    {m.trigger === 'natural-language' && '💬'}
                    {' '}{m.trigger}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    {formatDuration(m.duration)}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    {m.imageSizeFormatted}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: colors.quark.accent }}>
                    {formatCost(m.totalCost)}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'center' }}>
                    {m.success ? (
                      <span style={{ color: colors.success.accent }}>✓</span>
                    ) : (
                      <span style={{ color: '#ff5c93' }}>✗</span>
                    )}
                  </td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '20px 0', textAlign: 'center', opacity: 0.5 }}>
                    No deployments recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown Details */}
      <div className="card span-12" style={cardStyle(colors.quark.accent, colors.quark.glow)}>
        <h3 style={{ marginTop: 0, color: colors.quark.accent }}>💰 Cost Components (Per Deploy)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'rgba(39,174,96,.1)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>ECR Storage</div>
            <div style={{ fontSize: 14 }}>~$0.0001/deploy</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>$0.10/GB/month prorated</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(39,174,96,.1)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Data Transfer</div>
            <div style={{ fontSize: 14 }}>~$0.027/deploy</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>~150MB × 2 × $0.09/GB</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(39,174,96,.1)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>EC2 Compute</div>
            <div style={{ fontSize: 14 }}>~$0.0003/deploy</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>~1 min × $0.0208/hr</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(39,174,96,.1)', borderRadius: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>GitHub Actions</div>
            <div style={{ fontSize: 14 }}>~$0.024/deploy</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>~3 min × $0.008/min</div>
          </div>
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 13, opacity: 0.7 }}>
          <strong>Rule of Acquisition #3:</strong> &quot;Never spend more for an acquisition than you have to.&quot;
          At ~$0.05/deploy, you&apos;re getting excellent value!
        </p>
      </div>
    </div>
  );
}





