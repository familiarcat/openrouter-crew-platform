#!/usr/bin/env node
import path from 'node:path';
import { executePipeline } from './engine';

interface ParsedArgs {
  appDir?: string;
  audioInput?: string;
  wadInput?: string;
  offline: boolean;
  installPythonDeps: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    offline: false,
    installPythonDeps: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--app' && next) {
      parsed.appDir = next;
      index += 1;
      continue;
    }

    if (arg === '--audio' && next) {
      parsed.audioInput = next;
      index += 1;
      continue;
    }

    if (arg === '--wad' && next) {
      parsed.wadInput = next;
      index += 1;
      continue;
    }

    if (arg === '--offline') {
      parsed.offline = true;
      continue;
    }

    if (arg === '--install-python-deps') {
      parsed.installPythonDeps = true;
    }
  }

  return parsed;
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  if (command !== 'run') {
    console.error('Usage: creative-pipeline run --app <path> [--audio <path>] [--wad <path>] [--offline] [--install-python-deps]');
    process.exit(1);
  }

  const parsed = parseArgs(rest);
  if (!parsed.appDir) {
    console.error('Missing required flag: --app <path>');
    process.exit(1);
  }

  const summary = await executePipeline({
    appDir: path.resolve(parsed.appDir),
    audioInput: parsed.audioInput,
    wadInput: parsed.wadInput,
    offline: parsed.offline,
    installPythonDeps: parsed.installPythonDeps,
  });

  console.log(`Run ${summary.runId}: ${summary.status}`);
  console.log(`Run summary: ${path.join(summary.runDir, 'run-summary.json')}`);
  if (summary.output?.path) {
    console.log(`Output: ${summary.output.path}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
