import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  HeartPulse, 
  Cpu, 
  Gavel, 
  Wrench, 
  BrainCircuit, 
  Radio, 
  Coins 
} from 'lucide-react';

interface CrewMemberResponse {
  assessment?: string;
  recommendation?: string;
  confidence: number;
  diagnosis?: string;
  treatment?: string;
  logical_failure?: string;
  command_authority?: string;
  [key: string]: any;
}

interface EmergencyAnalysis {
  analysis_id: string;
  issue_type: string;
  severity: string;
  crew_emergency_response: Record<string, CrewMemberResponse>;
  pattern_violation?: {
    standing_order: string;
    violation: string;
  };
}

const CREW_CONFIG: Record<string, { icon: any; color: string; role: string; label: string }> = {
  picard: { icon: Gavel, color: 'text-red-600', role: 'Captain', label: 'Picard' },
  riker: { icon: ShieldAlert, color: 'text-red-500', role: 'First Officer', label: 'Riker' },
  data: { icon: Cpu, color: 'text-yellow-500', role: 'Ops', label: 'Data' },
  la_forge: { icon: Wrench, color: 'text-yellow-600', role: 'Engineering', label: 'La Forge' },
  worf: { icon: AlertTriangle, color: 'text-yellow-700', role: 'Security', label: 'Worf' },
  crusher: { icon: HeartPulse, color: 'text-blue-500', role: 'Medical', label: 'Crusher' },
  troi: { icon: BrainCircuit, color: 'text-blue-400', role: 'Counselor', label: 'Troi' },
  uhura: { icon: Radio, color: 'text-red-400', role: 'Comms', label: 'Uhura' },
  quark: { icon: Coins, color: 'text-orange-500', role: 'Business', label: 'Quark' },
};

export const CrewEmergencyAlert: React.FC<{ analysis: EmergencyAnalysis }> = ({ analysis }) => {
  if (!analysis) return null;

  const isCritical = analysis.severity === 'HIGH' || analysis.severity === 'CRITICAL';

  return (
    <div className="space-y-6">
      {/* Header Alert Banner */}
      <div className={`border-l-4 p-4 rounded-r-lg ${isCritical ? 'bg-red-50 border-red-600' : 'bg-yellow-50 border-yellow-500'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isCritical ? 'text-red-700' : 'text-yellow-700'}`}>
              <AlertTriangle className="h-5 w-5" />
              {analysis.issue_type.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              ID: {analysis.analysis_id}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCritical ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
            SEVERITY: {analysis.severity}
          </span>
        </div>
        
        {analysis.pattern_violation && (
          <div className="mt-4 bg-white/50 p-3 rounded border border-black/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold block text-gray-600 text-xs uppercase">Standing Order</span>
                <span className="text-gray-900">{analysis.pattern_violation.standing_order}</span>
              </div>
              <div>
                <span className="font-semibold block text-red-600 text-xs uppercase">Violation</span>
                <span className="text-red-900 font-medium">{analysis.pattern_violation.violation}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crew Response Grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Crew Consensus & Orders</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(analysis.crew_emergency_response).map(([crewId, response]) => {
            const config = CREW_CONFIG[crewId] || { icon: AlertTriangle, color: 'text-gray-500', role: 'Unknown', label: crewId };
            const Icon = config.icon;

            // Extract the main message (prioritize specific fields based on role)
            const mainMessage = response.assessment || 
                              response.diagnosis || 
                              response.logical_failure || 
                              response.user_psychology_alert || 
                              response.business_critical ||
                              "No assessment provided";

            const action = response.recommendation || 
                         response.treatment || 
                         response.directive || 
                         response.action ||
                         response.solution;

            return (
              <div key={crewId} className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <div>
                      <div className="font-bold text-sm leading-none">{config.label}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{config.role}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {response.confidence}% CONF
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Assessment</span>
                    <p className="text-sm text-foreground leading-snug">
                      {mainMessage}
                    </p>
                  </div>
                  
                  {action && (
                    <div className="bg-secondary/50 p-2 rounded text-xs">
                      <span className="font-bold text-secondary-foreground block mb-0.5">Recommendation</span>
                      {action}
                    </div>
                  )}

                  {response.consequence && (
                    <div className="text-xs text-red-600 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      {response.consequence}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CrewEmergencyAlert;