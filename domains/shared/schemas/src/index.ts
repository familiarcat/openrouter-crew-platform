import { z } from 'zod';
export interface Tables { [key: string]: any; };
export interface LLMUsageEvent { id: string; model: string; crew_member: string; input_tokens: number; output_tokens: number; total_tokens: number; estimated_cost_usd: number; project_id: string; created_at: string; };
export interface Project { id: string; name: string; budget?: number; status?: string; };
export enum ModelTier { HAIKU = 'haiku', SONNET = 'sonnet', OPUS = 'opus', GPT_4O = 'gpt-4o', GEMINI_1_5_PRO = 'gemini-1.5-pro' }
export type ModelChoice = ModelTier;
export type RoutingMode = 'premium' | 'standard' | 'budget' | 'ultra_budget';
export type CostTier = 'premium' | 'standard' | 'budget' | 'ultra_budget';
export const MissionStateSchema = z.object({ missionId: z.string(), projectId: z.string(), status: z.any(), brief: z.any(), steps: z.array(z.any()), timestamp: z.string(), error: z.string().optional() });
export type MissionState = z.infer<typeof MissionStateSchema>;