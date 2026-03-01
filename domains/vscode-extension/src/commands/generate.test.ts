import * as assert from 'assert';
import { generateCommand } from './generate.js';
import { CommandTestContext } from './command-test-utils.js';

suite('Generate Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should call executeTask with user input', async () => {
        testContext.mockInputBox('Create a function to sum numbers');

        let capturedTask = '';
        testContext.commandExecutor.executeTask = async (task: string) => {
            capturedTask = task;
            return { output: 'done', model: 'test', cost: 0, executionTimeMs: 100 };
        };

        await generateCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        assert.strictEqual(capturedTask, 'Create a function to sum numbers');
    });
});