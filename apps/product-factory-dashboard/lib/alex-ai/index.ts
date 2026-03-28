/**
 * Alex AI Integration Module
 * 
 * Unified DDD architecture connecting:
 * - UI Client / Cursor Chat → MCP Server
 * - MCP Server ↔ n8n Crew Orchestration
 * - n8n Server ↔ Supabase RAG Memories
 * 
 * This module provides the integration layer for the Alex AI crew system
 * within the rag-refresh-product-factory project.
 */

import fs from 'fs';
import path from 'path';

// =============================================================================
// TYPES
// =============================================================================

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  department: string;
  specialization: string[];
  status: 'active' | 'inactive';
  capabilities: string[];
  personality: {
    archetype: string;
    traits: string[];
    catchphrases: string[];
    decisionMaking: string;
    responseStyle: string;
  };
  aiConfiguration: {
    model: string;
    preferredModels?: string[];
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    guidelines: string[];
  };
  integrations: {
    n8n: {
      enabled: boolean;
      workflowId: string;
      webhookPath: string;
      workflowName: string;
    };
    supabase: {
      enabled: boolean;
      memoryTable: string;
      filter: string;
    };
    alexAI: {
      enabled: boolean;
      integration: string;
      coordinatesWithCrew: boolean;
    };
  };
  responsibilities: string[];
  worksWith: string[];
  typicalUseCases: string[];
  memoryAlpha?: Record<string, unknown>;
}

export interface ObservationLoungeSession {
  id: string;
  topic: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  attendees: CrewMember[];
  contributions: CrewContribution[];
  consensus?: string;
  actionItems: ActionItem[];
  timestamp: string;
}

export interface CrewContribution {
  crew: string;
  role: string;
  expertise: string;
  recommendation?: string;
  memories: unknown[];
  emoji: string;
}

export interface ActionItem {
  id: string;
  assignee: string;
  task: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

// =============================================================================
// CREW LOADER
// =============================================================================

const CREW_MEMBERS_DIR = path.join(process.cwd(), 'crew-members');

export function loadCrewMembers(): Map<string, CrewMember> {
  const crew = new Map<string, CrewMember>();
  
  try {
    const files = fs.readdirSync(CREW_MEMBERS_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CREW_MEMBERS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const member = JSON.parse(content) as CrewMember;
        crew.set(member.id, member);
      }
    }
  } catch (error) {
    console.error('Failed to load crew members:', error);
  }
  
  return crew;
}

export function getCrewMember(id: string): CrewMember | undefined {
  const crew = loadCrewMembers();
  return crew.get(id);
}

export function getAllCrewMembers(): CrewMember[] {
  return Array.from(loadCrewMembers().values());
}

// =============================================================================
// OBSERVATION LOUNGE
// =============================================================================

export class ObservationLounge {
  private crew: Map<string, CrewMember>;

  constructor() {
    this.crew = loadCrewMembers();
  }

  /**
   * Convene the senior staff for collaborative discussion
   */
  convene(topic: string, options: {
    attendees?: string[];
    urgency?: 'low' | 'normal' | 'high' | 'critical';
  } = {}): ObservationLoungeSession {
    const {
      attendees = ['captain_picard', 'commander_riker', 'commander_data', 'geordi_la_forge', 'lieutenant_worf', 'dr_crusher', 'counselor_troi'],
      urgency = 'normal',
    } = options;

    const attendeeMembers = attendees
      .map(id => this.crew.get(id))
      .filter((m): m is CrewMember => m !== undefined);

    const session: ObservationLoungeSession = {
      id: `obs-${Date.now()}`,
      topic,
      urgency,
      attendees: attendeeMembers,
      contributions: attendeeMembers.map(m => ({
        crew: m.name,
        role: m.role,
        expertise: m.specialization.join(', '),
        memories: [],
        emoji: this.getCrewEmoji(m.id),
      })),
      actionItems: [],
      timestamp: new Date().toISOString(),
    };

    return session;
  }

  /**
   * Determine optimal discussion order based on topic
   */
  getDiscussionOrder(topic: string): string[] {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('security') || topicLower.includes('risk')) {
      return ['lieutenant_worf', 'commander_data', 'geordi_la_forge', 'commander_riker', 'captain_picard'];
    }
    
    if (topicLower.includes('infrastructure') || topicLower.includes('code') || topicLower.includes('api')) {
      return ['geordi_la_forge', 'commander_data', 'chief_obrien', 'lieutenant_worf', 'captain_picard'];
    }
    
    if (topicLower.includes('user') || topicLower.includes('ux') || topicLower.includes('experience')) {
      return ['counselor_troi', 'dr_crusher', 'lieutenant_uhura', 'commander_riker', 'captain_picard'];
    }
    
    if (topicLower.includes('budget') || topicLower.includes('cost') || topicLower.includes('roi')) {
      return ['quark', 'commander_riker', 'chief_obrien', 'captain_picard'];
    }
    
    if (topicLower.includes('performance') || topicLower.includes('health')) {
      return ['dr_crusher', 'commander_data', 'geordi_la_forge', 'captain_picard'];
    }
    
    // Default: strategic chain of command
    return ['commander_data', 'geordi_la_forge', 'lieutenant_worf', 'counselor_troi', 'commander_riker', 'captain_picard'];
  }

  private getCrewEmoji(id: string): string {
    const emojis: Record<string, string> = {
      captain_picard: '👨‍✈️',
      commander_data: '🤖',
      commander_riker: '🎺',
      geordi_la_forge: '🔧',
      lieutenant_worf: '⚔️',
      dr_crusher: '👩‍⚕️',
      counselor_troi: '💜',
      chief_obrien: '🛠️',
      lieutenant_uhura: '📡',
      quark: '💰',
    };
    return emojis[id] || '🖖';
  }
}

// =============================================================================
// HALLUCINATION PREVENTION
// =============================================================================

export interface HallucinationEvent {
  id: string;
  type: 'terminal-blocker' | 'memory-conflict' | 'context-drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedBy: string;
  timestamp: string;
  resolution?: string;
}

export class HallucinationDetector {
  private events: HallucinationEvent[] = [];

  /**
   * Log a potential hallucination event for crew analysis
   */
  logEvent(event: Omit<HallucinationEvent, 'id' | 'timestamp'>): HallucinationEvent {
    const fullEvent: HallucinationEvent = {
      ...event,
      id: `hall-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    this.events.push(fullEvent);
    return fullEvent;
  }

  /**
   * Get events for crew collaborative analysis
   */
  getEventsForAnalysis(severity?: string): HallucinationEvent[] {
    if (severity) {
      return this.events.filter(e => e.severity === severity);
    }
    return [...this.events];
  }

  /**
   * Clear resolved events
   */
  clearResolved(): void {
    this.events = this.events.filter(e => !e.resolution);
  }
}

// =============================================================================
// N8N INTEGRATION
// =============================================================================

export interface N8nConfig {
  baseUrl: string;
  apiKey: string;
  webhookUrl: string;
}

export class N8nOrchestrator {
  private config: N8nConfig;

  constructor(config: N8nConfig) {
    this.config = config;
  }

  async callCrewWebhook(crewId: string, payload: unknown): Promise<unknown> {
    const crew = getCrewMember(crewId);
    if (!crew?.integrations.n8n.enabled) {
      throw new Error(`Crew member ${crewId} does not have n8n integration enabled`);
    }

    const url = `${this.config.webhookUrl}${crew.integrations.n8n.webhookPath}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    return response.json();
  }

  async orchestrateCrew(task: string, context: Record<string, unknown> = {}): Promise<unknown> {
    const crew = getAllCrewMembers();
    
    return this.callWebhook('alex-ai/orchestrate', {
      task,
      context,
      crew: crew.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        specialty: c.specialization.join(', '),
      })),
      timestamp: new Date().toISOString(),
    });
  }

  private async callWebhook(endpoint: string, payload: unknown): Promise<unknown> {
    const url = `${this.config.webhookUrl}/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    return response.json();
  }
}

// =============================================================================
// SUPABASE RAG
// =============================================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export interface CrewMemory {
  id: string;
  crew_member: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  created_at: string;
}

// Note: Actual Supabase client integration should use @supabase/supabase-js
// This is a type definition for the interface

// =============================================================================
// EXPORTS
// =============================================================================

export const observationLounge = new ObservationLounge();
export const hallucinationDetector = new HallucinationDetector();

export default {
  loadCrewMembers,
  getCrewMember,
  getAllCrewMembers,
  ObservationLounge,
  HallucinationDetector,
  N8nOrchestrator,
  observationLounge,
  hallucinationDetector,
};
