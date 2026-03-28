import React from 'react';
import { 
  Bot, 
  Zap, 
  DollarSign, 
  Activity, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Cpu,
  Layers
} from 'lucide-react';

export interface UiEnhancements {
  model_visual_cue?: {
    model_name: string;
    provider: string;
    icon: string;
    color: string;
  };
  cost_display?: {
    total_cost: number;
    cost_breakdown: Record<string, number>;
    cost_efficiency: string;
    savings_vs_alternative: number;
  };
  sub_agent_status?: {
    crew_member_used: string | null;
    crew_consistency: string;
    n8n_workflow_status: string;
    last_sync: string;
  };
  performance_metrics?: {
    response_time: string;
    token_usage: Record<string, number>;
    model_confidence: number;
  };
  // Observation Lounge specific
  crew_participation?: {
    total_crew: number;
    active_participants: number;
    participation_rate: string;
    status_icon: string;
  };
  department_summary?: Array<{
    department: string;
    crew_member: string;
    confidence: number;
    status: string;
  }>;
  discussion_quality?: {
    synthesis_available: boolean;
    recommendations_count: number;
    actions_count: number;
    quality_score: string;
  };
}

export const CrewAiInsights: React.FC<{ data: UiEnhancements }> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Model & Provider Card */}
      {data.model_visual_cue && (
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">AI Model</span>
            {data.model_visual_cue.provider === 'local_claude' ? (
              <Bot className="h-4 w-4 text-green-500" />
            ) : (
              <Zap className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div>
            <div className="text-lg font-bold truncate" title={data.model_visual_cue.model_name}>
              {data.model_visual_cue.model_name.split('/').pop()}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {data.model_visual_cue.provider.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {/* Cost & Efficiency Card */}
      {data.cost_display && (
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Cost Efficiency</span>
            <DollarSign className={`h-4 w-4 ${data.cost_display.savings_vs_alternative > 0 ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="text-2xl font-bold">
              ${data.cost_display.total_cost.toFixed(4)}
            </div>
            {data.cost_display.savings_vs_alternative > 0 && (
              <div className="text-xs text-green-600 font-medium">
                Saved ${data.cost_display.savings_vs_alternative.toFixed(4)} vs fallback
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance & Confidence Card */}
      {data.performance_metrics && (
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Performance</span>
            <Activity className="h-4 w-4 text-purple-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span className="font-medium">{data.performance_metrics.response_time}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium">{(data.performance_metrics.model_confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Crew / Sub-Agent Status Card */}
      {data.sub_agent_status && (
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Crew Agent</span>
            <Users className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold capitalize">
              {data.sub_agent_status.crew_member_used?.replace('_', ' ') || 'System'}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${data.sub_agent_status.n8n_workflow_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
              Workflow Active
            </div>
          </div>
        </div>
      )}

      {/* Observation Lounge: Participation */}
      {data.crew_participation && (
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Crew Quorum</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {data.crew_participation.participation_rate}
            </div>
            <div className="text-xs text-muted-foreground">
              {data.crew_participation.active_participants} of {data.crew_participation.total_crew} members active
            </div>
          </div>
        </div>
      )}

      {/* Observation Lounge: Discussion Quality */}
      {data.discussion_quality && (
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-medium">Discussion Output</span>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Synthesis</span>
              {data.discussion_quality.synthesis_available ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actions</span>
              <span className="font-medium bg-secondary px-1.5 rounded text-xs">
                {data.discussion_quality.actions_count}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrewAiInsights;