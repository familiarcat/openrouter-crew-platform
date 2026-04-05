export enum ModelTier {
  HAIKU = 'anthropic/claude-3-haiku-20240307',
  SONNET = 'anthropic/claude-3-sonnet-20240229',
  OPUS = 'anthropic/claude-3-opus-20240229',
  GPT_4O = 'openai/gpt-4o',
  GEMINI_1_5_PRO = 'google/gemini-1.5-pro-latest',
  // Add other relevant models as needed
}

export type ModelTierString = keyof typeof ModelTier;