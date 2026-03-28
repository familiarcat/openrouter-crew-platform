import React from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Zap 
} from 'lucide-react';

export interface PragmaticAnalysisData {
  isOverEngineered: boolean;
  needsQuickFix: boolean;
  questioningNecessity: boolean;
  pragmaticScore: number;
  relevantExperience: string;
  chiefMode: 'urgent_fix' | 'simplify' | 'standard';
}

const MODE_CONFIG = {
  urgent_fix: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: Zap,
    label: 'Urgent Fix Mode'
  },
  simplify: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Layers,
    label: 'Simplification Mode'
  },
  standard: {
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: Wrench,
    label: 'Standard Operations'
  }
};

export const PragmaticAnalysisCard: React.FC<{ analysis: PragmaticAnalysisData }> = ({ analysis }) => {
  if (!analysis) return null;

  const config = MODE_CONFIG[analysis.chiefMode] || MODE_CONFIG.standard;
  const ModeIcon = config.icon;

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full bg-white ${config.color} border ${config.border}`}>
            <ModeIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`font-bold ${config.color}`}>{config.label}</h3>
            <p className="text-xs text-muted-foreground">Pragmatic Score: {analysis.pragmaticScore}/3</p>
          </div>
        </div>
        {analysis.needsQuickFix && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
            URGENT
          </span>
        )}
      </div>

      {/* Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className={`flex items-center gap-2 p-2 rounded bg-white/60 border ${analysis.isOverEngineered ? 'border-yellow-300 bg-yellow-50' : 'border-transparent'}`}>
          {analysis.isOverEngineered ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> : <CheckCircle2 className="h-4 w-4 text-gray-400" />}
          <span className={`text-sm ${analysis.isOverEngineered ? 'font-medium text-yellow-800' : 'text-gray-500'}`}>
            Over-Engineered
          </span>
        </div>
        
        <div className={`flex items-center gap-2 p-2 rounded bg-white/60 border ${analysis.needsQuickFix ? 'border-red-300 bg-red-50' : 'border-transparent'}`}>
          {analysis.needsQuickFix ? <Zap className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-gray-400" />}
          <span className={`text-sm ${analysis.needsQuickFix ? 'font-medium text-red-800' : 'text-gray-500'}`}>
            Quick Fix Needed
          </span>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded bg-white/60 border ${analysis.questioningNecessity ? 'border-blue-300 bg-blue-50' : 'border-transparent'}`}>
          {analysis.questioningNecessity ? <ArrowRight className="h-4 w-4 text-blue-600" /> : <CheckCircle2 className="h-4 w-4 text-gray-400" />}
          <span className={`text-sm ${analysis.questioningNecessity ? 'font-medium text-blue-800' : 'text-gray-500'}`}>
            Questioning Necessity
          </span>
        </div>
      </div>

      {/* Relevant Experience */}
      {analysis.relevantExperience && (
        <div className="mt-3 pt-3 border-t border-black/5">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Wrench className="h-3 w-3" /> Field Experience Applied
          </h4>
          <div className="text-sm text-gray-700 bg-white p-3 rounded border border-black/5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {analysis.relevantExperience}
          </div>
        </div>
      )}
    </div>
  );
};

export default PragmaticAnalysisCard;