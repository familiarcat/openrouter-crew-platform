/**
 * Deployment Metrics & Cost Tracking
 * 
 * Quark's cost analysis + Troi's UX insights
 * Tracks every deployment with estimated costs
 */

export interface DeploymentMetric {
  id: string;
  timestamp: string;
  duration: number; // seconds
  imageSize: number; // bytes
  imageSizeFormatted: string;
  trigger: 'manual' | 'cicd' | 'natural-language';
  success: boolean;
  commitSha?: string;
  costs: DeployCosts;
  totalCost: number;
  cumulativeCost?: number;
}

export interface DeployCosts {
  ecrStorage: number;      // ECR storage delta
  dataTransfer: number;    // Image push/pull
  ec2Compute: number;      // Compute during deploy
  githubActions: number;   // CI/CD minutes (if applicable)
}

export interface DeploymentSummary {
  totalDeploys: number;
  successfulDeploys: number;
  failedDeploys: number;
  totalCost: number;
  averageCostPerDeploy: number;
  averageDuration: number;
  lastDeploy?: DeploymentMetric;
  costByTrigger: {
    manual: number;
    cicd: number;
    'natural-language': number;
  };
  deploysToday: number;
  deploysThisWeek: number;
  deploysThisMonth: number;
}

// AWS Pricing (us-east-2, as of 2024)
export const AWS_PRICING = {
  ecr: {
    storagePerGBMonth: 0.10,    // $0.10/GB/month
    dataTransferPerGB: 0.09,    // $0.09/GB out
  },
  ec2: {
    t3SmallPerHour: 0.0208,     // $0.0208/hour
  },
  github: {
    actionsPerMinute: 0.008,    // $0.008/min for private repos (free for public)
  },
};

/**
 * Calculate deployment costs
 */
export function calculateDeployCosts(
  imageSizeBytes: number,
  durationSeconds: number,
  trigger: 'manual' | 'cicd' | 'natural-language'
): DeployCosts {
  const imageSizeGB = imageSizeBytes / (1024 * 1024 * 1024);
  
  // ECR storage (prorated for the day)
  const ecrStorage = (imageSizeGB * AWS_PRICING.ecr.storagePerGBMonth) / 30;
  
  // Data transfer (push to ECR + pull to EC2)
  const dataTransfer = imageSizeGB * 2 * AWS_PRICING.ecr.dataTransferPerGB;
  
  // EC2 compute during deploy (instance is already running, so marginal cost is minimal)
  // But we count the "deploy overhead" as ~5 min of focused compute
  const ec2Compute = (durationSeconds / 3600) * AWS_PRICING.ec2.t3SmallPerHour;
  
  // GitHub Actions (only for CI/CD trigger, assume 3 min build)
  const githubActions = trigger === 'cicd' ? 3 * AWS_PRICING.github.actionsPerMinute : 0;
  
  return {
    ecrStorage: Math.round(ecrStorage * 10000) / 10000,
    dataTransfer: Math.round(dataTransfer * 10000) / 10000,
    ec2Compute: Math.round(ec2Compute * 10000) / 10000,
    githubActions: Math.round(githubActions * 10000) / 10000,
  };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format cost to currency
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(3)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Create a deployment metric record
 */
export function createDeploymentMetric(
  durationSeconds: number,
  imageSizeBytes: number,
  trigger: 'manual' | 'cicd' | 'natural-language',
  success: boolean,
  commitSha?: string
): DeploymentMetric {
  const costs = calculateDeployCosts(imageSizeBytes, durationSeconds, trigger);
  const totalCost = costs.ecrStorage + costs.dataTransfer + costs.ec2Compute + costs.githubActions;
  
  return {
    id: `deploy-${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration: durationSeconds,
    imageSize: imageSizeBytes,
    imageSizeFormatted: formatBytes(imageSizeBytes),
    trigger,
    success,
    commitSha,
    costs,
    totalCost: Math.round(totalCost * 10000) / 10000,
  };
}

/**
 * Calculate deployment summary from metrics
 */
export function calculateSummary(metrics: DeploymentMetric[]): DeploymentSummary {
  if (metrics.length === 0) {
    return {
      totalDeploys: 0,
      successfulDeploys: 0,
      failedDeploys: 0,
      totalCost: 0,
      averageCostPerDeploy: 0,
      averageDuration: 0,
      costByTrigger: { manual: 0, cicd: 0, 'natural-language': 0 },
      deploysToday: 0,
      deploysThisWeek: 0,
      deploysThisMonth: 0,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const successfulDeploys = metrics.filter(m => m.success).length;
  const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);

  const costByTrigger = {
    manual: metrics.filter(m => m.trigger === 'manual').reduce((sum, m) => sum + m.totalCost, 0),
    cicd: metrics.filter(m => m.trigger === 'cicd').reduce((sum, m) => sum + m.totalCost, 0),
    'natural-language': metrics.filter(m => m.trigger === 'natural-language').reduce((sum, m) => sum + m.totalCost, 0),
  };

  return {
    totalDeploys: metrics.length,
    successfulDeploys,
    failedDeploys: metrics.length - successfulDeploys,
    totalCost: Math.round(totalCost * 10000) / 10000,
    averageCostPerDeploy: Math.round((totalCost / metrics.length) * 10000) / 10000,
    averageDuration: Math.round(totalDuration / metrics.length),
    lastDeploy: metrics[metrics.length - 1],
    costByTrigger,
    deploysToday: metrics.filter(m => new Date(m.timestamp) >= today).length,
    deploysThisWeek: metrics.filter(m => new Date(m.timestamp) >= weekAgo).length,
    deploysThisMonth: metrics.filter(m => new Date(m.timestamp) >= monthAgo).length,
  };
}

/**
 * Quark's cost insight based on metrics
 */
export function getQuarkInsight(summary: DeploymentSummary): string {
  const insights: string[] = [];
  
  if (summary.totalDeploys === 0) {
    return "No deployments yet? Rule of Acquisition #9: Opportunity plus instinct equals profit. Deploy something!";
  }

  // Cost efficiency
  if (summary.averageCostPerDeploy < 0.01) {
    insights.push(`Excellent! At ${formatCost(summary.averageCostPerDeploy)} per deploy, you're practically stealing from the cloud providers.`);
  } else if (summary.averageCostPerDeploy < 0.05) {
    insights.push(`${formatCost(summary.averageCostPerDeploy)} per deploy is very reasonable. Rule of Acquisition #3 approved.`);
  } else {
    insights.push(`${formatCost(summary.averageCostPerDeploy)} per deploy is getting expensive. Consider optimizing your image size.`);
  }

  // Deploy frequency
  if (summary.deploysToday > 10) {
    insights.push("Over 10 deploys today? That's either excellent iteration or something's broken. Hope it's the former!");
  } else if (summary.deploysThisWeek > 20) {
    insights.push(`${summary.deploysThisWeek} deploys this week shows healthy development velocity.`);
  }

  // Trigger efficiency
  const cicdRatio = summary.costByTrigger.cicd / (summary.totalCost || 1);
  if (cicdRatio > 0.8) {
    insights.push("Most deploys are automated via CI/CD. That's the Ferengi way - let the machines do the work!");
  }

  // Success rate
  const successRate = (summary.successfulDeploys / summary.totalDeploys) * 100;
  if (successRate < 90) {
    insights.push(`${successRate.toFixed(0)}% success rate? We're losing latinum on failed deploys!`);
  }

  return insights.join(' ');
}

/**
 * Troi's UX insight for the metrics display
 */
export function getTroiInsight(summary: DeploymentSummary): string {
  if (summary.totalDeploys === 0) {
    return "I sense anticipation. The first deployment is always exciting - take your time to ensure it feels right.";
  }

  const insights: string[] = [];
  
  // Emotional state of development
  if (summary.deploysToday > 5) {
    insights.push("I sense intense focus today. Remember to take breaks - sustained creativity requires rest.");
  }
  
  if (summary.failedDeploys > summary.successfulDeploys * 0.2) {
    insights.push("There's some frustration here from failed deploys. Consider adding more pre-deploy checks to reduce anxiety.");
  } else {
    insights.push("The deployment flow feels smooth. Users will appreciate the reliability.");
  }

  // User experience perspective
  if (summary.averageDuration > 120) {
    insights.push("2+ minute deploys may feel slow. Consider caching strategies to improve the experience.");
  } else if (summary.averageDuration < 60) {
    insights.push("Quick deploys under a minute! That responsive feedback loop will keep motivation high.");
  }

  return insights.join(' ');
}





