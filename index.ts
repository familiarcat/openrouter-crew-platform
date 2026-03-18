#!/usr/bin/env node

import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import chalk from 'chalk';
import { Command } from 'commander';

import {
  printError,
  printHeader,
  printInfo,
  printStep,
  printSuccess,
  printTable,
  printWarning,
  stepMarker,
} from './logger';
import { askForConfirmation } from './prompts';
import { readConfig, writeConfig } from './configManager';

// --- Global Configuration (derived from bash script) ---
// Adjust PROJECT_ROOT based on where the compiled JS will run relative to the monorepo root
// If `crew` is run from monorepo root, and `dist/index.js` is in `apps/crew-cli/dist`,
// then `__dirname` is `apps/crew-cli/dist`, so `path.resolve(__dirname, '../../..')` correctly points to the monorepo root.
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const MEMORY_PACKAGE_DIR = path.join(PROJECT_ROOT, 'domains/shared/agent-memory');
const UNIFIED_DASHBOARD_DIR = path.join(PROJECT_ROOT, 'apps/unified-dashboard');

interface CliOptions {
  full: boolean;
  quick: boolean;
  skipPublish: boolean;
  skipDb: boolean;
  skipTests: boolean;
  step?: string;
}

interface Step {
  name: string;
  description: string;
  action: (options: CliOptions) => Promise<boolean>;
  isFatal?: boolean;
  shouldSkip?: (options: CliOptions) => Promise<boolean>;
}

const checkEnvironmentVariables = (options: CliOptions): void => {
  printStep('Checking environment variables...');

  interface EnvVarCheck {
    variable: keyof NodeJS.ProcessEnv;
    successMessage?: string;
    warningMessage: string;
    onMissing: (opts: CliOptions) => void;
    shouldCheck?: (opts: CliOptions) => boolean;
  }

  const checks: EnvVarCheck[] = [
    {
      variable: 'SUPABASE_URL',
      successMessage: 'SUPABASE_URL is set',
      warningMessage: 'SUPABASE_URL not set (database migration will be skipped)',
      onMissing: (opts) => { opts.skipDb = true; },
    },
    {
      variable: 'SUPABASE_KEY',
      successMessage: 'SUPABASE_KEY is set',
      warningMessage: 'SUPABASE_KEY not set (database migration will be skipped)',
      onMissing: (opts) => { opts.skipDb = true; },
    },
    {
      variable: 'NPM_TOKEN',
      // No success message for NPM_TOKEN, matching original logic
      warningMessage: 'NPM_TOKEN not set (npm publishing will be skipped)',
      onMissing: (opts) => { opts.skipPublish = true; },
      shouldCheck: (opts) => !opts.skipPublish,
    },
  ];

  for (const check of checks) {
    if (check.shouldCheck && !check.shouldCheck(options)) {
      continue;
    }

    if (process.env[check.variable]) {
      if (check.successMessage) {
        printSuccess(check.successMessage);
      }
    } else {
      printWarning(check.warningMessage);
      check.onMissing(options);
    }
  }

  if (options.skipDb) {
    printInfo('Database setup will be skipped');
  }
  if (options.skipPublish) {
    printInfo('npm publishing will be skipped');
  }

  printSuccess('Environment variables checked.');
};


// --- Prerequisite Checks ---
const checkPrerequisites = async (options: CliOptions): Promise<boolean> => {
  interface Prerequisite {
    description: string;
    execute: () => boolean; // Returns true on success
    isFatal: boolean;
  }

  const checkCommand = (cmd: string, successMessage: (version: string) => string, errorMessage: string, isOptional: boolean = false): boolean => {
    try {
      const version = execSync(`${cmd} --version`, { stdio: 'pipe' }).toString().trim();
      printSuccess(successMessage(version));
      return true;
    } catch (_) {
      if (isOptional) {
        printWarning(errorMessage);
        return true; // Optional check doesn't fail the process
      }
      printError(errorMessage);
      return false;
    }
  };

  const checkPath = (pathToCheck: string, successMessage: string, errorMessage: string, isDirectory: boolean, isOptional: boolean = false): boolean => {
    if (!fs.existsSync(pathToCheck)) {
      if (isOptional) {
        printWarning(errorMessage);
        return true;
      }
      printError(errorMessage);
      return false;
    }
    const stats = fs.statSync(pathToCheck);
    if ((isDirectory && !stats.isDirectory()) || (!isDirectory && !stats.isFile())) {
      printError(`${path.basename(pathToCheck)} is not a ${isDirectory ? 'directory' : 'file'} at ${pathToCheck}.`);
      return false;
    }
    printSuccess(successMessage);
    return true;
  };

  const toolAndPathChecks: Prerequisite[] = [
    {
      description: 'Node.js',
      execute: () => checkCommand('node', (v) => `Node.js: ${v}`, 'Node.js not found. Please install Node.js 18+'),
      isFatal: true,
    },
    {
      description: 'pnpm',
      execute: () => checkCommand('pnpm', (v) => `pnpm: ${v}`, 'pnpm not found. Install with: npm install -g pnpm'),
      isFatal: true,
    },
    {
      description: 'git',
      execute: () => checkCommand('git', (v) => `git: ${v.split(' ')[2] ?? v}`, 'git not found'),
      isFatal: true,
    },
    {
      description: 'TypeScript Compiler (tsc)',
      execute: () => checkCommand('tsc', (v) => `tsc: ${v}`, 'TypeScript not installed globally (will use pnpm)', true),
      isFatal: false,
    },
    {
      description: 'Root package.json',
      execute: () => checkPath(path.join(PROJECT_ROOT, 'package.json'), 'Root package.json found', 'Root package.json not found', false),
      isFatal: true,
    },
    {
      description: 'Memory package directory',
      execute: () => checkPath(MEMORY_PACKAGE_DIR, 'Memory package directory found', `Memory package directory not found at ${MEMORY_PACKAGE_DIR}`, true),
      isFatal: true,
    },
    {
      description: 'Unified dashboard directory',
      execute: () => checkPath(UNIFIED_DASHBOARD_DIR, 'Unified dashboard directory found', 'Unified dashboard not found (optional)', true, true),
      isFatal: false,
    },
  ];

  printStep('Verifying tools and project structure...');
  for (const check of toolAndPathChecks) {
    if (!check.execute() && check.isFatal) {
      printError(`Fatal prerequisite check failed: ${check.description}`);
      return false;
    }
  }
  printSuccess('Tools and project structure verified.');

  checkEnvironmentVariables(options);

  return true;
};

// --- Step Implementations (Exported for testing) ---
export const steps = {
  checkPrerequisites: async (options: CliOptions): Promise<boolean> => checkPrerequisites(options),

  setupDatabase: async (_options: CliOptions): Promise<boolean> => {
    interface DbCheck {
      description: string;
      execute: () => boolean; // returns true if the overall step can continue
    }

    const checks: DbCheck[] = [
      {
        description: 'Check for Supabase CLI',
        execute: () => {
          printStep('Checking for Supabase CLI...');
          try {
            execSync('supabase --version', { stdio: 'pipe' });
            printSuccess('Supabase CLI found.');
            return true; // Continue to next check
          } catch (_) {
            printWarning('Supabase CLI not found or not in PATH. Installation instructions:');
            console.log(chalk.gray('  npm install -g supabase'));
            printInfo('Skipping automatic database migration. Manual migration may be required.');
            return false; // Stop processing checks for this step
          }
        },
      },
      {
        description: 'Apply database migrations',
        execute: () => {
          printStep('Applying database migrations...');
          try {
            execSync('supabase db push', { cwd: PROJECT_ROOT, stdio: 'inherit' });
            printSuccess('Database migration applied successfully.');
          } catch (_) {
            printWarning('Database migration encountered an issue (may be non-critical).');
            printInfo('Continuing with unification steps...');
          }
          return true; // Always continue, as this part is non-fatal.
        },
      },
    ];

    for (const check of checks) {
      if (!check.execute()) {
        break;
      }
    }

    return true;
  },

  installDependencies: async (): Promise<boolean> => {
    printStep('Running pnpm install...');
    try {
      execSync('pnpm install', { cwd: PROJECT_ROOT, stdio: 'inherit' });
      printSuccess('Dependencies installed');
      return true;
    } catch (e: unknown) {
      printError('Failed to install dependencies');
      return false;
    }
  },

  buildMemorySystem: async (): Promise<boolean> => {
    printStep('Compiling TypeScript and verifying artifacts...');
    try {
      execSync('pnpm --filter @openrouter-crew/agent-memory build', { cwd: PROJECT_ROOT, stdio: 'inherit' });
      printSuccess('Memory system built successfully');
      return true;
    } catch (e: unknown) {
      printError('Memory system build failed');
      return false;
    }
  },

  runTests: async (): Promise<boolean> => {
    printStep('Running tests across the monorepo...');
    try {
      // The `test` script in the root package.json will run tests for all workspaces.
      execSync('pnpm test', { cwd: PROJECT_ROOT, stdio: 'inherit' });
      printSuccess('All tests passed');
      return true;
    } catch (e: unknown) {
      printError('Tests failed');
      return false;
    }
  },

  publishToNpm: async (options: CliOptions): Promise<boolean> => {
    printStep('Preparing npm publication...');

    try {
      const packageJsonPath = path.join(MEMORY_PACKAGE_DIR, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        printError(`package.json not found at ${packageJsonPath}`);
        return false;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version: string };
      const currentVersion = packageJson.version;

      printInfo(`Current version: ${currentVersion}`);
      printStep('Publishing package...');

      execSync('npm publish --access public', { cwd: MEMORY_PACKAGE_DIR, stdio: 'inherit' });
      printSuccess(`Published @openrouter-crew/agent-memory@${currentVersion} to npm`);
      return true;
    } catch (_) {
      printWarning('npm publish encountered issues');
      printInfo('This may be due to version already existing');
      return true;
    }
  },
};

// --- Step Definitions ---
const unificationSteps: Step[] = [
  { name: 'prerequisites', description: 'Checking Prerequisites', action: steps.checkPrerequisites, isFatal: true },
  { name: 'database', description: 'Setting Up Database', action: steps.setupDatabase, isFatal: false, shouldSkip: async (opts) => opts.skipDb },
  { name: 'dependencies', description: 'Installing Dependencies', action: steps.installDependencies, isFatal: true },
  { name: 'build-memory', description: 'Building Memory System', action: steps.buildMemorySystem, isFatal: true },
  { name: 'test', description: 'Running Monorepo Tests', action: steps.runTests, isFatal: true, shouldSkip: async (opts) => opts.skipTests },
  { name: 'publish', description: 'Publishing to npm', action: steps.publishToNpm, isFatal: false, shouldSkip: async (opts) => opts.skipPublish },
];

// --- Step Runner ---
const runUnification = async (options: CliOptions): Promise<void> => {
  printHeader('🎨 OpenRouter Crew Platform - Unified Integration');

  // Adjust options based on quick/full flags
  if (options.full) {
    options.quick = false;
    options.skipPublish = false;
    options.skipDb = false;
  } else if (options.quick) {
    options.skipPublish = true;
    options.skipDb = false;
  }

  printInfo(`Mode: ${options.full ? 'full' : options.quick ? 'quick' : options.step ? `step (${options.step})` : 'default'} | Publish: ${!options.skipPublish} | Database: ${!options.skipDb} | Tests: ${!options.skipTests}`);

  const stepsToRun = options.step ? unificationSteps.filter(s => s.name === options.step) : unificationSteps;

  if (options.step && stepsToRun.length === 0) {
    printError(`Step '${options.step}' is not implemented or invalid.`);
    printInfo(`Available steps: ${unificationSteps.map(s => s.name).join(', ')}`);
    process.exit(1);
  }

  for (const [index, step] of unificationSteps.entries()) {
    if (options.step && step.name !== options.step) continue;

    const stepNumber = index + 1;
    const totalSteps = unificationSteps.length;

    if (step.shouldSkip && await step.shouldSkip(options)) {
      stepMarker(`${stepNumber}/${totalSteps}`, `${step.description} (SKIPPED)`);
      continue;
    }

    stepMarker(`${stepNumber}/${totalSteps}`, step.description);
    const success = await step.action(options);

    if (!success && step.isFatal) {
      printError(`Fatal error during '${step.name}' step. Halting process.`);
      process.exit(1);
    }
  }

  printHeader('🎉 Unification Process Finished');
};

import { CrewApiClient } from './apiClient';

// Initialize the API client
const apiClient = new CrewApiClient({
    baseUrl:
      process.env.CREW_API_URL ||
      (process.env.CREW_PLATFORM_URL
        ? `${process.env.CREW_PLATFORM_URL.replace(/\/$/, '')}/api`
        : 'http://localhost:3000/api'),
    apiKey: process.env.CREW_API_KEY || 'dummy-key'
});

function runProjectCliCommand<T>(
  command:
    | 'list'
    | 'create'
    | 'get'
    | 'update'
    | 'delete'
    | 'list-sprints'
    | 'create-sprint'
    | 'list-stories'
    | 'get-story'
    | 'create-story'
    | 'update-story',
  options: {
    id?: string;
    payload?: Record<string, unknown>;
    status?: string;
    limit?: number;
  } = {}
): T {
  const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'crew-project-cli.mjs');
  const args = [scriptPath, command];

  if (options.id && !['list-sprints', 'list-stories'].includes(command)) {
    args.push('--id', options.id);
  }
  if (options.id && command === 'list-sprints') {
    args.push('--project-id', options.id);
  }
  if (options.id && command === 'list-stories') {
    args.push('--sprint-id', options.id);
  }
  if (options.status) {
    args.push('--status', options.status);
  }
  if (typeof options.limit === 'number') {
    args.push('--limit', String(options.limit));
  }
  if (options.payload) {
    args.push('--payload', JSON.stringify(options.payload));
  }

  const output = execFileSync(process.execPath, args, {
    cwd: PROJECT_ROOT,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 5,
  });

  return JSON.parse(output) as T;
}

// --- Main CLI Program ---
const program = new Command();

program
  .name('crew')
  .description('Unified CLI for OpenRouter Crew Platform operations')
  .version('1.0.0');

program
  .command('unify')
  .description('Orchestrates memory system deployment, UI/UX unification, and cross-platform integration')
  .option('--full', 'Complete integration (with publishing)', false)
  .option('--quick', 'Quick setup (no npm publishing)', false)
  .option('--skip-publish', 'Skip npm publishing', false)
  .option('--skip-db', 'Skip database migration', false)
  .option('--skip-tests', 'Skip running tests', false)
  .option('--step <name>', 'Run only a specific step (e.g., prerequisites, database, build-memory)')
  .action(runUnification);


const projectCommand = program.command('project')
  .description('Manage projects');

projectCommand
  .command('list')
  .description('List all projects in a table')
  .option('--json', 'Output raw project JSON')
  .action(async (options: { json?: boolean }) => {
    try {
      if (!options.json) {
        printStep('Fetching projects...');
      }

      const payload = runProjectCliCommand<{ projects: {
        id: string;
        name: string;
        status: string;
        budgetAllocated: number;
        budgetSpent: number;
      }[] }>('list');
      const projects = payload.projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        budget: {
          limit: project.budgetAllocated || 0,
          spent: project.budgetSpent || 0,
        },
      }));

      if (options.json) {
        console.log(JSON.stringify(projects, null, 2));
        return;
      }

      printHeader('All Projects');

      if (projects.length === 0) {
        printInfo('No projects found. Use `crew project new` to create one.');
        return;
      }

      printTable(projects, [
        { header: 'ID', width: 20, getter: (p) => p.id },
        { header: 'Name', width: 30, getter: (p) => p.name },
        {
          header: 'Status',
          width: 15,
          getter: (p) => p.status,
          color: (p) => p.status === 'active' ? chalk.green : chalk.gray
        },
        { header: 'Budget', width: 15, getter: (p) => `$${p.budget.limit.toFixed(2)}` },
        { header: 'Spent', width: 15, getter: (p) => `$${p.budget.spent.toFixed(2)}` },
        {
          header: 'Usage',
          width: 10,
          getter: (p) => `${(p.budget.spent / p.budget.limit * 100).toFixed(0)}%`
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to list projects: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('create <projectName>')
  .description('Create a project through the shared dashboard API')
  .option('--description <text>', 'Project description')
  .option('--domain <id>', 'Domain id (product-factory, dj-booking, alex-ai-universal)', 'product-factory')
  .option('--budget <amount>', 'Budget in USD')
  .option('--json', 'Output raw project JSON')
  .action(async (
    projectName: string,
    options: { description?: string; domain?: string; budget?: string; json?: boolean },
  ) => {
    try {
      if (!options.json) {
        printStep(`Creating project "${projectName}"...`);
      }

      const budgetUsd = options.budget ? parseFloat(options.budget) : undefined;
      if (options.budget && (Number.isNaN(budgetUsd) || budgetUsd! < 0)) {
        throw new Error(`Invalid budget amount: "${options.budget}". Must be a positive number.`);
      }

      const payload = runProjectCliCommand<{ project: { id: string; name: string; createdAt: string } }>('create', {
        payload: {
          name: projectName,
          description: options.description,
          domainId: options.domain,
          budgetUsd,
        },
      });
      const project = payload.project;

      if (options.json) {
        console.log(JSON.stringify(project, null, 2));
        return;
      }

      printSuccess(`Project '${project.name}' created with ID: ${project.id}`);
      printInfo("Run 'crew project list' to see the shared project catalog.");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to create project: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('new <projectName> <budget> <sprintName> <sprintGoal>')
  .description('Scaffold a new project, budget, and initial sprint')
  .option('-d, --duration <days>', 'The duration of the sprint in days', '14')
  .action(async (projectName: string, budget: string, sprintName: string, sprintGoal: string, options: { duration: string }) => {
    printHeader('🚀 Starting New Project Setup');
    console.log('---------------------------------');
    console.log(`  Project Name:    ${chalk.bold(projectName)}`);
    console.log(`  Budget:          $${chalk.bold(budget)}`);
    console.log(`  Sprint Name:     ${chalk.bold(sprintName)}`);
    console.log(`  Sprint Goal:     '${chalk.bold(sprintGoal)}'`);
    console.log(`  Sprint Duration: ${chalk.bold(options.duration)} days`);
    console.log('---------------------------------');
    console.log('');

    try {
      printStep("STEP 1: Creating project...");
      printInfo(`(CLI) Creating project "${projectName}" through the shared project command path`);
      const projectPayload = runProjectCliCommand<{ project: { id: string; name: string } }>('create', {
        payload: { name: projectName },
      });
      const newProject = projectPayload.project;
      printSuccess(`Project '${newProject.name}' created with ID: ${newProject.id}`);
      console.log('');

      printStep("STEP 2: Setting budget...");
      const budgetAmount = parseFloat(budget);
      if (isNaN(budgetAmount)) {
        throw new Error(`Invalid budget amount: "${budget}". Must be a number.`);
      }
      printInfo(`(CLI) Updating budget for project ${newProject.id} to ${budgetAmount}`);
      runProjectCliCommand('update', {
        id: newProject.id,
        payload: { budgetUsd: budgetAmount },
      });
      printSuccess(`Budget of $${budgetAmount.toFixed(2)} set for project '${newProject.name}'.`);
      console.log('');

      printStep("STEP 3: Creating sprint...");
      const durationDays = parseInt(options.duration, 10);
      if (isNaN(durationDays)) {
        throw new Error(`Invalid duration: "${options.duration}". Must be an integer.`);
      }
      const sprintParams = {
        projectId: newProject.id,
        name: sprintName,
        goal: sprintGoal,
        durationDays: durationDays,
      };
      printInfo(`(CLI) Creating sprint with params: ${JSON.stringify(sprintParams)}`);
      const sprintPayload = runProjectCliCommand<{ sprint: { name: string } }>('create-sprint', {
        payload: sprintParams,
      });
      const newSprint = sprintPayload.sprint;
      printSuccess(`Sprint '${newSprint.name}' created for project '${newProject.name}'.`);
      console.log('');

      printSuccess("🎉 Project setup complete for '" + chalk.bold(projectName) + "'.");
      printInfo("Run 'crew project list' to see your new project.");

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Project setup failed: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('feature <title>')
  .description('Create a sprint work item in the shared story lane')
  .requiredOption('--project <id>', 'Project id')
  .requiredOption('--sprint <id>', 'Sprint id')
  .option('--description <text>', 'Feature description')
  .option('--type <type>', 'Work type to store in the sprint system', 'feature')
  .option('--priority <level>', 'Priority level (1-4)', '2')
  .option('--points <number>', 'Story points', '3')
  .option('--json', 'Output raw story JSON')
  .action(async (
    title: string,
    options: {
      project: string;
      sprint: string;
      description?: string;
      type?: string;
      priority: string;
      points: string;
      json?: boolean;
    },
  ) => {
    try {
      if (!options.json) {
        printStep(`Creating feature "${title}"...`);
      }

      const priority = Number.parseInt(options.priority, 10);
      const storyPoints = Number.parseInt(options.points, 10);
      if (Number.isNaN(priority) || Number.isNaN(storyPoints)) {
        throw new Error('Priority and points must be numeric values.');
      }

      const payload = runProjectCliCommand<{ story: { id: string; title: string; sprintId: string; projectId: string } }>(
        'create-story',
        {
          payload: {
            projectId: options.project,
            sprintId: options.sprint,
            title,
            description: options.description,
            workType: options.type || 'feature',
            priority,
            storyPoints,
          },
        },
      );

      if (options.json) {
        console.log(JSON.stringify(payload.story, null, 2));
        return;
      }

      printSuccess(`Feature '${payload.story.title}' created with ID: ${payload.story.id}`);
      printInfo(`Project: ${payload.story.projectId} | Sprint: ${payload.story.sprintId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to create feature: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('info <id>')
  .description('Display detailed information about a specific project')
  .action(async (id: string) => {
    printStep(`Fetching details for project: ${id}...`);
    try {
      const payload = runProjectCliCommand<{ project: {
        id: string;
        name: string;
        createdAt: string;
        budgetAllocated: number;
        budgetSpent: number;
        sprints: { id: string; name: string; goals?: string[]; goal?: string }[];
      } }>('get', { id });
      const project = {
        id: payload.project.id,
        name: payload.project.name,
        createdAt: payload.project.createdAt,
        budget: {
          limit: payload.project.budgetAllocated || 0,
          spent: payload.project.budgetSpent || 0,
        },
        sprints: (payload.project.sprints || []).map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          goal: Array.isArray(sprint.goals) ? sprint.goals.join(', ') : sprint.goal || 'No goal specified',
        })),
      };

      printHeader(`Project Details: ${project.name}`);
      console.log(chalk.bold('ID:'.padEnd(15)) + project.id);
      console.log(chalk.bold('Created At:'.padEnd(15)) + new Date(project.createdAt).toLocaleString());
      console.log('');

      console.log(chalk.bold('--- Budget ---'));
      const budgetPercentage = (project.budget.spent / project.budget.limit) * 100;
      console.log(chalk.bold('Limit:'.padEnd(15)) + `$${project.budget.limit.toFixed(2)}`);
      console.log(chalk.bold('Spent:'.padEnd(15)) + `$${project.budget.spent.toFixed(2)} (${budgetPercentage.toFixed(1)}%)`);
      console.log('');

      console.log(chalk.bold('--- Sprints ---'));
      if (project.sprints.length > 0) {
        printTable(project.sprints, [
          { header: 'Sprint ID', width: 25, getter: (s) => s.id },
          { header: 'Name', width: 30, getter: (s) => s.name },
          { header: 'Goal', width: 50, getter: (s) => s.goal },
        ]);
      } else {
        printInfo('No sprints found for this project.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch project details: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('delete <id>')
  .description('Permanently delete a project by its ID')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (id: string, options: { force: boolean }) => {
    let confirmed = options.force;

    if (!confirmed) {
      printWarning(`You are about to permanently delete project with ID: ${chalk.bold(id)}`);
      printWarning('This action cannot be undone.');

      const confirmationText = 'DELETE';
      confirmed = await askForConfirmation(
        `To confirm, please type "${confirmationText}": `,
        confirmationText
      );

      if (!confirmed) {
        printInfo('Deletion cancelled. Confirmation text did not match.');
        return;
      }
    }

    printStep(`Deleting project: ${id}...`);
    try {
      const result = runProjectCliCommand<{ success: boolean; deletedId: string }>('delete', { id });
      if (result.success) {
        printSuccess(`Project with ID "${result.deletedId}" has been permanently deleted.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Deletion failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to delete project: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('archive <id>')
  .description('Archive a project by its ID')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (id: string, options: { force: boolean }) => {
    let confirmed = options.force;

    if (!confirmed) {
      printWarning(`You are about to archive project with ID: ${chalk.bold(id)}`);
      printInfo('Archived projects will no longer appear in active lists but can be restored.');

      const confirmationText = 'ARCHIVE';
      confirmed = await askForConfirmation(
        `To confirm, please type "${confirmationText}": `,
        confirmationText
      );

      if (!confirmed) {
        printInfo('Archiving cancelled. Confirmation text did not match.');
        return;
      }
    }

    printStep(`Archiving project: ${id}...`);
    try {
      const result = runProjectCliCommand<{ project: { id: string } }>('update', {
        id,
        payload: { status: 'archived' },
      });
      if (result.project?.id) {
        printSuccess(`Project with ID "${result.project.id}" has been archived.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Archival failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to archive project: ${message}`);
      process.exit(1);
    }
  });

projectCommand
  .command('restore <id>')
  .description('Restore an archived project by its ID')
  .action(async (id: string) => {
    printStep(`Restoring project: ${id}...`);
    try {
      const result = runProjectCliCommand<{ project: { id: string } }>('update', {
        id,
        payload: { status: 'active' },
      });
      if (result.project?.id) {
        printSuccess(`Project with ID "${result.project.id}" has been restored.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Restoration failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to restore project: ${message}`);
      process.exit(1);
    }
  });

const teamCommand = program.command('team')
  .description('Manage crew teams and members');

teamCommand
  .command('list')
  .description('List all available agents and their status')
  .action(async () => {
    printStep('Fetching crew roster...');
    try {
      const members = await apiClient.listTeamMembers();
      printHeader('Crew Roster Status');

      printTable(members, [
        { header: 'Member', width: 22, getter: (m) => m.name },
        { header: 'Role', width: 25, getter: (m) => m.role },
        {
          header: 'Status',
          width: 15,
          getter: (m) => m.status,
          color: (m) => (m.status === 'Available' ? chalk.green : chalk.yellow),
        },
        { header: 'Workload', width: 10, getter: (m) => `${m.workload}%` },
        { header: 'Model', width: 20, getter: (m) => m.model },
      ]);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch team list: ${message}`);
      process.exit(1);
    }
  });

teamCommand
  .command('assign <member> <task>')
  .description('Assign a task to a specific crew member')
  .action(async (member: string, task: string) => {
    printStep(`Assigning task to ${member}...`);
    try {
      const result = await apiClient.assignTask({ member, task });
      printSuccess(`Task assigned successfully to ${member}.`);
      printInfo(`Task ID: ${result.taskId}`);
      printInfo(`Task: "${task}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to assign task: ${message}`);
      process.exit(1);
    }
  });

const costCommand = program.command('cost')
  .description('Manage and forecast project costs');

costCommand
  .command('status')
  .description('Show current daily and monthly spending status')
  .action(async () => {
    printStep('Fetching current cost status...');
    try {
      const status = await apiClient.getCostStatus();
      printHeader('Cost Status');
      const dailyPercentage = (status.dailySpent / status.dailyBudget) * 100;
      const monthlyPercentage = (status.monthlySpent / status.monthlyBudget) * 100;

      console.log(`  Today's Spending:      ${chalk.bold(`$${status.dailySpent.toFixed(2)}`)} / $${status.dailyBudget.toFixed(2)} (${dailyPercentage.toFixed(1)}%)`);
      console.log('');
      console.log(`  This Month's Spending:  ${chalk.bold(`$${status.monthlySpent.toFixed(2)}`)} / $${status.monthlyBudget.toFixed(2)} (${monthlyPercentage.toFixed(1)}%)`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch cost status: ${message}`);
      process.exit(1);
    }
  });

costCommand
  .command('forecast')
  .description('Forecast future spending based on current trends')
  .option('--days <number>', 'Number of days to forecast', '30')
  .action(async (options: { days: string }) => {
    const days = parseInt(options.days, 10);
    if (isNaN(days) || days <= 0) {
      printError('Invalid number of days. Must be a positive integer.');
      process.exit(1);
    }
    printStep(`Forecasting costs for the next ${days} days...`);
    try {
      const forecast = await apiClient.getCostForecast({ days });
      printHeader(`Cost Forecast (${days} Days)`);
      console.log(`  Projected Spending: ${chalk.bold(`$${forecast.projectedCost.toFixed(2)}`)}`);
      console.log(`  Based on an average of $${(forecast.projectedCost / forecast.periodDays).toFixed(2)}/day.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to generate cost forecast: ${message}`);
      process.exit(1);
    }
  });

const memoryCommand = program.command('memory')
  .description('Interact with the Universal Memory system');

memoryCommand
  .command('list')
  .description('List recent memories from the Universal Memory')
  .action(async () => {
    printStep('Fetching recent memories...');
    try {
      const memories = await apiClient.listMemories();
      printHeader('Universal Memory - Recent Entries');
      printTable(memories, [
        { header: 'ID', width: 12, getter: (m) => m.id },
        { header: 'Type', width: 15, getter: (m) => m.type },
        { header: 'Content Snippet', width: 65, getter: (m) => (m.content.length > 62 ? m.content.substring(0, 62) + '...' : m.content) },
        { header: 'Author', width: 20, getter: (m) => m.crewMember },
        { header: 'Confidence', width: 12, getter: (m) => `${(m.confidence * 100).toFixed(0)}%` },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch memories: ${message}`);
      process.exit(1);
    }
  });

memoryCommand
  .command('search <query>')
  .description('Search memories for a specific keyword or phrase')
  .action(async (query: string) => {
    printStep(`Searching memories for: "${query}"...`);
    try {
      const memories = await apiClient.searchMemories(query);
      printHeader(`Memory Search Results for "${query}"`);

      if (memories.length === 0) {
        printInfo('No memories found matching your query.');
        return;
      }

      printTable(memories, [
        { header: 'ID', width: 12, getter: (m) => m.id },
        { header: 'Type', width: 15, getter: (m) => m.type },
        { header: 'Content Snippet', width: 65, getter: (m) => (m.content.length > 62 ? m.content.substring(0, 62) + '...' : m.content) },
        { header: 'Author', width: 20, getter: (m) => m.crewMember },
        { header: 'Confidence', width: 12, getter: (m) => `${(m.confidence * 100).toFixed(0)}%` },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to search memories: ${message}`);
      process.exit(1);
    }
  });

memoryCommand
  .command('show <id>')
  .description('Show the full content and metadata of a single memory')
  .action(async (id: string) => {
    printStep(`Fetching details for memory: ${id}...`);
    try {
      const memory = await apiClient.getMemoryById(id);

      if (!memory) {
        printError(`Memory with ID "${id}" not found.`);
        process.exit(1);
      }

      printHeader(`Memory Details: ${memory.id}`);
      console.log(chalk.bold('ID:'.padEnd(15)) + memory.id);
      console.log(chalk.bold('Type:'.padEnd(15)) + memory.type);
      console.log(chalk.bold('Author:'.padEnd(15)) + memory.crewMember);
      console.log(chalk.bold('Timestamp:'.padEnd(15)) + memory.timestamp);
      console.log(chalk.bold('Confidence:'.padEnd(15)) + `${(memory.confidence * 100).toFixed(0)}%`);
      console.log(chalk.bold('--- Content ---'));
      console.log(memory.content);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch memory details: ${message}`);
      process.exit(1);
    }
  });

memoryCommand
  .command('delete <id>')
  .description('Permanently delete a memory by its ID')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (id: string, options: { force: boolean }) => {
    let confirmed = options.force;

    if (!confirmed) {
      printWarning(`You are about to permanently delete memory with ID: ${chalk.bold(id)}`);
      printWarning('This action cannot be undone.');

      const confirmationText = 'DELETE';
      confirmed = await askForConfirmation(
        `To confirm, please type "${confirmationText}": `,
        confirmationText
      );

      if (!confirmed) {
        printInfo('Deletion cancelled. Confirmation text did not match.');
        return;
      }
    }

    printStep(`Deleting memory: ${id}...`);
    try {
      const result = await apiClient.deleteMemory(id);
      if (result.success) {
        printSuccess(`Memory with ID "${result.deletedId}" has been permanently deleted.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Deletion failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to delete memory: ${message}`);
      process.exit(1);
    }
  });

const budgetCommand = program.command('budget')
  .description('Manage global budget settings');

budgetCommand
  .command('get')
  .description('Get the current budget limits')
  .action(async () => {
    printStep('Fetching budget limits...');
    try {
      const budget = await apiClient.getBudget();
      printHeader('Current Budget Limits');
      console.log(`  Daily Limit:      ${chalk.bold(`$${budget.dailyLimit.toFixed(2)}`)}`);
      console.log(`  Monthly Limit:    ${chalk.bold(`$${budget.monthlyLimit.toFixed(2)}`)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch budget: ${message}`);
      process.exit(1);
    }
  });

budgetCommand
  .command('set')
  .description('Set the daily budget limit')
  .option('--limit <amount>', 'The new daily budget limit in USD')
  .action(async (options: { limit?: string }) => {
    if (!options.limit) {
      printError('The --limit option is required.');
      process.exit(1);
    }
    const limit = parseFloat(options.limit);
    if (isNaN(limit) || limit < 0) {
      printError('Invalid limit amount. Must be a non-negative number.');
      process.exit(1);
    }
    printStep(`Setting daily budget limit to $${limit.toFixed(2)}...`);
    try {
      const result = await apiClient.setBudget({ limit });
      if (result.success) {
        printSuccess(`Daily budget limit successfully set to $${result.newDailyLimit.toFixed(2)}.`);
      } else {
        printError('Failed to set budget limit.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to set budget: ${message}`);
      process.exit(1);
    }
  });

const analyticsCommand = program.command('analytics')
  .description('View platform analytics');

analyticsCommand
  .command('summary')
  .description('Show high-level platform metrics')
  .action(async () => {
    printStep('Fetching analytics summary...');
    try {
      const metrics = await apiClient.getAnalyticsSummary();
      printHeader('Platform Analytics Summary');

      console.log(chalk.bold('Projects'));
      console.log(`  Total:          ${metrics.totalProjects}`);
      console.log(`  Active:         ${metrics.activeProjects}`);
      console.log('');

      console.log(chalk.bold('Memory System'));
      console.log(`  Total Memories: ${metrics.totalMemories}`);
      console.log('');

      console.log(chalk.bold('Financials'));
      console.log(`  Total Spend:    $${metrics.totalSpend.toFixed(2)}`);
      console.log(`  Budget Usage:   ${metrics.budgetUtilization.toFixed(1)}%`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch analytics: ${message}`);
      process.exit(1);
    }
  });

analyticsCommand
  .command('insights')
  .description('View AI-driven optimization suggestions')
  .action(async () => {
    printStep('Fetching analytics insights...');
    try {
      const { insights } = await apiClient.getAnalyticsInsights();
      printHeader('AI Optimization Insights');

      if (insights.length === 0) {
        printInfo('No insights available at this time.');
        return;
      }

      printTable(insights, [
        { 
          header: 'Type', 
          width: 15, 
          getter: (i) => i.type.toUpperCase(),
          color: (i) => i.type === 'warning' ? chalk.red : i.type === 'opportunity' ? chalk.green : chalk.blue
        },
        { header: 'Insight', width: 50, getter: (i) => i.message },
        { header: 'Impact', width: 30, getter: (i) => i.impact },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch insights: ${message}`);
      process.exit(1);
    }
  });

analyticsCommand
  .command('export')
  .description('Export analytics data to a file')
  .option('--format <format>', 'Export format (csv or json)', 'csv')
  .option('--output <file>', 'Output file path')
  .action(async (options: { format: string; output?: string }) => {
    printStep(`Exporting analytics as ${options.format.toUpperCase()}...`);
    try {
      const data = await apiClient.exportAnalytics(options.format as 'csv' | 'json');
      
      if (options.output) {
        fs.writeFileSync(options.output, data);
        printSuccess(`Analytics exported to ${options.output}`);
      } else {
        console.log(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to export analytics: ${message}`);
      process.exit(1);
    }
  });

const historyCommand = program.command('history')
  .description('View audit log and operation history');

historyCommand
  .command('list')
  .description('Show recent operations from the audit log')
  .option('--limit <number>', 'Number of entries to show', '20')
  .action(async (options: { limit: string }) => {
    const limit = parseInt(options.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      printError('Invalid limit. Must be a positive integer.');
      process.exit(1);
    }
    printStep(`Fetching last ${limit} history entries...`);
    try {
      const history = await apiClient.getAuditLog(limit);
      printHeader('Operation History');

      if (history.length === 0) {
        printInfo('No history found.');
        return;
      }

      printTable(history, [
        { header: 'ID', width: 10, getter: (h) => h.id },
        { header: 'Timestamp', width: 25, getter: (h) => new Date(h.timestamp).toLocaleString() },
        { header: 'Actor', width: 20, getter: (h) => h.actor },
        { header: 'Action', width: 20, getter: (h) => h.action },
        {
          header: 'Status',
          width: 12,
          getter: (h) => h.status,
          color: (h) => h.status === 'success' ? chalk.green : chalk.red
        },
        { header: 'Details', width: 40, getter: (h) => h.details },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch history: ${message}`);
      process.exit(1);
    }
  });

historyCommand
  .command('show <operation-id>')
  .description('View details of a specific audit log entry')
  .action(async (id: string) => {
    printStep(`Fetching details for operation: ${id}...`);
    try {
      const entry = await apiClient.getAuditLogEntry(id);

      if (!entry) {
        printError(`Operation with ID "${id}" not found.`);
        process.exit(1);
      }

      printHeader(`Operation Details: ${entry.id}`);
      console.log(chalk.bold('Timestamp:'.padEnd(15)) + new Date(entry.timestamp).toLocaleString());
      console.log(chalk.bold('Actor:'.padEnd(15)) + entry.actor);
      console.log(chalk.bold('Action:'.padEnd(15)) + entry.action);
      
      const statusColor = entry.status === 'success' ? chalk.green : chalk.red;
      console.log(chalk.bold('Status:'.padEnd(15)) + statusColor(entry.status.toUpperCase()));
      
      console.log(chalk.bold('Details:'.padEnd(15)) + entry.details);
      console.log(chalk.bold('Metadata:'.padEnd(15)) + JSON.stringify(entry.metadata));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch operation details: ${message}`);
      process.exit(1);
    }
  });

historyCommand
  .command('export')
  .description('Export audit log to a file')
  .option('--format <format>', 'Export format (csv or json)', 'csv')
  .option('--output <file>', 'Output file path')
  .option('--limit <number>', 'Number of entries to export', '100')
  .action(async (options: { format: string; output?: string; limit: string }) => {
    const limit = parseInt(options.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      printError('Invalid limit. Must be a positive integer.');
      process.exit(1);
    }
    printStep(`Exporting last ${limit} history entries as ${options.format.toUpperCase()}...`);
    try {
      const data = await apiClient.exportHistory(options.format as 'csv' | 'json', limit);

      if (options.output) {
        fs.writeFileSync(options.output, data);
        printSuccess(`History exported to ${options.output}`);
      } else {
        console.log(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to export history: ${message}`);
      process.exit(1);
    }
  });

const configCommand = program.command('config')
  .description('Manage local CLI configuration');

configCommand
  .command('view')
  .description('View current configuration')
  .action(() => {
    printHeader('CLI Configuration');
    const config = readConfig();
    if (Object.keys(config).length === 0) {
      printInfo('No configuration set. Use `crew config set <key> <value>`.');
    } else {
      console.log(JSON.stringify(config, null, 2));
    }
  });

configCommand
  .command('get <key>')
  .description('Get a single configuration value')
  .action((key: string) => {
    try {
      const config = readConfig();
      if (key in config) {
        const value = config[key];
        if (typeof value === 'object' && value !== null) {
          console.log(JSON.stringify(value, null, 2));
        } else {
          console.log(value);
        }
      } else {
        printWarning(`Key '${key}' not found in configuration.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to get config: ${message}`);
      process.exit(1);
    }
  });

configCommand
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action((key: string, value: string) => {
    try {
      const config = readConfig();
      config[key] = value;
      writeConfig(config);
      printSuccess(`Set '${key}' to '${value}'`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to set config: ${message}`);
      process.exit(1);
    }
  });

configCommand
  .command('unset <key>')
  .description('Remove a configuration value')
  .action((key: string) => {
    try {
      const config = readConfig();
      if (key in config) {
        delete config[key];
        writeConfig(config);
        printSuccess(`Unset '${key}'`);
      } else {
        printWarning(`Key '${key}' not found in configuration.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to unset config: ${message}`);
      process.exit(1);
    }
  });

configCommand
  .command('reset')
  .description('Reset all configuration to defaults')
  .action(async () => {
    printWarning('This will delete all your local CLI configuration.');
    const confirmed = await askForConfirmation('To confirm, please type "RESET": ', 'RESET');
    if (confirmed) {
      try {
        writeConfig({});
        printSuccess('Configuration has been reset.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        printError(`Failed to reset config: ${message}`);
        process.exit(1);
      }
    } else {
      printInfo('Reset cancelled.');
    }
  });

const sprintCommand = program.command('sprint')
  .description('Manage project sprints');

sprintCommand
  .command('list <project-id>')
  .description('List all sprints for a given project')
  .option('--json', 'Output raw sprint JSON')
  .action(async (projectId: string, options: { json?: boolean }) => {
    if (!options.json) {
      printStep(`Fetching sprints for project: ${projectId}...`);
    }
    try {
      const payload = runProjectCliCommand<{ data: {
        id: string;
        name: string;
        status?: string;
        goals?: string[];
        goal?: string;
      }[] }>('list-sprints', { id: projectId });
      const sprints = payload.data || [];

      if (options.json) {
        console.log(JSON.stringify(sprints, null, 2));
        return;
      }

      printHeader(`Sprints for Project: ${projectId}`);

      if (sprints.length === 0) {
        printInfo('No sprints found for this project.');
        return;
      }

      printTable(sprints, [
        { header: 'ID', width: 20, getter: (s) => s.id },
        { header: 'Name', width: 30, getter: (s) => s.name },
        {
          header: 'Status',
          width: 15,
          getter: (s) => s.status,
          color: (s) => {
            if (s.status === 'active') return chalk.green;
            if (s.status === 'completed') return chalk.gray;
            return chalk.blue;
          }
        },
        { header: 'Goal', width: 60, getter: (s) => s.goal },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to list sprints: ${message}`);
      process.exit(1);
    }
  });

sprintCommand
  .command('create <project-id> <name>')
  .description('Create a new sprint for a project')
  .option('--goal <goal>', 'The primary goal for the sprint', 'No goal specified')
  .option('--duration <days>', 'The duration of the sprint in days', '14')
  .option('--json', 'Output raw sprint JSON')
  .action(async (projectId: string, name: string, options: { goal: string; duration: string; json?: boolean }) => {
    if (!options.json) {
      printStep(`Creating sprint "${name}" for project ${projectId}...`);
    }
    try {
      const durationDays = parseInt(options.duration, 10);
      if (isNaN(durationDays)) {
        throw new Error(`Invalid duration: "${options.duration}". Must be an integer.`);
      }
      const payload = runProjectCliCommand<{ sprint: { id: string; name: string } }>('create-sprint', {
        payload: { projectId, name, goal: options.goal, durationDays },
      });
      const newSprint = payload.sprint;

      if (options.json) {
        console.log(JSON.stringify(newSprint, null, 2));
        return;
      }

      printSuccess(`Sprint '${newSprint.name}' created with ID: ${newSprint.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to create sprint: ${message}`);
      process.exit(1);
    }
  });

sprintCommand
  .command('show <sprint-id>')
  .description('View details of a specific sprint')
  .action(async (sprintId: string) => {
    printStep(`Fetching details for sprint: ${sprintId}...`);
    try {
      const sprint = await apiClient.getSprintById(sprintId);

      if (!sprint) {
        printError(`Sprint with ID "${sprintId}" not found.`);
        process.exit(1);
      }

      printHeader(`Sprint Details: ${sprint.name}`);
      console.log(chalk.bold('ID:'.padEnd(15)) + sprint.id);
      console.log(chalk.bold('Project ID:'.padEnd(15)) + sprint.projectId);

      const statusColor = sprint.status === 'active' ? chalk.green : sprint.status === 'completed' ? chalk.gray : chalk.blue;
      console.log(chalk.bold('Status:'.padEnd(15)) + statusColor(sprint.status));

      console.log(chalk.bold('Goal:'.padEnd(15)) + sprint.goal);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch sprint details: ${message}`);
      process.exit(1);
    }
  });

sprintCommand
  .command('update <sprint-id>')
  .description("Update a sprint's status or goal")
  .option('--status <status>', 'New sprint status (planned, active, completed)')
  .option('--goal <goal>', 'New sprint goal')
  .action(async (sprintId: string, options: { status?: 'planned' | 'active' | 'completed'; goal?: string }) => {
    const updates: { status?: 'planned' | 'active' | 'completed'; goal?: string } = {};
    if (options.status) {
      if (!['planned', 'active', 'completed'].includes(options.status)) {
        printError('Invalid status. Must be one of: planned, active, completed.');
        process.exit(1);
      }
      updates.status = options.status;
    }
    if (options.goal) {
      updates.goal = options.goal;
    }

    if (Object.keys(updates).length === 0) {
      printError('At least one option (--status or --goal) must be provided.');
      process.exit(1);
    }

    printStep(`Updating sprint ${sprintId}...`);
    try {
      const result = await apiClient.updateSprint(sprintId, updates);
      if (result.success) {
        printSuccess(`Sprint with ID "${result.updatedId}" has been updated.`);
      } else {
        printError('Update failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to update sprint: ${message}`);
      process.exit(1);
    }
  });

sprintCommand
  .command('start <sprint-id>')
  .description("Start a sprint by setting its status to 'active'")
  .action(async (sprintId: string) => {
    printStep(`Starting sprint ${sprintId}...`);
    try {
      const result = await apiClient.updateSprint(sprintId, { status: 'active' });
      if (result.success) {
        printSuccess(`Sprint with ID "${result.updatedId}" is now active.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Failed to start sprint for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to start sprint: ${message}`);
      process.exit(1);
    }
  });

sprintCommand
  .command('complete <sprint-id>')
  .description("Complete a sprint by setting its status to 'completed'")
  .action(async (sprintId: string) => {
    printStep(`Completing sprint ${sprintId}...`);
    try {
      const result = await apiClient.updateSprint(sprintId, { status: 'completed' });
      if (result.success) {
        printSuccess(`Sprint with ID "${result.updatedId}" has been marked as completed.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Failed to complete sprint for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to complete sprint: ${message}`);
      process.exit(1);
    }
  });

const storyCommand = program.command('story')
  .description('Manage sprint stories');

storyCommand
  .command('list <sprint-id>')
  .description('List all stories for a given sprint')
  .option('--json', 'Output raw story JSON')
  .action(async (sprintId: string, options: { json?: boolean }) => {
    if (!options.json) {
      printStep(`Fetching stories for sprint: ${sprintId}...`);
    }
    try {
      const payload = runProjectCliCommand<{ stories: {
        id: string;
        title: string;
        status: string;
        storyPoints?: number;
        assignee?: string;
      }[] }>('list-stories', { id: sprintId });
      const stories = payload.stories || [];

      if (options.json) {
        console.log(JSON.stringify(stories, null, 2));
        return;
      }

      printHeader(`Stories for Sprint: ${sprintId}`);

      if (stories.length === 0) {
        printInfo('No stories found for this sprint.');
        return;
      }

      printTable(stories, [
        { header: 'ID', width: 15, getter: (s) => s.id },
        { header: 'Title', width: 40, getter: (s) => s.title },
        {
          header: 'Status',
          width: 15,
          getter: (s) => s.status,
          color: (s) => {
            if (s.status === 'done') return chalk.gray;
            if (s.status === 'in-progress') return chalk.yellow;
            return chalk.white;
          }
        },
        { header: 'Points', width: 10, getter: (s) => String(s.storyPoints || 0) },
        { header: 'Assignee', width: 25, getter: (s) => s.assignee || '' },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to list stories: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('create <sprint-id> <title>')
  .description('Create a new story in a sprint')
  .requiredOption('--project <id>', 'Project id')
  .option('--description <text>', 'Story description')
  .option('--type <type>', 'Work type', 'feature')
  .option('--priority <level>', 'Priority level (1-4)', '2')
  .option('--points <number>', 'The story points for this story', '0')
  .option('--json', 'Output raw story JSON')
  .action(async (
    sprintId: string,
    title: string,
    options: {
      project: string;
      description?: string;
      type: string;
      priority: string;
      points: string;
      json?: boolean;
    },
  ) => {
    if (!options.json) {
      printStep(`Creating story "${title}" in sprint ${sprintId}...`);
    }
    try {
      const points = parseInt(options.points, 10);
      const priority = parseInt(options.priority, 10);
      if (isNaN(points) || isNaN(priority)) {
        throw new Error(`Invalid points value: "${options.points}". Must be an integer.`);
      }
      const payload = runProjectCliCommand<{ story: { id: string; title: string } }>('create-story', {
        payload: {
          projectId: options.project,
          sprintId,
          title,
          description: options.description,
          workType: options.type,
          priority,
          storyPoints: points,
        },
      });
      const newStory = payload.story;

      if (options.json) {
        console.log(JSON.stringify(newStory, null, 2));
        return;
      }

      printSuccess(`Story '${newStory.title}' created with ID: ${newStory.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to create story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('show <story-id>')
  .description('View details of a specific story')
  .action(async (storyId: string) => {
    printStep(`Fetching details for story: ${storyId}...`);
    try {
      const story = await apiClient.getStoryById(storyId);

      if (!story) {
        printError(`Story with ID "${storyId}" not found.`);
        process.exit(1);
      }

      printHeader(`Story Details: ${story.title}`);
      console.log(chalk.bold('ID:'.padEnd(15)) + story.id);
      console.log(chalk.bold('Sprint ID:'.padEnd(15)) + story.sprintId);

      const statusColor = story.status === 'done' ? chalk.gray : story.status === 'in-progress' ? chalk.yellow : chalk.white;
      console.log(chalk.bold('Status:'.padEnd(15)) + statusColor(story.status));

      console.log(chalk.bold('Points:'.padEnd(15)) + story.points);
      console.log(chalk.bold('Assignee:'.padEnd(15)) + story.assignee);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to fetch story details: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('update <story-id>')
  .description("Update a story's status or assignee")
  .option('--status <status>', 'New story status (todo, in-progress, done, blocked)')
  .option('--assignee <name>', 'New assignee for the story')
  .action(async (storyId: string, options: { status?: 'todo' | 'in-progress' | 'done' | 'blocked'; assignee?: string }) => {
    const updates: { status?: 'todo' | 'in-progress' | 'done' | 'blocked'; assignee?: string } = {};
    if (options.status) {
      if (!['todo', 'in-progress', 'done', 'blocked'].includes(options.status)) {
        printError('Invalid status. Must be one of: todo, in-progress, done, blocked.');
        process.exit(1);
      }
      updates.status = options.status;
    }
    if (options.assignee) {
      updates.assignee = options.assignee;
    }

    if (Object.keys(updates).length === 0) {
      printError('At least one option (--status or --assignee) must be provided.');
      process.exit(1);
    }

    printStep(`Updating story ${storyId}...`);
    try {
      const result = await apiClient.updateStory(storyId, updates);
      if (result.success) {
        printSuccess(`Story with ID "${result.updatedId}" has been updated.`);
      } else {
        printError('Update failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to update story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('delete <story-id>')
  .description('Permanently delete a story by its ID')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (storyId: string, options: { force: boolean }) => {
    let confirmed = options.force;

    if (!confirmed) {
      printWarning(`You are about to permanently delete story with ID: ${chalk.bold(storyId)}`);
      printWarning('This action cannot be undone.');

      const confirmationText = 'DELETE';
      confirmed = await askForConfirmation(
        `To confirm, please type "${confirmationText}": `,
        confirmationText
      );

      if (!confirmed) {
        printInfo('Deletion cancelled. Confirmation text did not match.');
        return;
      }
    }

    printStep(`Deleting story: ${storyId}...`);
    try {
      const result = await apiClient.deleteStory(storyId);
      if (result.success) {
        printSuccess(`Story with ID "${result.deletedId}" has been permanently deleted.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Deletion failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to delete story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('assign <story-id> <member-name>')
  .description("Assign a story to a crew member (shortcut for 'update --assignee')")
  .action(async (storyId: string, memberName: string) => {
    printStep(`Assigning story ${storyId} to ${memberName}...`);
    try {
      const result = await apiClient.updateStory(storyId, { assignee: memberName });
      if (result.success) {
        printSuccess(`Story with ID "${result.updatedId}" has been assigned to ${memberName}.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Assignment failed for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to assign story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('start <story-id>')
  .description("Start a story by setting its status to 'in-progress'")
  .action(async (storyId: string) => {
    printStep(`Starting story ${storyId}...`);
    try {
      const result = await apiClient.updateStory(storyId, { status: 'in-progress' });
      if (result.success) {
        printSuccess(`Story with ID "${result.updatedId}" is now in progress.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Failed to start story for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to start story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('done <story-id>')
  .description("Complete a story by setting its status to 'done'")
  .action(async (storyId: string) => {
    printStep(`Completing story ${storyId}...`);
    try {
      const result = await apiClient.updateStory(storyId, { status: 'done' });
      if (result.success) {
        printSuccess(`Story with ID "${result.updatedId}" has been marked as done.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Failed to complete story for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to complete story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('estimate <story-id>')
  .description('Use AI to estimate story points for a story')
  .action(async (storyId: string) => {
    printStep(`Estimating story points for ${storyId}...`);
    try {
      const estimation = await apiClient.estimateStory(storyId);
      printHeader(`AI Estimation for Story: ${storyId}`);
      console.log(chalk.bold('Suggested Points:'.padEnd(20)) + estimation.suggestedPoints);
      console.log(chalk.bold('Reasoning:'));
      console.log(estimation.reasoning);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to estimate story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('block <story-id>')
  .description("Block a story by setting its status to 'blocked'")
  .action(async (storyId: string) => {
    printStep(`Blocking story ${storyId}...`);
    try {
      const result = await apiClient.updateStory(storyId, { status: 'blocked' });
      if (result.success) {
        printSuccess(`Story with ID "${result.updatedId}" has been marked as blocked.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Failed to block story for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to block story: ${message}`);
      process.exit(1);
    }
  });

storyCommand
  .command('unblock <story-id>')
  .description("Unblock a story by setting its status to 'todo'")
  .action(async (storyId: string) => {
    printStep(`Unblocking story ${storyId}...`);
    try {
      const result = await apiClient.updateStory(storyId, { status: 'todo' });
      if (result.success) {
        printSuccess(`Story with ID "${result.updatedId}" has been unblocked and moved to To Do.`);
      } else {
        // This branch is unlikely to be hit with the current API client mock
        printError('Failed to unblock story for an unknown reason.');
        process.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      printError(`Failed to unblock story: ${message}`);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse(process.argv);
}

// Export for testing purposes
export { program, steps };
