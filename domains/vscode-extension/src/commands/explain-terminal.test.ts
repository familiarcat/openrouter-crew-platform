import * as assert from 'assert';
import { explainTerminalCommand } from './explain-terminal.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Explain Terminal Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should pre-fill input with clipboard content', async () => {
        testContext.mockClipboard('Error: Something went wrong');
        testContext.mockInputBox('Error: Something went wrong');

        let capturedOutput = '';
        testContext.commandExecutor.explainTerminal = async (output: string) => {
            capturedOutput = output;
            return { success: true, output: 'Explanation', model: 'test', costUSD: 0 };
        };

        await explainTerminalCommand(
            testContext.commandExecutor,
            testContext.outputLogger
        );

        assert.strictEqual(capturedOutput, 'Error: Something went wrong');
    });
});