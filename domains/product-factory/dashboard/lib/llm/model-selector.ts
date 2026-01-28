import fs from "node:fs";
import path from "node:path";

export type ModelTier = "cheap" | "standard" | "premium";
export type SelectModelInput = {
  crewMember?: string;
  complexity?: number; // 1..10
  needsRag?: boolean;
  needsTools?: boolean;
  minContext?: number; // tokens
};

type CostModel = {
  id: string;
  input_per_million?: number;
  output_per_million?: number;
  context?: number;
  supports_tools?: boolean;
  supports_rag?: boolean;
};

type CostDb = { models: CostModel[] };

type Policy = {
  tiers: Record<string, { max_complexity: number; min_context: number; requires_tools: boolean }>;
  crew_defaults: Record<string, ModelTier>;
  fallback_models: string[];
};

function readJson<T>(p: string): T {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as T;
}

function projectRoot() {
  // Works in Next.js server runtime + node scripts
  return process.cwd();
}

export function selectOpenRouterModel(input: SelectModelInput = {}) {
  const root = projectRoot();
  const policyPath = path.join(root, "data", "model-policy.json");
  const costPath = path.join(root, "data", "llm-cost-database.json");

  const policy = readJson<Policy>(policyPath);
  const costDb = readJson<CostDb>(costPath);

  const crew = (input.crewMember || "").toLowerCase();
  const complexity = Math.max(1, Math.min(10, input.complexity ?? 3));
  const defaultTier: ModelTier = policy.crew_defaults[crew] ?? "standard";

  const tier: ModelTier =
    complexity <= policy.tiers.cheap.max_complexity ? "cheap" :
    complexity <= policy.tiers.standard.max_complexity ? "standard" : "premium";

  // elevate tier if explicit requirements demand it
  const needsTools = input.needsTools ?? policy.tiers[tier].requires_tools;
  const minContext = Math.max(input.minContext ?? 0, policy.tiers[tier].min_context ?? 0);
  const needsRag = input.needsRag ?? false;

  // Candidate models: allowlist in policy fallback list
  const candidates = policy.fallback_models
    .map(id => costDb.models.find(m => m.id === id) ?? ({ id } as CostModel))
    .filter(m => !needsTools || m.supports_tools !== false)
    .filter(m => !needsRag || m.supports_rag !== false)
    .filter(m => (m.context ?? 0) >= minContext);

  const scored = candidates.map(m => {
    const inCost = m.input_per_million ?? 9999;
    const outCost = m.output_per_million ?? 9999;
    const score = inCost * 0.6 + outCost * 0.4;
    return { id: m.id, score, context: m.context ?? 0 };
  }).sort((a,b) => a.score - b.score);

  const selected = scored[0]?.id ?? policy.fallback_models[0];
  return {
    model: selected,
    tier,
    defaultTier,
    inputs: { crewMember: input.crewMember, complexity, needsTools, needsRag, minContext }
  };
}
