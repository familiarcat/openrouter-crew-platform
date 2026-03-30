'use client';

import React from 'react';
import { 
  Brain, 
  Cpu, 
  MessageSquareText, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Coins,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SovereignAgentViewportProps {
  agentName: string; // e.g., "Commander Data"
  agentId: string;   // e.g., "commander_data"
  status: 'THINKING' | 'TOOL_CALL' | 'IDLE' | 'ERROR' | 'SUCCESS' | 'STOPPED';
  streamContent: string; // The actual output/thinking stream from the agent
  metadata?: {
    model?: string;
    tokensUsed?: number;
    cost?: number;
    executionTimeMs?: number;
  };
  isActive?: boolean; // If this agent is currently the primary focus
}

const getStatusIcon = (status: SovereignAgentViewportProps['status']) => {
  switch (status) {
    case 'THINKING':
      return <Brain className="w-4 h-4 text-blue-400 animate-pulse" />;
    case 'TOOL_CALL':
      return <Cpu className="w-4 h-4 text-purple-400 animate-spin" />;
    case 'IDLE':
      return <MessageSquareText className="w-4 h-4 text-gray-500" />;
    case 'ERROR':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'SUCCESS':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'STOPPED':
      return <Loader2 className="w-4 h-4 text-gray-600" />;
    default:
      return <MessageSquareText className="w-4 h-4 text-gray-500" />;
  }
};

export const SovereignAgentViewport: React.FC<SovereignAgentViewportProps> = ({
  agentName,
  agentId,
  status,
  streamContent,
  metadata,
  isActive = false,
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full border rounded-xl overflow-hidden transition-all duration-300",
        isActive
          ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
          : "border-white/10 hover:border-white/20"
      )}
    >
      {/* Header: Agent Identity & Status */}
      <div
        className={cn(
          "flex items-center justify-between p-3 border-b bg-white/5 backdrop-blur-md",
          isActive ? "border-blue-500/30" : "border-white/10"
        )}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span className="font-semibold text-sm text-white">{agentName}</span>
          <span className="text-xs text-gray-400/70">({agentId})</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {metadata?.cost !== undefined && (
            <span className="flex items-center gap-1 text-yellow-500/90">
              <Coins className="w-3 h-3" /> ${metadata.cost.toFixed(4)}
            </span>
          )}
          {metadata?.executionTimeMs !== undefined && (
            <span className="flex items-center gap-1 text-green-500/90">
              <Zap className="w-3 h-3" /> {metadata.executionTimeMs}ms
            </span>
          )}
          {metadata?.model && (
            <span className="text-gray-500/80">{metadata.model.split('/').pop()}</span>
          )}
        </div>
      </div>

      {/* Content Area: Thinking Stream (Dark Forest Viewport) */}
      <div className="flex-1 p-4 text-sm font-mono text-gray-300 overflow-y-auto custom-scrollbar bg-black/20">
        <pre className="whitespace-pre-wrap break-words">
          {streamContent}
        </pre>
      </div>
    </div>
  );
};

export default SovereignAgentViewport;