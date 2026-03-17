import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  ExecutePipelineOptions,
  PipelineDefinition,
  PipelineMapping,
  PipelineMemoryRecord,
  PipelineRunSummary,
  PipelineStepDefinition,
  StepExecutionSummary,
} from './types';

type TemplateContext = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

function createRunId(): string {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    '-',
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join('');
}

function previewText(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 800 ? `${trimmed.slice(0, 800)}…` : trimmed;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function getValueByPath(source: TemplateContext, token: string): unknown {
  return token.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function renderTemplate(input: string | undefined, context: TemplateContext): string | undefined {
  if (!input) {
    return input;
  }

  return input.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, token: string) => {
    const value = getValueByPath(context, token.trim());
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });
}

async function runShellCommand(
  command: string,
  cwd: string,
  env: NodeJS.ProcessEnv
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function notifyCrew(
  mapping: PipelineMapping,
  step: PipelineStepDefinition,
  summary: PipelineRunSummary,
  status: 'started' | 'completed' | 'failed',
  detail?: string
): Promise<StepExecutionSummary['notification']> {
  if (summary.inputs.offline || mapping.notifications?.enabled === false) {
    return {
      attempted: false,
      outcome: 'skipped',
      detail: 'offline mode enabled',
    };
  }

  const agentKey = step.agent || mapping.stepAgents?.[step.id];
  if (!agentKey) {
    return {
      attempted: false,
      outcome: 'skipped',
      detail: 'no agent mapping',
    };
  }

  const agent = mapping.agents?.[agentKey];
  const candidates = [agent?.webhookEnv, ...(agent?.webhookEnvCandidates ?? [])].filter(Boolean) as string[];
  const webhookEnv = candidates.find((candidate) => process.env[candidate]);

  if (!webhookEnv) {
    return {
      attempted: false,
      outcome: 'skipped',
      detail: 'webhook env var not set',
    };
  }

  const webhookUrl = process.env[webhookEnv];
  if (!webhookUrl) {
    return {
      attempted: false,
      webhookEnv,
      outcome: 'skipped',
      detail: 'webhook URL unavailable',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        appId: summary.appId,
        appName: summary.appName,
        runId: summary.runId,
        stepId: step.id,
        stepName: step.name,
        status,
        detail,
        timestamp: nowIso(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        attempted: true,
        webhookEnv,
        outcome: 'failed',
        detail: `HTTP ${response.status}`,
      };
    }

    return {
      attempted: true,
      webhookEnv,
      outcome: 'sent',
    };
  } catch (error) {
    return {
      attempted: true,
      webhookEnv,
      outcome: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadMemoryFile(memoryFile: string): Promise<PipelineMemoryRecord> {
  if (!(await fileExists(memoryFile))) {
    return {
      schemaVersion: 1,
      runs: [],
      successfulConfigurations: [],
    };
  }

  return await readJsonFile<PipelineMemoryRecord>(memoryFile);
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function executePipeline(options: ExecutePipelineOptions): Promise<PipelineRunSummary> {
  const appDir = path.resolve(options.appDir);
  const workspaceRoot = path.resolve(options.workspaceRoot ?? path.join(appDir, '..', '..'));
  const pipelineFile = path.join(appDir, 'pipeline.task.json');
  const mappingFile = path.join(appDir, 'pipeline.mapping.json');

  const definition = await readJsonFile<PipelineDefinition>(pipelineFile);
  const mapping = await readJsonFile<PipelineMapping>(mappingFile);

  const runId = createRunId();
  const startedAt = nowIso();
  const runDir = path.join(appDir, 'outputs', runId);
  const memoryFile = path.join(appDir, definition.memoryFile ?? 'analysis/pipeline_memory.json');

  await fs.mkdir(runDir, { recursive: true });

  const audioInput = options.audioInput ? path.resolve(options.audioInput) : '';
  const wadInput = options.wadInput ? path.resolve(options.wadInput) : '';
  const context: TemplateContext = {
    paths: {
      appDir,
      workspaceRoot,
      runDir,
      memoryFile,
    },
    vars: {
      audioInput,
      wadInput,
      offline: options.offline ? '1' : '0',
      installPythonDeps: options.installPythonDeps ? '1' : '0',
      installPythonFlag: options.installPythonDeps ? '--install' : '',
    },
  };

  const summary: PipelineRunSummary = {
    appId: definition.id,
    appName: definition.name,
    runId,
    status: 'success',
    startedAt,
    finishedAt: startedAt,
    durationMs: 0,
    appDir,
    runDir,
    memoryFile,
    inputs: {
      audioInput: audioInput || undefined,
      wadInput: wadInput || undefined,
      offline: !!options.offline,
      installPythonDeps: !!options.installPythonDeps,
    },
    steps: [],
  };

  const runSummaryPath = path.join(runDir, 'run-summary.json');

  for (const step of definition.steps) {
    const stepStartedAt = Date.now();
    const startedNotification = await notifyCrew(mapping, step, summary, 'started');
    const command = renderTemplate(step.command, context);
    const resultFile = renderTemplate(step.resultFile, context);
    const stepEnv = Object.fromEntries(
      Object.entries(step.env ?? {}).map(([key, value]) => [key, renderTemplate(value, context) ?? ''])
    );

    const executionSummary: StepExecutionSummary = {
      id: step.id,
      name: step.name,
      status: 'skipped',
      startedAt: new Date(stepStartedAt).toISOString(),
      finishedAt: new Date(stepStartedAt).toISOString(),
      durationMs: 0,
      command,
      agent: step.agent || mapping.stepAgents?.[step.id],
      resultFile,
      notification: startedNotification,
    };

    try {
      if (!command) {
        executionSummary.status = 'skipped';
      } else {
        const result = await runShellCommand(command, appDir, {
          ...process.env,
          ...stepEnv,
          CLIPPY_APP_DIR: appDir,
          CLIPPY_WORKSPACE_ROOT: workspaceRoot,
          CLIPPY_RUN_DIR: runDir,
          CLIPPY_AUDIO_INPUT: audioInput,
          CLIPPY_WAD_INPUT: wadInput,
        });

        executionSummary.stdoutPreview = previewText(result.stdout);
        executionSummary.stderrPreview = previewText(result.stderr);

        if (result.exitCode !== 0) {
          executionSummary.status = step.continueOnError ? 'warning' : 'failed';
          executionSummary.notification = await notifyCrew(
            mapping,
            step,
            summary,
            'failed',
            executionSummary.stderrPreview || `exit code ${result.exitCode}`
          );

          if (!step.continueOnError) {
            throw new Error(`Step ${step.id} failed with exit code ${result.exitCode}`);
          }
        } else {
          executionSummary.status = 'success';
          executionSummary.notification = await notifyCrew(mapping, step, summary, 'completed');
        }
      }

      if (resultFile && (await fileExists(resultFile))) {
        executionSummary.result = await readJsonFile(resultFile);
      }
    } catch (error) {
      executionSummary.status = 'failed';
      executionSummary.stderrPreview = error instanceof Error ? error.message : String(error);
      executionSummary.notification = await notifyCrew(
        mapping,
        step,
        summary,
        'failed',
        executionSummary.stderrPreview
      );
      summary.status = 'failed';
      executionSummary.finishedAt = nowIso();
      executionSummary.durationMs = Date.now() - stepStartedAt;
      summary.steps.push(executionSummary);
      await writeJsonFile(runSummaryPath, summary);
      break;
    }

    executionSummary.finishedAt = nowIso();
    executionSummary.durationMs = Date.now() - stepStartedAt;
    if (executionSummary.status === 'warning' && summary.status === 'success') {
      summary.status = 'warning';
    }
    summary.steps.push(executionSummary);
    await writeJsonFile(runSummaryPath, summary);
  }

  const renderStep = summary.steps.find((step) => step.id === 'render_preview');
  const renderResult = renderStep?.result as Record<string, unknown> | undefined;

  summary.output = {
    kind: typeof renderResult?.output_kind === 'string' ? renderResult.output_kind : undefined,
    path: typeof renderResult?.output_path === 'string' ? renderResult.output_path : undefined,
    renderMode: typeof renderResult?.render_mode === 'string' ? renderResult.render_mode : undefined,
  };

  if (summary.status === 'success' && summary.output.kind && summary.output.kind !== 'video') {
    summary.status = 'warning';
  }

  const finishedAt = nowIso();
  summary.finishedAt = finishedAt;
  summary.durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

  const memory = await loadMemoryFile(memoryFile);
  memory.lastRunId = runId;
  memory.runs.push({
    runId,
    appId: summary.appId,
    startedAt,
    finishedAt,
    status: summary.status,
    durationMs: summary.durationMs,
    audioInput: summary.inputs.audioInput,
    wadInput: summary.inputs.wadInput,
    renderMode: summary.output?.renderMode,
    outputKind: summary.output?.kind,
    outputPath: summary.output?.path,
    stepDurationsMs: Object.fromEntries(summary.steps.map((step) => [step.id, step.durationMs])),
  });

  if (summary.status !== 'failed') {
    memory.successfulConfigurations.push({
      recordedAt: finishedAt,
      runId,
      renderMode: summary.output?.renderMode,
      outputKind: summary.output?.kind,
      outputPath: summary.output?.path,
    });
  }

  await writeJsonFile(memoryFile, memory);
  await writeJsonFile(runSummaryPath, summary);
  await writeJsonFile(path.join(appDir, 'outputs', 'latest-run.json'), summary);

  return summary;
}
