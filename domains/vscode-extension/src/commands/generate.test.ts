import * as assert from 'assert';
import { generateCommand } from './generate.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Generate Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should construct prompt correctly for Generic Code', async () => {
        testContext.mockQuickPick({ label: 'Generic Code' });
        testContext.mockInputBox('Create a function');

        let capturedPrompt = '';
        testContext.commandExecutor.generate = async (prompt: string) => {
            capturedPrompt = prompt;
            return { success: true, output: 'done', model: 'test', costUSD: 0 };
        };

        await generateCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        // For Generic Code, promptPrefix is empty
        assert.strictEqual(capturedPrompt, 'Create a function');
    });

    test('should construct prompt correctly for React Component', async () => {
        testContext.mockQuickPick({ label: 'React Component' });
        testContext.mockInputBox('UserProfile');

        let capturedPrompt = '';
        testContext.commandExecutor.generate = async (prompt: string) => {
            capturedPrompt = prompt;
            return { success: true, output: 'done', model: 'test', costUSD: 0 };
        };

        await generateCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger
        );

        // For React Component, promptPrefix is "Create a React Component: "
        assert.strictEqual(capturedPrompt, 'Create a React Component: UserProfile');
    });
});