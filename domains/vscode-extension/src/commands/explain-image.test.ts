import * as assert from 'assert';
import * as vscode from 'vscode';
import { explainImageCommand } from './explain-image.js';
import { CommandTestContext } from './command-test-utils.js';

suite('Explain Image Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should process selected image', async () => {
        const mockUri = vscode.Uri.file('/path/to/image.png');
        testContext.mockOpenDialog([mockUri]);
        testContext.mockReadFile(Buffer.from('test'));

        let capturedBase64 = '';
        testContext.commandExecutor.processImage = async (base64: string) => {
            capturedBase64 = base64;
            return { success: true, output: 'Analysis', model: 'test', costUSD: 0 };
        };

        await explainImageCommand(
            testContext.commandExecutor,
            testContext.outputLogger
        );

        // 'test' in base64 is 'dGVzdA=='
        assert.strictEqual(capturedBase64, 'dGVzdA==');
    });
});