/**
 * Observation Lounge System
 *
 * Crew members share findings, insights, and anomalies discovered during their work.
 * The lounge integrates with MCP services for role-specific data gathering and
 * stores findings in agent memory with confidence decay based on usage.
 *
 * Architecture:
 * 1. Crew members execute their tasks with assigned MCP services
 * 2. They capture findings and store them in the observation lounge
 * 3. Findings are shared with other crew members (project-scoped pool)
 * 4. Agent memory system tracks confidence and decay over time
 * 5. Usage/reference activates memories (prevents decay)
 * 6. Unused memories fade away (memory decay policy)
 *
 * Crew Roles & Associated MCP Services:
 * - strategic-leadership: Industry analysis, competitor tracking, market trends
 * - data-analytics: Cost pattern analysis, anomaly detection, forecasting
 * - tactical-execution: Project timeline analysis, workflow optimization
 * - user-experience: UX research tools, user feedback aggregation
 * - security-compliance: Vulnerability scanning, compliance checking
 * - system-health: System metrics, performance monitoring
 * - infrastructure: Cloud cost analysis, infrastructure optimization
 * - communications: Sentiment analysis, engagement metrics
 * - pragmatic-solutions: Solution architecture analysis
 * - business-intelligence: Market analysis, competitive intelligence
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MemoryService } from '@openrouter-crew/agent-memory';

export type InsightType = 'insight' | 'recommendation' | 'anomaly' | 'pattern' | 'opportunity';

export interface ObservationLoungeConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface Finding {
  id: string;
  projectId: string;
  crewMemberId: string;
  crewMemberName: string;
  crewMemberRole: string;
  finding: string;
  insightType: InsightType;
  mcp_service_used?: string;
  data_source?: string;
  confidence: number; // 0-1
  tags: string[];
  related_findings?: string[]; // IDs of related findings
  created_at: Date;
  updated_at: Date;
  status: 'draft' | 'published' | 'archived';
  mcp_tool_chain?: string[]; // Sequence of MCP tools used
}

export interface CrewMemberMCPServices {
  [role: string]: {
    primary: string[]; // Must-have services
    secondary?: string[]; // Optional services
    frequency?: 'hourly' | 'daily' | 'weekly'; // How often to use
  };
}

/**
 * MCP Services by crew role
 * These are examples of free/open-source MCP services
 */
const MCPServicesByRole: CrewMemberMCPServices = {
  'data-analytics': {
    primary: [
      'mcp-dataframe-analyzer', // Process CSV/JSON data
      'mcp-statistical-suite', // Calculate statistics, trends
      'mcp-anomaly-detector', // Detect outliers
      'mcp-cost-forecaster' // Project costs
    ],
    secondary: [
      'mcp-visualization-builder', // Create charts
      'mcp-correlation-finder' // Find relationships in data
    ],
    frequency: 'daily'
  },
  'strategic-leadership': {
    primary: [
      'mcp-market-analyzer', // Industry/market data
      'mcp-competitor-tracker', // Track competitors
      'mcp-trend-identifier', // Identify market trends
      'mcp-risk-assessor' // Assess strategic risks
    ],
    secondary: ['mcp-swot-generator'],
    frequency: 'weekly'
  },
  'tactical-execution': {
    primary: [
      'mcp-timeline-optimizer', // Analyze schedules
      'mcp-resource-allocator', // Optimize resource usage
      'mcp-dependency-mapper', // Map task dependencies
      'mcp-velocity-calculator' // Track delivery velocity
    ],
    frequency: 'daily'
  },
  'user-experience': {
    primary: [
      'mcp-ux-research-aggregator', // Compile user research
      'mcp-sentiment-analyzer', // Analyze user sentiment
      'mcp-usability-scorer', // Score interface usability
      'mcp-feedback-categorizer' // Organize user feedback
    ],
    secondary: ['mcp-user-journey-mapper'],
    frequency: 'daily'
  },
  'security-compliance': {
    primary: [
      'mcp-security-scanner', // Basic vulnerability scan
      'mcp-compliance-checker', // Check compliance requirements
      'mcp-audit-log-analyzer', // Analyze access logs
      'mcp-policy-validator' // Validate against policies
    ],
    frequency: 'daily'
  },
  'system-health': {
    primary: [
      'mcp-metrics-collector', // Gather system metrics
      'mcp-alert-analyzer', // Analyze alerts
      'mcp-performance-profiler', // Profile performance
      'mcp-uptime-tracker' // Track availability
    ],
    frequency: 'hourly'
  },
  'infrastructure': {
    primary: [
      'mcp-cloud-cost-analyzer', // Analyze cloud costs
      'mcp-resource-optimizer', // Optimize resource allocation
      'mcp-capacity-planner', // Plan for growth
      'mcp-infrastructure-auditor' // Audit infrastructure
    ],
    frequency: 'weekly'
  },
  'communications': {
    primary: [
      'mcp-sentiment-analyzer', // Analyze tone
      'mcp-engagement-scorer', // Score audience engagement
      'mcp-message-optimizer', // Optimize messaging
      'mcp-audience-analyzer' // Understand audience
    ],
    frequency: 'daily'
  },
  'pragmatic-solutions': {
    primary: [
      'mcp-architecture-analyzer', // Analyze system architecture
      'mcp-solution-validator', // Validate solutions
      'mcp-trade-off-calculator', // Calculate trade-offs
      'mcp-complexity-estimator' // Estimate complexity
    ],
    frequency: 'daily'
  },
  'business-intelligence': {
    primary: [
      'mcp-market-analyzer', // Market analysis
      'mcp-financial-forecaster', // Financial projections
      'mcp-customer-analyzer', // Analyze customer data
      'mcp-opportunity-identifier' // Find business opportunities
    ],
    frequency: 'weekly'
  }
};

export class ObservationLounge {
  private supabase: SupabaseClient;
  private memoryService: MemoryService;
  private config: ObservationLoungeConfig;

  constructor(config: ObservationLoungeConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.memoryService = new (MemoryService as any)(createClient(config.supabaseUrl, config.supabaseKey));
  }

  /**
   * Get recommended MCP services for a crew member role
   */
  getMCPServicesForRole(role: string) {
    return MCPServicesByRole[role] || MCPServicesByRole['pragmatic-solutions'];
  }

  /**
   * Submit a finding to the observation lounge
   * This captures observations from crew members during their work
   */
  async submitFinding(finding: Omit<Finding, 'id' | 'created_at' | 'updated_at'>): Promise<Finding> {
    const id = `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const record: Finding = {
      ...finding,
      id,
      created_at: now,
      updated_at: now
    };

    // Store in Supabase
    const { error } = await this.supabase
      .from('observation_lounge_findings')
      .insert({
        id: record.id,
        project_id: record.projectId,
        crew_member_id: record.crewMemberId,
        crew_member_name: record.crewMemberName,
        crew_member_role: record.crewMemberRole,
        finding: record.finding,
        insight_type: record.insightType,
        mcp_service_used: record.mcp_service_used,
        data_source: record.data_source,
        confidence: record.confidence,
        tags: record.tags,
        related_findings: record.related_findings,
        status: record.status,
        mcp_tool_chain: record.mcp_tool_chain
      });

    if (error) throw error;

    // Store in agent memory with decay
    await this.storeInMemory(record);

    return record;
  }

  /**
   * Store finding in agent memory with appropriate retention tier
   * High confidence findings get longer retention
   */
  private async storeInMemory(finding: Finding) {
    // Determine retention tier based on confidence
    let retentionTier: 'eternal' | 'standard' | 'temporary' | 'session';
    if (finding.confidence >= 0.9) {
      retentionTier = 'eternal'; // Very high confidence findings are permanent
    } else if (finding.confidence >= 0.7) {
      retentionTier = 'standard'; // 30 days half-life
    } else if (finding.confidence >= 0.5) {
      retentionTier = 'temporary'; // 3 days half-life
    } else {
      retentionTier = 'session'; // 10 hours half-life
    }

    // Determine memory layer based on insight type
    let layer: 1 | 2 | 3 | 4;
    switch (finding.insightType) {
      case 'anomaly':
        layer = 1; // Raw observations (anomalies are direct findings)
        break;
      case 'pattern':
        layer = 2; // Patterns across observations
        break;
      case 'recommendation':
        layer = 3; // Strategy/recommendation
        break;
      case 'insight':
      case 'opportunity':
      default:
        layer = 2; // General insights go to pattern layer
    }

    await this.memoryService.store({
      projectId: finding.projectId,
      crewId: finding.crewMemberId,
      layer,
      content: finding.finding,
      summary: `${finding.insightType.toUpperCase()}: ${finding.finding.substring(0, 100)}...`,
      tags: [
        finding.crewMemberRole,
        finding.insightType,
        ...(finding.tags || [])
      ],
      retentionTier,
      contextKeywords: [
        finding.crewMemberName,
        finding.insightType,
        ...(finding.tags || [])
      ]
    });
  }

  /**
   * Retrieve findings with memory decay consideration
   * Activating a memory increases its confidence and prevents decay
   */
  async getFindings(
    projectId: string,
    options?: {
      role?: string;
      insightType?: InsightType;
      minConfidence?: number;
      limit?: number;
    }
  ): Promise<Finding[]> {
    let query = this.supabase
      .from('observation_lounge_findings')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'published');

    if (options?.role) {
      query = query.eq('crew_member_role', options.role);
    }

    if (options?.insightType) {
      query = query.eq('insight_type', options.insightType);
    }

    const { data, error } = await query
      .gte('confidence', options?.minConfidence || 0.1)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 100);

    if (error) throw error;

    // Activate memories to prevent decay (record in agent memory)
    if (data) {
      for (const finding of data) {
        await this.memoryService.reportOutcome({
          sessionId: `obs_retrieval_${Date.now()}`,
          activatedNodeIds: [finding.id],
          outcome: 'success',
          crewMember: 'observation-lounge-system', outcomeDelta: 0.1
        });
      }
    }

    return data || [];
  }

  /**
   * Find related findings through memory connections
   * Uses agent memory graph edges to find correlated findings
   */
  async getRelatedFindings(findingId: string): Promise<Finding[]> {
    const { data, error } = await this.supabase
      .from('observation_lounge_findings')
      .select('*')
      .contains('related_findings', [findingId]);

    if (error) throw error;
    return data || [];
  }

  /**
   * Publish a draft finding
   */
  async publishFinding(findingId: string): Promise<Finding> {
    const { data, error } = await this.supabase
      .from('observation_lounge_findings')
      .update({
        status: 'published',
        updated_at: new Date()
      })
      .eq('id', findingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Archive a finding (soft delete)
   */
  async archiveFinding(findingId: string): Promise<Finding> {
    const { data, error } = await this.supabase
      .from('observation_lounge_findings')
      .update({
        status: 'archived',
        updated_at: new Date()
      })
      .eq('id', findingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get statistics for observation lounge
   */
  async getStatistics(projectId: string) {
    const { data, error } = await this.supabase
      .from('observation_lounge_findings')
      .select('crew_member_role, insight_type, confidence')
      .eq('project_id', projectId)
      .eq('status', 'published');

    if (error) throw error;

    // Calculate statistics
    const stats = {
      totalFindings: data?.length || 0,
      byRole: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      averageConfidence: 0
    };

    let totalConfidence = 0;

    data?.forEach(finding => {
      // Count by role
      const role = finding.crew_member_role;
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;

      // Count by type
      const type = finding.insight_type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Sum confidence for average
      totalConfidence += finding.confidence;
    });

    if (data && data.length > 0) {
      stats.averageConfidence = totalConfidence / data.length;
    }

    return stats;
  }
}

export default ObservationLounge;
