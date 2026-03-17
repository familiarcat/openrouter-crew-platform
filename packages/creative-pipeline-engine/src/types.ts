export interface PipelineStepDefinition {
  id: string;
  name: string;
  description?: string;
  command?: string;
  resultFile?: string;
  continueOnError?: boolean;
  agent?: string;
  env?: Record<string, string>;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  memoryFile?: string;
  steps: PipelineStepDefinition[];
}

export interface AgentMapping {
  description?: string;
  webhookEnv?: string;
  webhookEnvCandidates?: string[];
}

export interface PipelineMapping {
  notifications?: {
    enabled?: boolean;
  };
  agents?: Record<string, AgentMapping>;
  stepAgents?: Record<string, string>;
}

export interface ExecutePipelineOptions {
  appDir: string;
  workspaceRoot?: string;
  audioInput?: string;
  wadInput?: string;
  offline?: boolean;
  installPythonDeps?: boolean;
}

export interface StepExecutionSummary {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  command?: string;
  agent?: string;
  resultFile?: string;
  result?: unknown;
  stdoutPreview?: string;
  stderrPreview?: string;
  notification?: {
    attempted: boolean;
    webhookEnv?: string;
    outcome: 'sent' | 'skipped' | 'failed';
    detail?: string;
  };
}

export interface PipelineMemoryRecord {
  schemaVersion: number;
  lastRunId?: string;
  runs: Array<{
    runId: string;
    appId: string;
    startedAt: string;
    finishedAt: string;
    status: 'success' | 'warning' | 'failed';
    durationMs: number;
    audioInput?: string;
    wadInput?: string;
    renderMode?: string;
    outputKind?: string;
    outputPath?: string;
    stepDurationsMs: Record<string, number>;
  }>;
  successfulConfigurations: Array<{
    recordedAt: string;
    runId: string;
    renderMode?: string;
    outputKind?: string;
    outputPath?: string;
  }>;
}

export interface PipelineRunSummary {
  appId: string;
  appName: string;
  runId: string;
  status: 'success' | 'warning' | 'failed';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  appDir: string;
  runDir: string;
  memoryFile: string;
  inputs: {
    audioInput?: string;
    wadInput?: string;
    offline: boolean;
    installPythonDeps: boolean;
  };
  steps: StepExecutionSummary[];
  output?: {
    kind?: string;
    path?: string;
    renderMode?: string;
  };
}
