import React from 'react';
import { 
  Clock, 
  Cpu, 
  Database, 
  Hash, 
  DollarSign,
  Calendar
} from 'lucide-react';

export interface WorkflowMetadata {
  generated_at: string;
  model: string;
  usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
  pragmatic_mode?: string;
  execution_time_ms?: number;
  cost_estimate?: number;
}

export const WorkflowExecutionMetadata: React.FC<{ metadata: WorkflowMetadata }> = ({ metadata }) => {
  if (!metadata) return null;

  // Simple cost estimation if not provided (approximate blended rate)
  const estimatedCost = metadata.cost_estimate || 
    (metadata.usage ? (metadata.usage.total_tokens * 0.00001) : 0);

  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-sm">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Execution Metadata</h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Model Info */}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <Cpu className="h-3 w-3" /> Model
          </span>
          <span className="font-mono text-xs truncate" title={metadata.model}>
            {metadata.model?.split('/').pop() || 'Unknown'}
          </span>
        </div>

        {/* Token Usage */}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <Hash className="h-3 w-3" /> Tokens
          </span>
          <span className="font-mono text-xs">
            {metadata.usage?.total_tokens.toLocaleString() || '-'}
          </span>
        </div>

        {/* Timestamp */}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <Calendar className="h-3 w-3" /> Generated
          </span>
          <span className="font-mono text-xs">
            {new Date(metadata.generated_at).toLocaleTimeString()}
          </span>
        </div>

        {/* Cost */}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <DollarSign className="h-3 w-3" /> Est. Cost
          </span>
          <span className="font-mono text-xs text-green-600 font-medium">
            ${estimatedCost.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Detailed Token Breakdown (Tooltip-like info) */}
      {metadata.usage && (
        <div className="mt-3 pt-2 border-t border-border/50 flex gap-4 text-[10px] text-muted-foreground">
          <span>
            Prompt: <strong className="text-foreground">{metadata.usage.prompt_tokens}</strong>
          </span>
          <span>
            Completion: <strong className="text-foreground">{metadata.usage.completion_tokens}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default WorkflowExecutionMetadata;