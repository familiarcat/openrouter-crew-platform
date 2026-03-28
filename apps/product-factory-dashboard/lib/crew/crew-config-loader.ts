/**
 * Crew configuration loader.
 *
 * Loads and parses crew member JSON configuration files from the
 * crew-members/ directory. Provides type-safe access to crew member
 * configurations including system prompts, AI settings, and tier models.
 */

import fs from "fs";
import path from "path";

/**
 * Crew member configuration structure
 * Based on crew-members/*.json files
 */
export interface CrewConfig {
  id: string;
  name: string;
  callName: string;
  role: string;
  department: string;
  specialization: string[];
  capabilities: string[];
  aiConfiguration: {
    model: string;
    systemPrompt: string;
    temperature: number;
    maxTokens: number;
    tieredModels: {
      [tier: string]: {
        primary: string;
        fallback: string;
        costPerRequest: number;
        description?: string;
      };
    };
    dynamicSelection?: {
      enabled: boolean;
      defaultTier: string;
      costOptimization: boolean;
      orchestratorControlled: boolean;
    };
  };
  integrations?: {
    n8n?: {
      enabled: boolean;
      workflowId?: string;
      webhookPath?: string;
      workflowName?: string;
    };
    supabase?: {
      enabled: boolean;
      memoryTable?: string;
      filter?: string;
    };
    alexAI?: {
      enabled: boolean;
      integration?: string;
      coordinatesWithCrew?: boolean;
    };
  };
  personality?: {
    archetype: string;
    traits: string[];
    catchphrases: string[];
    decisionMaking: string;
    responseStyle: string;
  };
  expertise?: {
    primary: string;
    secondary: string[];
    yearsOfExperience: string;
    knownFor: string[];
  };
}

/**
 * Load a single crew member configuration by ID
 *
 * @param crewId - The crew member ID (e.g., "commander_riker")
 * @returns Crew member configuration
 * @throws Error if configuration file not found or invalid
 */
export function loadCrewConfig(crewId: string): CrewConfig {
  const projectRoot = process.cwd();

  // Convert crew_id to filename format: commander_riker -> commander-riker.json
  const filename = crewId.replace(/_/g, "-") + ".json";
  const configPath = path.join(projectRoot, "crew-members", filename);

  try {
    const data = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(data) as CrewConfig;
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load crew config for ${crewId}: ${error.message}`
      );
    }
    throw new Error(`Failed to load crew config for ${crewId}`);
  }
}

/**
 * Load all crew member configurations
 *
 * @returns Record mapping crew IDs to their configurations
 */
export function loadAllCrewConfigs(): Record<string, CrewConfig> {
  const projectRoot = process.cwd();
  const crewMembersDir = path.join(projectRoot, "crew-members");

  const configs: Record<string, CrewConfig> = {};

  try {
    const files = fs.readdirSync(crewMembersDir);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const configPath = path.join(crewMembersDir, file);
      const data = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(data) as CrewConfig;

      configs[config.id] = config;
    }

    return configs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load crew configs: ${error.message}`);
    }
    throw new Error("Failed to load crew configs");
  }
}

/**
 * Get model ID for a crew member at a specific tier
 *
 * @param crewId - The crew member ID
 * @param tier - The LLM tier (e.g., "premium", "standard", "budget")
 * @returns Model ID (e.g., "openai/gpt-4o")
 * @throws Error if crew config or tier not found
 */
export function getCrewModelForTier(crewId: string, tier: string): string {
  const config = loadCrewConfig(crewId);

  const tierConfig = config.aiConfiguration.tieredModels[tier];
  if (!tierConfig) {
    throw new Error(
      `Tier '${tier}' not found for crew member ${crewId}`
    );
  }

  return tierConfig.primary;
}
