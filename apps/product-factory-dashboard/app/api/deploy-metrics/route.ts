import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  DeploymentMetric,
  createDeploymentMetric,
  calculateSummary,
  getQuarkInsight,
  getTroiInsight,
} from '../../../lib/deploy-metrics';

const METRICS_FILE = path.join(process.cwd(), 'data', 'deploy-metrics.json');

// Load metrics from file
function loadMetrics(): DeploymentMetric[] {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const data = fs.readFileSync(METRICS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading metrics:', error);
  }
  return [];
}

// Save metrics to file
function saveMetrics(metrics: DeploymentMetric[]): void {
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('Error saving metrics:', error);
  }
}

// GET - Retrieve metrics and summary
export async function GET() {
  const metrics = loadMetrics();
  const summary = calculateSummary(metrics);
  
  return NextResponse.json({
    metrics: metrics.slice(-50), // Last 50 deploys
    summary,
    insights: {
      quark: getQuarkInsight(summary),
      troi: getTroiInsight(summary),
    },
    updatedAt: new Date().toISOString(),
  });
}

// POST - Record a new deployment
export async function POST(req: Request) {
  const body = await req.json();
  
  const {
    duration = 60,           // seconds
    imageSize = 150000000,   // ~150MB default
    trigger = 'manual',
    success = true,
    commitSha,
  } = body;

  const metric = createDeploymentMetric(
    duration,
    imageSize,
    trigger,
    success,
    commitSha
  );

  // Load existing metrics
  const metrics = loadMetrics();
  
  // Calculate cumulative cost
  const previousTotal = metrics.reduce((sum, m) => sum + m.totalCost, 0);
  metric.cumulativeCost = Math.round((previousTotal + metric.totalCost) * 10000) / 10000;
  
  // Add new metric
  metrics.push(metric);
  
  // Keep last 1000 records
  const trimmedMetrics = metrics.slice(-1000);
  saveMetrics(trimmedMetrics);

  const summary = calculateSummary(trimmedMetrics);

  return NextResponse.json({
    recorded: metric,
    summary,
    insights: {
      quark: getQuarkInsight(summary),
      troi: getTroiInsight(summary),
    },
  });
}

