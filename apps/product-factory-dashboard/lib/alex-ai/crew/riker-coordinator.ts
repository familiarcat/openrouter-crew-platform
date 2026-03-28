/**
 * Commander Riker - Tactical Execution & Coordination
 * 
 * Handles project analysis, synergy detection, and execution planning.
 * Delegates complex reasoning to the AI Crew Member via n8n.
 */

import { wrapCrewCall } from './client';

export interface ProjectSnapshot {
  id: string;
  name: string;
  status: string;
  progress: number;
  domains: Array<{
    slug: string;
    name: string;
    status: string;
    progress: number;
    features: string[];
  }>;
  crew: Array<{
    memberId: string;
    role: string;
    assignment: string;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    status: string;
    date?: string;
  }>;
}

export const rikerCoordinator = {
  /**
   * General tactical execution and coordination
   */
  execute: async (message: string, context?: any) => {
    return wrapCrewCall('commander_riker', message, context);
  },

  /**
   * Generate a coordination plan across multiple projects
   */
  generateCoordinationPlan: async (projects: ProjectSnapshot[]) => {
    return wrapCrewCall(
      'commander_riker', 
      'Analyze these projects and generate a coordination plan focusing on cross-project synergies and resource optimization.', 
      { projects }
    );
  },

  /**
   * Analyze a single project for collaboration needs
   */
  analyzeProject: async (project: ProjectSnapshot) => {
    return wrapCrewCall(
      'commander_riker',
      'Analyze this project for collaboration opportunities and acceleration strategies.',
      { project }
    );
  }
};