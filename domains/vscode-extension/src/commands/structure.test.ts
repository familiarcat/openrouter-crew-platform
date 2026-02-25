import * as assert from 'assert';
import { structureCommand } from './structure.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Structure Command Test Suite', () => {
    let testContext: CommandTestContext;
    let mockStructureView: any;

    setup(() => {
        testContext = new CommandTestContext();
        mockStructureView = { show: () => {} };
    });

    teardown(() => {
        testContext.restore();
    });

    test('should analyze structure with optional focus', async () => {
        testContext.mockInputBox('services folder');

        let capturedFocus = '';
        testContext.commandExecutor.structure = async (focus: string) => {
            capturedFocus = focus;
            return { success: true, output: 'Analysis', model: 'test', costUSD: 0 };
        };

        await structureCommand(
            testContext.commandExecutor,
            testContext.outputLogger,
            mockStructureView
        );

        assert.strictEqual(capturedFocus, 'services folder');
    });
});