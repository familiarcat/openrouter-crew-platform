import * as assert from 'assert';
import * as vscode from 'vscode';
import { previewImageCostCommand } from './preview-image-cost.js';
import { CommandTestContext } from './command-test-utils.js';

suite('Preview Image Cost Command Test Suite', () => {
    let testContext: CommandTestContext;

    setup(() => {
        testContext = new CommandTestContext();
    });

    teardown(() => {
        testContext.restore();
    });

    test('should estimate cost for selected image', async () => {
        // Mock image selection
        const mockUri = vscode.Uri.file('/path/to/image.png');
        testContext.mockOpenDialog([mockUri]);

        // Mock file content (base64 will be 'dGVzdA==' for 'test')
        testContext.mockReadFile(Buffer.from('test'));

        // Mock estimator
        let capturedBase64 = '';
        testContext.commandExecutor.estimateImageCost = async (base64: string) => {
            capturedBase64 = base64;
            return {
                cost: 0.005,
                model: 'gpt-4-vision',
                inputTokens: 500,
                outputTokens: 100,
                complexity: 'MEDIUM'
            };
        };

        // Mock info message to verify output
        let infoMessage = '';
        (vscode.window as any).showInformationMessage = async (msg: string) => {
            infoMessage = msg;
        };

        await previewImageCostCommand(testContext.commandExecutor);

        assert.strictEqual(capturedBase64, 'dGVzdA==');
        assert.ok(infoMessage.includes('$0.005000'));
        assert.ok(infoMessage.includes('gpt-4-vision'));
    });

    test('should do nothing if image selection is cancelled', async () => {
        testContext.mockOpenDialog(undefined);

        let estimateCalled = false;
        testContext.commandExecutor.estimateImageCost = async () => {
            estimateCalled = true;
        };

        await previewImageCostCommand(testContext.commandExecutor);

        assert.strictEqual(estimateCalled, false);
    });
});