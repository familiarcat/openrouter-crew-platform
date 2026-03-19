import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { program, steps } from '../index';

describe('crew unify', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  // Spies for each step function
  let checkPrerequisitesSpy: jest.SpyInstance;
  let setupDatabaseSpy: jest.SpyInstance;
  let installDependenciesSpy: jest.SpyInstance;
  let buildMemorySystemSpy: jest.SpyInstance;
  let runTestsSpy: jest.SpyInstance;
  let publishToNpmSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console and process.exit
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);

    // Spy on and mock step implementations
    checkPrerequisitesSpy = jest.spyOn(steps, 'checkPrerequisites').mockResolvedValue(true);
    setupDatabaseSpy = jest.spyOn(steps, 'setupDatabase').mockResolvedValue(true);
    installDependenciesSpy = jest.spyOn(steps, 'installDependencies').mockResolvedValue(true);
    buildMemorySystemSpy = jest.spyOn(steps, 'buildMemorySystem').mockResolvedValue(true);
    runTestsSpy = jest.spyOn(steps, 'runTests').mockResolvedValue(true);
    publishToNpmSpy = jest.spyOn(steps, 'publishToNpm').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should run all steps in order by default', async () => {
    const args = ['node', 'crew', 'unify'];
    await program.parseAsync(args);

    const calls = [
        checkPrerequisitesSpy,
        setupDatabaseSpy,
        installDependenciesSpy,
        buildMemorySystemSpy,
        runTestsSpy,
        publishToNpmSpy
    ];

    for(const call of calls) {
        expect(call).toHaveBeenCalledTimes(1);
    }
  });

  test('should only run a specific step with --step flag', async () => {
    const args = ['node', 'crew', 'unify', '--step=dependencies'];
    await program.parseAsync(args);

    expect(checkPrerequisitesSpy).not.toHaveBeenCalled();
    expect(setupDatabaseSpy).not.toHaveBeenCalled();
    expect(installDependenciesSpy).toHaveBeenCalledTimes(1);
    expect(buildMemorySystemSpy).not.toHaveBeenCalled();
    expect(runTestsSpy).not.toHaveBeenCalled();
    expect(publishToNpmSpy).not.toHaveBeenCalled();
  });

  test('should skip database step with --skip-db flag', async () => {
    const args = ['node', 'crew', 'unify', '--skip-db'];
    await program.parseAsync(args);

    expect(setupDatabaseSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Database Setup (SKIPPED)'));
  });

  test('should skip tests step with --skip-tests flag', async () => {
    const args = ['node', 'crew', 'unify', '--skip-tests'];
    await program.parseAsync(args);

    expect(runTestsSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Running Monorepo Tests (SKIPPED)'));
  });

  test('should skip publish step with --skip-publish flag', async () => {
    const args = ['node', 'crew', 'unify', '--skip-publish'];
    await program.parseAsync(args);

    expect(publishToNpmSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Publishing to npm (SKIPPED)'));
  });

  test('--quick flag should skip publishing', async () => {
    const args = ['node', 'crew', 'unify', '--quick'];
    await program.parseAsync(args);

    expect(publishToNpmSpy).not.toHaveBeenCalled();
    expect(runTestsSpy).toHaveBeenCalled(); // but not other steps
  });

  test('--full flag should not skip any steps', async () => {
    const args = ['node', 'crew', 'unify', '--full'];
    await program.parseAsync(args);

    expect(setupDatabaseSpy).toHaveBeenCalled();
    expect(runTestsSpy).toHaveBeenCalled();
    expect(publishToNpmSpy).toHaveBeenCalled();
  });

  test('should halt execution if a fatal step fails', async () => {
    // prerequisites is a fatal step
    checkPrerequisitesSpy.mockResolvedValue(false);
    const args = ['node', 'crew', 'unify'];

    await program.parseAsync(args);

    expect(checkPrerequisitesSpy).toHaveBeenCalledTimes(1);
    // Subsequent steps should not be called
    expect(setupDatabaseSpy).not.toHaveBeenCalled();
    expect(installDependenciesSpy).not.toHaveBeenCalled();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Fatal error during 'prerequisites' step. Halting process."));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('should continue execution if a non-fatal step fails', async () => {
    // database is a non-fatal step
    setupDatabaseSpy.mockResolvedValue(false);
    const args = ['node', 'crew', 'unify'];

    await program.parseAsync(args);

    expect(checkPrerequisitesSpy).toHaveBeenCalledTimes(1);
    expect(setupDatabaseSpy).toHaveBeenCalledTimes(1);
    // Subsequent steps should still be called
    expect(installDependenciesSpy).toHaveBeenCalledTimes(1);

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🎉 Unification Process Finished'));
  });

  test('should exit if an invalid step name is provided', async () => {
    const args = ['node', 'crew', 'unify', '--step=nonexistent'];
    await program.parseAsync(args);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Step 'nonexistent' is not implemented or invalid."));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});