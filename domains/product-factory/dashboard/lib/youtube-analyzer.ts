/**
 * YouTube Content Analyzer
 * 
 * Extracts content from YouTube videos and transforms it into project proposals
 * using the Alex AI crew collaboration system.
 */

export interface YouTubeVideo {
  id: string;
  url: string;
  title?: string;
  description?: string;
  transcript?: string;
  duration?: string;
  channel?: string;
  publishedAt?: string;
  tags?: string[];
}

export interface ProjectProposal {
  id: string;
  name: string;
  tagline: string;
  description: string;
  domain: string;
  sourceVideo: string;
  crewAnalysis: CrewProjectAnalysis;
  techStack: string[];
  estimatedEffort: EffortEstimate;
  monetization: MonetizationStrategy;
  mvpFeatures: string[];
  fullFeatures: string[];
  risks: string[];
  successMetrics: string[];
}

export interface CrewProjectAnalysis {
  picard: CrewInsight;
  data: CrewInsight;
  laforge: CrewInsight;
  troi: CrewInsight;
  quark: CrewInsight;
  consensus: string;
}

export interface CrewInsight {
  crewMember: string;
  role: string;
  analysis: string;
  recommendation: string;
  concerns?: string[];
  opportunities?: string[];
}

export interface EffortEstimate {
  mvpDays: number;
  fullDays: number;
  teamSize: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface MonetizationStrategy {
  primaryModel: string;
  revenueStreams: RevenueStream[];
  estimatedMRR: string;
  timeToRevenue: string;
  competitiveAdvantage: string;
}

export interface RevenueStream {
  name: string;
  model: 'subscription' | 'usage' | 'freemium' | 'enterprise' | 'marketplace' | 'ads';
  pricing: string;
  targetCustomer: string;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch video metadata using YouTube oEmbed API (no API key required)
 */
export async function fetchVideoMetadata(videoId: string): Promise<Partial<YouTubeVideo>> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video metadata: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: data.title,
      channel: data.author_name,
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }
}

/**
 * Generate crew analysis for a project concept
 */
export function generateCrewAnalysis(
  projectConcept: string,
  domain: string
): CrewProjectAnalysis {
  return {
    picard: {
      crewMember: 'Captain Picard',
      role: 'Strategic Leadership',
      analysis: `This project aligns with our strategic vision for ${domain}. The key consideration is ensuring we build something that creates lasting value, not just immediate returns.`,
      recommendation: 'Proceed with a phased approach - prove the concept with an MVP before full investment.',
      concerns: ['Market timing', 'Resource allocation', 'Long-term sustainability'],
      opportunities: ['First-mover advantage', 'Platform potential', 'Strategic partnerships'],
    },
    data: {
      crewMember: 'Commander Data',
      role: 'Analytics & AI/ML',
      analysis: `Based on my analysis, the probability of technical success is approximately 78.4%. The ${domain} domain shows favorable patterns for AI integration.`,
      recommendation: 'Implement robust data pipelines and monitoring from day one. Consider embedding AI capabilities early.',
      concerns: ['Data quality requirements', 'Model accuracy thresholds', 'Scalability of ML pipelines'],
      opportunities: ['Automation potential', 'Predictive capabilities', 'Pattern recognition features'],
    },
    laforge: {
      crewMember: 'Geordi La Forge',
      role: 'Infrastructure & Engineering',
      analysis: `I can make this work! The technical architecture is sound. We should leverage modern serverless infrastructure for cost efficiency.`,
      recommendation: 'Start with Next.js + Vercel for rapid iteration, migrate to dedicated infrastructure at scale.',
      concerns: ['Initial performance optimization', 'Integration complexity', 'Technical debt management'],
      opportunities: ['Modern stack advantages', 'DevOps automation', 'API-first architecture'],
    },
    troi: {
      crewMember: 'Counselor Troi',
      role: 'User Experience',
      analysis: `I sense this will resonate with users who feel overwhelmed by current solutions. The emotional driver is empowerment through simplification.`,
      recommendation: 'Focus on an intuitive onboarding flow. Users should feel capable within the first 5 minutes.',
      concerns: ['User learning curve', 'Feature overwhelm', 'Accessibility compliance'],
      opportunities: ['Emotional connection through UX', 'Community building', 'User advocacy'],
    },
    quark: {
      crewMember: 'Quark',
      role: 'Business Intelligence',
      analysis: `Rule of Acquisition #62: The riskier the road, the greater the profit. This has solid ROI potential if we nail the pricing.`,
      recommendation: 'Start with freemium to build adoption, then introduce usage-based pricing at scale.',
      concerns: ['Customer acquisition cost', 'Churn risk', 'Pricing sensitivity'],
      opportunities: ['Recurring revenue', 'Upsell potential', 'Enterprise tier margins'],
    },
    consensus: `The crew recommends proceeding with a lean MVP approach, focusing on ${domain} as the initial domain. Technical feasibility is high, market timing is favorable, and monetization paths are clear. Key success factors: intuitive UX, robust infrastructure, and value-based pricing.`,
  };
}

/**
 * Generate monetization strategy based on project type
 */
export function generateMonetizationStrategy(
  projectType: string,
  targetMarket: 'b2b' | 'b2c' | 'b2b2c'
): MonetizationStrategy {
  const strategies: Record<string, MonetizationStrategy> = {
    saas: {
      primaryModel: 'SaaS Subscription',
      revenueStreams: [
        { name: 'Starter', model: 'freemium', pricing: '$0/mo', targetCustomer: 'Individual developers' },
        { name: 'Pro', model: 'subscription', pricing: '$29/mo', targetCustomer: 'Small teams' },
        { name: 'Team', model: 'subscription', pricing: '$99/mo', targetCustomer: 'Growing companies' },
        { name: 'Enterprise', model: 'enterprise', pricing: 'Custom', targetCustomer: 'Large organizations' },
      ],
      estimatedMRR: '$10k-50k within 12 months',
      timeToRevenue: '2-3 months post-launch',
      competitiveAdvantage: 'AI-powered automation and crew-based collaboration',
    },
    platform: {
      primaryModel: 'Platform + Marketplace',
      revenueStreams: [
        { name: 'Base Platform', model: 'subscription', pricing: '$49/mo', targetCustomer: 'Platform users' },
        { name: 'Transaction Fee', model: 'usage', pricing: '5% per transaction', targetCustomer: 'Marketplace participants' },
        { name: 'Premium Listings', model: 'marketplace', pricing: '$199/mo', targetCustomer: 'Power sellers' },
      ],
      estimatedMRR: '$25k-100k within 18 months',
      timeToRevenue: '4-6 months post-launch',
      competitiveAdvantage: 'Network effects and ecosystem lock-in',
    },
    api: {
      primaryModel: 'API-as-a-Service',
      revenueStreams: [
        { name: 'Free Tier', model: 'freemium', pricing: '1,000 calls/mo', targetCustomer: 'Developers testing' },
        { name: 'Growth', model: 'usage', pricing: '$0.001/call', targetCustomer: 'Startups' },
        { name: 'Scale', model: 'usage', pricing: '$0.0005/call (volume)', targetCustomer: 'Scale-ups' },
        { name: 'Enterprise', model: 'enterprise', pricing: 'Custom SLA', targetCustomer: 'Enterprise' },
      ],
      estimatedMRR: '$5k-30k within 12 months',
      timeToRevenue: '1-2 months post-launch',
      competitiveAdvantage: 'Developer experience and reliability',
    },
  };

  return strategies[projectType] || strategies.saas;
}

/**
 * Generate three project proposals from video content
 */
export function generateProjectProposals(
  video: YouTubeVideo,
  context?: string
): ProjectProposal[] {
  const baseId = video.id || 'unknown';
  const timestamp = Date.now();
  
  // Project 1: Content Intelligence Platform
  const project1: ProjectProposal = {
    id: `proj-${baseId}-1-${timestamp}`,
    name: 'ContentMind AI',
    tagline: 'Transform video content into actionable insights',
    description: 'An AI-powered platform that analyzes video content, extracts key concepts, and generates structured knowledge bases. Perfect for content creators, educators, and businesses looking to maximize the value of their video assets.',
    domain: 'Content Intelligence',
    sourceVideo: video.url,
    crewAnalysis: generateCrewAnalysis('content intelligence platform', 'Content Intelligence'),
    techStack: ['Next.js', 'TypeScript', 'OpenAI API', 'Supabase', 'Vercel', 'n8n'],
    estimatedEffort: {
      mvpDays: 14,
      fullDays: 45,
      teamSize: 2,
      complexity: 'medium',
    },
    monetization: generateMonetizationStrategy('saas', 'b2b'),
    mvpFeatures: [
      'YouTube URL input and content extraction',
      'AI-powered transcript analysis',
      'Key concept identification',
      'Exportable knowledge summaries',
    ],
    fullFeatures: [
      'Multi-video knowledge graph',
      'Custom AI training on content library',
      'Team collaboration features',
      'API access for integrations',
      'White-label options',
    ],
    risks: [
      'YouTube API rate limits',
      'AI model costs at scale',
      'Content accuracy validation',
    ],
    successMetrics: [
      '1,000 videos processed in month 1',
      '100 paying customers by month 3',
      '$10k MRR by month 6',
    ],
  };

  // Project 2: Learning Path Generator
  const project2: ProjectProposal = {
    id: `proj-${baseId}-2-${timestamp}`,
    name: 'SkillForge',
    tagline: 'AI-curated learning paths from the world\'s best content',
    description: 'Automatically generates personalized learning curricula by analyzing YouTube educational content, structuring it into progressive modules, and tracking learner progress with AI-powered assessments.',
    domain: 'EdTech',
    sourceVideo: video.url,
    crewAnalysis: generateCrewAnalysis('edtech learning platform', 'EdTech'),
    techStack: ['Next.js', 'TypeScript', 'LangChain', 'PostgreSQL', 'Redis', 'Stripe'],
    estimatedEffort: {
      mvpDays: 21,
      fullDays: 60,
      teamSize: 3,
      complexity: 'high',
    },
    monetization: generateMonetizationStrategy('platform', 'b2c'),
    mvpFeatures: [
      'Topic-based content discovery',
      'Automated curriculum generation',
      'Progress tracking dashboard',
      'Basic quiz generation',
    ],
    fullFeatures: [
      'Personalized learning algorithms',
      'Cohort-based learning communities',
      'Certification programs',
      'Enterprise training modules',
      'Creator monetization tools',
    ],
    risks: [
      'Content licensing complexities',
      'User engagement and completion rates',
      'Competition from established EdTech',
    ],
    successMetrics: [
      '5,000 learners enrolled by month 2',
      '40% course completion rate',
      '$25k MRR by month 9',
    ],
  };

  // Project 3: Research Assistant API
  const project3: ProjectProposal = {
    id: `proj-${baseId}-3-${timestamp}`,
    name: 'InsightAPI',
    tagline: 'Video intelligence as an API service',
    description: 'A developer-focused API that provides video content analysis, summarization, and insight extraction as a service. Enable any application to understand and leverage video content programmatically.',
    domain: 'Developer Tools',
    sourceVideo: video.url,
    crewAnalysis: generateCrewAnalysis('developer API service', 'Developer Tools'),
    techStack: ['Node.js', 'TypeScript', 'FastAPI', 'Redis', 'PostgreSQL', 'Docker', 'AWS'],
    estimatedEffort: {
      mvpDays: 10,
      fullDays: 30,
      teamSize: 2,
      complexity: 'medium',
    },
    monetization: generateMonetizationStrategy('api', 'b2b'),
    mvpFeatures: [
      'Video URL to transcript endpoint',
      'Content summarization API',
      'Key topics extraction',
      'Developer documentation',
    ],
    fullFeatures: [
      'Custom model fine-tuning',
      'Batch processing',
      'Webhook integrations',
      'Multi-language support',
      'Enterprise SLAs',
    ],
    risks: [
      'API abuse and cost control',
      'Maintaining uptime SLAs',
      'Keeping pace with AI model updates',
    ],
    successMetrics: [
      '100 developer signups in month 1',
      '1M API calls/month by month 4',
      '$15k MRR by month 6',
    ],
  };

  return [project1, project2, project3];
}





