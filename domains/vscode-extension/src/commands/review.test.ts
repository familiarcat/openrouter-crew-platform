import * as assert from 'assert';
import { reviewCommand } from './review.js';
import { CommandTestContext } from '../test/command-test-utils.js';

suite('Review Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should review selected code', async () => {
        testContext.contextProvider.getEditorContext = () => ({
            selectedCode: 'const x = 1;',
            languageId: 'typescript',
            fileName: '/test/file.ts'
        });

        let capturedCode = '';
        testContext.commandExecutor.review = async (code: string) => {
            capturedCode = code;
            return { success: true, output: 'LGTM', model: 'test', costUSD: 0 };
        };

        await reviewCommand(
            testContext.commandExecutor,
            testContext.contextProvider,
            testContext.outputLogger,
            testContext.fileManager
        );

        assert.strictEqual(capturedCode, 'const x = 1;');
    });
});