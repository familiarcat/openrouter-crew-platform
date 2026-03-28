import React from 'react';
import { 
  User, 
  Shield, 
  Zap, 
  Activity, 
  Cpu, 
  Gavel, 
  HeartPulse, 
  Radio, 
  Coins, 
  Wrench, 
  BrainCircuit 
} from 'lucide-react';

export interface CrewMember {
  id: string;
  name: string;
  displayName: string;
  role: string;
  tier: 'premium' | 'standard' | 'budget';
  expertise: string[];
  workloadCurrent: number;
  workloadCapacity: number;
  bio?: string;
  status: 'active' | 'busy' | 'offline';
}

const CREW_ICONS: Record<string, any> = {
  captain_picard: Gavel,
  commander_riker: Shield,
  commander_data: Cpu,
  geordi_la_forge: Wrench,
  lt_worf: AlertTriangle,
  dr_crusher: HeartPulse,
  counselor_troi: BrainCircuit,
  lt_uhura: Radio,
  chief_obrien: Wrench,
  quark: Coins,
};

const TIER_COLORS = {
  premium: 'bg-purple-100 text-purple-800 border-purple-200',
  standard: 'bg-blue-100 text-blue-800 border-blue-200',
  budget: 'bg-green-100 text-green-800 border-green-200',
};

import { AlertTriangle } from 'lucide-react';

export const CrewMemberProfile: React.FC<{ member: CrewMember }> = ({ member }) => {
  const Icon = CREW_ICONS[member.name] || User;
  const utilization = Math.round((member.workloadCurrent / member.workloadCapacity) * 100);
  
  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full bg-secondary/50`}>
              <Icon className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">{member.displayName}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${TIER_COLORS[member.tier]}`}>
            {member.tier}
          </span>
        </div>

        {/* Workload Indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Workload</span>
            <span className={`font-medium ${utilization > 80 ? 'text-red-500' : 'text-foreground'}`}>
              {utilization}% ({member.workloadCurrent}/{member.workloadCapacity})
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                utilization > 90 ? 'bg-red-500' : 
                utilization > 70 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`} 
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {member.expertise.slice(0, 4).map((skill) => (
            <span key={skill} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
              {skill}
            </span>
          ))}
          {member.expertise.length > 4 && (
            <span className="px-2 py-1 bg-secondary/50 text-muted-foreground text-xs rounded">
              +{member.expertise.length - 4}
            </span>
          )}
        </div>

        {/* Status Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
          <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : member.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
          <span className="capitalize">{member.status}</span>
        </div>
      </div>
    </div>
  );
};

export default CrewMemberProfile;